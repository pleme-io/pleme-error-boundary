/**
 * Error Boundary Component (Radix/Tailwind variant)
 *
 * React Error Boundary that works with Tailwind CSS and optional sonner toasts.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback, type ErrorFallbackProps } from './ErrorFallback'

export interface RadixErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback element */
  fallback?: ReactNode
  /** Custom fallback props (used if no fallback element provided) */
  fallbackProps?: Omit<ErrorFallbackProps, 'error' | 'onRetry'>
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Callback to capture exception (e.g., to observability system) */
  captureException?: (error: Error, context?: Record<string, unknown>) => void
}

interface RadixErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary for Tailwind-based applications.
 *
 * @example
 * ```tsx
 * import { RadixErrorBoundary } from '@pleme/error-boundary/radix'
 *
 * function App() {
 *   return (
 *     <RadixErrorBoundary
 *       captureException={(error, context) => {
 *         observability.captureException(error, context)
 *       }}
 *     >
 *       <YourApp />
 *     </RadixErrorBoundary>
 *   )
 * }
 * ```
 */
export class RadixErrorBoundary extends Component<
  RadixErrorBoundaryProps,
  RadixErrorBoundaryState
> {
  constructor(props: RadixErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): RadixErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Always log to console
    console.error('[ErrorBoundary] Rendering error caught:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)

    // Send to observability if provided
    this.props.captureException?.(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'radix',
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error fallback with optional customization
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          {...this.props.fallbackProps}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Route error component for TanStack Router.
 * Use this as errorComponent in route configuration.
 *
 * @example
 * ```tsx
 * // In route configuration
 * export const Route = createFileRoute('/')({
 *   component: HomePage,
 *   errorComponent: RouteErrorComponent,
 * })
 * ```
 */
export function RouteErrorComponent({
  error,
}: {
  error: Error
}): ReactNode {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ErrorFallback
        error={error}
        onRetry={handleRetry}
        className="w-full max-w-lg"
      />
    </div>
  )
}
