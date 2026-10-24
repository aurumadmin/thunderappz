/**
 * Alternative Production Startup Entry Point (cPanel / VPS / Docker / PM2)
 *
 * Can be specified in cPanel if startup file is configured as server.js
 */

// 1. Immediately disable Passenger's auto-installer hook before any modules load
if (typeof PhusionPassenger !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

// 2. Prevent duplicate startup if Passenger or a process runner re-evaluates server.js
if (!global.__THUNDER_SERVER_ENTRY_STARTED__) {
  global.__THUNDER_SERVER_ENTRY_STARTED__ = true;

  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  import('./dist/server.cjs').catch((err) => {
    console.error('[Startup Error] Failed to load ./dist/server.cjs.');
    console.error('Please ensure "npm run build" was executed and the "dist/" directory is uploaded.');
    console.error(err);
    process.exit(1);
  });
}
