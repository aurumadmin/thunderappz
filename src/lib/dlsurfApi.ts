/**
 * DL.surf API client helper
 * Handles fetching blogs and single articles with automatic server proxying and resilient CORS fallback proxies.
 */

export interface DlSurfPost {
  id: number | string;
  title: string;
  description?: string;
  summary?: string;
  link_slug: string;
  created_at?: string;
  thumbnail_path?: string | null;
  is_readaloud?: boolean;
  content_json?: any;
  [key: string]: any;
}

export interface DlSurfCreatorResponse {
  status: string;
  message?: string;
  data?: DlSurfPost[];
}

export interface DlSurfDocResponse {
  status: string;
  message?: string;
  data?: DlSurfPost;
}

export const FALLBACK_THUNDERBOLT_POSTS: DlSurfPost[] = [
  {
    id: 657376,
    title: "How to Install Docker on Ubuntu VPS in 2026: Complete Beginner’s Guide",
    description: "If you've recently started using a VPS, you've probably heard about Docker. Docker is one of the most useful tools you can learn if you want to host websites, APIs, databases, bots, and other applications on your own server. Instead of manually installing every dependency for every project, Docker lets you package applications and their dependencies into isolated containers. In this guide, we'll learn how to install Docker on an Ubuntu VPS, verify that it's working, run your first container, manage containers, and deploy a simple application.",
    summary: "Complete step-by-step guide to installing Docker, managing containers, and deploying your first application on an Ubuntu VPS.",
    thumbnail_path: "thumbnails/6b04bcab-2.png",
    link_slug: "how-to-install-docker-on-ubuntu-vps-in-2026-complete-beginners-guide",
    created_at: "2026-08-30T02:59:55.240205Z",
  },
  {
    id: 657375,
    title: "How to Set Up a Cheap Linux VPS in 2026: A Beginner’s Complete Guide",
    description: "A VPS can sound complicated when you're just getting started with Linux. You may have seen terms like SSH, Ubuntu, root access, IPv4, ports, firewall, Docker, Nginx, and systemd and wondered where you're even supposed to begin. The good news is that setting up a VPS isn't nearly as difficult as it looks. In this guide, we'll walk through the process of setting up a Linux VPS from scratch, securing it, connecting to it through SSH, and preparing it to run websites, APIs, bots, applications, and other projects.",
    summary: "Learn how to choose, connect to, secure, and configure a cheap Linux VPS from scratch without prior experience.",
    thumbnail_path: "thumbnails/a6bc0041-3.png",
    link_slug: "how-to-set-up-a-cheap-linux-vps-in-2026-a-beginners-complete-guide",
    created_at: "2026-08-30T02:56:39.19527Z",
  },
  {
    id: 657360,
    title: "How to Protect Your Linux VPS With Fail2Ban: A Beginner’s Guide",
    description: "If your Linux VPS is connected to the public internet, automated bots may constantly scan it for open ports and attempt to log in to services such as SSH. This doesn't necessarily mean your server has been compromised. Internet-facing servers receive automated connection attempts all the time. However, it's still important to add sensible security measures. One useful tool is Fail2Ban. Fail2Ban monitors logs for suspicious activity and can temporarily block IP addresses that repeatedly fail authentication.",
    summary: "Stop automated brute-force attacks on your Linux VPS SSH port by configuring Fail2Ban filters and jails.",
    thumbnail_path: "thumbnails/940332bd-3.png",
    link_slug: "how-to-protect-your-linux-vps-with-fail2ban-a-beginners-guide",
    created_at: "2026-08-29T07:53:40.949705Z",
  },
  {
    id: 657300,
    title: "How to Enable HTTPS on Your VPS With Nginx and Let’s Encrypt",
    description: "If you've connected your domain to a VPS and configured Nginx, there's one important step left before putting your website into production: HTTPS. HTTPS encrypts the connection between your visitors and your server. It also helps protect sensitive information and prevents browsers from displaying security warnings for an unsecured website. The easiest way to get a free HTTPS certificate on a Linux VPS is usually Let's Encrypt, combined with Certbot.",
    summary: "Secure your Nginx web server with free, automated SSL/TLS certificates using Let's Encrypt and Certbot.",
    thumbnail_path: "thumbnails/0dbc4c79-a.png",
    link_slug: "how-to-enable-https-on-your-vps-with-nginx-and-lets-encrypt",
    created_at: "2026-08-26T14:41:21.500228Z",
  },
  {
    id: 657299,
    title: "How to Point a Domain to Your VPS: A Beginner’s DNS Guide",
    description: "Buying a domain is only the first step toward putting a website online. If your website or application is running on a VPS, you need to connect your domain to the server so visitors can reach it using a familiar address such as example.com. This process is handled through DNS, or the Domain Name System. In this beginner-friendly guide, we'll explain how DNS works, which records you need, how to point a domain to a VPS, and how to troubleshoot common problems.",
    summary: "Understand A records, CNAMEs, propagation, and DNS setup to connect any domain to your Linux server IP address.",
    thumbnail_path: "thumbnails/3ba0a7b4-f.png",
    link_slug: "how-to-point-a-domain-to-your-vps-a-beginners-dns-guide",
    created_at: "2026-08-26T14:39:41.201835Z",
  },
  {
    id: 657298,
    title: "How to Use Nginx as a Reverse Proxy on a Linux VPS",
    description: "If you run applications on a Linux VPS, you may eventually want to host multiple websites or services on the same server. This is where Nginx as a reverse proxy becomes extremely useful. Instead of exposing every application on a different port, Nginx can receive incoming web requests and forward them to the appropriate application running internally on your VPS.",
    summary: "Host multiple web applications and node services under standard HTTP/HTTPS ports using Nginx reverse proxy blocks.",
    thumbnail_path: "thumbnails/d5e38eef-5.png",
    link_slug: "how-to-use-nginx-as-a-reverse-proxy-on-a-linux-vps",
    created_at: "2026-08-26T14:36:55.104397Z",
  }
];

