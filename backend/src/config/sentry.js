let Sentry = null;
try {
  Sentry = require('@sentry/node');
} catch (_e) {}

function initBackendSentry() {
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
  }
}

module.exports = { initBackendSentry, Sentry };
