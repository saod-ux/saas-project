import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    console.log("[VERIFY-DEBUG] Request received", {
      hasIdToken: Boolean(idToken),
      tokenLength: idToken?.length ?? 0,
      start: typeof idToken === "string" ? idToken.slice(0, 20) : undefined,
      end: typeof idToken === "string" ? idToken.slice(-20) : undefined,
    });

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { ok: false, error: "NO_TOKEN" },
        { status: 400 }
      );
    }

    console.log("[VERIFY-DEBUG] Verifying ID token…");
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    console.log("[VERIFY-DEBUG] Token verified successfully", {
      uid: decoded.uid,
      email: decoded.email,
      projectId: decoded.aud,
    });

    return NextResponse.json({ 
      ok: true, 
      uid: decoded.uid,
      email: decoded.email,
      projectId: decoded.aud,
    });
  } catch (err: any) {
    console.error("[VERIFY-DEBUG] Token verification error", {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      stack: err?.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return NextResponse.json(
      { ok: false, error: err?.code || "VERIFICATION_ERROR", message: err?.message },
      { status: 401 }
    );
  }
}
