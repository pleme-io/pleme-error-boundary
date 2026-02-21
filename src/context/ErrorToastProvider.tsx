/**
 * Error Toast Provider
 *
 * Unified error handling with notistack toast notifications.
 * CRITICAL: All errors are logged to console.error AND shown as toasts.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <ErrorToastProvider>
 *   <App />
 * </ErrorToastProvider>
 *
 * // In any component
 * const { addError } = useErrorToast();
 * addError({ type: 'network', message: 'Connection failed' });
 * ```
 */

import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { SnackbarProvider, useSnackbar, type VariantType } from 'notistack';
import { useMachine } from '@xstate/react';
import {
  errorMachine,
  getErrors,
  getGlobalError,
  getIsOnline,
  getLatestError,
  errorToCreateInput,
} from '../machines/error.machine';
import type {
  AppError,
  CreateErrorInput,
  ErrorContextValue,
  ErrorToastProviderProps,
  ToastConfig,
  ErrorType,
} from '../types';

// Default toast configuration
const DEFAULT_CONFIG: ToastConfig = {
  position: 'top-right',
  autoHideDuration: 5000,
  maxToasts: 3,
  preventDuplicates: true,
};

// Map error types to notistack variants
const errorTypeToVariant = (type: ErrorType): VariantType => {
  switch (type) {
    case 'validation':
      return 'warning';
    case 'network':
    case 'auth':
    case 'cart':
    case 'checkout':
    case 'general':
    default:
      return 'error';
  }
};

// Context for error state
const ErrorToastContext = createContext<ErrorContextValue | null>(null);

/**
 * Inner provider that uses notistack hooks
 */
