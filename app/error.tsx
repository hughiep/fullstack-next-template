'use client'

import { useEffect } from 'react'
import { logger } from '@/shared/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the logger service
    logger.error('Unhandled error in page component', { 
      message: error.message,
      stack: error.stack,
      digest: error.digest
    })
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center py-16">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-base text-gray-500">
          We apologize for the inconvenience. Our team has been notified of this issue.
        </p>
        <div className="mt-6">
          <button
            onClick={() => reset()}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
