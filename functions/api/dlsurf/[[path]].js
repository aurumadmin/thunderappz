// Cloudflare Pages Functions handler for /api/dlsurf/*
// Serves as Cloudflare edge proxy to bypass browser CORS on docapi.dl.surf

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Handle preflight OPTIONS request
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

  // Extract path after /api/dlsurf/
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
