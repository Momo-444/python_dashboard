import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Filtrer les erreurs connues
    beforeSend(event) {
      if (event.exception?.values?.[0]?.value?.includes('NetworkError')) {
        return null;
      }
      return event;
    },
  });
}

// Helper pour capturer des erreurs manuellement
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

// Helper pour définir l'utilisateur courant
export function setUser(user: { id: string; email?: string; role?: string }) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

// Helper pour effacer l'utilisateur (logout)
export function clearUser() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
