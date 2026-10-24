/**
 * Production Startup Entry Point for cPanel Setup Node.js App & CloudLinux Passenger
 *
 * In cPanel "Setup Node.js App":
 * - Application startup file: app.js
 * - Application mode: Production
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import('./dist/server.cjs').catch((err) => {
  console.error('[cPanel Startup Error] Failed to load ./dist/server.cjs.');
  console.error('Please ensure "npm run build" was executed and the "dist/" directory is uploaded.');
  console.error(err);
  process.exit(1);
});
