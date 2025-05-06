import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // You can also log to an error reporting service here
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary p-4 m-4 border border-red-500 rounded bg-red-50">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <details className="text-sm bg-white p-3 rounded">
            <summary className="cursor-pointer font-medium">Error details (for developers)</summary>
            <pre className="mt-2 whitespace-pre-wrap text-red-900 bg-red-50 p-2 rounded">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
