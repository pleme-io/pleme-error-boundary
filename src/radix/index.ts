/**
 * @pleme/error-boundary/radix
 *
 * Radix/Tailwind variant of the error boundary components.
 * Use this for Tailwind-based applications like Lilitu.
 *
 * @example
 * ```tsx
 * import { RadixErrorBoundary, ErrorFallback, RouteErrorComponent } from '@pleme/error-boundary/radix'
 *
 * // Wrap your app
 * function App() {
 *   return (
 *     <RadixErrorBoundary
 *       captureException={(error, context) => {
 *         // Send to your observability system
 *         observability.captureException(error, context)
 *       }}
 *     >
 *       <YourApp />
 *     </RadixErrorBoundary>
 *   )
 * }
 *
 * // Use in TanStack Router routes
 * export const Route = createFileRoute('/')({
 *   component: HomePage,
 *   errorComponent: RouteErrorComponent,
 * })
 * ```
 */

export { ErrorFallback, type ErrorFallbackProps } from './ErrorFallback'
export {
  RadixErrorBoundary,
  RouteErrorComponent,
  type RadixErrorBoundaryProps,
} from './ErrorBoundary'
