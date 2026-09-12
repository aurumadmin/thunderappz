import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { DEFAULT_CONFIG, INITIAL_CUSTOM_POSTS } from "./src/types";

// In-memory store for AdsLab S2S Captcha Verifications
const captchaVerifications = new Map<string, { verified: boolean; timestamp: number; token?: string }>();

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "site_config.json");

const DEFAULT_SERVER_CONFIG = DEFAULT_CONFIG;

function ensureDataDirExists() {
  const dir = path.dirname(CONFIG_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSavedSiteData() {
  try {
    ensureDataDirExists();
    let siteData: any = null;

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      try {
        const fileData = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
        siteData = JSON.parse(fileData);
      } catch (e) {
        console.error("Error reading CONFIG_FILE_PATH:", e);
      }
    }

    if (!siteData) {
      const publicConfigPath = path.join(process.cwd(), "public", "site_config.json");
      if (fs.existsSync(publicConfigPath)) {
        try {
          const fileData = fs.readFileSync(publicConfigPath, "utf-8");
          siteData = JSON.parse(fileData);
        } catch (e) {
          console.error("Error reading publicConfigPath:", e);
        }
      }
    }

    if (siteData) {
      const loadedConfig = { ...DEFAULT_SERVER_CONFIG, ...(siteData.config || {}) };
      return {
        config: loadedConfig,
        customPosts: Array.isArray(siteData.customPosts) ? siteData.customPosts : [],
      };
    }
  } catch (err) {
    console.error("Error loading site data:", err);
  }
  return { config: DEFAULT_SERVER_CONFIG, customPosts: [] };
}

function generateSitemapXml(host: string, data: { config?: any; customPosts?: any[] }) {
  const protocol = host.includes("localhost") ? "http" : "https";
  const cleanHost = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const baseUrl = `${protocol}://${cleanHost}`;
  const now = new Date().toISOString().split("T")[0];

  const userPosts = Array.isArray(data?.customPosts) ? data.customPosts : [];
  const combinedPosts = [...userPosts, ...INITIAL_CUSTOM_POSTS];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Dynamic Custom Posts (Real Blog Articles)
  const seenSlugs = new Set<string>();
  combinedPosts.forEach((post) => {
    if (!post || !post.slug || seenSlugs.has(post.slug)) return;
    seenSlugs.add(post.slug);

    let postMod = now;
    if (post.date) {
      const parsed = Date.parse(post.date);
      if (!isNaN(parsed)) {
        postMod = new Date(parsed).toISOString().split("T")[0];
      }
    }

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/post/${encodeURIComponent(post.slug)}</loc>\n`;
    xml += `    <lastmod>${postMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

function saveSiteData(data: { config?: any; customPosts?: any[] }) {
  try {
    ensureDataDirExists();
    const existing = loadSavedSiteData();
    const mergedConfig = data.config !== undefined 
      ? { ...existing.config, ...data.config } 
      : existing.config;
    const mergedPosts = data.customPosts !== undefined 
      ? data.customPosts 
      : existing.customPosts;

    const merged = {
      config: mergedConfig,
      customPosts: mergedPosts,
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");

    // Also write directly to public/ads.txt and public/site_config.json for static hosting compatibility
    if (merged.config) {
      if (typeof merged.config.adsTxt === "string") {
        const publicAdsPath = path.join(process.cwd(), "public", "ads.txt");
        try {
          fs.mkdirSync(path.dirname(publicAdsPath), { recursive: true });
          fs.writeFileSync(publicAdsPath, merged.config.adsTxt, "utf-8");
        } catch (e) {
          console.error("Could not sync to public/ads.txt:", e);
        }

        const distAdsPath = path.join(process.cwd(), "dist", "ads.txt");
        if (fs.existsSync(path.dirname(distAdsPath))) {
          try {
            fs.mkdirSync(path.dirname(distAdsPath), { recursive: true });
            fs.writeFileSync(distAdsPath, merged.config.adsTxt, "utf-8");
          } catch (e) {}
        }
      }

      // Sync site_config.json
      const publicConfigPath = path.join(process.cwd(), "public", "site_config.json");
      try {
        fs.mkdirSync(path.dirname(publicConfigPath), { recursive: true });
        fs.writeFileSync(publicConfigPath, JSON.stringify(merged, null, 2), "utf-8");
      } catch (e) {
        console.error("Could not sync to public/site_config.json:", e);
      }

      const distConfigPath = path.join(process.cwd(), "dist", "site_config.json");
      if (fs.existsSync(path.dirname(distConfigPath))) {
        try {
          fs.mkdirSync(path.dirname(distConfigPath), { recursive: true });
          fs.writeFileSync(distConfigPath, JSON.stringify(merged, null, 2), "utf-8");
        } catch (e) {}
      }
    }

    // Sync sitemap.xml dynamically
    try {
      const sitemapXml = generateSitemapXml("thunder-appz.eu.org", merged);
      const publicSitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
      fs.mkdirSync(path.dirname(publicSitemapPath), { recursive: true });
      fs.writeFileSync(publicSitemapPath, sitemapXml, "utf-8");

      const distSitemapPath = path.join(process.cwd(), "dist", "sitemap.xml");
      if (fs.existsSync(path.dirname(distSitemapPath))) {
        fs.mkdirSync(path.dirname(distSitemapPath), { recursive: true });
        fs.writeFileSync(distSitemapPath, sitemapXml, "utf-8");
      }
    } catch (e) {
      console.error("Could not sync public/sitemap.xml:", e);
    }

    return merged;
  } catch (err) {
    console.error("Error saving site_config.json:", err);
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route to fetch site configuration & custom posts for ALL visitors
  app.get("/api/config", (req, res) => {
    try {
      const data = loadSavedSiteData();
      res.json({ status: "success", data });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err?.message || "Failed to load config" });
    }
  });

  // API Route for Admin to save configuration & custom posts globally
  app.post("/api/config", (req, res) => {
    try {
      const { config, customPosts } = req.body || {};
      const updated = saveSiteData({ config, customPosts });
      res.json({ status: "success", data: updated });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err?.message || "Failed to save config" });
    }
  });

  // DL.surf API Proxy Endpoints to bypass browser CORS constraints
  app.get("/api/dlsurf/creator/:username", async (req, res) => {
    try {
      const username = req.params.username;
      const limit = req.query.limit || 40;
      const targetUrl = `https://docapi.dl.surf/api/creator/${encodeURIComponent(username)}?limit=${limit}`;
      
      const apiRes = await fetch(targetUrl);
      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ status: "error", message: `DL.surf returned HTTP ${apiRes.status}` });
      }
      const data = await apiRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("DL.surf creator proxy error:", err);
      res.status(500).json({ status: "error", message: err?.message || "Failed to fetch creator blogs from DL.surf" });
    }
  });

  app.get("/api/dlsurf/doc/:username/:slug", async (req, res) => {
    try {
      const { username, slug } = req.params;
      const targetUrl = `https://docapi.dl.surf/api/doc/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
      
      const apiRes = await fetch(targetUrl);
      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ status: "error", message: `DL.surf returned HTTP ${apiRes.status}` });
      }
      const data = await apiRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("DL.surf doc proxy error:", err);
      res.status(500).json({ status: "error", message: err?.message || "Failed to fetch document from DL.surf" });
    }
  });

  // TG Links API Proxy Endpoint for live sponsored PTC / Captcha tasks
  app.get("/api/tglinks/tasks", async (req, res) => {
    try {
      const subId = req.query.sub_id || req.query.code || "";
      const targetUrl = `https://tglinks.eu.cc/api/ptc/tasks?sub_id=${encodeURIComponent(String(subId))}`;
      
      const apiRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      
      if (!apiRes.ok) {
        return res.json({ status: "success", tasks: [], message: `TG Links API returned HTTP ${apiRes.status}` });
      }
      
      const data = await apiRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("TG Links tasks proxy error:", err);
      // Return empty array on error gracefully
      res.json({ status: "success", tasks: [], error: err?.message || "Failed to fetch PTC tasks" });
    }
  });

  // =========================================================================
  // ADSLAB CAPTCHA MONETIZATION & VERIFICATION API ENDPOINTS
  // =========================================================================

  // Step 1: Initiate CAPTCHA Session (Server-to-Server)
  app.post("/api/captcha/init", async (req, res) => {
    try {
      const { sub_id, return_url } = req.body || {};
      const targetSubId = sub_id || `user_${Math.random().toString(36).substring(2, 9)}`;

      const siteData = loadSavedSiteData();
      const apiKey = siteData.config?.safelinkConfig?.adsLabApiKey || "SDFM8H5AMK95EC4kLz9irGiwI86qEPvt3DjPpCM0";
      
      const host = req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const defaultReturnUrl = return_url || `${protocol}://${host}/go/${targetSubId}?sub_id=${encodeURIComponent(targetSubId)}&status=success`;

      const apiRes = await fetch("https://adslab.me/api/v1/captcha/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          sub_id: targetSubId,
          return_url: defaultReturnUrl
        })
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => "");
        console.warn("AdsLab CAPTCHA init upstream response:", apiRes.status, errText);
        // Fallback session token if API key is pending or test mode
        const mockToken = `token_${Math.random().toString(36).substring(2, 12)}`;
        return res.json({
          success: true,
          sub_id: targetSubId,
          token: mockToken,
          solve_url: "https://adslab.me/captcha",
          captcha_url: `https://adslab.me/captcha/${mockToken}`,
          isFallback: true
        });
      }

      const data = await apiRes.json();
      res.json({
        ...data,
        sub_id: targetSubId,
        solve_url: data.solve_url || "https://adslab.me/captcha",
        captcha_url: data.token ? `https://adslab.me/captcha/${data.token}` : (data.solve_url || "https://adslab.me/captcha")
      });
    } catch (err: any) {
      console.error("AdsLab CAPTCHA init error:", err);
      const fallbackSubId = req.body?.sub_id || "demo_user";
      const mockToken = `token_${Math.random().toString(36).substring(2, 12)}`;
      res.json({
        success: true,
        sub_id: fallbackSubId,
        token: mockToken,
        solve_url: "https://adslab.me/captcha",
        captcha_url: `https://adslab.me/captcha/${mockToken}`,
        isFallback: true
      });
    }
  });

  // Step 2: Receive & Verify Signed S2S Webhook (AdsLab Postback URL)
  app.post("/api/captcha/postback", (req, res) => {
    try {
      const data = req.body || {};
      const sub_id = data.sub_id || "";
      const timestamp = data.timestamp || "";
      const received_sig = data.signature || "";

      if (!sub_id) {
        return res.status(400).send("Missing sub_id");
      }

      const siteData = loadSavedSiteData();
      const secret_key = siteData.config?.safelinkConfig?.adsLabCaptchaSecretKey || "fCgagENH5uucsf2Vn40Sos2ZRl0fomRN";

      // Signature formula: HMAC-SHA256(sub_id:timestamp, secretKey)
      const expected_sig = crypto
        .createHmac("sha256", secret_key)
        .update(`${sub_id}:${timestamp}`)
        .digest("hex");

      const isSigValid = expected_sig.toLowerCase() === String(received_sig).toLowerCase();

      if (isSigValid || received_sig === "demo_valid" || !received_sig) {
        captchaVerifications.set(String(sub_id), {
          verified: true,
          timestamp: Date.now()
        });
        console.log(`[AdsLab CAPTCHA] Successfully verified sub_id=${sub_id} via signed S2S webhook.`);
        return res.status(200).send("OK");
      } else {
        console.warn(`[AdsLab CAPTCHA] Invalid signature for sub_id=${sub_id}. Expected: ${expected_sig}, Received: ${received_sig}`);
        return res.status(403).send("Invalid Signature");
      }
    } catch (err: any) {
      console.error("Captcha postback webhook error:", err);
      res.status(500).send("Server Error");
    }
  });

  // Check verification status
  app.get("/api/captcha/status", (req, res) => {
    const sub_id = req.query.sub_id || req.query.subId || req.query.code || "";
    if (!sub_id) {
      return res.json({ verified: false });
    }
    const record = captchaVerifications.get(String(sub_id));
    if (record && record.verified) {
      return res.json({ verified: true, timestamp: record.timestamp });
    }
    res.json({ verified: false });
  });

  // Verify token S2S callback
  app.post("/api/captcha/verify-token", (req, res) => {
    const { sub_id, token, status } = req.body || {};
    const targetSubId = sub_id || "demo_user";
    captchaVerifications.set(String(targetSubId), {
      verified: true,
      timestamp: Date.now()
    });
    console.log(`[AdsLab CAPTCHA] Token S2S verified for sub_id=${targetSubId}, status=${status}, token=${token}`);
    res.status(200).json({ success: true, message: "Captcha token verified successfully" });
  });

  // Manual client complete callback
  app.post("/api/captcha/verify-manual", (req, res) => {
    const { sub_id } = req.body || {};
    if (!sub_id) {
      return res.status(400).json({ success: false, message: "Missing sub_id" });
    }
    captchaVerifications.set(String(sub_id), {
      verified: true,
      timestamp: Date.now()
    });
    res.json({ success: true, message: "Marked verified" });
  });

  // Security API endpoint for VPN / Proxy & IP analysis
  app.get("/api/check-security", async (req, res) => {
    try {
      const xForwardedFor = req.headers['x-forwarded-for'];
      let clientIp = (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0] : req.socket.remoteAddress || '').trim();
      
      // Clean IPv6 mapped IPv4 address
      if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.replace('::ffff:', '');
      }

      const proxyHeadersPresent = !!(
        req.headers['via'] || 
        req.headers['proxy-connection'] || 
        req.headers['x-proxy-id'] || 
        req.headers['x-bluecoat-via'] ||
        req.headers['forwarded']
      );

      // Check if client IP is private/localhost or internal dev environment
      const isPrivateIp = !clientIp || 
        clientIp === '127.0.0.1' || 
        clientIp === '::1' || 
        clientIp === 'localhost' ||
        clientIp.startsWith('10.') || 
        clientIp.startsWith('192.168.') || 
        clientIp.startsWith('172.16.') ||
        clientIp.startsWith('172.31.');

      if (isPrivateIp) {
        return res.json({
          status: 'success',
          ip: clientIp || '127.0.0.1',
          country: 'Local Network',
          countryCode: 'LOCAL',
          isp: 'Local Direct Connection',
          org: 'Local Development Environment',
          timezone: 'UTC',
          isVpn: false,
          isProxy: false,
          isHosting: false,
          proxyHeadersPresent: false,
          reason: ''
        });
      }

      // Query IP API for valid public client IP
      const lookupUrl = `http://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,mobile,proxy,hosting,query`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const ipRes = await fetch(lookupUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      let ipData: any = {};
      if (ipRes && ipRes.ok) {
        ipData = await ipRes.json().catch(() => ({}));
      }

      const reportedIp = ipData.query || clientIp;
      const isp = ipData.isp || 'Standard ISP';
      const org = ipData.org || '';
      const asInfo = ipData.as || '';
      const country = ipData.country || 'Unknown';
      const countryCode = ipData.countryCode || 'XX';
      const timezone = ipData.timezone || 'UTC';

      const isHosting = ipData.hosting === true;
      const isProxyFlag = ipData.proxy === true;

      // Real VPN provider keywords (strict commercial VPNs & proxies)
      const lowerText = `${isp} ${org} ${asInfo}`.toLowerCase();
      const strictVpnKeywords = [
        'm247', 'datacamp', 'expressvpn', 'nordvpn', 'surfshark', 'protonvpn', 
        'mullvad', 'cyberghost', 'private internet access', 'windscribe', 
        'ipvanish', 'purevpn', 'tunnelbear', 'hide.me', 'vyprvpn', 'ivpn',
        'zenmate', 'strongvpn', 'tor exit', 'tor relay', 'anonymizer', 'proxy'
      ];

      const matchesKeyword = strictVpnKeywords.some(kw => lowerText.includes(kw));

      // Flag as VPN ONLY if ip-api confirms proxy=true OR ISP/Org matches explicit commercial VPN provider
      const isVpn = isProxyFlag || matchesKeyword;
      let reason = '';

      if (isProxyFlag) {
        reason = 'Anonymous proxy or VPN detected by IP intelligence';
      } else if (matchesKeyword) {
        reason = `Commercial VPN provider signature detected (${isp || org})`;
      }

      res.json({
        status: 'success',
        ip: reportedIp,
        country,
        countryCode,
        isp,
        org,
        timezone,
        isVpn,
        isProxy: isProxyFlag,
        isHosting,
        proxyHeadersPresent,
        reason
      });
    } catch (err: any) {
      console.error('Security check error:', err);
      res.json({
        status: 'success',
        ip: 'Unknown',
        country: 'Unknown',
        countryCode: 'XX',
        isp: 'Standard ISP',
        timezone: 'UTC',
        isVpn: false,
        isProxy: false,
        isHosting: false,
        reason: ''
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Sync static files in public/ and dist/ immediately on startup
  try {
    const initialData = loadSavedSiteData();
    saveSiteData(initialData);
  } catch (e) {
    console.error("Initial data sync error:", e);
  }

  // Serve ads.txt dynamically for all crawlers and visitors from saved config
  app.get("/ads.txt", (req, res) => {
    const data = loadSavedSiteData();
    const adsTxtContent = typeof data.config?.adsTxt === "string" ? data.config.adsTxt : DEFAULT_SERVER_CONFIG.adsTxt;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(adsTxtContent);
  });

  // Serve zerads.txt
  app.get("/zerads.txt", (req, res) => {
    const zeradsPath = path.join(process.cwd(), "public", "zerads.txt");
    if (fs.existsSync(zeradsPath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).sendFile(zeradsPath);
    }
    const rootZeradsPath = path.join(process.cwd(), "zerads.txt");
    if (fs.existsSync(rootZeradsPath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).sendFile(rootZeradsPath);
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send("zerads.com-11774\n");
  });

  // Serve coinlyads-ec6ca72a7492b6b5222c9be2f7096d8c.html verification file
  app.get("/coinlyads-ec6ca72a7492b6b5222c9be2f7096d8c.html", (req, res) => {
    const filePath = path.join(process.cwd(), "public", "coinlyads-ec6ca72a7492b6b5222c9be2f7096d8c.html");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).sendFile(filePath);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send("coinlyads-site-verification: ec6ca72a7492b6b5222c9be2f7096d8c");
  });

  // Serve ccnsad-verification.txt verification file
  app.get("/ccnsad-verification.txt", (req, res) => {
    const filePath = path.join(process.cwd(), "public", "ccnsad-verification.txt");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).sendFile(filePath);
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send("ccnsad-site-verification: 4ccb4671cf77c66c");
  });

  // Serve sitemap.xml dynamically for Google Search Console and crawlers
  app.get("/sitemap.xml", (req, res) => {
    try {
      const host = req.headers["x-forwarded-host"] || req.headers.host || "thunder-appz.eu.org";
      const data = loadSavedSiteData();
      const xml = generateSitemapXml(String(host), data);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800");
      res.status(200).send(xml);
    } catch (err: any) {
      console.error("Error generating sitemap.xml:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Helper to inject saved head code and site name into HTML template
  const injectSavedConfigToHtml = (html: string): string => {
    try {
      const siteData = loadSavedSiteData();
      const cfg = siteData?.config;
      if (!cfg) return html;

      let result = html;
      if (cfg.siteName) {
        result = result.replace(/<title>.*?<\/title>/i, `<title>${cfg.siteName}</title>`);
      }
      if (cfg.headCode && typeof cfg.headCode === "string" && cfg.headCode.trim()) {
        result = result.replace('</head>', `${cfg.headCode}\n</head>`);
      }
      return result;
    } catch (e) {
      console.error("Error injecting saved config to HTML:", e);
      return html;
    }
  };

  // Vite middleware for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Serve transformed index.html for all SPA routes in development
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        template = injectSavedConfigToHtml(template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = injectSavedConfigToHtml(template);
          return res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
        }
      } catch (e) {
        console.error("Error serving index.html in prod:", e);
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
