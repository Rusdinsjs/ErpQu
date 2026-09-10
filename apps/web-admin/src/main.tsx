// Main Entry Point - Pure Tailwind
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/mobile.css';
import App from './App.tsx';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// Handle dynamic chunk loading failures gracefully (e.g. after a redeployment with new hashes)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New deployment detected or chunk failed to load, reloading app...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
