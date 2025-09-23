import './globals.css'
import type { Metadata } from 'next'
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContextClient'
import { LanguageProvider } from '@/contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'SaaS Platform',
  description: 'Multi-tenant SaaS platform with authentication and RBAC',
  metadataBase: new URL('http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <FirebaseAuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  )
}
