// Cloudflare Pages / Workers Advanced Worker script
// Automatically mounted by Cloudflare Pages when building static site

const SHORTENER_PROVIDERS = [
  {
    id: 'iflylink',
    name: 'iFlyLink',
    domain: 'iflylink.com',
    apiBaseUrl: 'https://iflylink.com/api',
    quickLinkBaseUrl: 'https://iflylink.com/st',
    apiToken: 'd50e9f33ac2ba0fa9871d0deb52a3ee1d09d9a9a',
  },
  {
    id: 'vplink',
    name: 'VPLINK',
    domain: 'vplink.in',
    apiBaseUrl: 'https://vplink.in/api',
    quickLinkBaseUrl: 'https://vplink.in/st',
    apiToken: '85f94d452596fe752d1d71183007a12088a0285a',
  },
  {
    id: 'earnlinks',
    name: 'EarnLinks',
    domain: 'earnlinks.in',
    apiBaseUrl: 'https://earnlinks.in/api',
    quickLinkBaseUrl: 'https://earnlinks.in/st',
    apiToken: 'c9a8b1733dbf489f3757d15c04ecaf29044ca251',
  },
  {
    id: 'linkco',
    name: 'LinkCo',
    domain: 'linkco.site',
    apiBaseUrl: 'https://linkco.site/api',
    quickLinkBaseUrl: 'https://linkco.site/st',
    apiToken: 'c4f3b602d93d8d1c26eb43f12eb3986865f1094a',
  },
];

function selectOrderedProviders(usedProviders = []) {
  const usedSet = new Set(Array.isArray(usedProviders) ? usedProviders.filter(Boolean) : []);
  const unused = SHORTENER_PROVIDERS.filter((p) => !usedSet.has(p.id));
  return unused.length > 0 ? unused : SHORTENER_PROVIDERS;
}

function buildDestUrl(returnUrl, token, providerId) {
  try {
    const u = new URL(returnUrl);
    u.searchParams.set('vp_unlock', token);
    u.searchParams.set('sp', providerId);
    return u.toString();
  } catch {
    const sep = returnUrl.includes('?') ? '&' : '?';
    return `${returnUrl}${sep}vp_unlock=${encodeURIComponent(token)}&sp=${encodeURIComponent(providerId)}`;
  }
}

async function shortenFromProvider(provider, encodedDest) {
  const customAlias = `th${Math.random().toString(36).substring(2, 8)}`;
  const jsonApiUrl = `${provider.apiBaseUrl}?api=${provider.apiToken}&url=${encodedDest}&alias=${customAlias}`;

  try {
    const res = await fetch(jsonApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json, text/plain, */*',
      },
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data && data.status !== 'error' && data.shortenedUrl) {
        const clean = String(data.shortenedUrl)
          .replace(/\\\//g, '/')
          .replace(/^"+|"+$/g, '')
          .trim();
        if (clean.startsWith('http')) return clean;
      }
    } catch {
      if (text.trim().startsWith('http')) return text.trim();
    }
  } catch {
    // fallback below
  }

  try {
    const textApiUrl = `${provider.apiBaseUrl}?api=${provider.apiToken}&url=${encodedDest}&format=text`;
    const fbRes = await fetch(textApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const fbText = (await fbRes.text()).trim();
    if (fbText.startsWith('http')) return fbText;
  } catch {
    // fallback below
  }

  return '';
}

async function resolveShortLink(gameSlug, returnUrl, providedToken, usedProviders = []) {
  const unlockToken =
    providedToken && String(providedToken).startsWith('vpl_')
      ? String(providedToken)
      : `vpl_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;

  const candidates = selectOrderedProviders(usedProviders);
  let chosenProvider = candidates[0] || SHORTENER_PROVIDERS[0];
  let shortenedUrl = '';

  for (const candidate of candidates) {
    const destUrl = buildDestUrl(returnUrl, unlockToken, candidate.id);
    const encodedDest = encodeURIComponent(destUrl);
    const generated = await shortenFromProvider(candidate, encodedDest);
    if (generated) {
      chosenProvider = candidate;
      shortenedUrl = generated;
      break;
    }
  }

  if (!shortenedUrl) {
    const destUrl = buildDestUrl(returnUrl, unlockToken, chosenProvider.id);
    const encodedDest = encodeURIComponent(destUrl);
    shortenedUrl = `${chosenProvider.quickLinkBaseUrl}?api=${chosenProvider.apiToken}&url=${encodedDest}`;
  }

  return {
    shortenedUrl,
    token: unlockToken,
    providerId: chosenProvider.id,
    providerName: chosenProvider.name,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle OPTIONS CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 1. Shortener API: POST /api/vplink/shorten
    if (url.pathname === '/api/vplink/shorten' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const gameSlug = String(body.gameSlug || 'game');
        const returnUrl = String(body.returnUrl || `${url.origin}/game/${gameSlug}`);
        const token = body.token ? String(body.token) : undefined;
        const usedProviders = Array.isArray(body.usedProviders) ? body.usedProviders.map(String) : [];

        const result = await resolveShortLink(gameSlug, returnUrl, token, usedProviders);
        return new Response(
          JSON.stringify({
            status: 'success',
            shortenedUrl: result.shortenedUrl,
            token: result.token,
            providerId: result.providerId,
            providerName: result.providerName,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ status: 'error', message: err.message || 'Failed to shorten URL' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // 2. Shortener Direct Redirect: GET /api/vplink/go/:gameSlug
    if (url.pathname.startsWith('/api/vplink/go/')) {
      const gameSlug = decodeURIComponent(url.pathname.replace(/^\/api\/vplink\/go\/?/, '')) || 'game';
      const token = url.searchParams.get('token') || undefined;
      const returnUrl = url.searchParams.get('returnUrl') || `${url.origin}/game/${encodeURIComponent(gameSlug)}`;
      const usedParam = url.searchParams.get('used') || '';
      const usedProviders = usedParam
        ? usedParam.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const result = await resolveShortLink(gameSlug, returnUrl, token, usedProviders);
      return Response.redirect(result.shortenedUrl, 302);
    }

    // 3. Shortener Verification & Status: GET /api/vplink/verify & /api/vplink/status
    if (url.pathname === '/api/vplink/verify' || url.pathname === '/api/vplink/status') {
      const token = url.searchParams.get('token') || '';
      const sp = url.searchParams.get('sp') || 'iflylink';
      const verified = Boolean(token && token.startsWith('vpl_'));
      return new Response(
        JSON.stringify({
          status: 'success',
          verified,
          providerId: sp,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 4. Proxy DL.surf API requests from Cloudflare edge server to bypass browser CORS
    if (url.pathname.startsWith('/api/dlsurf/')) {
      const subPath = url.pathname.replace(/^\/api\/dlsurf\/?/, '');
      const targetUrl = `https://docapi.dl.surf/api/${subPath}${url.search}`;

      try {
        const originResponse = await fetch(targetUrl, {
          headers: {
            Accept: 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const bodyText = await originResponse.text();

        return new Response(bodyText, {
          status: originResponse.status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ status: 'error', message: err.message }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // 5. Proxy site config requests on static worker hosts
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

    // 6. Fallback to static asset serving for all frontend pages and assets
    return env.ASSETS.fetch(request);
  },
};
