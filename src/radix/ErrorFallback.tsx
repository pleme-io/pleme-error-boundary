/**
 * Error Fallback Component (Radix/Tailwind variant)
 *
 * A UI-agnostic error fallback component that works with Tailwind CSS.
 * Designed for Lilitu and other Tailwind-based products.
 */

import type { ReactNode } from 'react'

export interface ErrorFallbackProps {
  /** The error that was caught */
  error?: Error | null
  /** Callback when user clicks retry */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
  /** Whether to show error details (defaults to checking for development mode) */
  showDetails?: boolean
  /** Custom title text */
  title?: string
  /** Custom message text */
  message?: string
  /** Custom retry button text */
  retryLabel?: string
}

/**
 * Merge class names utility (simple version for library use)
 */
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Check if in development mode
 */
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

/**
 * Error fallback component with Tailwind CSS styling.
 * Works with any Tailwind-based theme (CSS variables).
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={error}
 *   onRetry={() => window.location.reload()}
 *   title="Oops!"
 *   message="Something went wrong"
 * />
 * ```
 */
export function ErrorFallback({
  error,
  onRetry,
  className,
  showDetails = isDevelopment(),
  title = 'Algo deu errado',
  message = 'Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.',
  retryLabel = 'Tentar novamente',
}: ErrorFallbackProps): ReactNode {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border border-border bg-card p-8 text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Error message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="max-w-md text-muted-foreground">{message}</p>
      </div>

      {/* Error details (development only) */}
      {showDetails && error && (
        <details className="w-full max-w-lg">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Detalhes do erro (desenvolvimento)
          </summary>
          <pre className="mt-2 overflow-auto rounded-md bg-background p-4 text-left text-xs text-destructive">
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
