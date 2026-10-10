import React, { useState } from 'react';
import { Search, Sun, Moon, Gamepad2, Sparkles, Shuffle, ShieldCheck } from 'lucide-react';
import { BlogConfig } from '../types';
import { Game, INITIAL_GAMES } from '../data/gamesData';

interface ZontalHeaderProps {
  config: BlogConfig;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleTheme: () => void;
  onSelectGame?: (game: Game) => void;
}

export const ZontalHeader: React.FC<ZontalHeaderProps> = ({
  config,
  searchQuery,
  onSearchChange,
  onToggleTheme,
  onSelectGame,
}) => {
  const isDark = config.theme === 'dark';
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Live search suggestions
  const searchSuggestions = searchQuery.trim()
    ? INITIAL_GAMES.filter(g => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelectRandom = () => {
    if (onSelectGame && INITIAL_GAMES.length > 0) {
      const rand = INITIAL_GAMES[Math.floor(Math.random() * INITIAL_GAMES.length)];
      onSelectGame(rand);
    }
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors ${
      isDark 
        ? 'bg-slate-950/95 border-slate-800/80 backdrop-blur-md text-slate-100' 
        : 'bg-white/95 border-slate-200/80 backdrop-blur-md text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <a 
          href="/" 
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="flex items-center gap-3 shrink-0 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 ring-2 ring-white/10 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight font-serif text-rose-500 uppercase">
                ZONTAL
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                ARCADE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block font-medium">
              Free HTML5 Games Portal
            </p>
          </div>
        </a>

        {/* Center Search Input with Auto-complete & Search Button */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6 relative">
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
              className={`w-full py-2.5 pl-10 pr-24 rounded-xl text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                isDark 
                  ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500' 
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            
            <div className="absolute right-1.5 top-1 flex items-center gap-1">
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="px-1.5 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-lg shadow-md shadow-rose-600/20 transition-all flex items-center gap-1 cursor-pointer"
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Random Game Play Button */}
          <button
            onClick={handleSelectRandom}
            title="Surprise Me! Play Random Game"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:opacity-90 transition-all cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random Game</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title="Toggle Light / Dark Mode"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </header>
  );
};
