import React, { useEffect, useRef, useState } from 'react';
import { AdSize } from '../types';

interface AdSlotProps {
  code?: string;
  slotId: string;
  label?: string;
  adSize?: AdSize;
  className?: string;
  showPlaceholder?: boolean;
  
  // Click-tracking props
  isClickTrackingActive?: boolean;
  isClicked?: boolean;
  isPendingVerification?: boolean;
  verificationCountdown?: number;
  onAdClicked?: (slotId: string) => void;
}

export const AD_SIZE_LABELS: Record<AdSize, string> = {
  '300x250': '300×250 (Medium Rectangle)',
  '300x600': '300×600 (Half Page / Filmstrip)',
  '160x600': '160×600 (Wide Skyscraper)',
  '336x280': '336×280 (Large Rectangle)',
  '320x100': '320×100 (Large Mobile Banner)',
  '320x50': '320×50 (Mobile Banner)',
  '468x60': '468×60 (Full Banner)',
  '728x90': '728×90 (Leaderboard)',
  'responsive': 'Responsive / Fluid'
};

const getAdSizeStyles = (size?: AdSize): { containerClass: string; minHeight: string } => {
  switch (size) {
    case '300x250':
      return { containerClass: 'max-w-[320px] w-full', minHeight: 'min-h-[250px]' };
    case '300x600':
      return { containerClass: 'max-w-[320px] w-full', minHeight: 'min-h-[600px]' };
    case '160x600':
      return { containerClass: 'max-w-[180px] w-full', minHeight: 'min-h-[600px]' };
    case '336x280':
      return { containerClass: 'max-w-[360px] w-full', minHeight: 'min-h-[280px]' };
    case '320x100':
      return { containerClass: 'max-w-[340px] w-full', minHeight: 'min-h-[100px]' };
    case '320x50':
      return { containerClass: 'max-w-[340px] w-full', minHeight: 'min-h-[50px]' };
    case '468x60':
      return { containerClass: 'max-w-[490px] w-full', minHeight: 'min-h-[60px]' };
    case '728x90':
      return { containerClass: 'max-w-[750px] w-full', minHeight: 'min-h-[90px]' };
    case 'responsive':
    default:
      return { containerClass: 'w-full', minHeight: 'min-h-[60px]' };
  }
};

