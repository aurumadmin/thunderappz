import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Maximize, 
  Heart, 
  Share2, 
  Gamepad2, 
  Star, 
  Info, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Check
} from 'lucide-react';
import { Game } from '../data/gamesData';
import { AdSlot } from './AdSlot';
import { BlogConfig } from '../types';

interface GamePlayerModalProps {
  game: Game | null;
  onClose: () => void;
  onSelectRelatedGame: (game: Game) => void;
  relatedGames: Game[];
  config: BlogConfig;
}

export const GamePlayerModal: React.FC<GamePlayerModalProps> = ({
  game,
  onClose,
  onSelectRelatedGame,
  relatedGames,
  config,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [playCount, setPlayCount] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!game) return;
    setPlayCount(game.plays + 1);
    setIsLiked(false);

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [game]);

  if (!game) return null;

  const handleToggleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) return;

    if (!isFullscreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const gameDirectUrl = `${window.location.origin}/game/${game.slug}`;

  const handleShare = () => {
    navigator.clipboard.writeText(gameDirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-y-auto animate-fade-in">
      
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer shrink-0 border border-slate-700/50"
            title="Close Game"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
              <span>{game.title}</span>
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="capitalize text-rose-400 font-bold">{game.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-slate-400" />
                {playCount.toLocaleString()} plays
              </span>
            </div>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiked 
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isLiked ? 'Liked' : 'Like'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copy Game URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>

      </div>

      {/* Main Player View Container */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">

        {/* Game Player Container Frame */}
        <div 
          ref={playerContainerRef}
          className="relative w-full aspect-[16/9] max-h-[75vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group"
        >
          <iframe
            ref={iframeRef}
            src={game.iframeUrl}
            title={game.title}
            className="w-full h-full border-0 rounded-2xl bg-slate-950"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; gamepad; fullscreen"
            allowFullScreen
          />
        </div>

        {/* In-Game Ad Slot */}
        <AdSlot 
          code={config.inPostAdCode || config.safelinkConfig?.middleBanner} 
          slotId="in-game-player-bottom" 
          label="Game Player Banner Ad" 
          adSize="728x90"
          showPlaceholder={false} 
        />

        {/* Game Info & Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Description & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold text-white">About {game.title}</h3>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{game.rating} Rating</span>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                {game.description}
              </p>

              {game.tags && game.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {game.tags.slice(0, 6).map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 capitalize">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-rose-400" />
                  Game Controls
                </h4>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-medium">
                  {game.controls}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Related Games */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-rose-400" />
                More Games You Might Like
              </h3>
              
              <div className="space-y-3">
                {relatedGames.slice(0, 4).map((relGame) => (
                  <button
                    key={relGame.id}
                    onClick={() => onSelectRelatedGame(relGame)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 transition-all cursor-pointer group text-left"
                  >
                    <img 
                      src={relGame.thumbnailUrl} 
                      alt={relGame.title} 
                      className="w-14 h-14 rounded-lg object-cover group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-rose-400 truncate transition-colors">
                        {relGame.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                        {relGame.category} • {relGame.plays.toLocaleString()} plays
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
