import React from 'react';
import { Gamepad2, Play, Star } from 'lucide-react';
import { Game } from '../data/gamesData';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  isDark: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay, isDark }) => {
  return (
    <div 
      onClick={() => onPlay(game)}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer flex flex-col justify-between ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50 hover:shadow-rose-500/10' 
          : 'bg-white border-slate-200/90 hover:border-rose-500/40 hover:shadow-slate-200'
      }`}
    >
      {/* Thumbnail Aspect Ratio Frame */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Hover Overlay Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {game.featured ? (
            <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
              Featured
            </span>
          ) : game.newest ? (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
              New
            </span>
          ) : (
            <span />
          )}

          <span className="bg-slate-950/80 backdrop-blur-sm text-amber-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{game.rating.toFixed(1)}</span>
          </span>
        </div>
      </div>

      {/* Card Info Section (Matching Screenshot) */}
      <div className="p-3 sm:p-4 space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-rose-500 transition-colors">
            {game.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium capitalize mt-0.5">
            {game.category}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Gamepad2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{game.plays.toLocaleString()} plays</span>
          </div>

          <span className="text-[11px] font-bold text-rose-500 group-hover:text-rose-400 transition-colors flex items-center gap-1">
            <span>Play</span>
            <Play className="w-2.5 h-2.5 fill-current" />
          </span>
        </div>
      </div>

    </div>
  );
};
