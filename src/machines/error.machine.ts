/**
 * Error Management State Machine
 *
 * Handles global error state for the application.
 * CRITICAL: All errors are logged to console.error regardless of other handling.
 */

import { assign, type StateFrom, setup } from 'xstate';
import type { AppError, CreateErrorInput } from '../types';

/**
 * Error machine context type
 */
export interface ErrorMachineContext {
  errors: AppError[];
  globalError: AppError | null;
  isOnline: boolean;
  maxErrors: number;
}

/**
 * Error machine event types
 */
export type ErrorMachineEvent =
  | { type: 'ADD_ERROR'; payload: CreateErrorInput }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_GLOBAL_ERROR'; payload: AppError | null }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_MAX_ERRORS'; payload: number };

/**
 * Generate unique error ID
 */
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log error to console.error (ALWAYS - regardless of environment)
 */
const logErrorToConsole = (error: AppError): void => {
  console.error(
    `[${error.type.toUpperCase()}] ${error.message}`,
    error.details ? `\nDetails: ${error.details}` : '',
    error.context ? `\nContext: ${JSON.stringify(error.context, null, 2)}` : '',
    error.stack ? `\nStack: ${error.stack}` : ''
  );
};

export const errorMachine = setup({
  types: {
    context: {} as ErrorMachineContext,
    events: {} as ErrorMachineEvent,
  },
}).createMachine({
  id: 'errorManagement',
  initial: 'active',
  context: {
    errors: [],
    globalError: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    maxErrors: 50,
  },
  states: {
    active: {
      on: {
        ADD_ERROR: {
          actions: assign({
            errors: ({ context, event }) => {
              const newError: AppError = {
                ...event.payload,
                id: generateErrorId(),
                timestamp: Date.now(),
              };

              // CRITICAL: Always log to console.error
              logErrorToConsole(newError);

              // Keep only most recent errors
              const updated = [...context.errors, newError];
              return updated.slice(-context.maxErrors);
            },
          }),
        },
        REMOVE_ERROR: {
          actions: assign({
            errors: ({ context, event }) =>
              context.errors.filter((error) => error.id !== event.payload),
          }),
        },
        CLEAR_ERRORS: {
          actions: assign({
            errors: [],
          }),
        },
        SET_GLOBAL_ERROR: {
          actions: assign({
            globalError: ({ event }) => {
              if (event.payload) {
                // CRITICAL: Always log global errors to console.error
                logErrorToConsole(event.payload);
              }
              return event.payload;
            },
          }),
        },
        SET_ONLINE_STATUS: {
          actions: assign({
            isOnline: ({ event }) => event.payload,
          }),
        },
        SET_MAX_ERRORS: {
          actions: assign({
            maxErrors: ({ event }) => event.payload,
          }),
        },
      },
    },
  },
});

// Selectors
type ErrorMachineState = StateFrom<typeof errorMachine>;

export const getErrors = (state: ErrorMachineState | undefined): AppError[] =>
  state?.context?.errors || [];

export const getGlobalError = (state: ErrorMachineState | undefined): AppError | null =>
  state?.context?.globalError || null;

export const getIsOnline = (state: ErrorMachineState | undefined): boolean =>
  state?.context?.isOnline ?? true;

export const getLatestError = (state: ErrorMachineState | undefined): AppError | null => {
  const errors = getErrors(state);
  return errors.length > 0 ? (errors[errors.length - 1] ?? null) : null;
};

// Utility functions for creating errors
export const createNetworkError = (
  message: string,
  details?: string
): CreateErrorInput => ({
  type: 'network',
  message,
  ...(details !== undefined ? { details } : {}),
  recoverable: true,
});

export const createValidationError = (
  message: string,
  details?: string
): CreateErrorInput => ({
  type: 'validation',
  message,
  ...(details !== undefined ? { details } : {}),
  recoverable: true,
});

export const createCartError = (
  message: string,
  details?: string
): CreateErrorInput => ({
  type: 'cart',
  message,
  ...(details !== undefined ? { details } : {}),
  recoverable: true,
});

export const createCheckoutError = (
  message: string,
  details?: string
): CreateErrorInput => ({
  type: 'checkout',
  message,
  ...(details !== undefined ? { details } : {}),
  recoverable: false,
});

export const createGeneralError = (
  message: string,
  details?: string
): CreateErrorInput => ({
  type: 'general',
  message,
  ...(details !== undefined ? { details } : {}),
  recoverable: false,
});

export const createAuthError = (
  message: string,
  details?: string
): CreateErrorInput => ({
  type: 'auth',
  message,
  ...(details !== undefined ? { details } : {}),
  recoverable: true,
});

/**
 * Convert Error object to CreateErrorInput
 */
export const errorToCreateInput = (
  error: Error,
  context?: Record<string, unknown>
): CreateErrorInput => ({
  type: 'general',
  message: error.message,
  ...(error.stack !== undefined ? { stack: error.stack } : {}),
  ...(context !== undefined ? { context } : {}),
  recoverable: false,
});
