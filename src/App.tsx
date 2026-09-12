import React, { useState, useEffect, useRef } from 'react';
import { UserHomePage } from 'embed-dlsurf-blogs';
import { BlogHeader } from './components/BlogHeader';
import { AdminPanel } from './components/AdminPanel';
import { AuthorCard } from './components/AuthorCard';
import { AdSlot } from './components/AdSlot';
import { DlSurfArticleReader } from './components/DlSurfArticleReader';
import { SafelinkView } from './components/SafelinkView';
import { SafelinkAdminPanel } from './components/SafelinkAdminPanel';
import { SecurityShield } from './components/SecurityShield';
import { AdsLabSdkInit } from './components/AdsLabSdkInit';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BlogConfig, DEFAULT_CONFIG, CustomPost, INITIAL_CUSTOM_POSTS, getPostCategories } from './types';
import { fetchDlSurfCreatorPosts } from './lib/dlsurfApi';
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
        params.get('go') !== null || 
        params.get('safelink') !== null ||
        (params.get('code') !== null && params.get('token') !== null) ||
        hash.startsWith('#go') ||
        hash.startsWith('#safelink')
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
        params.get('go') !== null || 
        params.get('safelink') !== null ||
        (params.get('code') !== null && params.get('token') !== null) ||
        hash.startsWith('#go') ||
        hash.startsWith('#safelink')
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
    if (!config.username) return;
    setIsLoadingDl(true);
    try {
      const posts = await fetchDlSurfCreatorPosts(config.username, config.limit || 40);
      setDlSurfPosts(posts);
    } catch (err) {
      console.error('Error in App.tsx fetching DL.surf posts:', err);
      setDlSurfPosts([]);
    } finally {
      setIsLoadingDl(false);
    }
  }, [config.username, config.limit]);

  useEffect(() => {
    reloadDlSurfPosts();
  }, [reloadDlSurfPosts]);

  // Inject Custom <head> code dynamically on mount/update
  useEffect(() => {
    const headCode = config.headCode || '';
    // Remove existing custom head elements
    const existing = document.querySelectorAll('[data-custom-head="true"]');
    existing.forEach(el => el.remove());

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
  }, [config.headCode]);

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
        {/* Blog Header bar - rendered when not in standalone Safelink view */}
        {currentView !== 'safelink' && (
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
      ) : (
        /* Render Premium Redesigned Blog Template View */
        <>
          {/* 1. Header Banner Ad Slot */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <AdSlot code={config.headerAdCode} slotId="header-top-ad" label="Header Banner Ad" showPlaceholder={true} />
          </div>

          {/* Main Body Layout: Split into grid layout on feed, or full page width on article view */}
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className={activePostSlug ? "w-full max-w-5xl mx-auto space-y-10" : "grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"}>
              
              {/* Main Content Column: Full width for articles, 8 cols for feed */}
              <div className={activePostSlug ? "w-full space-y-10" : "lg:col-span-8 space-y-10"}>
                
                {activePostSlug ? (
                  /* ARTICLE READER VIEW (FULL PAGE WIDTH, NO SIDEBARS) */
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
                ) : (
                  /* HOME FEED VIEW */
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* Premium Interactive Search Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-150 dark:border-neutral-850">
                      <div className="flex items-center space-x-2">
                        <Newspaper className="w-5 h-5 text-rose-500" />
                        <h2 className="text-sm font-extrabold tracking-widest uppercase font-mono text-neutral-800 dark:text-neutral-200">
                          Latest Publications
                        </h2>
                      </div>
                      
                      {/* Search Input Widget */}
                      <div className="relative w-full sm:max-w-xs md:max-w-md">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search publications..."
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {isLoadingDl && filteredPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tracking-wider uppercase">Retuning system publications...</p>
                      </div>
                    ) : filteredPosts.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10">
                        <Compass className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                        <p className="text-lg font-serif font-bold text-neutral-800 dark:text-white">No matches found</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                          Try refining your query or check Admin settings for username verification.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-12">
                        
                        {/* 1. FEATURED ARTICLE */}
                        {filteredPosts[0] && (
                          <section id="featured-article" className="space-y-3">
                            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-500">
                              <Sparkles className="w-4 h-4" />
                              <span>Featured Article</span>
                            </div>

                            <div 
                              onClick={() => navigateToPost(filteredPosts[0].slug)}
                              className={`group rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-rose-500/40 ${
                                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
                              }`}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-12">
                                {/* Thumbnail */}
                                <div className="md:col-span-7 h-64 md:h-80 overflow-hidden relative bg-neutral-100 dark:bg-neutral-800">
                                  {filteredPosts[0].thumbnailUrl ? (
                                    <img 
                                      src={filteredPosts[0].thumbnailUrl} 
                                      alt={filteredPosts[0].title}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-linear-to-tr from-rose-500/15 via-transparent to-neutral-500/5 flex items-center justify-center p-8">
                                      <Sparkles className="w-12 h-12 text-rose-500/40" />
                                    </div>
                                  )}
                                  <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-extrabold uppercase bg-rose-600 text-white shadow-md tracking-wider">
                                      ⭐ Featured
                                    </span>
                                    {filteredPosts[0].category && (
                                      <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-neutral-900/80 backdrop-blur-md text-white shadow-md tracking-wider border border-white/20">
                                        {filteredPosts[0].category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Details */}
                                <div className="md:col-span-5 p-8 flex flex-col justify-between">
                                  <div className="space-y-3.5">
                                    <div className="flex items-center space-x-2 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                                      <span className="flex items-center space-x-1">
                                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                        <span>{filteredPosts[0].date}</span>
                                      </span>
                                      <span>•</span>
                                      <span>{filteredPosts[0].readTime}</span>
                                    </div>
                                    
                                    <h3 className="font-serif font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white leading-tight group-hover:text-rose-500 transition-colors">
                                      {filteredPosts[0].title}
                                    </h3>
                                    
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-4 leading-relaxed font-serif">
                                      {filteredPosts[0].summary}
                                    </p>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-neutral-400">
                                      By <span className="font-bold text-neutral-600 dark:text-neutral-300">{filteredPosts[0].author}</span>
                                    </span>
                                    <div className="flex items-center space-x-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                      <span>Read Article</span>
                                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        )}

                        {/* 2. LATEST ARTICLES */}
                        {filteredPosts.length > 1 && (
                          <section id="latest-articles" className="space-y-4">
                            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-500 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                              <BookOpen className="w-4 h-4" />
                              <span>Latest Articles</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {filteredPosts.slice(1, 4).map((post) => (
                                <div
                                  key={post.id}
                                  onClick={() => navigateToPost(post.slug)}
                                  className={`group rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                                    isDark 
                                      ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
                                      : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
                                  }`}
                                >
                                  <div>
                                    {post.thumbnailUrl ? (
                                      <div className="h-44 w-full overflow-hidden relative border-b border-neutral-100 dark:border-neutral-850 bg-neutral-100 dark:bg-neutral-800">
                                        <img 
                                          src={post.thumbnailUrl} 
                                          alt={post.title} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {post.category && (
                                          <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-md text-[9px] font-mono font-extrabold tracking-wider uppercase bg-rose-600 text-white shadow-md">
                                              {post.category}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="h-44 w-full relative border-b border-neutral-100 dark:border-neutral-850 bg-neutral-900 flex items-center justify-center p-6">
                                        <Sparkles className="w-6 h-6 text-rose-500/50" />
                                      </div>
                                    )}

                                    <div className="p-5 space-y-2">
                                      <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono">
                                        <span>{post.date}</span>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                      </div>
                                      <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-white leading-snug group-hover:text-rose-500 transition-colors line-clamp-2">
                                        {post.title}
                                      </h3>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 font-serif">
                                        {post.summary}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="px-5 pb-5 pt-2 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-neutral-100 dark:border-neutral-850/50">
                                    <span>By {post.author}</span>
                                    <span className="font-bold text-rose-500 flex items-center">
                                      Read <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* 3. ADVERTISEMENT */}
                        <section id="advertisement" className="my-8">
                          <AdSlot 
                            code={config.inPostAdCode} 
                            slotId="homepage-middle-ad" 
                            label="Advertisement" 
                            showPlaceholder={true} 
                          />
                        </section>

                        {/* 4. MORE ARTICLES */}
                        {filteredPosts.length > 4 && (
                          <section id="more-articles" className="space-y-4">
                            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-500 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                              <Grid className="w-4 h-4" />
                              <span>More Articles</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {filteredPosts.slice(4).map((post) => (
                                <div
                                  key={post.id}
                                  onClick={() => navigateToPost(post.slug)}
                                  className={`group rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                                    isDark 
                                      ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
                                      : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
                                  }`}
                                >
                                  <div>
                                    {post.thumbnailUrl && (
                                      <div className="h-40 w-full overflow-hidden relative border-b border-neutral-100 dark:border-neutral-850 bg-neutral-100 dark:bg-neutral-800">
                                        <img 
                                          src={post.thumbnailUrl} 
                                          alt={post.title} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {post.category && (
                                          <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-md text-[9px] font-mono font-extrabold tracking-wider uppercase bg-rose-600 text-white shadow-md">
                                              {post.category}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="p-5 space-y-2">
                                      <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono">
                                        <span>{post.date}</span>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                      </div>
                                      <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-white leading-snug group-hover:text-rose-500 transition-colors line-clamp-2">
                                        {post.title}
                                      </h3>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 font-serif">
                                        {post.summary}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="px-5 pb-5 pt-2 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-neutral-100 dark:border-neutral-850/50">
                                    <span>By {post.author}</span>
                                    <span className="font-bold text-rose-500 flex items-center">
                                      Read <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column (4 cols): Sleek Modular Sidebar (ONLY rendered on Home Feed, hidden on Article View) */}
              {!activePostSlug && (
                <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
                  
                  {/* 1. About the Author Widget */}
                <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/80'
                }`}>
                  {/* Decorative background header strip */}
                  <div 
                    className="h-20 w-full relative"
                    style={{
                      background: `linear-gradient(135deg, ${config.accentColor}bb, ${config.accentColor}33)`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"></div>
                  </div>

                  <div className="px-6 pb-6 relative">
                    {/* Floating Avatar */}
                    <div className="relative -mt-10 mb-4 inline-block">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-serif text-xl font-extrabold shadow-md border-4 border-white dark:border-neutral-900">
                        {config.username ? config.username[0].toUpperCase() : 'T'}
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-lg text-neutral-900 dark:text-white flex items-center space-x-1.5">
                      <span>@{config.username}</span>
                    </h4>
                    
                    <p className="text-[10px] font-mono uppercase text-rose-500 tracking-wider font-bold mb-3">
                      Chief Publisher
                    </p>
                    
                    <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 font-serif italic mb-4">
                      {config.tagline || 'Writer and content creator on the platform.'}
                    </p>

                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-850 flex items-center space-x-3 text-neutral-400">
                      {config.githubUrl && (
                        <a href={config.githubUrl} target="_blank" rel="noreferrer" className="hover:text-rose-500 transition-colors">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                      )}
                      {config.twitterUrl && (
                        <a href={config.twitterUrl} target="_blank" rel="noreferrer" className="hover:text-rose-500 transition-colors">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>
                      )}
                      {config.email && (
                        <a href={`mailto:${config.email}`} className="hover:text-rose-500 transition-colors">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Sidebar Ad Slot */}
                <AdSlot code={config.sidebarAdCode} slotId="sidebar-widget-ad" label="Sidebar Advertisement" showPlaceholder={true} />

                {/* 3. Newsletter Widget Box */}
                <div className={`rounded-2xl border p-6 transition-all duration-300 relative overflow-hidden ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/80 shadow-2xs'
                }`}>
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <Mail className="w-16 h-16 text-rose-500" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest font-mono text-neutral-400 dark:text-neutral-500 mb-2 flex items-center space-x-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-rose-500" />
                    <span>Newsletter</span>
                  </h3>
                  <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-white leading-tight mb-2">
                    Subscribe for updates
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed font-serif">
                    Get custom picks and network articles directly in your inbox.
                  </p>
                  
                  {newsletterSubscribed ? (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 rounded-xl p-3 text-xs text-center font-bold">
                      🎉 Awesome! You are subscribed.
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); if (newsletterEmail.trim()) setNewsletterSubscribed(true); }} className="space-y-2">
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="yourname@email.com"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all font-mono"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Join Thunderbolt list</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* 4. Trending Widget list */}
                {mixedPosts.length > 0 && (
                  <div className={`rounded-2xl border p-6 transition-all duration-300 ${
                    isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/80 shadow-2xs'
                  }`}>
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-neutral-400 dark:text-neutral-500 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-850 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-rose-500" />
                      <span>Trending Stories</span>
                    </h3>
                    <ul className="space-y-4">
                      {mixedPosts.slice(0, 4).map((post, idx) => (
                        <li key={post.id} className="flex space-x-3.5 items-start">
                          <span className="font-mono text-xl font-extrabold text-neutral-300 dark:text-neutral-800 leading-none">
                            {`0${idx + 1}`}
                          </span>
                          <div className="space-y-0.5">
                            <button
                              onClick={() => navigateToPost(post.slug)}
                              className="font-serif font-extrabold text-neutral-850 dark:text-neutral-200 hover:text-rose-500 dark:hover:text-rose-400 text-left transition-colors line-clamp-2 leading-tight text-xs"
                            >
                              {post.title}
                            </button>
                            <span className="text-[10px] font-mono text-neutral-400 block">
                              {post.date}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              )}

            </div>
          </main>
        </>
      )}

      {/* Footer Bottom Ad Slot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdSlot code={config.footerAdCode} slotId="footer-bottom-ad" label="Footer Bottom Ad" />
      </div>

      {/* Footer Section */}
      <footer className={`border-t py-12 mt-16 transition-colors duration-300 ${
        isDark ? 'border-neutral-800 bg-neutral-950/60 text-neutral-500' : 'border-neutral-200 bg-neutral-100/40 text-neutral-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs gap-6">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="font-serif font-black text-sm text-neutral-900 dark:text-white">
              {config.siteName}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              • Premium Digital Magazine
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-neutral-500 dark:text-neutral-400">
            <button onClick={handleGoToHome} className="hover:text-rose-500 transition-colors">
              Home
            </button>
            <span>•</span>
            <button onClick={() => setFooterModalTab('about')} className="hover:text-rose-500 transition-colors">
              About
            </button>
            <span>•</span>
            <button onClick={() => setFooterModalTab('contact')} className="hover:text-rose-500 transition-colors">
              Contact Us
            </button>
            <span>•</span>
            <button onClick={() => setFooterModalTab('privacy')} className="hover:text-rose-500 transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => setFooterModalTab('terms')} className="hover:text-rose-500 transition-colors">
              Terms & Conditions
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400">
            © {new Date().getFullYear()} {config.siteName}. All rights reserved.
          </div>
        </div>
      </footer>

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
