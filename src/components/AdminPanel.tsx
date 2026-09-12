import React, { useState, useEffect, useMemo } from 'react';
import { BlogConfig, BLOG_CATEGORIES, getPostCategories } from '../types';
import { DlSurfPost } from '../lib/dlsurfApi';
import { 
  Shield, FileText, Settings, Save, LogOut, Check, ArrowLeft, Download, Copy, Tag, X, Search, RefreshCw, Layers, CheckSquare, Square
} from 'lucide-react';

interface AdminPanelProps {
  config: BlogConfig;
  onConfigChange: (newConfig: BlogConfig) => void;
  dlSurfPosts: DlSurfPost[];
  isLoadingDl?: boolean;
  onRefreshDlPosts?: () => void;
  onBackToHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  onConfigChange,
  dlSurfPosts,
  isLoadingDl = false,
  onRefreshDlPosts,
  onBackToHome,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tab State: 'settings' | 'categories'
  const [activeTab, setActiveTab] = useState<'settings' | 'categories'>('categories');

  // Local Config States
  const [username, setUsername] = useState(config.username || 'thunderbolt');
  const [siteName, setSiteName] = useState(config.siteName);
  const [tagline, setTagline] = useState(config.tagline);
  const [accentColor, setAccentColor] = useState(config.accentColor);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(config.theme);
  const [adsTxt, setAdsTxt] = useState(config.adsTxt || '');
  const [headCode, setHeadCode] = useState(config.headCode || '');
  const [headerAdCode, setHeaderAdCode] = useState(config.headerAdCode || '');
  const [sidebarAdCode, setSidebarAdCode] = useState(config.sidebarAdCode || '');
  const [footerAdCode, setFooterAdCode] = useState(config.footerAdCode || '');
  const [inPostAdCode, setInPostAdCode] = useState(config.inPostAdCode || '');

  // Local Category Mapping: { [slugOrId: string]: string[] }
  const [dlCategoryMap, setDlCategoryMap] = useState<Record<string, string[]>>(config.dlCategoryMap || {});

  // Category Management UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPostSlug, setEditingPostSlug] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedPostSlugs, setSelectedPostSlugs] = useState<Set<string>>(new Set());
  const [batchCategory, setBatchCategory] = useState<string>('Linux');

