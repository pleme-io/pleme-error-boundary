/**
 * Error Context
 *
 * Provides global error state management without XState
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppError, CreateErrorInput, ErrorContextValue } from '../types';

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

/**
 * Props for ErrorProvider
 */
export interface ErrorProviderProps {
  /**
   * Child components
   */
  children: React.ReactNode;

  /**
   * Maximum number of errors to keep in memory
   * @default 50
   */
  maxErrors?: number;

  /**
   * Deduplicate errors within this time window (ms)
   * @default 1000
   */
  deduplicationWindow?: number;
}

/**
 * Error Provider Component
 *
 * Provides error state management to child components
 *
 * @example
 * ```tsx
 * <ErrorProvider maxErrors={100}>
 *   <App />
 * </ErrorProvider>
 * ```
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  maxErrors = 50,
  deduplicationWindow = 1000,
}): React.ReactElement => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Track online/offline status
  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add error with deduplication
  const addError = useCallback(
    (input: CreateErrorInput): void => {
      const timestamp = Date.now();

      // Check for duplicate errors within deduplication window
      const isDuplicate = errors.some((existingError) => {
        const timeDiff = timestamp - existingError.timestamp;
        return (
          existingError.message === input.message &&
          existingError.type === input.type &&
          timeDiff < deduplicationWindow
        );
      });

      if (isDuplicate) {
        return;
      }

      const appError: AppError = {
        ...input,
        id: `error_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
      };

      setErrors((prev) => {
        const updated = [...prev, appError];
        // Keep only most recent errors
        return updated.slice(-maxErrors);
      });
    },
    [errors, maxErrors, deduplicationWindow]
  );

  // Add error from Error object
  const addErrorFromException = useCallback(
    (error: Error, context?: Record<string, unknown>): void => {
      addError({
        type: 'general',
        message: error.message,
        ...(error.stack !== undefined ? { stack: error.stack } : {}),
        ...(context !== undefined ? { context } : {}),
        recoverable: false,
      });
    },
    [addError]
  );

  // Remove specific error by ID
  const removeError = useCallback((id: string): void => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback((): void => {
    setErrors([]);
  }, []);

  const [globalError, setGlobalError] = useState<AppError | null>(null);

  const value: ErrorContextValue = {
    error: errors[errors.length - 1] ?? null,
    errors,
    globalError,
    isOnline,
    addError,
    addErrorFromException,
    removeError,
    clearErrors: clearAllErrors,
    setGlobalError,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

/**
 * Hook to access error context
 *
 * @returns Error context value
 * @throws Error if used outside ErrorProvider
 *
 * @example
 * ```tsx
 * const { error, addError, clearError } = useErrorContext();
 *
 * try {
 *   // some code
 * } catch (err) {
 *   addError(err as Error, { component: 'MyComponent' });
 * }
 * ```
 */
export function useErrorContext(): ErrorContextValue {
  const context = useContext(ErrorContext);

  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }

  return context;
}
