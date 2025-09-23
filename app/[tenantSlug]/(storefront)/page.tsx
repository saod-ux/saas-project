import { redirect } from "next/navigation";

export default function TenantRoot({ params }: { params: { tenantSlug: string } }) {
  redirect(`/${params.tenantSlug}/retail`);
}
