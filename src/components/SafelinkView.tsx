import React, { useState, useEffect, useRef } from 'react';
import { AdSlot } from './AdSlot';
import { BlogConfig, AdSize } from '../types';
import { 
  ShieldCheck, Lock, CheckCircle2, Clock, 
  ExternalLink, Sparkles, RefreshCw, Eye, 
  Zap, Award, ChevronDown, Check, Layers,
  Shield, Key, Server, Cpu, Activity, Globe, ArrowDown,
  MousePointerClick
} from 'lucide-react';

interface SafelinkViewProps {
  config: BlogConfig;
  customPosts?: any[];
  dlSurfPosts?: any[];
  onSelectPost?: (slug: string) => void;
  onNavigateHome: () => void;
}

interface PtcTask {
  id: string;
  title: string;
  reward?: string;
  duration?: number;
  link?: string;
  description?: string;
}

export const SafelinkView: React.FC<SafelinkViewProps> = ({
  config,
  onNavigateHome,
}) => {
  // 1. URL Parameter Extraction
  const [code, setCode] = useState<string>('demo');
  const [token, setToken] = useState<string>('');
  const [subId, setSubId] = useState<string>('');
  const [fullParams, setFullParams] = useState<URLSearchParams>(new URLSearchParams());

  // Input control for manual testing
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [customTokenInput, setCustomTokenInput] = useState<string>('');

  // 2. Safelink Config
  const safelinkCfg = config.safelinkConfig || {};
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1 countdown timer
  const initialStep1Timer = safelinkCfg.step1Timer !== undefined ? safelinkCfg.step1Timer : 15;
  const [step1Timer, setStep1Timer] = useState<number>(initialStep1Timer);
  const [step1TimerDone, setStep1TimerDone] = useState<boolean>(initialStep1Timer <= 0);
  
  // Step 2 countdown timer
  const initialStep2Timer = safelinkCfg.step2Timer !== undefined ? safelinkCfg.step2Timer : 3;
  const [step2Timer, setStep2Timer] = useState<number>(initialStep2Timer);
  const [step2TimerDone, setStep2TimerDone] = useState<boolean>(initialStep2Timer <= 0);

  // 3. PTC Tasks State (Inactive gate as requested, API ready)
  const [ptcTasks, setPtcTasks] = useState<PtcTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  
  // Active Task Modal for viewing
  const [activeTask, setActiveTask] = useState<PtcTask | null>(null);
  const [activeTaskCountdown, setActiveTaskCountdown] = useState<number>(5);
  const [isTaskWatching, setIsTaskWatching] = useState<boolean>(false);

  // 4. Redirect state
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // 4b. AdsLab CAPTCHA Monetization & Verification State (Disabled)
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(true);
  const [isInitiatingCaptcha, setIsInitiatingCaptcha] = useState<boolean>(false);
  const [isCheckingCaptchaStatus, setIsCheckingCaptchaStatus] = useState<boolean>(false);
  const [captchaStatusText, setCaptchaStatusText] = useState<string>('');
  const [captchaSession, setCaptchaSession] = useState<{ token?: string; captcha_url?: string } | null>(null);

  // 4c. Click Ads to Continue & Multiple Click Ads Gate State
  const isClickGateEnabled = safelinkCfg.enableClickAdGate ?? true;
  const requiredClickAdsCount = safelinkCfg.requiredClickAdsCount ?? 1;
  const requireTabFocusReturnTimer = safelinkCfg.requireTabFocusReturnTimer ?? true;
  const tabFocusReturnSeconds = safelinkCfg.tabFocusReturnSeconds ?? 5;
  const clickTrackedSlots = safelinkCfg.clickTrackedSlots || ['headerBanner', 'footerBanner', 'sidebarBanner', 'aboveTimerBanner', 'belowTimerBanner'];

  const [clickedSlotIds, setClickedSlotIds] = useState<string[]>([]);
  const [clickedAds, setClickedAds] = useState<Record<string, boolean>>({});
  const [hoveredAdId, setHoveredAdId] = useState<string | null>(null);
  const [isVerifyingAdClick, setIsVerifyingAdClick] = useState<boolean>(false);
  const [adVerificationTimer, setAdVerificationTimer] = useState<number>(0);

  const totalClickedCount = Math.max(
    clickedSlotIds.length,
    Object.values(clickedAds).filter(Boolean).length
  );
  const isClickAdsRequirementMet = totalClickedCount >= requiredClickAdsCount;

  // Randomized Banner Code & Size State for Click Ad Gate (Initializes ONCE to prevent auto-reloading)
  const [randomAdCode, setRandomAdCode] = useState<string>('');
  const [randomAdSize, setRandomAdSize] = useState<AdSize>('responsive');
  const hasPickedRandomAdRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasPickedRandomAdRef.current) return;

    const AD_SIZES: AdSize[] = ['300x250', '336x280', '728x90', '320x100', '468x60', '300x600', 'responsive'];
    const pickedSize = AD_SIZES[Math.floor(Math.random() * AD_SIZES.length)];

    const configuredCodes = [
      safelinkCfg.middleBanner,
      safelinkCfg.aboveTimerBanner,
      safelinkCfg.belowTimerBanner,
      safelinkCfg.headerBanner,
      safelinkCfg.footerBanner,
      safelinkCfg.sidebarBanner,
      config.inPostAdCode,
      config.headerAdCode,
      config.sidebarAdCode,
      config.footerAdCode,
    ].filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim().length > 0));

    if (configuredCodes.length > 0) {
      const pickedCode = configuredCodes[Math.floor(Math.random() * configuredCodes.length)];
      setRandomAdCode(pickedCode);
      setRandomAdSize(pickedSize);
      hasPickedRandomAdRef.current = true;
    } else {
      setRandomAdCode('');
      setRandomAdSize(pickedSize);
      hasPickedRandomAdRef.current = true;
    }
  }, [safelinkCfg, config]);

  // Listen for when window loses focus (user clicked inside an iframe / banner ad)
  useEffect(() => {
    const handleWindowBlur = () => {
      if (hoveredAdId && !clickedAds[hoveredAdId]) {
        // Verify if hovered ad slot wrapper actually rendered loaded ad content
        const adElement = document.getElementById(`ad-slot-wrapper-${hoveredAdId}`) || document.querySelector(`[data-slot-id="${hoveredAdId}"]`);
        
        let isAdContentLoaded = true;
        if (adElement) {
          const childCount = adElement.childElementCount;
          const height = (adElement as HTMLElement).offsetHeight || 0;
          const hasIframeOrAd = adElement.querySelector('iframe, ins, img, a, svg, div, script') !== null;
          isAdContentLoaded = (childCount > 0 || height > 10 || hasIframeOrAd);
        }

        if (!isAdContentLoaded) {
          console.warn(`Window blurred while hovering ad [${hoveredAdId}], but ad content did not load. Click ignored.`);
          return;
        }

        const activeId = hoveredAdId;
        console.log(`Window blurred while hovering ad [${activeId}]. Registering ad visit verification...`);
        setClickedAds((prev) => ({ ...prev, [activeId]: true }));
        setClickedSlotIds((existing) => (existing.includes(activeId) ? existing : [...existing, activeId]));
        setIsVerifyingAdClick(true);
        setAdVerificationTimer(tabFocusReturnSeconds || 5);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [hoveredAdId, clickedAds, tabFocusReturnSeconds]);

  // Handle countdown when user returns back to the blog tab
  useEffect(() => {
    if (!isVerifyingAdClick || adVerificationTimer <= 0) return;

    const timer = setInterval(() => {
      setAdVerificationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsVerifyingAdClick(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerifyingAdClick, adVerificationTimer]);

  const handleAdSlotClicked = (slotId: string) => {
    if (!isClickGateEnabled) return;
    setClickedAds((prev) => ({ ...prev, [slotId]: true }));
    if (!clickedSlotIds.includes(slotId)) {
      console.log('Ad click verified and counted for slot:', slotId);
      setClickedSlotIds((existing) => [...existing, slotId]);
    }
    setIsVerifyingAdClick(true);
    setAdVerificationTimer(tabFocusReturnSeconds || 5);
  };

  // Popunder script triggered on first user interaction
  const [popunderTriggered, setPopunderTriggered] = useState<boolean>(false);

  // Smooth scroll ref
  const step2Ref = useRef<HTMLDivElement>(null);

  // AdsLab CAPTCHA return verification & S2S token check
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const statusParam = searchParams.get('status');
    const subIdParam = searchParams.get('sub_id') || searchParams.get('subId');
    const isAdslabReturn = searchParams.get('adslab_return') === 'true' || searchParams.get('captcha_verified') === 'true' || (Boolean(statusParam) && statusParam === 'success' && Boolean(subIdParam));
    const tokenParam = searchParams.get('captcha_token') || (isAdslabReturn ? searchParams.get('token') : '') || '';

    // STRICT: Only execute return verification if explicitly returning from AdsLab CAPTCHA!
    if (isAdslabReturn && subIdParam) {
      setCaptchaStatusText('Verifying AdsLab Captcha token via S2S...');

      const verifyPayload = {
        sub_id: subIdParam,
        status: statusParam || "completed",
        token: tokenParam
      };

      const doS2SVerify = async () => {
        let verified = false;

        // Try primary TG Links API
        try {
          const primaryRes = await fetch('https://tglinks.eu.cc/api/captcha/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload)
          });
          if (primaryRes.ok) {
            verified = true;
          }
        } catch (err) {
          // Primary S2S fetch error
        }

        // Try local backend if primary not verified
        if (!verified) {
          try {
            const localRes = await fetch('/api/captcha/verify-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verifyPayload)
            });
            if (localRes.ok) {
              verified = true;
            }
          } catch (err) {
            // Local fetch error
          }
        }

        if (verified) {
          setIsCaptchaVerified(true);
          setCaptchaStatusText('🎉 Captcha Verified Successfully!');
        } else {
          setCaptchaStatusText('Captcha verification failed. Please try again.');
        }
      };

      doS2SVerify();
    }

    if (!subIdParam || !isAdslabReturn) return;

    // Periodically poll /api/captcha/status?sub_id=... to catch S2S webhook verification
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/captcha/status?sub_id=${encodeURIComponent(subIdParam)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.verified) {
            setIsCaptchaVerified(true);
            setCaptchaStatusText('🎉 Captcha Verified Successfully!');
            clearInterval(interval);
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [subId, code]);

  const handleSolveCaptcha = async () => {
    const targetSubId = subId || code || 'user_' + Math.random().toString(36).substring(2, 8);
    setIsInitiatingCaptcha(true);
    setCaptchaStatusText('Redirecting to AdsLab Captcha...');

    try {
      const returnUrl = `${window.location.origin}/go/${encodeURIComponent(code || targetSubId)}?sub_id=${encodeURIComponent(targetSubId)}&status=success`;

      const res = await fetch('/api/captcha/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sub_id: targetSubId,
          return_url: returnUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCaptchaSession(data);
        const initToken = data.token || data.initToken || '';
        
        // Option A: Hidden HTML form that submits via POST to https://adslab.me/captcha
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://adslab.me/captcha';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = initToken;
        form.appendChild(tokenInput);

        const returnUrlInput = document.createElement('input');
        returnUrlInput.type = 'hidden';
        returnUrlInput.name = 'return_url';
        returnUrlInput.value = returnUrl;
        form.appendChild(returnUrlInput);

        document.body.appendChild(form);
        form.submit();
      } else {
        window.location.href = 'https://adslab.me/captcha';
      }
    } catch (err) {
      window.location.href = 'https://adslab.me/captcha';
    } finally {
      setIsInitiatingCaptcha(false);
    }
  };

  const handleCheckCaptchaStatus = async () => {
    const targetSubId = subId || code;
    setIsCheckingCaptchaStatus(true);
    setCaptchaStatusText('Checking AdsLab verification status...');

    try {
      const res = await fetch(`/api/captcha/status?sub_id=${encodeURIComponent(targetSubId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.verified) {
          setIsCaptchaVerified(true);
          setCaptchaStatusText('Captcha Verified ✓');
        } else {
          // Check URL search parameters or session
          const searchParams = new URLSearchParams(window.location.search);
          if (searchParams.get('captcha_verified') === 'true' || searchParams.get('token')) {
            setIsCaptchaVerified(true);
            setCaptchaStatusText('Captcha Verified ✓');
          } else {
            setCaptchaStatusText('Captcha not completed on AdsLab yet. Please solve it on the opened page.');
          }
        }
      } else {
        setCaptchaStatusText('Unable to verify with AdsLab. Please try again.');
      }
    } catch (e) {
      setCaptchaStatusText('Error checking status. Please try again.');
    } finally {
      setIsCheckingCaptchaStatus(false);
    }
  };

  // Extract params on mount / route change
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setFullParams(searchParams);

    // Extract code from path (e.g. /go/:code or /safelink/:code) or search params
    let extractedCode = searchParams.get('code') || searchParams.get('c') || searchParams.get('go') || '';
    const path = window.location.pathname;
    if (!extractedCode) {
      if (path.startsWith('/go/')) {
        extractedCode = path.replace('/go/', '').split('/')[0];
      } else if (path.startsWith('/safelink/')) {
        extractedCode = path.replace('/safelink/', '').split('/')[0];
      }
    }
    
    const finalCode = extractedCode.trim() || 'demo';
    setCode(finalCode);

    // Extract token
    const extractedToken = searchParams.get('token') || searchParams.get('t') || 'tg_token_demo';
    setToken(extractedToken);

    // Extract sub_id
    const extractedSubId = searchParams.get('sub_id') || searchParams.get('subid') || finalCode;
    setSubId(extractedSubId);

    setCustomCodeInput(finalCode);
    setCustomTokenInput(extractedToken);
  }, []);

  // Handle first user interaction for Popunder / Click Ad
  useEffect(() => {
    if (!safelinkCfg.popunderCode || popunderTriggered) return;

    const handleFirstClick = () => {
      setPopunderTriggered(true);
      if (safelinkCfg.popunderCode && safelinkCfg.popunderCode.includes('http')) {
        try {
          const match = safelinkCfg.popunderCode.match(/https?:\/\/[^\s"']+/);
          if (match && match[0]) {
            window.open(match[0], safelinkCfg.clickAdOpenNewTab ? '_blank' : '_self');
          }
        } catch {
          // ignore error
        }
      }
    };

    window.addEventListener('click', handleFirstClick, { once: true });
    return () => window.removeEventListener('click', handleFirstClick);
  }, [safelinkCfg.popunderCode, safelinkCfg.clickAdOpenNewTab, popunderTriggered]);

  // Step 1: Timer interval
  useEffect(() => {
    setStep1Timer(initialStep1Timer);
    setStep1TimerDone(initialStep1Timer <= 0);

    if (initialStep1Timer <= 0) return;

    const timer = setInterval(() => {
      setStep1Timer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep1TimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [initialStep1Timer]);

  // Step 2: Timer interval (triggers when step 2 opens)
  useEffect(() => {
    if (step !== 2) return;
    
    setStep2Timer(initialStep2Timer);
    setStep2TimerDone(initialStep2Timer <= 0);

    if (initialStep2Timer <= 0) return;

    const timer = setInterval(() => {
      setStep2Timer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep2TimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, initialStep2Timer]);

  // Fetch optional PTC tasks (inactive requirement as per docs instruction)
  useEffect(() => {
    if (!code || !safelinkCfg.enablePtcTasks) return;

    let isMounted = true;
    const fetchTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const querySubId = subId || code;
        const res = await fetch(`/api/tglinks/tasks?sub_id=${encodeURIComponent(querySubId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.tasks)) {
            setPtcTasks(data.tasks);
          }
        }
      } catch (err) {
        console.warn('PTC tasks notice:', err);
      } finally {
        if (isMounted) setIsLoadingTasks(false);
      }
    };

    fetchTasks();
    return () => { isMounted = false; };
  }, [code, subId, safelinkCfg.enablePtcTasks]);

  // Task timer logic
  useEffect(() => {
    if (!isTaskWatching || activeTaskCountdown <= 0) return;

    const interval = setInterval(() => {
      setActiveTaskCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTaskWatching(false);
          if (activeTask) {
            setCompletedTaskIds((completed) => [...completed, activeTask.id]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTaskWatching, activeTaskCountdown, activeTask]);

  // Check Step 1 readiness
  const isStep1Ready = step1TimerDone;

  const activeClickAdCode = randomAdCode || safelinkCfg.middleBanner || safelinkCfg.aboveTimerBanner || safelinkCfg.belowTimerBanner || safelinkCfg.headerBanner || safelinkCfg.footerBanner || safelinkCfg.sidebarBanner || config.inPostAdCode || config.headerAdCode || config.sidebarAdCode || config.footerAdCode;
  const hasAnyAdCodeConfigured = Boolean(activeClickAdCode && activeClickAdCode.trim().length > 0);

  const isClickGateSatisfied = !isClickGateEnabled || !hasAnyAdCodeConfigured || isClickAdsRequirementMet;
  const isCaptchaSatisfied = safelinkCfg.enableCaptcha === false || isCaptchaVerified;
  const canGetDestinationLink = step1TimerDone && isClickGateSatisfied && !isVerifyingAdClick && isCaptchaSatisfied && !isRedirecting;

  // Handler to proceed to Step 2
  const handleProceedToStep2 = () => {
    if (!isStep1Ready) return;
    
    // Attempt AdsLab Interstitial Trigger
    if (typeof window.showint_adslab === 'function') {
      window.showint_adslab()
        .then(() => console.log('AdsLab Interstitial closed'))
        .catch(e => console.error('No ad available:', e));
    } else if (typeof window.adslabShowInterstitial === 'function') {
      try {
        window.adslabShowInterstitial();
      } catch (err) {
        console.warn('AdsLab Interstitial trigger notice:', err);
      }
    }

    setStep(2);
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Handler to complete handoff back to TG Links
  const handleGetDestinationLink = async () => {
    if (!canGetDestinationLink || isRedirecting) return;

    setIsRedirecting(true);

    const doRedirect = () => {
      // TG Links handoff format: https://tglinks.eu.cc/p/:code?token={token}&status=completed
      const targetUrl = new URL(`https://tglinks.eu.cc/p/${encodeURIComponent(code)}`);
      targetUrl.searchParams.set('token', token);
      targetUrl.searchParams.set('status', 'completed');
      if (subId) {
        targetUrl.searchParams.set('sub_id', subId);
      }
      
      // Preserve extra original search params
      fullParams.forEach((val, key) => {
        if (!['code', 'c', 'token', 't', 'status'].includes(key)) {
          targetUrl.searchParams.set(key, val);
        }
      });

      window.location.href = targetUrl.toString();
    };

    // 1. Trigger AdsLab Interstitial ad before performing redirect
    try {
      if (typeof window.showint_adslab === 'function') {
        console.log('Triggering AdsLab Interstitial via showint_adslab()...');
        await window.showint_adslab();
      } else if (typeof window.adslabShowInterstitial === 'function') {
        console.log('Triggering AdsLab Interstitial via adslabShowInterstitial()...');
        window.adslabShowInterstitial();
      }
    } catch (err) {
      console.warn('AdsLab Interstitial notice or closed:', err);
    }

    // 2. Perform redirect after ad completes / closes
    setTimeout(doRedirect, 400);
  };

  // Open task modal for viewing
  const handleStartTask = (task: PtcTask) => {
    setActiveTask(task);
    setActiveTaskCountdown(task.duration || 5);
    setIsTaskWatching(true);
    if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Standalone Safelink Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-600/20 border border-rose-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-100">
                  TG Links
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Safelink Gateway
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Encrypted Shortlink Verification System
              </p>
            </div>
          </div>

          {/* Right Header Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px]">System Active • SSL Secured</span>
            </div>

            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Main Portal
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Top Leaderboard Banner Ad Slot (728x90 / Custom) */}
        {(safelinkCfg.headerBanner || config.headerAdCode) && (
          <div className="mb-6 flex justify-center">
            <AdSlot
              code={safelinkCfg.headerBanner || config.headerAdCode}
              slotId="safelink-header-ad"
              label="Top Leaderboard Banner"
              adSize={safelinkCfg.headerBannerSize || '728x90'}
              showPlaceholder={false}
              className="w-full"
              isClickTrackingActive={false}
            />
          </div>
        )}

        {/* Main Content Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Verification Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. COOL CIRCULAR COUNTDOWN TIMER */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="text-slate-800/80"
                    strokeWidth="7"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className={`transition-all duration-1000 ease-linear ${
                      step1TimerDone ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                    strokeWidth="7"
                    strokeDasharray={263.89}
                    strokeDashoffset={263.89 * (1 - Math.max(0, step1Timer) / Math.max(1, initialStep1Timer))}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                    step1TimerDone ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
                  }`}>
                    {step1TimerDone ? '✓' : `${step1Timer}s`}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
                    {step1TimerDone ? 'Complete' : 'Wait'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white">
                  {step1TimerDone ? 'Verification Timer Complete' : 'Verification Timer Active'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {step1TimerDone 
                    ? 'Timer complete! Click 1 banner ad below to continue.' 
                    : `Please wait ${step1Timer} seconds to proceed with verification.`}
                </p>
              </div>
            </div>

            {/* 2. CLICK AD TO CONTINUE GATE CARD */}
            {isClickGateEnabled && hasAnyAdCodeConfigured && (
              <div className={`p-6 rounded-2xl border transition-all ${
                isClickGateSatisfied
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : isVerifyingAdClick
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-xl'
                  : 'bg-slate-900 border-rose-500/40 shadow-xl'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isClickGateSatisfied 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : isVerifyingAdClick
                        ? 'bg-amber-500/20 text-amber-400 animate-spin'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <MousePointerClick className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        Click 1 Banner Ad Below to Continue
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {isClickGateSatisfied
                          ? '✓ Banner ad click verified! You can now proceed to destination link.'
                          : isVerifyingAdClick
                          ? `⏳ Ad clicked! Verifying visit: ${adVerificationTimer}s`
                          : `👇 Click on the banner ad inside this card below to verify and unlock destination link.`}
                      </p>
                    </div>
                  </div>

                  <span className={`px-4 py-2 rounded-xl text-xs font-bold font-mono shrink-0 ${
                    isClickGateSatisfied 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : isVerifyingAdClick 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isClickGateSatisfied 
                      ? '✓ Ad Visit Verified' 
                      : isVerifyingAdClick 
                      ? `Verifying ${adVerificationTimer}s` 
                      : `${requiredClickAdsCount - totalClickedCount} Ad Click Required`}
                  </span>
                </div>

                {/* DEDICATED CLICKABLE AD BANNER SLOT WITH HOVER & FOCUS BLUR LISTENERS */}
                <div 
                  className={`relative p-3 rounded-xl border transition-all ${
                    clickedAds['safelink-required-click-ad'] || isClickGateSatisfied 
                      ? "border-emerald-500/50 bg-emerald-500/5" 
                      : isVerifyingAdClick
                      ? "border-amber-500/50 bg-amber-500/5 shadow-lg"
                      : "border-amber-500/50 animate-pulse bg-amber-500/5"
                  }`}
                  onMouseEnter={() => setHoveredAdId('safelink-required-click-ad')}
                  onMouseLeave={() => setHoveredAdId(null)}
                  onTouchStart={() => setHoveredAdId('safelink-required-click-ad')}
                >
                  {/* Status Badge above banner */}
                  <div className="text-xs font-bold font-mono mb-2 flex items-center justify-between">
                    <span className={clickedAds['safelink-required-click-ad'] || isClickGateSatisfied ? "text-emerald-400" : isVerifyingAdClick ? "text-amber-400 animate-pulse" : "text-amber-400"}>
                      {clickedAds['safelink-required-click-ad'] || isClickGateSatisfied 
                        ? "✅ Ad Visit Verified!" 
                        : isVerifyingAdClick 
                        ? `⏳ Verifying Ad Visit (${adVerificationTimer}s)...` 
                        : "👇 Click on this banner ad to unlock"}
                    </span>
                  </div>

                  <AdSlot
                    code={randomAdCode || safelinkCfg.middleBanner || safelinkCfg.aboveTimerBanner || config.inPostAdCode}
                    slotId="safelink-required-click-ad"
                    label="Click Banner Ad Below to Continue"
                    adSize={randomAdSize}
                    showPlaceholder={true}
                    className="w-full"
                    isClickTrackingActive={!isClickGateSatisfied}
                    isClicked={isClickGateSatisfied}
                    isPendingVerification={isVerifyingAdClick}
                    verificationCountdown={adVerificationTimer}
                    onAdClicked={handleAdSlotClicked}
                  />
                </div>
              </div>
            )}

            {/* Optional PTC Task Feed if enabled */}
            {safelinkCfg.enablePtcTasks && ptcTasks.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Sponsored Tasks
                    </h4>
                  </div>
                  {isLoadingTasks && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-rose-400" />
                      Loading tasks...
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {ptcTasks.map((task) => {
                    const isCompleted = completedTaskIds.includes(task.id);
                    return (
                      <div 
                        key={task.id} 
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCompleted ? 'bg-emerald-500 text-white' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {isCompleted ? <Check className="w-4 h-4" /> : <Eye className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {task.title}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartTask(task)}
                          disabled={isCompleted}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {isCompleted ? 'Completed ✓' : 'View Task'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Above Timer Banner Ad Slot */}
            {(safelinkCfg.aboveTimerBanner || safelinkCfg.middleBanner || config.inPostAdCode) && (
              <div className="my-4">
                <AdSlot
                  code={safelinkCfg.aboveTimerBanner || safelinkCfg.middleBanner || config.inPostAdCode}
                  slotId="safelink-above-timer-ad"
                  label="Above Timer Banner Ad"
                  adSize={safelinkCfg.aboveTimerBannerSize || 'responsive'}
                  showPlaceholder={false}
                  className="w-full"
                  isClickTrackingActive={false}
                />
              </div>
            )}

            {/* Below Timer Banner Ad Slot */}
            {safelinkCfg.belowTimerBanner && (
              <div className="my-3">
                <AdSlot
                  code={safelinkCfg.belowTimerBanner}
                  slotId="safelink-below-timer-ad"
                  label="Below Timer Banner Ad"
                  adSize={safelinkCfg.belowTimerBannerSize || 'responsive'}
                  showPlaceholder={false}
                  className="w-full"
                  isClickTrackingActive={false}
                />
              </div>
            )}

          </div>

          {/* Sidebar Column (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Sidebar Banner Ad Slot */}
            {(safelinkCfg.sidebarBanner || config.sidebarAdCode) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl sticky top-20 flex justify-center">
                <AdSlot
                  code={safelinkCfg.sidebarBanner || config.sidebarAdCode}
                  slotId="safelink-sidebar-ad"
                  label="Sidebar Banner"
                  adSize={safelinkCfg.sidebarBannerSize || '300x250'}
                  showPlaceholder={false}
                  className="w-full"
                  isClickTrackingActive={false}
                />
              </div>
            )}

          </aside>
        </div>

        {/* Bottom Leaderboard Banner Ad Slot (Full Width - Before Continue Button) */}
        {(safelinkCfg.footerBanner || config.footerAdCode) && (
          <div className="my-8 flex justify-center">
            <AdSlot
              code={safelinkCfg.footerBanner || config.footerAdCode}
              slotId="safelink-footer-ad"
              label="Bottom Leaderboard Banner"
              adSize={safelinkCfg.footerBannerSize || '728x90'}
              showPlaceholder={false}
              className="w-full"
              isClickTrackingActive={false}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* FINAL SINGLE ACTION BUTTON - PLACED AT VERY END OF ALL ADS */}
        {/* ========================================================= */}
        <div id="final-action-section" className="bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 text-center my-8 animate-fadeIn max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              {canGetDestinationLink ? 'Link Verification Complete' : 'Gate Requirements Active'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              {canGetDestinationLink 
                ? 'Your Destination Link is Unlocked!' 
                : 'Verification In Progress'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {canGetDestinationLink 
                ? 'All security checks & ad click verifications complete. Click the button below to reach your target URL.' 
                : 'Please complete all required timer & ad click verifications above to unlock the destination link.'}
            </p>
          </div>

          <button
            onClick={handleGetDestinationLink}
            disabled={!canGetDestinationLink}
            className={`w-full max-w-md mx-auto py-4 px-8 rounded-xl text-base sm:text-lg font-extrabold flex items-center justify-center gap-3 transition-all ${
              canGetDestinationLink
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-2xl shadow-rose-600/40 active:scale-[0.99] cursor-pointer ring-4 ring-rose-500/30 animate-bounce'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isRedirecting ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin text-white" />
                <span>Redirecting to TG Links...</span>
              </>
            ) : !step1TimerDone ? (
              <>
                <Clock className="w-5 h-5 animate-spin text-rose-400" />
                <span>Please wait {step1Timer}s countdown...</span>
              </>
            ) : isVerifyingAdClick ? (
              <>
                <Clock className="w-5 h-5 animate-spin text-amber-400" />
                <span>⏳ Verifying Ad Visit ({adVerificationTimer}s)...</span>
              </>
            ) : !isCaptchaVerified ? (
              <>
                <Key className="w-5 h-5 text-amber-400" />
                <span>Solve the Captcha Above to Continue...</span>
              </>
            ) : !isClickGateSatisfied ? (
              <>
                <MousePointerClick className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>👇 Click {Math.max(1, requiredClickAdsCount - totalClickedCount)} Ad Banner(s) Above to Continue</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                <span>{safelinkCfg.step1ButtonLabel || safelinkCfg.step2ButtonLabel || 'Continue to TG Links'}</span>
                <ExternalLink className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* PTC Task Modal for viewing */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                Sponsored Task
              </span>
              <span className="text-xs font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full font-bold">
                {activeTaskCountdown > 0 ? `Timer: ${activeTaskCountdown}s` : '✓ Completed!'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100">
              {activeTask.title}
            </h3>

            <p className="text-xs text-slate-400">
              Please stay on this page until the timer finishes to validate your session.
            </p>

            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-rose-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(( (activeTask.duration || 5) - activeTaskCountdown ) / (activeTask.duration || 5)) * 100}%` }}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={activeTaskCountdown > 0}
                onClick={() => {
                  setActiveTask(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTaskCountdown === 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {activeTaskCountdown > 0 ? 'Watching Task...' : 'Confirm & Close ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popunder Script Injection Slot */}
      {safelinkCfg.popunderCode && (
        <AdSlot
          code={safelinkCfg.popunderCode}
          slotId="safelink-popunder-ad"
          label="Popunder Script"
          showPlaceholder={false}
          className="hidden"
        />
      )}

      {/* Standalone Safelink Footer */}
      <footer className="mt-12 bg-slate-900 border-t border-slate-800 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span className="font-bold text-slate-200">TG Links Safelink Gateway</span>
          </div>
          <p>© {new Date().getFullYear()} TG Links Safelink System. Encrypted Shortlink Protection Protocol.</p>
        </div>
      </footer>
    </div>
  );
};
