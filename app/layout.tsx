import './globals.css'
import type { Metadata } from 'next'
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import QueryProvider from '@/components/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'SaaS Platform',
  description: 'Multi-tenant SaaS platform with authentication and RBAC',
  metadataBase: new URL('http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <FirebaseAuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </FirebaseAuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
