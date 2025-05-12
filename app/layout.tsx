import './globals.css'

import '@/config'

import type { Metadata } from 'next'
import { AuthProvider } from '@/modules/shared/contexts/auth/AuthContext'
import Navigation from '@/modules/shared/components/layout/Navigation'

export const metadata: Metadata = {
  title: 'App',
  description: 'App description metadata',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-gray-50 border-t border-gray-200 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-gray-500 text-sm">
                  © {new Date().getFullYear()} Next.js Fullstack App
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
