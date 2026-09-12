/**
 * DL.surf API client helper
 * Handles fetching blogs and single articles with automatic server proxying and resilient CORS fallback proxies.
 */

import { FALLBACK_THUNDERBOLT_POSTS } from './fallbackPosts';

export { FALLBACK_THUNDERBOLT_POSTS };

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

/**
 * Helper to fetch with strict timeout using AbortController
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 3000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

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
  
  // List of endpoints to try sequentially with short timeout
  const fetchCandidates = [
    // 1. Primary backend proxy (Express server or Cloudflare Workers/_worker.js/Functions proxy)
    `/api/dlsurf/creator/${encodeURIComponent(cleanUser)}?limit=${limit}`,
    
    // 2. Codetabs CORS proxy
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
    
    // 3. AllOrigins raw proxy
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    
    // 4. Wrapped AllOrigins proxy
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    
    // 5. Direct call
    directUrl,
  ];

  let lastError: Error | null = null;

  for (const candidateUrl of fetchCandidates) {
    try {
      // 3 second strict timeout per candidate
      const res = await fetchWithTimeout(candidateUrl, 3000);
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
    // 1. Primary backend proxy (Express server or Cloudflare Workers/_worker.js/Functions proxy)
    `/api/dlsurf/doc/${encodeURIComponent(cleanUser)}/${encodeURIComponent(cleanSlug)}`,
    
    // 2. Codetabs CORS proxy
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
    
    // 3. AllOrigins raw proxy
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    
    // 4. Wrapped AllOrigins proxy
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    
    // 5. Direct call
    directUrl,
  ];

  let lastError: Error | null = null;

  for (const candidateUrl of fetchCandidates) {
    try {
      // 3 second strict timeout per candidate
      const res = await fetchWithTimeout(candidateUrl, 3000);
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

  // Fallback match from static posts list if network fails or times out
  const matched = FALLBACK_THUNDERBOLT_POSTS.find(
    p => p.link_slug === cleanSlug || String(p.id) === cleanSlug
  );
  if (matched) {
    return matched;
  }

  throw lastError || new Error(`Failed to fetch article "${cleanSlug}" from DL.surf.`);
}
