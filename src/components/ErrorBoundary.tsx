'use client';

import type { JSX } from 'react';
import { Component, type ReactNode } from 'react';
import { reportError } from '../utils/errorReporter';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => JSX.Element;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches React errors and logs them
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    // Get user ID if available (we'll need to pass it via context or props)
    // For now, we'll report without userId
    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorData: {
        type: 'react-error-boundary',
      },
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): JSX.Element | ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <article className={cardClasses} style={{ maxWidth: '600px' }}>
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Something went wrong</h2>
        <div className={cardBody}>
          <p className="mb-4">
            We&apos;re sorry, but something unexpected happened. The error has been logged and we&apos;ll
            look into it.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm">
              <summary className="cursor-pointer font-medium mb-2">Error details (dev only)</summary>
              <pre className="whitespace-pre-wrap text-xs overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button onClick={resetError} className={`${btnBase} ${btnPrimary}`}>
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className={`${btnBase} ${btnPrimary}`}
            >
              Go Home
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
