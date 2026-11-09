/**
 * Thunder — HidenCloud (Pterodactyl) & cPanel startup entry point (server.js alias)
 */
process.env.NODE_ENV = 'production';
if (typeof globalThis.PhusionPassenger === 'undefined') {
  process.env.PORT =
    process.env.SERVER_PORT ||
    process.env.P_SERVER_PORT ||
    process.env.APP_PORT ||
    process.env.PORT ||
    '24597';
}

import('./dist/server.cjs').catch((err) => {
  console.error('[Thunder] Failed to start application:', err);
  process.exit(1);
});
