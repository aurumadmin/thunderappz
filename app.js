/**
 * Thunder — Production startup entry point
 */
process.env.NODE_ENV = 'production';
if (typeof globalThis.PhusionPassenger === 'undefined' && !process.env.PORT) {
  process.env.PORT = '3000';
}

import('./dist/server.cjs').catch((err) => {
  console.error('[Thunder] Failed to start application:', err);
  process.exit(1);
});
