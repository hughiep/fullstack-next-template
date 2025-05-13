# Error Handling & Logging Best Practices

This document outlines the best practices for error handling and logging in our Next.js application to avoid duplicate logs and ensure proper error management.

## Core Principles

1. **Centralized Error Handling**: Use wrapper functions to standardize error handling
2. **Consistent Error Types**: Always use `AppError` for application errors
3. **Environmental Awareness**: Different logging behaviors for development vs production
4. **Client/Server Separation**: Tailored error handling for each context

## Directory Structure

```
modules/
  shared/
    logger/
      index.ts             # Core logging functionality
    types/
      error.ts            # AppError definition
    utilities/
      error-handler.ts    # Generic error handling utilities
      api-error-handler.ts # API route error handling
      server-action-handler.ts # Server Action error handling
    components/
      ui/
        error-boundary.tsx # Client-side error boundary
        error-monitor.tsx  # Global error monitoring
app/
  error.tsx               # Global error page
  not-found.tsx           # 404 page
```

## Usage Guidelines

### Server-Side (API Routes)

Use the `withApiErrorHandler` wrapper for all API routes:

```typescript
import { withApiErrorHandler } from '@/modules/shared/utilities/api-error-handler'

export const GET = withApiErrorHandler(async (req) => {
  // Your code here that may throw errors
  return NextResponse.json({ data })
})
```

### Server Actions

Use the `withServerActionErrorHandler` wrapper for all server actions:

```typescript
import { withServerActionErrorHandler } from '@/modules/shared/utilities/server-action-handler'

export const createPost = withServerActionErrorHandler(async (data) => {
  // Your code here that may throw errors
  return { success: true, data }
})
```

### Client-Side Components

1. Use ErrorBoundary for component-level errors:

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

2. The global ErrorMonitor is already included in the root layout and handles uncaught client-side errors.

### Throwing Errors

Always use AppError when throwing errors to ensure consistent handling:

```typescript
import { AppError } from '@/shared/types/error'

if (somethingWrongHappened) {
  throw new AppError({
    message: 'User-friendly message',
    code: 'ERROR_CODE',
    statusCode: 400, // HTTP status code
    context: { additionalData: 'someValue' }
  })
}
```

### Logging

Use the logger with appropriate levels:

```typescript
import { logger } from '@/shared/logger'

// Only for development debugging
logger.debug('Detailed debug info', { someData })

// General information
logger.info('Process completed successfully', { processedCount: 5 })

// Potential issues that don't break functionality
logger.warn('Resource running low', { availableSpace: '10%' })

// Errors that need attention
logger.error('Failed to process payment', error)
```

## Environment Configuration

- **Development**: All log levels are shown, and full error details are displayed
- **Production**: Only warnings and errors are logged by default, and users see friendly error messages

## Adding External Error Monitoring

To integrate with services like Sentry or LogRocket:

1. Update the `persistLog` method in the logger
2. Add initialization code to the appropriate entry points
3. Configure the service to capture different error levels

## Testing Error Handling

Always test both the happy path and error scenarios to ensure proper error propagation and handling.
