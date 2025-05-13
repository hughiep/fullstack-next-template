'use client'

import { useEffect } from 'react'

import { logger } from '@/shared/logger'

/**
 * This component sets up global error handlers for client-side errors
 * Place it in your root layout near the top of the component tree
 */
export function ErrorMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Keep track of previous handlers to restore them if needed
    const originalOnError = window.onerror
    const originalOnUnhandledRejection = window.onunhandledrejection

    // Handle synchronous errors
    window.onerror = (event, source, lineno, colno, error) => {
      logger.error('Global error caught', {
        message: error?.message || String(event),
        stack: error?.stack,
        source,
        lineno,
        colno,
      })

      // Call original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(event, source, lineno, colno, error)
      }
      return false
    }

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const error = event.reason
      logger.error('Unhandled promise rejection', {
        message: error?.message || String(error),
        stack: error?.stack,
      })

      // Call original handler if it exists
      if (typeof originalOnUnhandledRejection === 'function') {
        return originalOnUnhandledRejection(event)
      }
    }

    // Clean up when component unmounts
    return () => {
      window.onerror = originalOnError
      window.onunhandledrejection = originalOnUnhandledRejection
    }
  }, [])

  // This component doesn't render anything
  return null
}
