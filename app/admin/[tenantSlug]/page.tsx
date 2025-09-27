import { redirect } from 'next/navigation';

export default function AdminTenantPage({ params }: { params: { tenantSlug: string } }) {
  // Redirect to the overview page (which we'll create)
  redirect(`/admin/${params.tenantSlug}/overview`);
}

