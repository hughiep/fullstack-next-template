import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/shared/logger'
import { AppError } from '@/shared/types/error'

/**
 * Wrapper for API route handlers to standardize error handling
 * 
 * @example
 * export const GET = withApiErrorHandler(async (req) => {
 *   // Your code here
 *   return NextResponse.json({ data: result })
 * })
 */
export function withApiErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req)
    } catch (error) {
      // Handle known application errors
      if (error instanceof AppError) {
        logger.error(`API Error: ${error.message}`, {
          path: req.nextUrl.pathname,
          method: req.method,
          code: error.code,
          statusCode: error.statusCode,
        })
        
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code 
          },
          { status: error.statusCode || 500 }
        )
      }
      
      // For unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      logger.error(`Unhandled API Error: ${errorMessage}`, {
        path: req.nextUrl.pathname,
        method: req.method,
        error,
      })
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
}
