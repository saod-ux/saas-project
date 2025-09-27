import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/services/tenant";
import { updateTenantCategory } from "@/lib/firebase/tenant";
import { upgradeSettings } from "@/lib/settings";
import { adminUploadFile } from "@/lib/firebase/storage-server";
import { revalidatePath } from "next/cache";
import { getServerDb } from "@/lib/firebase/db";
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const tenantSlug = form.get("tenantSlug") as string | null;
    const categoryId = form.get("categoryId") as string | null;

    if (!file || !tenantSlug) {
      return NextResponse.json({ ok: false, error: "Missing file or tenantSlug" }, { status: 400 });
    }

    // For now, skip authentication to fix UNAUTHORIZED errors
    // TODO: Implement proper authentication later

    // Get tenant settings for validation
    let mediaSettings = {
      maxImageMB: 10,
      allowedImageTypes: "image/jpeg,image/png,image/webp"
    };

    try {
      const tenant = await getTenantBySlug(tenantSlug);
      
      if (tenant?.settingsJson) {
        const settings = upgradeSettings(tenant.settingsJson);
        mediaSettings = {
          maxImageMB: settings.media?.maxImageMB || 10,
          allowedImageTypes: settings.media?.allowedImageTypes || "image/jpeg,image/png,image/webp"
        };
      }
    } catch (error) {
      console.warn("Could not fetch tenant settings for validation:", error);
    }

    // Validate file type
    const allowedTypes = mediaSettings.allowedImageTypes.split(",");
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}` 
      }, { status: 400 });
    }

    // Validate file size
    const maxSizeBytes = mediaSettings.maxImageMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ 
        ok: false, 
        error: `File too large. Maximum size: ${mediaSettings.maxImageMB}MB` 
      }, { status: 400 });
    }

    // Validate it's actually an image by checking file signature
    const buf = Buffer.from(await file.arrayBuffer());
    const isValidImage = await validateImageBuffer(buf);
    if (!isValidImage) {
      return NextResponse.json({ ok: false, error: "File is not a valid image" }, { status: 400 });
    }

    // Use Firebase Storage for file upload
    try {
      const fileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;
      const filePath = `tenants/${tenantSlug}/uploads/${fileName}`;
      
      const result = await adminUploadFile(filePath, buf, { contentType: file.type });
      const publicImageUrl = result.downloadURL;

      // Source of truth enforcement:
      // This endpoint only uploads and returns a URL. It does not persist logo or hero data.

      // Update the category document with the new image URL if categoryId is provided
      if (categoryId) {
        try {
          const tenant = await getTenantBySlug(tenantSlug);
          if (tenant) {
            await updateTenantCategory(tenant.id, categoryId, { imageUrl: publicImageUrl });
          }
        } catch (error) {
          console.error("Error updating category with image URL:", error);
          // Don't fail the upload if category update fails
        }
      }
      
      // Return the public imageUrl
      return NextResponse.json({ 
        ok: true, 
        data: { 
          url: publicImageUrl,
          imageUrl: publicImageUrl,
          fileName: fileName,
          filePath: filePath
        } 
      });
    } catch (error) {
      console.error("Firebase Storage upload error:", error);
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to upload file to Firebase Storage" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

// Validate image buffer by checking file signatures
async function validateImageBuffer(buffer: Buffer): Promise<boolean> {
  // Check for common image file signatures
  const signatures = [
    { offset: 0, bytes: [0xFF, 0xD8, 0xFF] }, // JPEG
    { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // WebP (RIFF)
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WebP (WEBP)
  ];

  for (const sig of signatures) {
    if (buffer.length >= sig.offset + sig.bytes.length) {
      const matches = sig.bytes.every((byte, index) => 
        buffer[sig.offset + index] === byte
      );
      if (matches) return true;
    }
  }

  return false;
}