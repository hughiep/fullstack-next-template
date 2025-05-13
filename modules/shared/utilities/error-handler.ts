import { logger } from '@/shared/logger'
import { AppError } from '@/shared/types/error'

/**
 * Global error handler to process and standardize error handling
 */
export function handleError(error: unknown, context?: string): AppError {
  // If it's already an AppError, just log it and return
  if (error instanceof AppError) {
    logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
    })
    return error
  }

  // For other errors, convert to AppError with appropriate details
  let appError: AppError

  if (error instanceof Error) {
    appError = new AppError({
      message: error.message,
      code: 'UNEXPECTED_ERROR',
      context: { originalError: error.stack },
    })
  } else {
    // For non-Error objects or primitives
    appError = new AppError({
      message: String(error),
      code: 'UNKNOWN_ERROR',
      context: { originalValue: error },
    })
  }

  // Log the standardized error
  logger.error(`${context ? `[${context}] ` : ''}${appError.message}`, {
    code: appError.code,
    context: appError.context,
  })

  return appError
}

/**
 * Helper to wrap async functions with consistent error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw handleError(error, context)
  }
}
