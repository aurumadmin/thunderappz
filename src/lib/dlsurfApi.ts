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

/**
 * Helper to safely extract JSON from various proxy response structures.
 */
function parseProxyResponse(rawText: string): any {
  try {
    const json = JSON.parse(rawText);
    // If the proxy wraps response in a 'contents' field (e.g. allorigins /get)
    if (json && typeof json.contents === 'string') {
      try {
        return JSON.parse(json.contents);
      } catch (e) {
        return json;
      }
    }
    return json;
  } catch (err) {
    throw new Error('Response is not valid JSON');
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
  if (!cleanUser) return [];

  const directUrl = `https://docapi.dl.surf/api/creator/${encodeURIComponent(cleanUser)}?limit=${limit}`;
  
  // List of endpoints to try sequentially
  const fetchCandidates = [
    // 1. Local Node.js server proxy (handles CORS on backend)
    `/api/dlsurf/creator/${encodeURIComponent(cleanUser)}?limit=${limit}`,
    
    // 2. Direct CORS proxy 1
    `https://cors.sh/${directUrl}`,
    
    // 3. Direct CORS proxy 2
    `https://proxy.cors.sh/${directUrl}`,
    
    // 4. Wrapped CORS proxy 3
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

  throw lastError || new Error(`Unable to fetch articles for creator "@${cleanUser}". Please verify username.`);
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
    
    // 2. Direct CORS proxy 1
    `https://cors.sh/${directUrl}`,
    
    // 3. Direct CORS proxy 2
    `https://proxy.cors.sh/${directUrl}`,
    
    // 4. Wrapped CORS proxy 3
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

  throw lastError || new Error(`Failed to fetch article "${cleanSlug}" from DL.surf.`);
}


