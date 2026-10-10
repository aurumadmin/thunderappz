import React, { useState, useMemo, useEffect } from 'react';
import { 
  Gamepad2, Sparkles, Flame, Grid, Search, BookOpen, Clock, Calendar, 
  ArrowRight, Shield, Play, Star, Trophy, Zap, Compass 
} from 'lucide-react';
import { BlogConfig, CustomPost } from '../types';
import { Game, GAME_CATEGORIES, INITIAL_GAMES } from '../data/gamesData';
import { ZontalHeader } from './ZontalHeader';
import { ZontalSidebar } from './ZontalSidebar';
import { GameCard } from './GameCard';
import { GamePlayerModal } from './GamePlayerModal';
import { AdSlot } from './AdSlot';

interface ArcadeViewProps {
  config: BlogConfig;
  customPosts: CustomPost[];
  dlSurfPosts: any[];
  onSelectPost: (slug: string) => void;
  onNavigateSafelinkAdmin: () => void;
  onNavigateBlogAdmin: () => void;
  onToggleTheme: () => void;
}

export const ArcadeView: React.FC<ArcadeViewProps> = ({
  config,
  customPosts,
  dlSurfPosts,
  onSelectPost,
  onNavigateSafelinkAdmin,
  onNavigateBlogAdmin,
  onToggleTheme,
}) => {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'newest' | 'popular' | 'blogs'>('all');
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  const isDark = config.theme === 'dark';

  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // Deep Link Routing for Specific Game URLs
  const getGameFromUrl = (allGames: Game[]) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // Match /game/slug
    const gameMatch = pathname.match(/\/game\/([a-zA-Z0-9_-]+)/);
    let slug = gameMatch ? gameMatch[1] : null;

    if (!slug && searchParams.has('game')) {
      slug = searchParams.get('game');
    }

    if (!slug && hash.includes('/game/')) {
      slug = hash.split('/game/')[1];
    }

    if (slug) {
      return allGames.find((g) => g.slug === slug || g.id === slug) || null;
    }
    return null;
  };

  useEffect(() => {
    const initialGame = getGameFromUrl(games);
    if (initialGame) {
      setActiveGame(initialGame);
      document.title = `${initialGame.title} - Play Free Online | Zontal Arcade`;
    }
  }, [games]);

  const handleOpenGame = (game: Game) => {
    // Perform full page refresh navigation to specific game URL
    window.location.href = `/game/${game.slug}`;
  };

  const handleCloseGame = () => {
    window.location.href = '/';
  };

  // Filter games based on search, category, and tab filter
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;

      let matchesFilter = true;
      if (selectedFilter === 'newest') {
        matchesFilter = Boolean(game.newest || game.plays < 35000);
      } else if (selectedFilter === 'popular') {
        matchesFilter = Boolean(game.popular || game.plays >= 35000);
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        game.title.toLowerCase().includes(q) || 
        game.category.toLowerCase().includes(q) || 
        game.description.toLowerCase().includes(q);

      return matchesCategory && matchesFilter && matchesSearch;
    });
  }, [games, searchQuery, selectedCategory, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / ITEMS_PER_PAGE));

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGames.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGames, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedFilter && selectedFilter !== 'all') params.set('filter', selectedFilter);
    window.location.href = `${window.location.pathname}?${params.toString()}`;
  };

  const popularGames = useMemo(() => {
    return [...games].sort((a, b) => b.plays - a.plays);
  }, [games]);

  const featuredHeroGame = useMemo(() => {
    return games.find((g) => g.featured) || games[0];
  }, [games]);

  const handleAutoplayRandom = () => {
    const randomGame = games[Math.floor(Math.random() * games.length)];
    if (randomGame) {
      handleOpenGame(randomGame);
    }
  };

  const allBlogArticles = useMemo(() => {
    const list: any[] = [...customPosts];
    if (Array.isArray(dlSurfPosts)) {
      dlSurfPosts.forEach((post) => {
        if (post && post.id && !list.some((p) => p.id === post.id || p.slug === post.slug)) {
          list.push(post);
        }
      });
    }
    return list;
  }, [customPosts, dlSurfPosts]);

  const categoryName = GAME_CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'All Games';

  // Dedicated Game Page View
  if (activeGame) {
    const relatedGames = games.filter((g) => g.id !== activeGame.id && (g.category === activeGame.category || g.featured)).slice(0, 6);
    return (
      <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <ZontalHeader
          config={config}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleTheme={onToggleTheme}
          onSelectGame={handleOpenGame}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedFilter('all');
            handleCloseGame();
          }}
          selectedFilter={selectedFilter}
          onSelectFilter={(filt) => {
            setSelectedFilter(filt);
            handleCloseGame();
          }}
          onAutoplay={handleAutoplayRandom}
        />
        <GamePlayerModal
          game={activeGame}
          onClose={handleCloseGame}
          onSelectRelatedGame={(relGame) => {
            window.location.href = `/game/${relGame.slug}`;
          }}
          relatedGames={relatedGames.length > 0 ? relatedGames : games.filter((g) => g.id !== activeGame.id).slice(0, 6)}
          config={config}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-rose-500 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. Header Bar (With mobile nav button drawer) */}
      <ZontalHeader
        config={config}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleTheme={onToggleTheme}
        onSelectGame={handleOpenGame}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        onAutoplay={handleAutoplayRandom}
      />

      {/* Top Banner Ad Slot (Clean unframed banner) */}
      {(config.headerAdCode || config.safelinkConfig?.headerBanner) && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <AdSlot
            code={config.headerAdCode || config.safelinkConfig?.headerBanner}
            slotId="arcade-top-ad"
            label="Header Banner Ad"
            adSize="728x90"
            showPlaceholder={false}
            framed={false}
          />
        </div>
      )}

      {/* 2. Main Layout Container: Sidebar + Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Sidebar */}
        <ZontalSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          onAutoplay={handleAutoplayRandom}
          popularGames={popularGames}
          onSelectGame={handleOpenGame}
          isDark={isDark}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Featured Hero Banner Spotlight (if viewing All Games and no search) */}
          {selectedCategory === 'all' && selectedFilter === 'all' && !searchQuery && featuredHeroGame && (
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="space-y-3 max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Featured Game</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {featuredHeroGame.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {featuredHeroGame.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <button
                      onClick={() => handleOpenGame(featuredHeroGame)}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Now</span>
                    </button>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        {featuredHeroGame.rating}
                      </span>
                      <span>•</span>
                      <span>{featuredHeroGame.plays.toLocaleString()} plays</span>
                    </div>
                  </div>
                </div>

                <div className="relative shrink-0 w-full md:w-64 aspect-video md:aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                  <img 
                    src={featuredHeroGame.thumbnailUrl} 
                    alt={featuredHeroGame.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[10px] font-mono text-white font-bold bg-rose-600 px-2 py-0.5 rounded uppercase">
                      {featuredHeroGame.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active View Header Bar */}
          <div id="games-grid-section" className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                {selectedFilter === 'blogs' ? (
                  <>
                    <BookOpen className="w-6 h-6 text-emerald-400" />
                    <span>Gaming Blogs &amp; Guides</span>
                  </>
                ) : selectedFilter === 'newest' ? (
                  <>
                    <Clock className="w-6 h-6 text-amber-400" />
                    <span>Newest Games</span>
                  </>
                ) : selectedFilter === 'popular' ? (
                  <>
                    <Flame className="w-6 h-6 text-rose-500" />
                    <span>Most Popular Games</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-6 h-6 text-rose-500" />
                    <span>{categoryName}</span>
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {selectedFilter === 'blogs' 
                  ? 'Gaming guides, news, and strategy tips.'
                  : `Browse and play free online games.`}
              </p>
            </div>

            {/* Quick Stats Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-mono font-bold">
                {selectedFilter === 'blogs' ? `${allBlogArticles.length} Articles` : `${filteredGames.length} Games`}
              </span>
            </div>
          </div>

          {/* GAMES GRID VIEW */}
          {selectedFilter !== 'blogs' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {GAME_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedFilter('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id && selectedFilter === 'all'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* BLOGS VIEW */}
          {selectedFilter === 'blogs' ? (
            <div className="space-y-6">
              {allBlogArticles.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border p-8 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-200">No Gaming Guides Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Check back soon for new articles and walkthroughs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allBlogArticles.map((article: any) => (
                    <div
                      key={article.id || article.slug}
                      onClick={() => onSelectPost(article.slug)}
                      className={`group rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between ${
                        isDark ? 'bg-slate-900 border-slate-800 hover:border-rose-500/40' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            {article.date || 'Recent'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {article.readTime || '3 min'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-rose-400 transition-colors line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {article.summary || article.content?.substring(0, 150)}...
                        </p>
                      </div>

                      <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-rose-500">
                        <span>Read Full Guide</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* GAMES GRID VIEW */
            <div className="space-y-6">
              {filteredGames.length === 0 ? (
                <div className={`text-center py-20 rounded-2xl border p-8 space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <Search className="w-12 h-12 text-slate-500 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-200">No Games Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No games match your search query <code className="text-rose-400">"{searchQuery}"</code>.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedFilter('all'); }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Search &amp; Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {paginatedGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onPlay={handleOpenGame}
                        isDark={isDark}
                      />
                    ))}
                  </div>

                  {/* Pagination Navigation Bar */}
                  {totalPages > 1 && (
                    <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-slate-400 font-mono">
                        Showing <span className="font-bold text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredGames.length)}</span> of <span className="font-bold text-slate-200">{filteredGames.length}</span> games
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Bottom Banner Ad Placement */}
          {(config.footerAdCode || config.safelinkConfig?.footerBanner) && (
            <div className="pt-6 flex justify-center">
              <AdSlot
                code={config.footerAdCode || config.safelinkConfig?.footerBanner}
                slotId="arcade-footer-ad"
                label="Footer Banner Ad"
                adSize="728x90"
                showPlaceholder={false}
              />
            </div>
          )}

        </main>

      </div>

      {/* 3. Footer Bar */}
      <footer className={`border-t py-10 mt-12 transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold font-mono">
              ⚡
            </div>
            <div>
              <span className="font-bold text-slate-200 uppercase tracking-wider">THUNDER APPZ</span>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap font-medium">
            <button onClick={() => { setSelectedFilter('all'); setSelectedCategory('all'); }} className="hover:text-rose-400 transition-colors cursor-pointer">
              All Games
            </button>
            <button onClick={() => setSelectedFilter('newest')} className="hover:text-rose-400 transition-colors cursor-pointer">
              New Games
            </button>
            <button onClick={() => setSelectedFilter('popular')} className="hover:text-rose-400 transition-colors cursor-pointer">
              Popular Games
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            © {new Date().getFullYear()} Thunder Appz. All rights reserved.
          </div>

        </div>
      </footer>

      {/* 4. Full Featured Game Player Modal */}
      {activeGame && (
        <GamePlayerModal
          game={activeGame}
          onClose={handleCloseGame}
          onSelectRelatedGame={(relGame) => handleOpenGame(relGame)}
          relatedGames={games.filter((g) => g.id !== activeGame.id).slice(0, 6)}
          config={config}
        />
      )}

    </div>
  );
};