const ErrorToastProviderInner: React.FC<{
  children: React.ReactNode;
  maxErrors?: number;
  onError?: (error: AppError) => void;
}> = ({ children, maxErrors = 50, onError }) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [state, send] = useMachine(errorMachine);

  // Set max errors on mount
  useEffect(() => {
    send({ type: 'SET_MAX_ERRORS', payload: maxErrors });
  }, [maxErrors, send]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = (): void => {
      send({ type: 'SET_ONLINE_STATUS', payload: true });
    };

    const handleOffline = (): void => {
      send({ type: 'SET_ONLINE_STATUS', payload: false });
      send({
        type: 'ADD_ERROR',
        payload: {
          type: 'network',
          message: 'Você está offline. Verifique sua conexão com a internet.',
          recoverable: true,
        },
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [send]);

  // Listen for Apollo errors via window events
  useEffect(() => {
    const handleApolloNetworkError = (event: CustomEvent): void => {
      const { error, operation } = event.detail;
      send({
        type: 'ADD_ERROR',
        payload: {
          type: 'network',
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          details: `Operação: ${operation}\nErro: ${error.message}`,
          recoverable: true,
        },
      });
    };

    const handleApolloGraphQLError = (event: CustomEvent): void => {
      const { message, operation, path } = event.detail;

      // Skip auth-related errors - handled by auth system
      const authOperations = ['Login', 'Register', 'RefreshToken', 'Logout', 'Me'];
      if (authOperations.some((op) => operation?.includes(op))) {
        return;
      }

      // Skip password reset errors - handled by forgot password page
      const passwordResetOperations = ['RequestPasswordReset', 'ResetPassword'];
      if (passwordResetOperations.some((op) => operation?.includes(op))) {
        return;
      }

      // Skip generic credential errors
      if (
        message?.toLowerCase().includes('invalid credentials') ||
        message?.toLowerCase().includes('credenciais inválidas')
      ) {
        return;
      }

      // Skip password reset rate limit errors
      if (
        message?.toLowerCase().includes('redefinição de senha solicitada recentemente') ||
        message?.toLowerCase().includes('password reset requested too recently')
      ) {
        return;
      }

      send({
        type: 'ADD_ERROR',
        payload: {
          type: 'general',
          message: 'Erro no servidor. Nossa equipe foi notificada.',
          details: `Operação: ${operation}\nCaminho: ${path}\nMensagem: ${message}`,
          recoverable: true,
        },
      });
    };

    window.addEventListener('apollo-network-error', handleApolloNetworkError as EventListener);
    window.addEventListener('apollo-graphql-error', handleApolloGraphQLError as EventListener);

    return () => {
      window.removeEventListener('apollo-network-error', handleApolloNetworkError as EventListener);
      window.removeEventListener('apollo-graphql-error', handleApolloGraphQLError as EventListener);
    };
  }, [send]);

  // Show toast when new error is added
  const latestError = getLatestError(state);
  const previousErrorRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (latestError && latestError.id !== previousErrorRef.current) {
      previousErrorRef.current = latestError.id;

      // Call custom error handler if provided
      onError?.(latestError);

      // Show toast notification
      enqueueSnackbar(latestError.message, {
        variant: errorTypeToVariant(latestError.type),
        key: latestError.id,
        autoHideDuration: latestError.recoverable ? 5000 : 8000,
        action: latestError.action
          ? (key) => (
              <button
                type="button"
                onClick={() => {
                  latestError.action?.handler();
                  closeSnackbar(key);
                }}
                style={{
                  color: 'inherit',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {latestError.action?.label}
              </button>
            )
          : undefined,
      });
    }
  }, [latestError, enqueueSnackbar, closeSnackbar, onError]);

  // Context API
  const addError = useCallback(
    (error: CreateErrorInput): void => {
      send({ type: 'ADD_ERROR', payload: error });
    },
    [send]
  );

  const addErrorFromException = useCallback(
    (error: Error, context?: Record<string, unknown>): void => {
      send({ type: 'ADD_ERROR', payload: errorToCreateInput(error, context) });
    },
    [send]
  );

  const removeError = useCallback(
    (id: string): void => {
      send({ type: 'REMOVE_ERROR', payload: id });
      closeSnackbar(id);
    },
    [send, closeSnackbar]
  );

  const clearErrors = useCallback((): void => {
    const errors = getErrors(state);
    errors.forEach((error) => closeSnackbar(error.id));
    send({ type: 'CLEAR_ERRORS' });
  }, [send, closeSnackbar, state]);

  const setGlobalError = useCallback(
    (error: AppError | null): void => {
      send({ type: 'SET_GLOBAL_ERROR', payload: error });
    },
    [send]
  );

  const value: ErrorContextValue = {
    error: latestError,
    errors: getErrors(state),
    globalError: getGlobalError(state),
    isOnline: getIsOnline(state),
    addError,
    addErrorFromException,
    removeError,
    clearErrors,
    setGlobalError,
  };

  return (
    <ErrorToastContext.Provider value={value}>{children}</ErrorToastContext.Provider>
  );
};

/**
 * Error Toast Provider
 *
 * Wraps the application with error handling and toast notifications.
 * Position: top-right (default), color: red for errors, orange for warnings.
 */
export const ErrorToastProvider: React.FC<ErrorToastProviderProps> = ({
  children,
  config = {},
  maxErrors = 50,
  onError,
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Convert position to notistack format
  const anchorOrigin = {
    vertical: mergedConfig.position.includes('top') ? 'top' : 'bottom',
    horizontal: mergedConfig.position.includes('left')
      ? 'left'
      : mergedConfig.position.includes('center')
        ? 'center'
        : 'right',
  } as const;

  // Cast to any to avoid React type version mismatch between notistack's bundled
  // @types/react and the consumer's @types/react (ReactNode incompatibility).
  const Provider = SnackbarProvider as any;

  return (
    <Provider
      maxSnack={mergedConfig.maxToasts}
      autoHideDuration={mergedConfig.autoHideDuration}
      preventDuplicate={mergedConfig.preventDuplicates}
      anchorOrigin={anchorOrigin}
    >
      <ErrorToastProviderInner maxErrors={maxErrors} {...(onError !== undefined ? { onError } : {})}>
        {children as any}
      </ErrorToastProviderInner>
    </Provider>
  );
};

/**
 * Hook to access error toast functionality
 *
 * @returns Error context value with addError, removeError, etc.
 * @throws Error if used outside ErrorToastProvider
 *
 * @example
 * ```tsx
 * const { addError, addErrorFromException } = useErrorToast();
 *
 * // Add error manually
 * addError({ type: 'network', message: 'Connection failed' });
 *
 * // Add error from caught exception
 * try {
 *   await someOperation();
 * } catch (err) {
 *   addErrorFromException(err as Error, { component: 'MyComponent' });
 * }
 * ```
 */
export function useErrorToast(): ErrorContextValue {
  const context = useContext(ErrorToastContext);

  if (context === null) {
    throw new Error('useErrorToast must be used within an ErrorToastProvider');
  }

  return context;
}
