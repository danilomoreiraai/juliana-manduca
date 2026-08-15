import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    void import('@sentry/react').then(({ captureException }) => {
      captureException(error, { extra: { componentStack: info.componentStack } });
    });
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="cosmic-bg grid min-h-screen place-items-center px-5 text-center">
        <p>Algo inesperado aconteceu. Tente recarregar a página.</p>
      </div>
    );
  }
}