export const AdSlot: React.FC<AdSlotProps> = ({ 
  code, 
  slotId, 
  label = "Sponsored Advertisement", 
  adSize = 'responsive',
  className = "",
  showPlaceholder = false,
  isClickTrackingActive = false,
  isClicked = false,
  isPendingVerification = false,
  verificationCountdown = 0,
  onAdClicked
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sizeConfig = getAdSizeStyles(adSize);
  const displaySizeLabel = AD_SIZE_LABELS[adSize] || label;

  const isOverAdRef = useRef<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous elements
    containerRef.current.innerHTML = '';
    
    if (!code || !code.trim()) return;

    try {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(`<div>${code}</div>`, 'text/html');
      const parsedContainer = parsedDoc.querySelector('div');
      
      if (parsedContainer) {
        const nodes = Array.from(parsedContainer.childNodes);
        nodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName.toLowerCase() === 'script') {
              const script = document.createElement('script');
              Array.from(el.attributes).forEach(attr => {
                script.setAttribute(attr.name, attr.value);
              });
              script.textContent = el.textContent;
              containerRef.current?.appendChild(script);
            } else {
              const clone = el.cloneNode(true) as HTMLElement;
              const innerScripts = clone.querySelectorAll('script');
              innerScripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode?.replaceChild(newScript, oldScript);
              });
              containerRef.current?.appendChild(clone);
            }
          } else if (node.nodeType === Node.TEXT_NODE) {
            containerRef.current?.appendChild(document.createTextNode(node.textContent || ''));
          }
        });
      }

      // Safely invoke Google AdSense push if ins.adsbygoogle is present
      const timer = setTimeout(() => {
        if (containerRef.current && containerRef.current.querySelector('ins.adsbygoogle')) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (e) {
            // Silence duplicate push warnings
          }
        }
      }, 250);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error(`Error loading custom ad slot [${slotId}]:`, err);
    }
  }, [code, slotId]);

  // Check if ad content actually loaded inside container
  const checkIsAdLoaded = (): boolean => {
    if (!containerRef.current) return false;
    const hasChildren = containerRef.current.childElementCount > 0 || containerRef.current.children.length > 0;
    const hasHeight = containerRef.current.offsetHeight > 10;
    const hasMedia = containerRef.current.querySelector('iframe, ins, img, a, svg, div, script') !== null;
    return hasChildren || hasHeight || hasMedia;
  };

  // Robust Ad Click Detection (Handles iframes, third-party banners, links & overlays)
  useEffect(() => {
    if (!isClickTrackingActive || isClicked) return;

    const handleMouseEnter = () => { isOverAdRef.current = true; };
    const handleMouseLeave = () => { isOverAdRef.current = false; };

    const handleInteraction = () => {
      if (isClickTrackingActive && !isClicked && onAdClicked) {
        if (!checkIsAdLoaded()) {
          console.warn(`Click ignored on [${slotId}] because ad content did not load.`);
          return;
        }
        console.log(`Ad slot click registered on [${slotId}]`);
        onAdClicked(slotId);
      }
    };

    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('mouseenter', handleMouseEnter);
      wrapper.addEventListener('mouseleave', handleMouseLeave);
      wrapper.addEventListener('click', handleInteraction, true);
      wrapper.addEventListener('mousedown', handleInteraction, true);
      wrapper.addEventListener('touchstart', handleInteraction, true);
    }

    // Window Blur Listener (detects clicks inside cross-origin iframe ads like AdSense/EarnZilla)
    const handleWindowBlur = () => {
      if (isOverAdRef.current && isClickTrackingActive && !isClicked && onAdClicked) {
        if (!checkIsAdLoaded()) {
          console.warn(`Iframe click window blur ignored on [${slotId}] because ad content did not load.`);
          return;
        }
        console.log(`Iframe ad click detected via window blur on [${slotId}]`);
        onAdClicked(slotId);
      }
    };

    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (wrapper) {
        wrapper.removeEventListener('mouseenter', handleMouseEnter);
        wrapper.removeEventListener('mouseleave', handleMouseLeave);
        wrapper.removeEventListener('click', handleInteraction, true);
        wrapper.removeEventListener('mousedown', handleInteraction, true);
        wrapper.removeEventListener('touchstart', handleInteraction, true);
      }
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isClickTrackingActive, isClicked, slotId, onAdClicked]);

  const handleContainerMouseDown = () => {
    if (isClickTrackingActive && !isClicked && onAdClicked && checkIsAdLoaded()) {
      onAdClicked(slotId);
    }
  };

  const handleSimulatedAdClick = (e: React.MouseEvent) => {
    if (isClickTrackingActive && !isClicked && onAdClicked) {
      onAdClicked(slotId);
      window.open('https://adslab.me', '_blank');
    }
  };

  const hasAdCode = Boolean(code && code.trim().length > 0);

  if (!hasAdCode && !showPlaceholder && !isClickTrackingActive) {
    return null;
  }

  // Border styling depending on click status
  let borderStyle = "border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30";
  if (isClickTrackingActive && isClicked) {
    borderStyle = "border border-emerald-500/50 bg-emerald-950/20";
  }

  return (
    <div 
      ref={wrapperRef}
      id={`ad-slot-wrapper-${slotId}`}
      data-slot-id={slotId}
      className={`ad-container-slot my-4 mx-auto flex flex-col items-center relative group ${sizeConfig.containerClass} ${className}`}
    >
      <div className={`rounded-2xl p-3 sm:p-4 shadow-xs w-full flex flex-col items-center backdrop-blur-xs transition-all ${borderStyle}`}>
        
        {/* Ad Header Banner / Status Badge */}
        <div className="w-full flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5">
            {isClicked ? (
              <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ✓ AD CLICK VERIFIED
              </span>
            ) : isPendingVerification ? (
              <span className="text-amber-500 dark:text-amber-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                ⏳ VERIFYING AD VISIT ({verificationCountdown}s)...
              </span>
            ) : (
              <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                SPONSORED ADVERTISEMENT
              </span>
            )}
          </span>

          <span className={`text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
            isClicked 
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' 
              : isPendingVerification 
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30' 
              : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
          }`}>
            {displaySizeLabel}
          </span>
        </div>

        {/* Ad Code Container or Clean Space Holder */}
        {hasAdCode ? (
          <div className="w-full flex flex-col items-center">
            <div 
              ref={containerRef} 
              onMouseDown={handleContainerMouseDown}
              className={`flex justify-center items-center w-full ${sizeConfig.minHeight} overflow-hidden cursor-pointer`} 
            />
          </div>
        ) : (
          <div 
            onClick={isClickTrackingActive ? handleSimulatedAdClick : undefined}
            className={`w-full ${sizeConfig.minHeight} flex flex-col items-center justify-center rounded-xl p-4 text-center border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-neutral-900/20 transition-all ${
              isClickTrackingActive
                ? 'cursor-pointer hover:border-rose-500/50'
                : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isClickTrackingActive ? 'bg-rose-500 animate-pulse' : 'bg-neutral-400 dark:bg-neutral-600'}`}></span>
              <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${isClickTrackingActive ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {isClickTrackingActive 
                  ? (isClicked ? '✓ Ad Click Registered' : 'Click Sponsored Banner Here')
                  : 'Advertisement Space'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-sm font-sans">
              {isClickTrackingActive
                ? (isClicked ? 'Ad visit recorded successfully.' : 'Click banner to fulfill required ad visit.')
                : displaySizeLabel}
            </p>
            {isClickTrackingActive && (
              <div className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                {isClicked ? 'Verified ✓' : 'Click Banner →'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
