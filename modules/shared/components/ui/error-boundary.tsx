'use client'

import { useEffect, useState } from 'react'

import { logger } from '@/shared/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ErrorBoundary({
  children,
  fallback = (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
      Something went wrong. Please try again later.
    </div>
  ),
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      logger.error('Uncaught client error', {
        message: error.message,
        stack: error.error?.stack,
        source: error.filename,
        lineno: error.lineno,
        colno: error.colno,
      })
      setHasError(true)

      // Prevent the browser from showing the default error dialog
      error.preventDefault()
    }

    // Capture unhandled errors
    window.addEventListener('error', errorHandler)

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', {
        reason: event.reason,
      })
      setHasError(true)
      event.preventDefault()
    })

    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', () => {})
    }
  }, [])

  if (hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
