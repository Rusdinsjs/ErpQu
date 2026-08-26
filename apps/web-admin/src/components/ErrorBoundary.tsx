import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component with user-friendly recovery and technical diagnostics
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-xl w-full border border-border shadow-xl rounded-2xl bg-card p-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 p-3 bg-red-500/10 rounded-2xl text-red-500">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Oops! Terjadi Kendala Tampilan
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Modul ini mengalami kesalahan saat memproses data.
                  </p>
                </div>
              </div>

              {this.state.error && (
                <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-left">
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
                    <strong>Pesan:</strong> {this.state.error.message || this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2 text-xs">
                      <summary className="text-xs font-semibold text-red-500 cursor-pointer">
                        Detail Teknis
                      </summary>
                      <pre className="mt-1.5 p-2 bg-black/5 dark:bg-white/5 rounded text-[10px] text-muted-foreground overflow-auto max-h-36">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Button
                  onClick={this.handleReset}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm px-4 py-2"
                >
                  Coba Lagi
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="rounded-xl text-sm px-4 py-2"
                >
                  Muat Ulang Halaman
                </Button>
                <Button
                  onClick={this.handleGoDashboard}
                  variant="secondary"
                  className="rounded-xl text-sm px-4 py-2"
                >
                  Ke Dashboard Utama
                </Button>
              </div>

              <div className="mt-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <p>
                  Jika kendala terus berlanjut, silakan hubungi tim administrator ERPQu.
                </p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
