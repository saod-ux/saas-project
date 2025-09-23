import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          E-view — MVP
        </h1>
        
        <div className="space-y-4">
          <Link 
            href="/admin/platform"
            className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Platform Admin
          </Link>
          
          <div className="px-6 py-3 text-muted-foreground text-sm">
            Set DEFAULT_TENANT_SLUG in .env to enable quick redirect
          </div>
        </div>
      </div>
    </div>
  )
}