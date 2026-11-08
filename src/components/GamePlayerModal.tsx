import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Maximize, 
  Heart, 
  Share2, 
  Gamepad2, 
  Star, 
  Info, 
  ExternalLink,
  Check,
  Lock,
  Unlock,
  Clock,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { 
  Game, 
  FREE_PLAY_DURATION_SECONDS, 
  isGameUnlocked, 
  markGameUnlocked,
  getUsedShorteners24h,
  markShortenerUsed24h
} from '../data/gamesData';
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

  // Shortener Gate States (Rotates VPLINK -> EarnLinks -> LinkCo, 1 use per 24h each)
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(FREE_PLAY_DURATION_SECONDS);
  const [isGateLocked, setIsGateLocked] = useState<boolean>(false);
  const [readyShortUrl, setReadyShortUrl] = useState<string>('');
  const [pendingToken, setPendingToken] = useState<string>('');
  const [awaitingNewTabCompletion, setAwaitingNewTabCompletion] = useState<boolean>(false);
  const [shortenerError, setShortenerError] = useState<string | null>(null);
  const [justUnlockedBanner, setJustUnlockedBanner] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!game) return;
    setPlayCount(game.plays + 1);
    setIsLiked(false);
    setShortenerError(null);
    setAwaitingNewTabCompletion(false);
    setReadyShortUrl('');

    // Check if returning from shortener with ?vp_unlock=...&sp=...
    const params = new URLSearchParams(window.location.search);
    const vpUnlockToken = params.get('vp_unlock');
    const urlProviderId = params.get('sp') || '';

    const handleVerification = async () => {
      if (vpUnlockToken && vpUnlockToken.startsWith('vpl_')) {
        let isValid = false;
        let verifiedProviderId =
          urlProviderId || localStorage.getItem(`vplink_pending_provider_${game.slug}`) || '';

        const pendingLocal = localStorage.getItem(`vplink_pending_token_${game.slug}`);
        if (pendingLocal && pendingLocal === vpUnlockToken) {
          isValid = true;
        }
        try {
          const spQuery = urlProviderId ? `&sp=${encodeURIComponent(urlProviderId)}` : '';
          const verifyRes = await fetch(
            `/api/vplink/verify?token=${encodeURIComponent(vpUnlockToken)}&gameSlug=${encodeURIComponent(game.slug)}${spQuery}`
          );
          const verifyData = await verifyRes.json();
          if (verifyData?.verified) {
            isValid = true;
            if (verifyData.providerId) {
              verifiedProviderId = String(verifyData.providerId);
            }
          }
        } catch {
          isValid = true;
        }

        if (isValid) {
          markGameUnlocked(game.slug);
          if (verifiedProviderId) {
            markShortenerUsed24h(verifiedProviderId);
          }
          localStorage.removeItem(`vplink_pending_token_${game.slug}`);
          localStorage.removeItem(`vplink_pending_provider_${game.slug}`);
          sessionStorage.removeItem(`vplink_remaining_${game.slug}`);
          setUnlocked(true);
          setIsGateLocked(false);
          setJustUnlockedBanner(true);
          setTimeout(() => setJustUnlockedBanner(false), 6000);

          // Clean URL query parameters
          params.delete('vp_unlock');
          params.delete('sp');
          const cleanSearch = params.toString();
          const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${window.location.hash}`;
          window.history.replaceState({}, '', cleanUrl);
          return;
        }
      }

      // Otherwise check existing unlock status
      const alreadyUnlocked = isGameUnlocked(game.slug);
      setUnlocked(alreadyUnlocked);

      if (alreadyUnlocked) {
        setIsGateLocked(false);
        return;
      }

      // Prepare an unlock token and pre-generate short URL from an unused shortener (1 use per 24h)
      let token = localStorage.getItem(`vplink_pending_token_${game.slug}`) || '';
      if (!token || !token.startsWith('vpl_')) {
        token = `vpl_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
        localStorage.setItem(`vplink_pending_token_${game.slug}`, token);
      }
      setPendingToken(token);

      const usedProviders = Object.keys(getUsedShorteners24h());
      const returnUrl = `${window.location.origin}/game/${game.slug}`;
      fetch('/api/vplink/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug: game.slug, returnUrl, token, usedProviders }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.status === 'success' && data?.shortenedUrl) {
            if (data.token) {
              localStorage.setItem(`vplink_pending_token_${game.slug}`, data.token);
              setPendingToken(data.token);
            }
            if (data.providerId) {
              localStorage.setItem(`vplink_pending_provider_${game.slug}`, String(data.providerId));
            }
            setReadyShortUrl(data.shortenedUrl);
          }
        })
        .catch(() => {});

      // If this game requires completing shortener right from the start:
      if (game.requiresShortenerToStart) {
        setIsGateLocked(true);
        setRemainingSeconds(0);
        return;
      }

      // Otherwise, load or initialize remaining free play time for this game
      const savedRem = sessionStorage.getItem(`vplink_remaining_${game.slug}`);
      const initialRem = savedRem !== null ? parseInt(savedRem, 10) : FREE_PLAY_DURATION_SECONDS;
      const validRem = isNaN(initialRem) ? FREE_PLAY_DURATION_SECONDS : Math.max(0, initialRem);

      setRemainingSeconds(validRem);
      setIsGateLocked(validRem <= 0);
    };

    handleVerification();

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [game]);

  // Listen for unlock completion from the newly opened shortener tab/page
  useEffect(() => {
    if (!game || unlocked) return;

    const completeUnlockInCurrentTab = (resolvedProviderId?: string) => {
      markGameUnlocked(game.slug);
      const pid =
        resolvedProviderId || localStorage.getItem(`vplink_pending_provider_${game.slug}`) || '';
      if (pid) {
        markShortenerUsed24h(pid);
      }
      localStorage.removeItem(`vplink_pending_token_${game.slug}`);
      localStorage.removeItem(`vplink_pending_provider_${game.slug}`);
      sessionStorage.removeItem(`vplink_remaining_${game.slug}`);
      setUnlocked(true);
      setIsGateLocked(false);
      setAwaitingNewTabCompletion(false);
      setJustUnlockedBanner(true);
      setTimeout(() => setJustUnlockedBanner(false), 6000);
    };

    const checkCrossTabUnlock = async () => {
      if (isGameUnlocked(game.slug)) {
        completeUnlockInCurrentTab();
        return;
      }
      if (pendingToken) {
        try {
          const res = await fetch(`/api/vplink/status?token=${encodeURIComponent(pendingToken)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.verified) {
              completeUnlockInCurrentTab(data.providerId);
            }
          }
        } catch {
          // ignore
        }
      }
    };

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === `vplink_unlocked_${game.slug}` && e.newValue) {
        completeUnlockInCurrentTab();
      }
    };

    window.addEventListener('storage', onStorageChange);
    window.addEventListener('focus', checkCrossTabUnlock);

    let pollTimer: any = null;
    if (awaitingNewTabCompletion) {
      pollTimer = setInterval(checkCrossTabUnlock, 2500);
    }

    return () => {
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('focus', checkCrossTabUnlock);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [game, unlocked, pendingToken, awaitingNewTabCompletion]);

  // Countdown timer for games that allow free play before requiring shortener
  useEffect(() => {
    if (!game || unlocked || isGateLocked || game.requiresShortenerToStart) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - 1);
        try {
          sessionStorage.setItem(`vplink_remaining_${game.slug}`, String(next));
        } catch {
          // ignore
        }
        if (next <= 0) {
          setIsGateLocked(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game, unlocked, isGateLocked]);

  if (!game) return null;

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Build the external shortener URL that ALWAYS opens in a new browser tab/page (_blank), never in an iframe
  const returnUrl = `${window.location.origin}/game/${game.slug}`;
  const activeToken = pendingToken || `vpl_${game.slug}`;
  const usedListCsv = Object.keys(getUsedShorteners24h()).join(',');
  const fallbackGoUrl = `/api/vplink/go/${encodeURIComponent(game.slug)}?token=${encodeURIComponent(activeToken)}&returnUrl=${encodeURIComponent(returnUrl)}&used=${encodeURIComponent(usedListCsv)}`;
  const shortenerNewPageHref = readyShortUrl || fallbackGoUrl;

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
          {/* Playtime / Unlock Status Pill */}
          {unlocked ? (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <Unlock className="w-3.5 h-3.5" />
              <span>Full Game Unlocked</span>
            </div>
          ) : !isGateLocked && !game.requiresShortenerToStart ? (
            <a
              href={shortenerNewPageHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAwaitingNewTabCompletion(true)}
              title="Opens shortener in a new page to unlock unlimited playtime"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Free Play: {formatCountdown(remainingSeconds)}</span>
              <span className="hidden sm:inline text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-sans font-extrabold uppercase ml-1">
                Unlock
              </span>
            </a>
          ) : null}

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
            disabled={isGateLocked}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white border border-rose-500 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>

      </div>

      {/* Main Player View Container */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">

        {justUnlockedBanner && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Shortener verification completed! <strong>{game.title}</strong> is now unlocked for unlimited play.</span>
            </div>
            <button
              onClick={() => setJustUnlockedBanner(false)}
              className="text-xs text-emerald-400 hover:text-white font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Game Player Container Frame */}
        <div 
          ref={playerContainerRef}
          className="relative w-full aspect-[16/9] max-h-[75vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group"
        >
          {isGateLocked ? (
            /* VPLINK Shortener Gate Overlay (Opens shortener in a new page only, no iframe) */
            <div className="relative w-full h-full flex items-center justify-center p-6 text-center select-none overflow-hidden">
              {/* Blurred Background Game Artwork */}
              <img
                src={game.thumbnailUrl}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md scale-110 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/75 pointer-events-none" />

              <div className="relative z-10 max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-rose-600/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    {game.requiresShortenerToStart ? 'Verification Required to Start' : 'Free Playtime Limit Reached'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {game.requiresShortenerToStart
                      ? `Unlock ${game.title}`
                      : `Continue Playing ${game.title}`}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {game.requiresShortenerToStart
                      ? 'This featured game requires completing a quick shortener link before starting. Click below to open the shortener in a new page and unlock full access for 24 hours!'
                      : 'Your free preview playtime has ended! Click below to open the shortener in a new page and unlock unlimited continuous gameplay for 24 hours.'}
                  </p>
                </div>

                {shortenerError && (
                  <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-medium">
                    {shortenerError}
                  </div>
                )}

                <div className="pt-1 space-y-3">
                  <a
                    href={shortenerNewPageHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAwaitingNewTabCompletion(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>
                      {game.requiresShortenerToStart
                        ? 'Open Shortener in New Page to Play'
                        : 'Open Shortener in New Page to Continue'}
                    </span>
                  </a>

                  {awaitingNewTabCompletion ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-mono pt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Waiting for shortener completion in new tab...</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Opens in a new browser tab • Unlocks automatically for 24h
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={game.iframeUrl}
              title={game.title}
              className="w-full h-full border-0 rounded-2xl bg-slate-950"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; gamepad; fullscreen"
              allowFullScreen
            />
          )}
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

