/**
 * Error Boundary Component
 */

import React from 'react';
import type { ErrorBoundaryState, FallbackProps } from '../types';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /**
   * Child components
   */
  children: React.ReactNode;

  /**
   * Fallback UI to render when error occurs
   */
  fallback?: React.ComponentType<FallbackProps>;

  /**
   * Callback when error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /**
   * Callback when error is reset
   */
  onReset?: () => void;

  /**
   * Custom reset keys - when these change, error boundary resets
   */
  resetKeys?: unknown[];
}

/**
 * Default fallback component
 */
const DefaultFallback: React.FC<FallbackProps> = ({ error, resetError, isOnline }): React.ReactElement => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
        <summary>Error details</summary>
        <p>{error.message}</p>
      </details>
      {!isOnline && <p style={{ color: 'orange' }}>You appear to be offline</p>}
      <button type="button" onClick={resetError} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Try again
      </button>
    </div>
  );
};

/**
 * React Error Boundary Component
 *
 * Catches errors in child components and displays a fallback UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    // CRITICAL: Always log to console.error (regardless of environment)
    console.error(
      '[ErrorBoundary] Caught error:',
      error.message,
      '\nComponent stack:',
      errorInfo.componentStack,
      '\nError stack:',
      error.stack
    );
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => {
        return key !== prevProps.resetKeys?.[index];
      });

      if (hasResetKeyChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: FallbackComponent = DefaultFallback } = this.props;

    if (hasError && error && errorInfo) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo}
          resetError={this.reset}
          isOnline={isOnline}
        />
      );
    }

    return children;
  }
}
