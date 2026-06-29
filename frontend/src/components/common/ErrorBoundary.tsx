import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="clay max-w-md space-y-4 rounded-2xl p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              {this.state.error.message}
            </p>
            <Button onClick={this.reset} variant="default" className="mx-auto">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}