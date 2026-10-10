import React, { useState, useEffect, useRef } from 'react';
import { UserHomePage } from 'embed-dlsurf-blogs';
import { BlogHeader } from './components/BlogHeader';
import { AdminPanel } from './components/AdminPanel';
import { AuthorCard } from './components/AuthorCard';
import { AdSlot } from './components/AdSlot';
import { DlSurfArticleReader } from './components/DlSurfArticleReader';
import { SafelinkView } from './components/SafelinkView';
import { SafelinkAdminPanel } from './components/SafelinkAdminPanel';
import { ArcadeView } from './components/ArcadeView';
import { SecurityShield } from './components/SecurityShield';
import { AdsLabSdkInit } from './components/AdsLabSdkInit';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BlogConfig, DEFAULT_CONFIG, CustomPost, INITIAL_CUSTOM_POSTS, getPostCategories } from './types';
import { fetchDlSurfCreatorPosts, FALLBACK_THUNDERBOLT_POSTS } from './lib/dlsurfApi';
import { 
  Sparkles, ArrowLeft, BookOpen, Clock, Calendar, ChevronRight, User, 
  Shield, Compass, Search, TrendingUp, Send, Mail, Share2, Grid, Tag, Newspaper 
} from 'lucide-react';

const STORAGE_KEY = 'dlsurf_blog_config';
const POSTS_STORAGE_KEY = 'dlsurf_custom_posts';

import { FooterPagesModal } from './components/FooterPagesModal';

export interface UnifiedPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  readTime: string;
  summary: string;
  author: string;
  category?: string;
  categories?: string[];
  thumbnailUrl: string | null;
  isCustom: boolean;
}

