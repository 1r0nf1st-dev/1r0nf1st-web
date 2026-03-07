'use client';

import { useCallback } from 'react';
import { useAlert } from '../contexts/AlertContext';
import { useLiveRegion } from '../contexts/LiveRegionContext';
import { ApiError } from '../apiClient';

interface ErrorHandlerOptions {
  /** Whether to show alert modal (default: true) */
  showAlert?: boolean;
  /** Whether to announce to screen readers (default: true) */
  announce?: boolean;
  /** Custom error message prefix */
  prefix?: string;
  /** Fallback message if error cannot be parsed */
  fallback?: string;
}

/**
 * Hook for standardized error handling.
 * Provides consistent error handling with alerts and screen reader announcements.
 */
export const useErrorHandler = () => {
  const { showAlert } = useAlert();
  const { announce } = useLiveRegion();

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showAlert: showAlertModal = true,
        announce: announceError = true,
        prefix = '',
        fallback = 'An error occurred. Please try again.',
      } = options;

      let message = fallback;
      let title = 'Error';

      // Parse error message
      if (error instanceof ApiError) {
        message = error.message;
        if (error.status === 401) {
          title = 'Authentication Error';
          message = 'Please log in to continue.';
        } else if (error.status === 403) {
          title = 'Permission Denied';
          message = 'You do not have permission to perform this action.';
        } else if (error.status === 404) {
          title = 'Not Found';
          message = 'The requested resource was not found.';
        } else if (error.status >= 500) {
          title = 'Server Error';
          message = 'A server error occurred. Please try again later.';
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object') {
        // Handle various object error formats
        const errorObj = error as Record<string, unknown>;
        if ('message' in errorObj && typeof errorObj.message === 'string') {
          message = errorObj.message;
        } else if ('error' in errorObj && typeof errorObj.error === 'string') {
          message = errorObj.error;
        } else if ('error_description' in errorObj && typeof errorObj.error_description === 'string') {
          // Supabase auth errors
          message = errorObj.error_description;
        } else if ('msg' in errorObj && typeof errorObj.msg === 'string') {
          message = errorObj.msg;
        } else {
          // Try to stringify the object for debugging
          try {
            const stringified = JSON.stringify(error);
            if (stringified && stringified !== '{}') {
              message = `Error: ${stringified}`;
            }
          } catch {
            // Keep fallback
          }
        }
      }

      const fullMessage = prefix ? `${prefix} ${message}` : message;

      // Show alert modal
      if (showAlertModal) {
        showAlert(fullMessage, title);
      }

      // Announce to screen readers
      if (announceError) {
        announce(`Error: ${title}. ${fullMessage}`, 'assertive');
      }

      // Log to console for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error handled:', {
          errorType: error?.constructor?.name ?? typeof error,
          error,
          message: fullMessage,
          title,
        });
      }

      return { message: fullMessage, title };
    },
    [showAlert, announce],
  );

  return { handleError };
};
