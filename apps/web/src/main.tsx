import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { config } from './config';
import './index.css';

if (config.sentryDsn) {
  void import('@sentry/react').then(({ init }) => {
    init({
      dsn: config.sentryDsn,
      environment: import.meta.env.MODE,
      release: config.sentryRelease,
      sendDefaultPii: false,
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
