import CustomerAccount from '@/components/storefront/CustomerAccount'

interface AccountPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { tenantSlug } = await params;
  
  return <CustomerAccount tenantSlug={tenantSlug} />
}
