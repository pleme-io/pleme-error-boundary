/**
 * @pleme/error-boundary
 *
 * Unified error handling library for Nexus products.
 *
 * Features:
 * - React Error Boundary component
 * - Notistack-based toast notifications (top-right, red for errors)
 * - XState-based error state management
 * - CRITICAL: All errors are logged to console.error
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { ErrorToastProvider, ErrorBoundary } from '@pleme/error-boundary';
 *
 * function App() {
 *   return (
 *     <ErrorToastProvider>
 *       <ErrorBoundary>
 *         <YourApp />
 *       </ErrorBoundary>
 *     </ErrorToastProvider>
 *   );
 * }
 *
 * // In any component
 * import { useErrorToast, createNetworkError } from '@pleme/error-boundary';
 *
 * function MyComponent() {
 *   const { addError } = useErrorToast();
 *
 *   const handleError = () => {
 *     addError(createNetworkError('Connection failed'));
 *   };
 * }
 * ```
 */

// Types
export type {
  AppError,
  CreateErrorInput,
  ErrorBoundaryState,
  ErrorContextValue,
  ErrorToastProviderProps,
  ErrorType,
  FallbackProps,
  ToastConfig,
  ToastPosition,
  ToastSeverity,
} from './types';

// Error Boundary
export type { ErrorBoundaryProps } from './components/ErrorBoundary';
export { ErrorBoundary } from './components/ErrorBoundary';

// Legacy Error Context (for backwards compatibility)
export type { ErrorProviderProps } from './context/ErrorContext';
export { ErrorProvider, useErrorContext } from './context/ErrorContext';

// NEW: Error Toast Provider (recommended)
export { ErrorToastProvider, useErrorToast } from './context/ErrorToastProvider';

// Error Machine and utilities
export {
  errorMachine,
  getErrors,
  getGlobalError,
  getIsOnline,
  getLatestError,
  createAuthError,
  createCartError,
  createCheckoutError,
  createGeneralError,
  createNetworkError,
  createValidationError,
  errorToCreateInput,
} from './machines/error.machine';