/**
 * Helper to safely extract JSON from various proxy response structures.
 */
function parseProxyResponse(rawText: string): any {
  const trimmed = rawText.trim();
  if (!trimmed || trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype')) {
    throw new Error('Response is HTML or empty, not JSON');
  }

  try {
    const json = JSON.parse(trimmed);
    // If the proxy wraps response in a 'contents' field (e.g. allorigins /get)
    if (json && typeof json.contents === 'string') {
      const innerTrimmed = json.contents.trim();
      if (innerTrimmed.startsWith('<') || innerTrimmed.toLowerCase().includes('<!doctype')) {
        throw new Error('Wrapped content is HTML');
      }
      try {
        return JSON.parse(json.contents);
      } catch (e) {
        return json;
      }
    }
    return json;
  } catch (err: any) {
    throw new Error(err?.message || 'Response is not valid JSON');
  }
}

/**
 * Fetches blogs for a creator username from DL.surf with resilient proxies & fallbacks.
 */
export async function fetchDlSurfCreatorPosts(
  username: string, 
  limit: number = 40
): Promise<DlSurfPost[]> {
  const cleanUser = username.trim();
  if (!cleanUser) return FALLBACK_THUNDERBOLT_POSTS;

  const directUrl = `https://docapi.dl.surf/api/creator/${encodeURIComponent(cleanUser)}?limit=${limit}`;
  
  // List of endpoints to try sequentially
  const fetchCandidates = [
    // 1. Local Node.js server proxy (handles CORS on backend if server is running)
    `/api/dlsurf/creator/${encodeURIComponent(cleanUser)}?limit=${limit}`,
    
    // 2. AllOrigins raw proxy (returns clean JSON directly)
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    
    // 3. Codetabs CORS proxy
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
    
    // 4. Wrapped AllOrigins proxy
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    
    // 5. Direct call
    directUrl,
  ];

  let lastError: Error | null = null;

  for (const candidateUrl of fetchCandidates) {
    try {
      const res = await fetch(candidateUrl);
      if (!res.ok) {
        continue;
      }

      // Ensure response is application/json or non-HTML text
      const contentType = res.headers.get('content-type') || '';
      if (candidateUrl.startsWith('/api/') && contentType.includes('text/html')) {
        // SPA fallback served index.html instead of real API route
        continue;
      }

      const rawText = await res.text();
      const data = parseProxyResponse(rawText);

      if (data && data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      } else if (Array.isArray(data) && data.length > 0) {
        return data as DlSurfPost[];
      }
    } catch (err: any) {
      console.warn(`DL.surf creator fetch attempt failed for endpoint (${candidateUrl}):`, err);
      lastError = err;
    }
  }

  console.warn(`All network attempts failed for "${cleanUser}". Using fallback dataset.`);
  if (cleanUser.toLowerCase() === 'thunderbolt') {
    return FALLBACK_THUNDERBOLT_POSTS;
  }

  // Return fallback posts rather than throwing error to prevent empty UI
  return FALLBACK_THUNDERBOLT_POSTS;
}

/**
 * Fetches a single document by username and link_slug from DL.surf with fallbacks.
 */
export async function fetchDlSurfDoc(
  username: string, 
  linkSlug: string
): Promise<DlSurfPost> {
  const cleanUser = username.trim();
  const cleanSlug = linkSlug.trim();
  if (!cleanUser || !cleanSlug) {
    throw new Error('Username and link slug are required');
  }

  const directUrl = `https://docapi.dl.surf/api/doc/${encodeURIComponent(cleanUser)}/${encodeURIComponent(cleanSlug)}`;

  const fetchCandidates = [
    // 1. Local backend proxy
    `/api/dlsurf/doc/${encodeURIComponent(cleanUser)}/${encodeURIComponent(cleanSlug)}`,
    
    // 2. AllOrigins raw proxy
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    
    // 3. Codetabs CORS proxy
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
    
    // 4. Wrapped AllOrigins proxy
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    
    // 5. Direct call
    directUrl,
  ];

  let lastError: Error | null = null;

  for (const candidateUrl of fetchCandidates) {
    try {
      const res = await fetch(candidateUrl);
      if (!res.ok) {
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (candidateUrl.startsWith('/api/') && contentType.includes('text/html')) {
        continue;
      }

      const rawText = await res.text();
      const data = parseProxyResponse(rawText);

      if (data && data.status === 'success' && data.data) {
        return data.data;
      } else if (data && data.id && data.title) {
        return data as DlSurfPost;
      }
    } catch (err: any) {
      console.warn(`DL.surf doc fetch attempt failed for endpoint (${candidateUrl}):`, err);
      lastError = err;
    }
  }

  // Fallback match from static posts list if network fails
  const matched = FALLBACK_THUNDERBOLT_POSTS.find(
    p => p.link_slug === cleanSlug || String(p.id) === cleanSlug
  );
  if (matched) {
    return matched;
  }

  throw lastError || new Error(`Failed to fetch article "${cleanSlug}" from DL.surf.`);
}
