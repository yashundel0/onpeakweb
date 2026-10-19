import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OnPeak runtime error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-deepest px-6 text-center">
          <div className="max-w-md">
            <h1 className="font-display text-3xl font-extrabold text-white">
              Something went wrong
            </h1>
            <p className="mt-4 text-sm text-brand-cream/60">
              We hit an unexpected problem while loading the page. Your data is
              safe. Reloading usually fixes this.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-brand-deepest transition-colors hover:bg-brand-light"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
