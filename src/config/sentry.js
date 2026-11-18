/**
 * Configuración centralizada de Sentry para monitoreo de errores en producción.
 */
let SentrySdk = null;
try {
  SentrySdk = require('@sentry/react-native');
} catch (_e) {}

export function initSentry() {
  const dsn = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SENTRY_DSN : null;
  if (SentrySdk && dsn) {
    SentrySdk.init({
      dsn,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
    });
  }
}

export function captureAppError(error, context = {}) {
  if (SentrySdk && typeof SentrySdk.captureException === 'function') {
    SentrySdk.captureException(error, { extra: context });
  }
}