export default function App() {
  const [config, setConfig] = useState<BlogConfig>(DEFAULT_CONFIG);
  const [customPosts, setCustomPosts] = useState<CustomPost[]>([]);
  const [dlSurfPosts, setDlSurfPosts] = useState<any[]>([]);
  const [isLoadingDl, setIsLoadingDl] = useState<boolean>(false);
  const [activePostSlug, setActivePostSlug] = useState<string | null>(null);
  
  // Interactive Theme Layout & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    if (catParam) return catParam;
    const storedCat = localStorage.getItem('dlsurf_selected_category');
    if (storedCat) return storedCat;
    return 'All';
  });

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    localStorage.setItem('dlsurf_selected_category', cat);
    const params = new URLSearchParams(window.location.search);
    if (cat && cat !== 'All') {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl);
  };
  const [footerModalTab, setFooterModalTab] = useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  
  // View states: 'blog' | 'admin' | 'safelink' | 'safelinkAdmin'
  const [currentView, setCurrentView] = useState<'blog' | 'admin' | 'safelink' | 'safelinkAdmin'>('blog');

  // Helper to ensure config fields and ad slots are always populated with defaults
  const sanitizeConfig = (raw: Partial<BlogConfig> = {}): BlogConfig => {
    let loadedTagline = raw.tagline !== undefined ? raw.tagline : DEFAULT_CONFIG.tagline;
    if (loadedTagline && loadedTagline.includes('Blogger-style')) {
      loadedTagline = '';
    }

    const loadedHeadCode = raw.headCode !== undefined ? raw.headCode : (DEFAULT_CONFIG.headCode || '');

    return {
      username: raw.username !== undefined ? raw.username : DEFAULT_CONFIG.username,
      siteName: raw.siteName !== undefined ? raw.siteName : DEFAULT_CONFIG.siteName,
      tagline: loadedTagline,
      theme: raw.theme || DEFAULT_CONFIG.theme,
      accentColor: raw.accentColor || DEFAULT_CONFIG.accentColor,
      limit: raw.limit || DEFAULT_CONFIG.limit,
      showBio: raw.showBio !== undefined ? raw.showBio : DEFAULT_CONFIG.showBio,
      githubUrl: raw.githubUrl !== undefined ? raw.githubUrl : DEFAULT_CONFIG.githubUrl,
      twitterUrl: raw.twitterUrl !== undefined ? raw.twitterUrl : DEFAULT_CONFIG.twitterUrl,
      linkedinUrl: raw.linkedinUrl !== undefined ? raw.linkedinUrl : DEFAULT_CONFIG.linkedinUrl,
      email: raw.email !== undefined ? raw.email : DEFAULT_CONFIG.email,
      adsTxt: raw.adsTxt !== undefined ? raw.adsTxt : DEFAULT_CONFIG.adsTxt,
      headCode: loadedHeadCode,
      headerAdCode: raw.headerAdCode !== undefined ? raw.headerAdCode : (DEFAULT_CONFIG.headerAdCode || ''),
      sidebarAdCode: raw.sidebarAdCode !== undefined ? raw.sidebarAdCode : (DEFAULT_CONFIG.sidebarAdCode || ''),
      footerAdCode: raw.footerAdCode !== undefined ? raw.footerAdCode : (DEFAULT_CONFIG.footerAdCode || ''),
      inPostAdCode: raw.inPostAdCode !== undefined ? raw.inPostAdCode : (DEFAULT_CONFIG.inPostAdCode || ''),
      safelinkConfig: raw.safelinkConfig !== undefined ? raw.safelinkConfig : (DEFAULT_CONFIG.safelinkConfig || {}),
      dlCategoryMap: raw.dlCategoryMap !== undefined ? raw.dlCategoryMap : (DEFAULT_CONFIG.dlCategoryMap || {}),
    };
  };

  // Load configuration and custom posts on mount from server and local cache
  useEffect(() => {
    // 1. Initial Parse from Local Storage for fast UI start
    const storedConfig = localStorage.getItem(STORAGE_KEY);
    let parsedConfig: Partial<BlogConfig> = {};
    if (storedConfig) {
      try {
        parsedConfig = JSON.parse(storedConfig);
      } catch (e) {
        console.error('Failed to parse stored config', e);
      }
    }

    const initialMergedConfig = sanitizeConfig(parsedConfig);
    setConfig(initialMergedConfig);

    const DUMMY_IDS = new Set([
      'custom-post-1', 'custom-post-2', 'custom-post-3', 
      'custom-post-4', 'custom-post-5', 'custom-post-6', 'custom-post-7'
    ]);

    const storedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
    if (storedPosts) {
      try {
        const parsed = JSON.parse(storedPosts);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p: any) => p && p.id && !DUMMY_IDS.has(p.id) && !p.id.startsWith('custom-post-'));
          setCustomPosts(cleaned);
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(cleaned));
        } else {
          setCustomPosts([]);
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify([]));
        }
      } catch (e) {
        setCustomPosts([]);
      }
    } else {
      setCustomPosts([]);
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify([]));
    }

    // 2. Fetch latest server configuration globally (supports Cloudflare Workers, Node API & Static Hosting)
    const applyRemoteData = (serverConfig: any, serverPosts: any) => {
      if (serverConfig && typeof serverConfig === 'object') {
        const finalConfig = sanitizeConfig(serverConfig);
        setConfig(finalConfig);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalConfig));
      }

      if (Array.isArray(serverPosts)) {
        const cleaned = serverPosts.filter((p: any) => p && p.id && !DUMMY_IDS.has(p.id) && !p.id.startsWith('custom-post-'));
        setCustomPosts(cleaned);
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(cleaned));
      }
    };

    fetch('/api/config')
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error('Non-JSON or API 404 response');
      })
      .then((resData) => {
        if (resData?.status === 'success' && resData?.data) {
          applyRemoteData(resData.data.config, resData.data.customPosts);
        } else {
          throw new Error('Invalid config response structure');
        }
      })
      .catch(() => {
        // Fallback for static hosts (cPanel, Nginx, Apache) without Node.js backend
        fetch('/site_config.json?v=' + Date.now())
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Static config file not found');
          })
          .then((staticData) => {
            const rawConfig = staticData?.config || staticData;
            const rawPosts = staticData?.customPosts;
            applyRemoteData(rawConfig, rawPosts);
          })
          .catch((staticErr) => {
            console.warn('Using local client cache for config:', staticErr);
          });
      });

    // 3. Handle routing based on URL params / path / hash
    const detectViewFromLocation = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      if (path.startsWith('/safelink/admin') || hash === '#safelinkAdmin' || params.get('safelinkAdmin') !== null) {
        setCurrentView('safelinkAdmin');
      } else if (
        path.startsWith('/go') || 
        path.startsWith('/safelink') || 
        path.startsWith('/faucet') || 
        params.get('go') !== null || 
        params.get('safelink') !== null ||
        params.get('faucet') !== null ||
        (params.get('code') !== null && params.get('token') !== null) ||
        hash.startsWith('#go') ||
        hash.startsWith('#safelink') ||
        hash.startsWith('#faucet')
      ) {
        setCurrentView('safelink');
      } else if (hash === '#admin' || params.get('admin') !== null) {
        setCurrentView('admin');
      } else {
        setCurrentView('blog');
        const postParam = params.get('post');
        if (postParam) {
          setActivePostSlug(postParam);
        }
      }
    };

    detectViewFromLocation();
  }, []);

  // Listen to hash and popstate changes for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      if (path.startsWith('/safelink/admin') || hash === '#safelinkAdmin' || params.get('safelinkAdmin') !== null) {
        setCurrentView('safelinkAdmin');
      } else if (
        path.startsWith('/go') || 
        path.startsWith('/safelink') || 
        path.startsWith('/faucet') || 
        params.get('go') !== null || 
        params.get('safelink') !== null ||
        params.get('faucet') !== null ||
        (params.get('code') !== null && params.get('token') !== null) ||
        hash.startsWith('#go') ||
        hash.startsWith('#safelink') ||
        hash.startsWith('#faucet')
      ) {
        setCurrentView('safelink');
      } else if (hash === '#admin' || params.get('admin') !== null) {
        setCurrentView('admin');
      } else {
        setCurrentView('blog');
        setActivePostSlug(params.get('post'));
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Fetch DL.surf posts dynamically when username or limit changes
  const reloadDlSurfPosts = React.useCallback(async () => {
    if (!config.username) {
      setDlSurfPosts(FALLBACK_THUNDERBOLT_POSTS);
      return;
    }
    setIsLoadingDl(true);
    try {
      const posts = await fetchDlSurfCreatorPosts(config.username, config.limit || 40);
      setDlSurfPosts(posts && posts.length > 0 ? posts : FALLBACK_THUNDERBOLT_POSTS);
    } catch (err) {
      console.error('Error in App.tsx fetching DL.surf posts:', err);
      setDlSurfPosts(FALLBACK_THUNDERBOLT_POSTS);
    } finally {
      setIsLoadingDl(false);
    }
  }, [config.username, config.limit]);

  useEffect(() => {
    reloadDlSurfPosts();
  }, [reloadDlSurfPosts]);

  // Inject Custom <head> code dynamically on mount/update (EXCEPT on admin views)
  useEffect(() => {
    // Remove existing custom head elements
    const existing = document.querySelectorAll('[data-custom-head="true"]');
    existing.forEach(el => el.remove());

    // STRICT: Never inject custom head scripts on Admin console or Safelink Admin pages!
    if (currentView === 'admin' || currentView === 'safelinkAdmin') return;

    const headCode = config.headCode || '';
    if (!headCode.trim()) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<html><head>${headCode}</head><body></body></html>`, 'text/html');
      
      const processNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          
          if (tagName === 'script') {
            const script = document.createElement('script');
            Array.from(el.attributes).forEach(attr => {
              script.setAttribute(attr.name, attr.value);
            });
            script.textContent = el.textContent;
            script.setAttribute('data-custom-head', 'true');
            document.head.appendChild(script);
          } else if (['style', 'link', 'meta', 'title', 'base'].includes(tagName)) {
            const newEl = document.createElement(tagName);
            Array.from(el.attributes).forEach(attr => {
              newEl.setAttribute(attr.name, attr.value);
            });
            newEl.innerHTML = el.innerHTML;
            newEl.setAttribute('data-custom-head', 'true');
            document.head.appendChild(newEl);
          } else {
            // Visual elements like <ins>, <div>, <iframe> must be in body
            const newEl = document.createElement(tagName);
            Array.from(el.attributes).forEach(attr => {
              newEl.setAttribute(attr.name, attr.value);
            });
            newEl.innerHTML = el.innerHTML;
            newEl.setAttribute('data-custom-head', 'true');
            document.body.appendChild(newEl);
          }
        }
      };

      doc.head.childNodes.forEach(processNode);
      doc.body.childNodes.forEach(processNode);
    } catch (err) {
      console.error('Error parsing or injecting custom head code', err);
    }
  }, [config.headCode, currentView]);

  // Dynamically sync browser tab title with configuration site name
  useEffect(() => {
    if (config.siteName) {
      document.title = config.siteName;
    }
  }, [config.siteName]);

  // Merge customPosts and dlSurfPosts into a unified feed with deduplication by slug
  const mixedPosts = React.useMemo(() => {
    const formattedCustom: UnifiedPost[] = customPosts.map(post => {
      const cats = post.categories && post.categories.length > 0 
        ? post.categories 
        : (post.category ? [post.category] : ['Linux']);

      return {
        id: `custom-${post.id}`,
        title: post.title,
        slug: post.slug,
        date: post.date,
        readTime: post.readTime || '3 min read',
        summary: post.summary || '',
        author: post.author || config.username || 'Admin',
        category: cats[0],
        categories: cats,
        thumbnailUrl: post.thumbnailUrl || null,
        isCustom: true,
      };
    });

    const dlCategoryMap = config.dlCategoryMap || {};

    const formattedDl: UnifiedPost[] = dlSurfPosts.map(post => {
      let cleanDate = '2026-08-23';
      if (post.created_at) {
        try {
          cleanDate = new Date(post.created_at).toISOString().split('T')[0];
        } catch (e) {
          // fallback
        }
      }
      const thumbUrl = post.thumbnail_path 
        ? `https://cdn.dl.surf/${post.thumbnail_path}` 
        : null;

      const slug = post.link_slug || String(post.id);
      const assignedCategories = getPostCategories(post, dlCategoryMap);

      return {
        id: `dlsurf-${post.id}`,
        title: post.title,
        slug: slug,
        date: cleanDate,
        readTime: post.is_readaloud ? '4 min read' : '3 min read',
        summary: post.summary || post.description || 'No description available.',
        author: `@${config.username}`,
        category: assignedCategories[0] || 'Linux',
        categories: assignedCategories,
        thumbnailUrl: thumbUrl,
        isCustom: false,
      };
    });

    // Deduplicate by slug
    const seenSlugs = new Set<string>();
    const combined: UnifiedPost[] = [];

    for (const post of formattedDl) {
      if (!seenSlugs.has(post.slug)) {
        seenSlugs.add(post.slug);
        combined.push(post);
      }
    }

    for (const post of formattedCustom) {
      if (!seenSlugs.has(post.slug)) {
        seenSlugs.add(post.slug);
        combined.push(post);
      }
    }

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customPosts, dlSurfPosts, config.username, config.dlCategoryMap]);

  // Filter and search unified publications list
  const filteredPosts = React.useMemo(() => {
    let result = mixedPosts;
    
    // Category Filter
    if (selectedCategory && selectedCategory !== 'All') {
      const selectedLower = selectedCategory.toLowerCase();
      result = result.filter(post => {
        if (post.categories && post.categories.length > 0) {
          return post.categories.some(c => c.toLowerCase() === selectedLower);
        }
        return post.category?.toLowerCase() === selectedLower;
      });
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(post => 
        post.title.toLowerCase().includes(q) || 
        post.summary.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [mixedPosts, selectedCategory, searchQuery]);

  // Global sync helper to persist state to server
  const saveToServer = (cfg: BlogConfig, posts: CustomPost[]) => {
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: cfg, customPosts: posts }),
    })
      .then(async (res) => {
        if (res.ok) {
          const resData = await res.json();
          if (resData?.status === 'success' && resData?.data?.config) {
            const finalConfig = sanitizeConfig(resData.data.config);
            setConfig(finalConfig);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalConfig));
          }
        }
      })
      .catch(err => {
        console.error('Failed to sync settings to server:', err);
      });
  };

  // Configuration update handlers
  const handleConfigChange = (newConfig: BlogConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    saveToServer(newConfig, customPosts);
  };

  // Custom posts update handlers
  const handleAddPost = (newPost: CustomPost) => {
    const updated = [newPost, ...customPosts];
    setCustomPosts(updated);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
    saveToServer(config, updated);
  };

  const handleUpdatePost = (updatedPost: CustomPost) => {
    const updated = customPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
    setCustomPosts(updated);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
    saveToServer(config, updated);
  };

  const handleDeletePost = (id: string) => {
    const updated = customPosts.filter(p => p.id !== id);
    setCustomPosts(updated);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
    saveToServer(config, updated);
  };

  // Navigation helpers
  const navigateToPost = (slug: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (slug) {
      params.set('post', slug);
    } else {
      params.delete('post');
    }

    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.pushState({}, '', newUrl);
    setActivePostSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAdmin = () => {
    window.location.hash = '#admin';
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToSafelink = () => {
    const newUrl = '/go/abc?token=tg_token_demo';
    window.history.pushState({}, '', newUrl);
    setCurrentView('safelink');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToSafelinkAdmin = () => {
    window.history.pushState({}, '', '/safelink/admin');
    setCurrentView('safelinkAdmin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToHome = () => {
    window.history.pushState({}, '', '/');
    window.location.hash = '';
    setCurrentView('blog');
    navigateToPost(null);
  };

  // Intercept standard <a> anchor click navigations inside DL.surf UserHomePage grid
  const handleBlogClickIntercept = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href) {
        const urlParams = new URLSearchParams(href.includes('?') ? href.substring(href.indexOf('?')) : href);
        const postSlug = urlParams.get('post');
        
        if (postSlug) {
          e.preventDefault();
          navigateToPost(postSlug);
        } else {
          // Fallback parsing for URL paths
          const parts = href.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && !lastPart.startsWith('http') && !href.startsWith('#')) {
            e.preventDefault();
            navigateToPost(lastPart);
          }
        }
      }
    }
  };

  const isDark = config.theme === 'dark';

  // Find if current slug matches any custom local post
  const matchedCustomPost = customPosts.find(p => p.slug === activePostSlug);

  return (
    <ErrorBoundary>
      {/* Real-time Ad Blocker and VPN / Proxy Security Shield */}
      <SecurityShield config={config} />
      {/* Global AdsLab SDK Initializer */}
      <AdsLabSdkInit config={config} />

      <div
        id="app-root"
        className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
          isDark ? 'bg-[#0a0a0b] text-neutral-100' : 'bg-neutral-50 text-neutral-800'
        }`}
      >
        {/* Blog Header bar - rendered when in Admin view or reading a post */}
        {(currentView === 'admin' || (currentView === 'blog' && activePostSlug !== null)) && (
          <BlogHeader
            config={config}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onGoToHome={handleGoToHome}
            onOpenModal={(tab) => setFooterModalTab(tab)}
          />
        )}

        {currentView === 'safelinkAdmin' ? (
          <main className="flex-grow">
            <SafelinkAdminPanel
              config={config}
              onUpdateConfig={handleConfigChange}
              onNavigate={(view, slug) => {
                if (view === 'home') handleGoToHome();
                else if (view === 'admin') handleGoToAdmin();
                else if (view === 'safelinkAdmin') handleGoToSafelinkAdmin();
                else if (view === 'go') {
                  const targetCode = slug || 'demo';
                  window.history.pushState({}, '', `/go/${targetCode}?token=DEMO123&sub_id=admin_test`);
                  setCurrentView('safelink');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          </main>
        ) : currentView === 'safelink' ? (
          <SafelinkView
            config={config}
            customPosts={customPosts}
            dlSurfPosts={dlSurfPosts}
            onSelectPost={(slug) => {
              setCurrentView('blog');
              navigateToPost(slug);
            }}
            onNavigateHome={handleGoToHome}
          />
        ) : currentView === 'admin' ? (
        /* Render full-width Admin Console Panel */
        <main className="flex-grow">
          <AdminPanel
            config={config}
            onConfigChange={handleConfigChange}
            dlSurfPosts={dlSurfPosts}
            isLoadingDl={isLoadingDl}
            onRefreshDlPosts={reloadDlSurfPosts}
            onBackToHome={handleGoToHome}
          />
        </main>
      ) : activePostSlug ? (
        /* Render Article Reader View when viewing a guide/publication */
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <AdSlot code={config.headerAdCode} slotId="header-top-ad" label="Header Banner Ad" showPlaceholder={true} />
          </div>

          <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className={`rounded-3xl border p-6 sm:p-12 md:p-16 relative transition-all duration-300 shadow-md ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/80'
            }`}>
                    {/* Back Navigation Bar */}
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-neutral-100 dark:border-neutral-800/80">
                      <button
                        onClick={() => navigateToPost(null)}
                        className={`flex items-center space-x-2 py-2.5 px-5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                          isDark
                            ? 'bg-neutral-850 border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700 shadow-2xs'
                        }`}
                      >
                        <ArrowLeft className="w-4 h-4 text-rose-500" />
                        <span>All Publications</span>
                      </button>
                      <span className="text-xs font-mono uppercase tracking-wider font-extrabold px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-500">
                        {matchedCustomPost ? 'Editorial Publication' : 'Network Stream'}
                      </span>
                    </div>

                    {matchedCustomPost ? (
                      /* Render Locally-written Custom Post */
                      <article className="prose prose-rose dark:prose-invert max-w-none">
                        <header className="mb-10">
                          <h1 className="font-serif font-black text-3xl sm:text-5xl md:text-6xl text-neutral-900 dark:text-white leading-tight mb-6 tracking-tight">
                            {matchedCustomPost.title}
                          </h1>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-mono pb-6 border-b border-neutral-100 dark:border-neutral-850">
                            <span className="flex items-center space-x-1.5">
                              <Calendar className="w-4 h-4 text-rose-500" />
                              <span>{matchedCustomPost.date}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1.5">
                              <Clock className="w-4 h-4 text-rose-500" />
                              <span>{matchedCustomPost.readTime}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1.5">
                              <User className="w-4 h-4 text-rose-500" />
                              <span className="font-semibold text-neutral-700 dark:text-neutral-300">By {matchedCustomPost.author}</span>
                            </span>
                          </div>
                        </header>
                        
                        {/* 2. In-Article Ad Slot (Top of Article) */}
                        <AdSlot code={config.inPostAdCode} slotId="in-article-top" label="Sponsored Header Ad" className="my-8" showPlaceholder={true} />

                        {/* Summary Block */}
                        <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 italic text-base sm:text-xl text-neutral-700 dark:text-neutral-300 mb-10 leading-relaxed font-serif">
                          {matchedCustomPost.summary}
                        </div>

                        {/* Article body HTML */}
                        <div 
                          className="font-serif text-base sm:text-xl leading-relaxed text-neutral-850 dark:text-neutral-150 space-y-6 prose-p:mb-6 prose-p:text-base sm:prose-p:text-xl prose-p:leading-relaxed prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:font-extrabold prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:font-bold prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-a:text-rose-600 dark:prose-a:text-rose-400"
                          dangerouslySetInnerHTML={{ __html: matchedCustomPost.content }}
                        />

                        {/* 3. In-Article Ad Slot (Bottom of Article) */}
                        <AdSlot code={config.inPostAdCode} slotId="in-article-bottom" label="Article Bottom Ad" className="mt-10" showPlaceholder={true} />

                        {/* Footer details */}
                        <div className="mt-12 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-mono gap-4">
                          <span>Article Identifier: {matchedCustomPost.id}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert('Article link copied to clipboard!');
                            }} 
                            className="flex items-center space-x-1.5 text-rose-500 hover:underline"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share this article</span>
                          </button>
                        </div>
                      </article>
                    ) : (
                      /* Render dynamic DL.surf embedded Post */
                      <div className="space-y-6">
                        {/* 2. In-Article Ad Slot for Network posts */}
                        <AdSlot code={config.inPostAdCode} slotId="in-article-embed-top" label="Article Sponsored Ad" className="mb-6" showPlaceholder={true} />
                        
                        <div className="prose prose-rose max-w-none font-serif leading-relaxed text-neutral-900">
                          <DlSurfArticleReader
                            username={config.username}
                            slug={activePostSlug}
                            accentColor={config.accentColor}
                          />
                        </div>

                        {/* 3. Bottom Ad Slot */}
                        <AdSlot code={config.inPostAdCode} slotId="in-article-embed-bottom" label="Article Bottom Ad" className="mt-8" showPlaceholder={true} />
                      </div>
                    )}
                  </div>
                </main>
              </>
            ) : (
              /* FRONT OF THE WEBSITE: Zontal Arcade HTML5 Gaming Portal */
              <ArcadeView
                config={config}
                customPosts={customPosts}
                dlSurfPosts={dlSurfPosts}
                onSelectPost={(slug) => {
                  navigateToPost(slug);
                }}
                onNavigateSafelinkAdmin={handleGoToSafelinkAdmin}
                onNavigateBlogAdmin={handleGoToAdmin}
                onToggleTheme={() => {
                  const nextTheme = config.theme === 'dark' ? 'light' : 'dark';
                  handleConfigChange({ ...config, theme: nextTheme });
                }}
              />
            )}

      {/* Footer Modal for About, Contact, Privacy & Terms */}
      <FooterPagesModal 
        activeTab={footerModalTab}
        config={config}
        onClose={() => setFooterModalTab(null)}
      />
    </div>
    </ErrorBoundary>
  );
}

