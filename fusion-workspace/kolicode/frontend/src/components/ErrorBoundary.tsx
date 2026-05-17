import * as React from 'react';

interface ErrorBoundaryProps {
  /** Fallback UI to render when an error occurs */
  fallback: React.ReactNode;
  /** Optional callback to log error information */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** React children */
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error */
  error: Error | null;
  /** Error information from React */
  errorInfo: React.ErrorInfo | null;
}

/**
 * A React component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * Usage:
 *   <ErrorBoundary fallback={<div>Something went wrong.</div>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  /**
   * Called when an error is thrown by a descendant component.
   * Updates state to show the fallback UI and logs the error.
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  /**
   * Called after an error has been thrown and the fallback UI has been rendered.
   * Logs the error and error information to the console and calls the onError callback if provided.
   */
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught error in component tree:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}