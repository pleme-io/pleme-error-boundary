/**
 * Error Boundary Types
 *
 * Unified error types for all Nexus products
 */

/**
 * Error type categories
 */
export type ErrorType = 'network' | 'validation' | 'cart' | 'checkout' | 'general' | 'auth';

/**
 * Toast position (notistack compatible)
 */
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

/**
 * Toast severity levels
 */
export type ToastSeverity = 'error' | 'warning' | 'info' | 'success';

/**
 * Application error information
 */
export interface AppError {
  /**
   * Unique error ID
   */
  id: string;

  /**
   * Error type category
   */
  type: ErrorType;

  /**
   * Error message to display to user
   */
  message: string;

  /**
   * Additional error details (for debugging)
   */
  details?: string;

  /**
   * Error stack trace
   */
  stack?: string;

  /**
   * When the error occurred
   */
  timestamp: number;

  /**
   * Whether the error can be recovered from
   */
  recoverable?: boolean;

  /**
   * Error code (for API errors)
   */
  code?: string;

  /**
   * Error context/metadata
   */
  context?: Record<string, unknown>;

  /**
   * Optional action button
   */
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Input for creating a new error (without auto-generated fields)
 */
export type CreateErrorInput = Omit<AppError, 'id' | 'timestamp'>;

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  /**
   * Has an error occurred
   */
  hasError: boolean;

  /**
   * Current error
   */
  error: Error | null;

  /**
   * Error info from React
   */
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error context value (XState-based)
 */
export interface ErrorContextValue {
  /**
   * Current/latest error
   */
  error: AppError | null;

  /**
   * List of all errors
   */
  errors: AppError[];

  /**
   * Global error (for full-screen error displays)
   */
  globalError: AppError | null;

  /**
   * Is online
   */
  isOnline: boolean;

  /**
   * Add a new error (logs to console.error and shows toast)
   */
  addError: (error: CreateErrorInput) => void;

  /**
   * Add error from Error object
   */
  addErrorFromException: (error: Error, context?: Record<string, unknown>) => void;

  /**
   * Remove specific error by ID
   */
  removeError: (id: string) => void;

  /**
   * Clear all errors
   */
  clearErrors: () => void;

  /**
   * Set global error (for full-screen displays)
   */
  setGlobalError: (error: AppError | null) => void;
}

/**
 * Fallback component props
 */
export interface FallbackProps {
  /**
   * The error that was caught
   */
  error: Error;

  /**
   * React error info
   */
  errorInfo: React.ErrorInfo;

  /**
   * Reset the error boundary
   */
  resetError: () => void;

  /**
   * Is the user online
   */
  isOnline: boolean;
}

/**
 * Toast configuration options
 */
export interface ToastConfig {
  /**
   * Position for toast notifications
   * @default 'top-right'
   */
  position: ToastPosition;

  /**
   * Auto-hide duration in milliseconds
   * @default 5000
   */
  autoHideDuration: number;

  /**
   * Maximum number of toasts to show at once
   * @default 3
   */
  maxToasts: number;

  /**
   * Whether to prevent duplicate messages
   * @default true
   */
  preventDuplicates: boolean;
}

/**
 * Error toast provider props
 */
export interface ErrorToastProviderProps {
  /**
   * Child components
   */
  children: React.ReactNode;

  /**
   * Toast configuration
   */
  config?: Partial<ToastConfig>;

  /**
   * Maximum number of errors to keep in memory
   * @default 50
   */
  maxErrors?: number;

  /**
   * Custom error handler (called after console.error)
   */
  onError?: (error: AppError) => void;
}
