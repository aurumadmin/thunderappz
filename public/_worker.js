// Cloudflare Pages / Workers Advanced Worker script
// Automatically mounted by Cloudflare Pages when building static site

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Proxy DL.surf API requests from Cloudflare edge server to bypass browser CORS
    if (url.pathname.startsWith('/api/dlsurf/')) {
      const subPath = url.pathname.replace(/^\/api\/dlsurf\/?/, '');
      const targetUrl = `https://docapi.dl.surf/api/${subPath}${url.search}`;

      try {
        const originResponse = await fetch(targetUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const bodyText = await originResponse.text();

        return new Response(bodyText, {
          status: originResponse.status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'public, max-age=300'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ status: 'error', message: err.message }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 2. Proxy site config requests on static worker hosts
    if (url.pathname === '/api/config') {
      if (request.method === 'GET') {
        try {
          const configAsset = await env.ASSETS.fetch(new URL('/site_config.json', request.url));
          if (configAsset.ok) {
            return configAsset;
          }
        } catch (e) {
          // fallback below
        }
      }
    }

    // Handle OPTIONS CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // 3. Fallback to static asset serving for all frontend pages and assets
    return env.ASSETS.fetch(request);
  }
};
