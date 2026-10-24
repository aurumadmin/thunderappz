/**
 * Alternative Production Startup Entry Point (cPanel / VPS / Docker / PM2)
 *
 * Can be specified in cPanel if startup file is configured as server.js
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import('./dist/server.cjs').catch((err) => {
  console.error('[Startup Error] Failed to load ./dist/server.cjs.');
  console.error('Please ensure "npm run build" was executed and the "dist/" directory is uploaded.');
  console.error(err);
  process.exit(1);
});
