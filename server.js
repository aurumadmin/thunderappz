/**
 * Thunder — cPanel / CloudLinux startup entry point (server.js alias)
 */
process.env.NODE_ENV = 'production';
if (typeof globalThis.PhusionPassenger === 'undefined' && !process.env.PORT) {
  process.env.PORT = '3001';
}

import('./dist/server.cjs').catch((err) => {
  console.error('[Thunder] Failed to start application:', err);
  process.exit(1);
});
