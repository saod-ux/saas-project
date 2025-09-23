import { Header } from '@/components/storefront/Header'

export default function MorePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-bold text-ink mb-4">More</h1>
          <p className="text-muted">Additional features coming soon...</p>
        </div>
      </div>
    </div>
  )
}
