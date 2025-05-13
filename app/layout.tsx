import './globals.css'

import '@/config'

import type { Metadata } from 'next'
import { AuthProvider } from '@/modules/shared/contexts/auth/AuthContext'
import Navigation from '@/modules/shared/components/layout/Navigation'
import ErrorBoundary from '@/modules/shared/components/ui/error-boundary'
import { ErrorMonitor } from '@/modules/shared/components/ui/error-monitor'

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
        {/* Global error monitoring */}
        <ErrorMonitor />
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-grow">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <footer className="border-t border-gray-200 bg-gray-50 py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
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
