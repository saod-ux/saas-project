export default function NoTenantPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Tenant not found</h1>
      <p>Please access via subdomain like acme.localhost:3000 or add a custom domain.</p>
    </div>
  )
}
