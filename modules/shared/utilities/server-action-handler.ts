import { logger } from '@/shared/logger'
import { AppError } from '@/shared/types/error'

/**
 * Wrapper for server actions to standardize error handling
 *
 * @example
 * export const createPost = withServerActionErrorHandler(async (data: FormData) => {
 *   // Your code here
 *   return { success: true, data: post }
 * })
 */
export function withServerActionErrorHandler<T extends Array<any>, R>(
  serverAction: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    try {
      return await serverAction(...args)
    } catch (error) {
      // Handle known application errors
      if (error instanceof AppError) {
        // Log the error but let it propagate to the client
        logger.error(`Server Action Error: ${error.message}`, {
          code: error.code,
          statusCode: error.statusCode,
        })

        return { error }
      }

      // For unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred'

      // Convert to AppError for consistent client handling
      throw new AppError({
        message: 'Something went wrong. Please try again later.',
        code: 'SERVER_ACTION_FAILED',
        statusCode: 500,
        context: { originalError: errorMessage },
      })
    }
  }
}
