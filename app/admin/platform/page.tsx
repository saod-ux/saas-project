import Link from "next/link";

export default function PlatformOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
        <p className="text-gray-600">Manage tenants, domains and plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/platform/merchants" className="block rounded-lg border p-6 hover:bg-black/5">
          <div className="font-semibold">Merchants</div>
          <div className="text-sm text-neutral-600">Manage tenants</div>
        </Link>
        <Link href="/admin/platform/domains" className="block rounded-lg border p-6 hover:bg-black/5">
          <div className="font-semibold">Domains</div>
          <div className="text-sm text-neutral-600">Cross-tenant domains</div>
        </Link>
        <Link href="/admin/platform/plans" className="block rounded-lg border p-6 hover:bg-black/5">
          <div className="font-semibold">Plans</div>
          <div className="text-sm text-neutral-600">Manual plan assignment</div>
        </Link>
      </div>
    </div>
  );
}