  // Status Indicators
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [copiedAds, setCopiedAds] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    setUsername(config.username || 'thunderbolt');
    setSiteName(config.siteName);
    setTagline(config.tagline);
    setAccentColor(config.accentColor);
    setThemeMode(config.theme);
    setAdsTxt(config.adsTxt || '');
    setHeadCode(config.headCode || '');
    setHeaderAdCode(config.headerAdCode || '');
    setSidebarAdCode(config.sidebarAdCode || '');
    setFooterAdCode(config.footerAdCode || '');
    setInPostAdCode(config.inPostAdCode || '');
    setDlCategoryMap(config.dlCategoryMap || {});
  }, [config]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'teamthunder' && passwordInput === 'Thunderffyt123@') {
      setIsLoggedIn(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid login credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedConfig: BlogConfig = {
      ...config,
      username,
      siteName,
      tagline,
      accentColor,
      theme: themeMode,
      adsTxt,
      headCode,
      headerAdCode,
      sidebarAdCode,
      footerAdCode,
      inPostAdCode,
      dlCategoryMap,
    };
    onConfigChange(updatedConfig);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Helper to toggle a category for a single DL.surf post
  const togglePostCategory = (postSlugOrId: string, category: string) => {
    let currentCats = dlCategoryMap[postSlugOrId];
    if (!currentCats) {
      const matched = dlSurfPosts.find(p => (p.link_slug || String(p.id)) === postSlugOrId || String(p.id) === postSlugOrId);
      currentCats = getPostCategories(matched, dlCategoryMap);
    }
    let updatedCats: string[];

    if (currentCats.includes(category)) {
      if (currentCats.length === 1) {
        alert('Each article must have at least one assigned category.');
        return;
      }
      updatedCats = currentCats.filter(c => c !== category);
    } else {
      updatedCats = [...currentCats, category];
    }

    const newMap = {
      ...dlCategoryMap,
      [postSlugOrId]: updatedCats,
    };
    setDlCategoryMap(newMap);
    
    // Auto-save changes to config
    onConfigChange({
      ...config,
      dlCategoryMap: newMap,
    });
  };

  // Add custom category tag to a post
  const handleAddCustomTag = (postSlugOrId: string) => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    const currentCats = dlCategoryMap[postSlugOrId] || ['Linux'];
    if (!currentCats.includes(trimmed)) {
      const updatedCats = [...currentCats, trimmed];
      const newMap = {
        ...dlCategoryMap,
        [postSlugOrId]: updatedCats,
      };
      setDlCategoryMap(newMap);
      onConfigChange({
        ...config,
        dlCategoryMap: newMap,
      });
    }
    setCustomTagInput('');
  };

  // Batch Category Assignment
  const handleBatchAssignCategory = () => {
    if (selectedPostSlugs.size === 0) {
      alert('Please select at least one article first.');
      return;
    }

    const newMap = { ...dlCategoryMap };
    selectedPostSlugs.forEach(slug => {
      const current = newMap[slug] || [];
      if (!current.includes(batchCategory)) {
        newMap[slug] = [...current, batchCategory];
      }
    });

    setDlCategoryMap(newMap);
    onConfigChange({
      ...config,
      dlCategoryMap: newMap,
    });
    alert(`Assigned category "${batchCategory}" to ${selectedPostSlugs.size} articles!`);
    setSelectedPostSlugs(new Set());
  };

  const handleSelectAllFiltered = () => {
    if (selectedPostSlugs.size === filteredDlPosts.length) {
      setSelectedPostSlugs(new Set());
    } else {
      const allSlugs = new Set(filteredDlPosts.map(p => p.link_slug || String(p.id)));
      setSelectedPostSlugs(allSlugs);
    }
  };

  const toggleSelectPost = (slug: string) => {
    const next = new Set(selectedPostSlugs);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setSelectedPostSlugs(next);
  };

  const handleDownloadAdsTxt = () => {
    const blob = new Blob([adsTxt || '# Ads.txt managed via Thunder Appz Console'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ads.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadConfigJson = () => {
    const currentConfigObj = {
      config: {
        username,
        siteName,
        tagline,
        theme: themeMode,
        accentColor,
        adsTxt,
        headCode,
        headerAdCode,
        sidebarAdCode,
        footerAdCode,
        inPostAdCode,
        dlCategoryMap,
      },
      dlSurfPostsCount: dlSurfPosts.length,
    };
    const blob = new Blob([JSON.stringify(currentConfigObj, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'site_config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyAdsTxt = () => {
    navigator.clipboard.writeText(adsTxt || '# Ads.txt managed via Thunder Appz Console');
    setCopiedAds(true);
    setTimeout(() => setCopiedAds(false), 2000);
  };

  const handleCopyConfigJson = () => {
    const currentConfigObj = {
      config: {
        username,
        siteName,
        tagline,
        theme: themeMode,
        accentColor,
        adsTxt,
        headCode,
        headerAdCode,
        sidebarAdCode,
        footerAdCode,
        inPostAdCode,
        dlCategoryMap,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(currentConfigObj, null, 2));
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  // Filter DL.surf articles for search & category filter in Admin
  const filteredDlPosts = useMemo(() => {
    return dlSurfPosts.filter((post) => {
      const slug = post.link_slug || String(post.id);
      const postCats = getPostCategories(post, dlCategoryMap);

      // Category filter
      if (selectedCategoryFilter !== 'All') {
        if (!postCats.includes(selectedCategoryFilter)) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = post.title?.toLowerCase().includes(q);
        const slugMatch = slug.toLowerCase().includes(q);
        const descMatch = (post.description || post.summary || '').toLowerCase().includes(q);
        return titleMatch || slugMatch || descMatch;
      }

      return true;
    });
  }, [dlSurfPosts, dlCategoryMap, selectedCategoryFilter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-8 border-b pb-4 border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onBackToHome}
          className="flex items-center space-x-2 text-sm text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog View</span>
        </button>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-rose-600" />
          <span className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-500">
            Thunder Admin Console
          </span>
        </div>
      </div>

      {!isLoggedIn ? (
        /* Login Screen */
        <div className="max-w-md mx-auto my-12 p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-3 text-rose-600">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="font-serif font-bold text-2xl text-neutral-900 dark:text-white">Admin Authentication</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Authenticate to configure DL.surf categories & blog settings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-500 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 dark:text-neutral-400 mb-1">
                Username
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter admin username"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 dark:text-neutral-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors text-sm shadow-md cursor-pointer"
            >
              Sign In to Console
            </button>
          </form>
          <div className="mt-6 text-center text-[10px] text-neutral-400 font-mono">
            Protected Console • Thunder Appz
          </div>
        </div>
      ) : (
        /* Dashboard Container */
        <div className="space-y-6">
          {/* Top Hero Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-rose-600 text-white rounded-xl shadow-lg gap-4">
            <div>
              <h2 className="font-serif font-bold text-2xl">DL.surf Article Category Manager</h2>
              <p className="text-xs opacity-90 mt-1">
                Logged in as teamthunder • Assign & organize categories for DL.surf network articles
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors border border-white/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-1.5 py-3 px-5 border-b-2 font-medium text-xs uppercase tracking-wider font-mono transition-colors cursor-pointer ${
                activeTab === 'categories'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>DL.surf Article Categories ({dlSurfPosts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 py-3 px-5 border-b-2 font-medium text-xs uppercase tracking-wider font-mono transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>General Settings & Ads</span>
            </button>
          </div>

          {/* TAB 1: DL.SURF ARTICLE CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              
              {/* Creator Username & Refresh Control */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-grow w-full sm:w-auto">
                  <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                    DL.surf Creator Username
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-rose-500 font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="thunderbolt"
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono text-neutral-900 dark:text-white flex-grow max-w-xs"
                    />
                    <button
                      onClick={() => {
                        handleSaveSettings();
                        if (onRefreshDlPosts) onRefreshDlPosts();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDl ? 'animate-spin text-rose-400' : ''}`} />
                      <span>Sync Feed</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs font-mono text-neutral-400 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{dlSurfPosts.length} articles loaded from DL.surf</span>
                </div>
              </div>

              {/* Controls: Search, Filter, Batch Category Bar */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Search Input */}
                  <div className="relative flex-grow">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search DL.surf articles..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  {/* Filter by assigned Category */}
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-mono uppercase text-neutral-500 font-semibold whitespace-nowrap">
                      Filter:
                    </label>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white font-mono"
                    >
                      <option value="All">All Categories ({dlSurfPosts.length})</option>
                      {BLOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Batch Category Assignment Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAllFiltered}
                      className="flex items-center space-x-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:text-rose-600 cursor-pointer"
                    >
                      {selectedPostSlugs.size > 0 && selectedPostSlugs.size === filteredDlPosts.length ? (
                        <CheckSquare className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                      <span>Select All Filtered ({selectedPostSlugs.size} selected)</span>
                    </button>
                  </div>

                  {selectedPostSlugs.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-neutral-400">Assign Category to Selected:</span>
                      <select
                        value={batchCategory}
                        onChange={(e) => setBatchCategory(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white"
                      >
                        {BLOG_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleBatchAssignCategory}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        Apply Batch Category
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Articles List */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
                {isLoadingDl ? (
                  <div className="p-12 text-center text-neutral-400 font-mono text-xs flex flex-col items-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                    <span>Fetching DL.surf articles for @{username}...</span>
                  </div>
                ) : filteredDlPosts.length === 0 ? (
                  <div className="p-12 text-center text-neutral-400 font-mono text-xs space-y-2">
                    <FileText className="w-8 h-8 opacity-40 mx-auto" />
                    <p className="font-bold text-neutral-600 dark:text-neutral-300">No DL.surf articles found</p>
                    <p className="text-[11px] text-neutral-400">
                      Verify DL.surf creator username (@{username}) or clear search query.
                    </p>
                  </div>
                ) : (
                  filteredDlPosts.map((post) => {
                    const slug = post.link_slug || String(post.id);
                    const isSelected = selectedPostSlugs.has(slug);
                    const isEditing = editingPostSlug === slug;
                    const assignedCats = getPostCategories(post, dlCategoryMap);

                    let cleanDate = '2026-08-23';
                    if (post.created_at) {
                      try {
                        cleanDate = new Date(post.created_at).toISOString().split('T')[0];
                      } catch (e) {
                        // ignore
                      }
                    }

                    return (
                      <div key={slug} className={`p-5 transition-colors ${isSelected ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-950/30'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3 min-w-0">
                            {/* Checkbox for batch selection */}
                            <button
                              type="button"
                              onClick={() => toggleSelectPost(slug)}
                              className="mt-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-rose-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div className="min-w-0 space-y-1">
                              <h4 className="font-serif font-bold text-base text-neutral-900 dark:text-white leading-snug">
                                {post.title}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-mono">
                                <span>{cleanDate}</span>
                                <span>•</span>
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[10px] text-rose-500 font-bold">
                                  /{slug}
                                </span>
                              </div>

                              {/* Currently Assigned Category Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                                <span className="text-[10px] font-mono text-neutral-400 font-semibold">Assigned Categories:</span>
                                {assignedCats.map((cat) => (
                                  <span
                                    key={cat}
                                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  >
                                    <Tag className="w-3 h-3" />
                                    <span>{cat}</span>
                                    <button
                                      type="button"
                                      onClick={() => togglePostCategory(slug, cat)}
                                      className="hover:text-red-700 ml-0.5 cursor-pointer"
                                      title="Remove Category"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Toggle Category Selection Editor */}
                          <button
                            onClick={() => setEditingPostSlug(isEditing ? null : slug)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                              isEditing
                                ? 'bg-rose-600 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                            }`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>{isEditing ? 'Done Editing' : 'Edit Categories'}</span>
                          </button>
                        </div>

                        {/* Interactive Multi-Category Toggle Panel */}
                        {isEditing && (
                          <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold uppercase text-neutral-500">
                                Select Categories for Article:
                              </span>
                              <span className="text-[10px] font-mono text-rose-500 font-bold">
                                {assignedCats.length} category/categories selected
                              </span>
                            </div>

                            {/* Standard Category Pills */}
                            <div className="flex flex-wrap gap-2">
                              {BLOG_CATEGORIES.map((cat) => {
                                const isCatSelected = assignedCats.includes(cat);
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => togglePostCategory(slug, cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                                      isCatSelected
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-rose-500'
                                    }`}
                                  >
                                    {isCatSelected && <Check className="w-3.5 h-3.5" />}
                                    <span>{cat}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Add Custom Category Tag Input */}
                            <div className="flex items-center space-x-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                              <input
                                type="text"
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomTag(slug);
                                  }
                                }}
                                placeholder="Add custom category tag..."
                                className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white font-mono flex-grow max-w-sm"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomTag(slug)}
                                className="px-3 py-1 rounded-lg bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-900 text-white text-xs font-mono font-semibold cursor-pointer"
                              >
                                + Add Custom Category
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL SETTINGS & MONETIZATION */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <h3 className="font-serif font-bold text-lg border-b pb-2 text-neutral-900 dark:text-white">Blog & Monetization Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                    DL.surf Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                    Tagline / Subheading
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-grow px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                    Visual Palette Mode
                  </label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark')}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="light">Classic Light</option>
                    <option value="dark">Cozy Dark</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t pt-4 border-neutral-100 dark:border-neutral-800 space-y-5">
                  <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Ads.txt & Ad Placements</span>
                  </h4>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                      Edit ads.txt Page Content
                    </label>
                    <textarea
                      rows={3}
                      value={adsTxt}
                      onChange={(e) => setAdsTxt(e.target.value)}
                      placeholder="e.g. ownerdomain=thunder-appz.eu.org"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Served directly at <a href="/ads.txt" target="_blank" className="text-rose-500 hover:underline">/ads.txt</a> for verification.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                      Custom &lt;head&gt; Code Injection (All Pages)
                    </label>
                    <textarea
                      rows={3}
                      value={headCode}
                      onChange={(e) => setHeadCode(e.target.value)}
                      placeholder="<!-- Enter HTML scripts, styling tags, or meta tags here -->"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                        Header Banner Ad Code (Top)
                      </label>
                      <textarea
                        rows={3}
                        value={headerAdCode}
                        onChange={(e) => setHeaderAdCode(e.target.value)}
                        placeholder="<!-- Paste top banner code here -->"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                        Sidebar Ad Code
                      </label>
                      <textarea
                        rows={3}
                        value={sidebarAdCode}
                        onChange={(e) => setSidebarAdCode(e.target.value)}
                        placeholder="<!-- Paste sidebar code here -->"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                        In-Feed Native Ad Code
                      </label>
                      <textarea
                        rows={3}
                        value={inPostAdCode}
                        onChange={(e) => setInPostAdCode(e.target.value)}
                        placeholder="<!-- Paste in-feed code here -->"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold font-mono text-neutral-500 mb-1">
                        Footer Banner Ad Code (Bottom)
                      </label>
                      <textarea
                        rows={3}
                        value={footerAdCode}
                        onChange={(e) => setFooterAdCode(e.target.value)}
                        placeholder="<!-- Paste bottom banner code here -->"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Download / Copy Config Bar */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono uppercase">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Deployment Configurations Sync</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadAdsTxt}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ads.txt</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAdsTxt}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedAds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAds ? 'Copied ads.txt!' : 'Copy ads.txt'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadConfigJson}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download site_config.json</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyConfigJson}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedConfig ? 'Copied Config!' : 'Copy site_config.json'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-400">Settings are saved locally and persist instantly.</p>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Settings Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
