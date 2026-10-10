import React, { useState } from 'react';
import { 
  Search, Sun, Moon, Gamepad2, Sparkles, Shuffle, ShieldCheck, 
  Menu, X, Clock, Flame, BookOpen, ChevronRight, Trophy, Zap, Compass, Puzzle, Grid, Smile, Joystick 
} from 'lucide-react';
import { BlogConfig } from '../types';
import { Game, GAME_CATEGORIES, INITIAL_GAMES } from '../data/gamesData';

interface ZontalHeaderProps {
  config: BlogConfig;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleTheme: () => void;
  onSelectGame?: (game: Game) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  selectedFilter?: 'all' | 'newest' | 'popular' | 'blogs';
  onSelectFilter?: (filter: 'all' | 'newest' | 'popular' | 'blogs') => void;
  onAutoplay?: () => void;
}

export const ZontalHeader: React.FC<ZontalHeaderProps> = ({
  config,
  searchQuery,
  onSearchChange,
  onToggleTheme,
  onSelectGame,
  selectedCategory = 'all',
  onSelectCategory,
  selectedFilter = 'all',
  onSelectFilter,
  onAutoplay,
}) => {
  const isDark = config.theme === 'dark';
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live search suggestions
  const searchSuggestions = searchQuery.trim()
    ? INITIAL_GAMES.filter(g => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelectRandom = () => {
    if (onAutoplay) {
      onAutoplay();
    } else if (onSelectGame && INITIAL_GAMES.length > 0) {
      const rand = INITIAL_GAMES[Math.floor(Math.random() * INITIAL_GAMES.length)];
      onSelectGame(rand);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Smile': return <Smile className="w-4 h-4 text-pink-400" />;
      case 'Grid': return <Grid className="w-4 h-4 text-emerald-400" />;
      case 'Trophy': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-indigo-400" />;
      case 'Puzzle': return <Puzzle className="w-4 h-4 text-cyan-400" />;
      case 'Joystick': return <Joystick className="w-4 h-4 text-rose-400" />;
      case 'Compass': return <Compass className="w-4 h-4 text-orange-400" />;
      default: return <Gamepad2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors ${
      isDark 
        ? 'bg-slate-950/95 border-slate-800/80 backdrop-blur-md text-slate-100' 
        : 'bg-white/95 border-slate-200/80 backdrop-blur-md text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Mobile Nav Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' 
              : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
          }`}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5 text-rose-500" />}
          <span className="text-xs font-bold hidden xs:inline">Menu</span>
        </button>

        {/* Brand Logo */}
        <a 
          href="/" 
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="flex items-center gap-2 sm:gap-3 shrink-0 group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 ring-2 ring-white/10 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg sm:text-xl font-black tracking-tight font-serif text-rose-500 uppercase">
                Thunder Appz
              </span>
            </div>
          </div>
        </a>

        {/* Center Search Input */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-4 relative">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setIsSearchFocused(false);
              const grid = document.getElementById('games-grid-section');
              if (grid) grid.scrollIntoView({ behavior: 'smooth' });
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search games..."
              className={`w-full py-2 pl-9 pr-16 sm:pr-24 rounded-xl text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                isDark 
                  ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500' 
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
            
            <div className="absolute right-1 top-1 flex items-center gap-1">
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="px-1 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="px-2 sm:px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-lg shadow-md shadow-rose-600/20 transition-all flex items-center gap-1 cursor-pointer"
                title="Search games"
              >
                <Search className="w-3 h-3" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Search Live Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border p-2 shadow-2xl z-50 animate-fade-in ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1 border-b border-slate-800/50 mb-1">
                Top Matches ({searchSuggestions.length})
              </div>
              {searchSuggestions.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    if (onSelectGame) onSelectGame(g);
                    onSearchChange('');
                    setIsSearchFocused(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer text-left group"
                >
                  <img src={g.thumbnailUrl} alt={g.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate group-hover:text-rose-400">{g.title}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{g.category} • ⭐ {g.rating}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Utility Bar */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Random Game Play Button */}
          <button
            onClick={handleSelectRandom}
            title="Play Random Game"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:opacity-90 transition-all cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title="Toggle Light / Dark Mode"
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end animate-fade-in">
          <div className={`w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-6 space-y-6 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="font-black text-base text-rose-500 uppercase tracking-tight">
                  Game Navigation
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Nav Items */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1">
                Explore Games
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onSelectFilter && onSelectCategory) {
                      onSelectFilter('all');
                      onSelectCategory('all');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    selectedFilter === 'all' && selectedCategory === 'all'
                      ? 'bg-rose-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-rose-400" />
                  <span>All Games</span>
                </button>

                <button
                  onClick={() => {
                    if (onSelectFilter && onSelectCategory) {
                      onSelectFilter('newest');
                      onSelectCategory('all');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    selectedFilter === 'newest'
                      ? 'bg-rose-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Newest</span>
                </button>

                <button
                  onClick={() => {
                    if (onSelectFilter && onSelectCategory) {
                      onSelectFilter('popular');
                      onSelectCategory('all');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    selectedFilter === 'popular'
                      ? 'bg-rose-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Most Popular</span>
                </button>

                <button
                  onClick={() => {
                    handleSelectRandom();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Shuffle className="w-4 h-4 text-indigo-400" />
                  <span>Random</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (onSelectFilter) onSelectFilter('blogs');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer mt-2 ${
                  selectedFilter === 'blogs'
                    ? 'bg-rose-600 text-white shadow-md'
                    : isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Gaming Blogs & Guides</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1">
                Game Categories
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GAME_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onSelectCategory && onSelectFilter) {
                        onSelectCategory(cat.id);
                        onSelectFilter('all');
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedCategory === cat.id && selectedFilter === 'all'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold'
                        : isDark ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getCategoryIcon(cat.icon)}
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{cat.count} Games</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};

