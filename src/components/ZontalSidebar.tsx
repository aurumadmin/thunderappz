import React from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  Flame, 
  Shuffle, 
  BookOpen, 
  Trophy, 
  Puzzle, 
  Joystick, 
  Compass, 
  Smile, 
  Grid, 
  Zap, 
  ChevronRight,
  ChevronDown,
  Clock
} from 'lucide-react';
import { Game, GAME_CATEGORIES } from '../data/gamesData';

interface ZontalSidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedFilter: 'all' | 'newest' | 'popular' | 'blogs';
  onSelectFilter: (filter: 'all' | 'newest' | 'popular' | 'blogs') => void;
  onAutoplay: () => void;
  popularGames: Game[];
  onSelectGame: (game: Game) => void;
  isDark: boolean;
}

export const ZontalSidebar: React.FC<ZontalSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedFilter,
  onSelectFilter,
  onAutoplay,
  popularGames,
  onSelectGame,
  isDark,
}) => {
  const [showMoreCategories, setShowMoreCategories] = React.useState(false);

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

  const categories = GAME_CATEGORIES.filter(c => c.id !== 'all');
  const visibleCategories = showMoreCategories ? categories : categories.slice(0, 8);

  return (
    <aside className={`hidden lg:block w-64 shrink-0 space-y-6 ${
      isDark ? 'text-slate-200' : 'text-slate-800'
    }`}>
      
      {/* Primary Navigation Menu */}
      <div className={`rounded-2xl border p-3 space-y-1 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => { onSelectFilter('all'); onSelectCategory('all'); }}
          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
            selectedFilter === 'all' && selectedCategory === 'all'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-4 h-4" />
            <span>All Games</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={() => { onSelectFilter('newest'); onSelectCategory('all'); }}
          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
            selectedFilter === 'newest'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Newest Games</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={() => { onSelectFilter('popular'); onSelectCategory('all'); }}
          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
            selectedFilter === 'popular'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Most Popular</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={onAutoplay}
          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Shuffle className="w-4 h-4 text-indigo-400" />
            <span>Random Game</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={() => onSelectFilter('blogs')}
          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
            selectedFilter === 'blogs'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Blogs & Guides</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* CATEGORIES Section (Matching Screenshot) */}
      <div className={`rounded-2xl border p-4 space-y-3 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 px-1">
          Categories
        </div>

        <div className="space-y-1">
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { onSelectCategory(cat.id); onSelectFilter('all'); }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedCategory === cat.id && selectedFilter === 'all'
                  ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/30'
                  : isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                {getCategoryIcon(cat.icon)}
                <span className="truncate">{cat.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-normal">
                {cat.count} Games
              </span>
            </button>
          ))}

          {categories.length > 8 && (
            <button
              onClick={() => setShowMoreCategories(!showMoreCategories)}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer pt-2"
            >
              <span>{showMoreCategories ? 'Show Less' : 'More Categories'}</span>
              {showMoreCategories ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* POPULAR GAMES Widget (Matching Screenshot) */}
      <div className={`rounded-2xl border p-4 space-y-3 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
          <span>Popular Games</span>
          <Flame className="w-3.5 h-3.5 text-rose-500" />
        </div>

        <div className="space-y-2 pt-1">
          {popularGames.slice(0, 5).map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className={`w-full p-2 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group ${
                isDark 
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-800' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <img
                src={game.thumbnailUrl}
                alt={game.title}
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate group-hover:text-rose-400 transition-colors">
                  {game.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                  <Gamepad2 className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{game.plays.toLocaleString()} Plays</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </aside>
  );
};
