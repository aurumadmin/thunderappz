import React, { useState, useEffect, useCallback } from 'react';
import { BlogConfig } from '../types';
import { ShieldAlert, RefreshCw, AlertTriangle, Globe, Ban, CheckCircle2, Terminal, Info, ShieldX } from 'lucide-react';

interface SecurityShieldProps {
  config: BlogConfig;
  onBypass?: () => void;
}

interface VpnDetails {
  ip: string;
  country: string;
  countryCode?: string;
  isp: string;
  org?: string;
  timezone?: string;
  reason: string;
  isVpn: boolean;
  isProxy: boolean;
  isHosting: boolean;
}

export const SecurityShield: React.FC<SecurityShieldProps> = ({ config, onBypass }) => {
  const safelinkCfg = config.safelinkConfig || {};
  
  const enableAdBlock = safelinkCfg.enableAdBlockDetector !== false; // Enabled by default
  const enableVpn = safelinkCfg.enableVpnDetector !== false;         // Enabled by default
  const strictAdBlock = safelinkCfg.strictAdBlock !== false;        // Strict blocking by default
  const strictVpn = safelinkCfg.strictVpn !== false;                // Strict blocking by default

  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [adBlockDetected, setAdBlockDetected] = useState<boolean>(false);
  const [adBlockReasons, setAdBlockReasons] = useState<string[]>([]);

  const [vpnDetected, setVpnDetected] = useState<boolean>(false);
  const [vpnInfo, setVpnInfo] = useState<VpnDetails | null>(null);

  const [bypassActive, setBypassActive] = useState<boolean>(false);

  // 1. Ad Blocker Detection Engine (DOM Trap & Extension CSS Injections)
  const checkAdBlocker = useCallback(async (): Promise<{ detected: boolean; reasons: string[] }> => {
    if (!enableAdBlock) return { detected: false, reasons: [] };

    const detectedReasons: string[] = [];

    // Method A: Injected CSS DOM Trap Test
    const createTrapElement = (): Promise<boolean> => {
      return new Promise((resolve) => {
        const trap = document.createElement('div');
        trap.className = 'adsbygoogle ad-slot banner-ad adsbox textads google-auto-placed ad-container sponsor-ad';
        trap.id = 'ad-banner-slot-trap';
        trap.style.cssText = 'position: absolute !important; top: -9999px !important; left: -9999px !important; width: 10px !important; height: 10px !important; pointer-events: none !important;';
        trap.innerHTML = '&nbsp;';
        document.body.appendChild(trap);

        // Give adblocker extension time to apply element-hiding CSS rules
        setTimeout(() => {
          const style = window.getComputedStyle(trap);
          const isBlocked = 
            trap.offsetHeight === 0 || 
            trap.offsetWidth === 0 || 
            trap.clientHeight === 0 || 
            style.display === 'none' || 
            style.visibility === 'hidden' ||
            style.opacity === '0' ||
            trap.offsetParent === null;

          if (trap.parentNode) {
            trap.parentNode.removeChild(trap);
          }
          resolve(isBlocked);
        }, 200);
      });
    };

    const domBlocked = await createTrapElement();
    if (domBlocked) {
      detectedReasons.push('Ad container DOM element collapsed or hidden by active Ad Blocker extension');
    }

    // Method B: Brave Shield API Check
    const isBrave = (navigator as any).brave !== undefined && typeof (navigator as any).brave.isBrave === 'function';
    if (isBrave) {
      try {
        const braveActive = await (navigator as any).brave.isBrave();
        if (braveActive && domBlocked) {
          detectedReasons.push('Brave Shield Ad Blocking Engine active');
        }
      } catch (e) {
        // ignore
      }
    }

    return {
      detected: detectedReasons.length > 0,
      reasons: detectedReasons
    };
  }, [enableAdBlock]);

  // 2. VPN / Proxy Detection Engine
  const checkVpnProxy = useCallback(async (): Promise<{ detected: boolean; details: VpnDetails | null }> => {
    if (!enableVpn) return { detected: false, details: null };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/check-security', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const isVpn = !!data.isVpn;
        const isProxy = !!data.isProxy;
        const isHosting = !!data.isHosting;

        // Only trigger VPN restriction if explicitly flagged as an active VPN or anonymizer proxy
        const detected = isVpn;

        const details: VpnDetails = {
          ip: data.ip || 'Unknown',
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          isp: data.isp || 'Unknown ISP',
          org: data.org || '',
          timezone: data.timezone || 'UTC',
          reason: data.reason || 'VPN / Datacenter proxy signature detected',
          isVpn,
          isProxy,
          isHosting
        };

        return { detected, details };
      }
    } catch (err) {
      console.warn('VPN check error:', err);
    }

    return { detected: false, details: null };
  }, [enableVpn]);

  // Run full security evaluation on mount or manual recheck
  const runSecurityScan = useCallback(async () => {
    setIsChecking(true);

    const [adBlockResult, vpnResult] = await Promise.all([
      checkAdBlocker(),
      checkVpnProxy()
    ]);

    setAdBlockDetected(adBlockResult.detected);
    setAdBlockReasons(adBlockResult.reasons);

    setVpnDetected(vpnResult.detected);
    setVpnInfo(vpnResult.details);

    setIsChecking(false);
  }, [checkAdBlocker, checkVpnProxy]);

  useEffect(() => {
    runSecurityScan();
  }, [runSecurityScan]);

  // If nothing is detected or bypass is active, do not render modal
  if ((!adBlockDetected && !vpnDetected) || bypassActive) {
    return null;
  }

  // If user disabled detectors in config, hide
  if (!enableAdBlock && !enableVpn) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-fadeIn">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 my-auto">
        
        {/* Header Alert Title */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-600/20 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Security Enforcer
              </span>
              <span className="text-xs font-mono text-slate-400">
                TG Links Gateway
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
              Access Restricted
            </h2>
          </div>
        </div>

        {/* Main Alert Cards Container - Show ONLY ONE at a time */}
        <div className="space-y-4">
          
          {/* AD BLOCKER DETECTED CARD (Takes precedence if active) */}
          {adBlockDetected && enableAdBlock ? (
            <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-rose-400 text-base">
                  <Ban className="w-5 h-5 text-rose-500" />
                  <span>Ad Blocker Detected</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ACTION REQUIRED
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {safelinkCfg.adBlockMessage || 
                  "An active Ad Blocker (uBlock Origin, AdGuard, Brave Shield, or AdBlock Plus) was detected. Please disable your Ad Blocker for this site to continue accessing your shortlink destination."
                }
              </p>

              {/* Reasons list */}
              {adBlockReasons.length > 0 && (
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-400">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-rose-400" />
                    Detection Triggers:
                  </div>
                  {adBlockReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-rose-300/90">
                      <span className="text-rose-500">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick how to disable tips */}
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  How to disable your Ad Blocker:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Click your Ad Blocker icon in the browser toolbar (top right).</li>
                  <li>Select <strong>"Pause on this site"</strong> or toggle the power icon OFF.</li>
                  <li>Click <strong>"Re-check Connection"</strong> below to unblock.</li>
                </ul>
              </div>
            </div>
          ) : vpnDetected && enableVpn ? (
            /* VPN / PROXY / DATACENTER DETECTED CARD (Only shown if Ad Blocker is not active) */
            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-amber-400 text-base">
                  <Globe className="w-5 h-5 text-amber-500" />
                  <span>VPN / Proxy Connection Detected</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PROHIBITED NETWORK
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {safelinkCfg.vpnMessage || 
                  "You are accessing this page using a VPN, proxy server, or datacenter IP connection. To protect link authenticity and prevent automated bot requests, VPN access is strictly restricted."
                }
              </p>

              {/* VPN Technical details card */}
              {vpnInfo && (
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldX className="w-3.5 h-3.5 text-amber-400" />
                    Detected Network Signature:
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Detected IP:</span>
                      <span className="font-mono font-bold text-slate-200">{vpnInfo.ip}</span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Country Location:</span>
                      <span className="font-bold text-slate-200">{vpnInfo.country}</span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800 col-span-2">
                      <span className="text-slate-500 block text-[10px]">ISP / Provider:</span>
                      <span className="font-mono font-semibold text-amber-300">{vpnInfo.isp} {vpnInfo.org ? `(${vpnInfo.org})` : ''}</span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800 col-span-2">
                      <span className="text-slate-500 block text-[10px]">Flag Trigger:</span>
                      <span className="font-mono text-rose-400">{vpnInfo.reason}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-400">
                👉 Please turn off your VPN, proxy, or iCloud Private Relay and click <strong>"Re-check Connection"</strong>.
              </div>
            </div>
          ) : null}

        </div>

        {/* Action Controls Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          
          <button
            onClick={runSecurityScan}
            disabled={isChecking}
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-rose-500/30"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Scanning Security State...' : 'Re-check Security Connection'}</span>
          </button>

          {/* Bypass button for test / admin mode */}
          {onBypass && (
            <button
              onClick={() => {
                setBypassActive(true);
                onBypass();
              }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 px-3 font-mono"
            >
              [Admin Override / Dismiss]
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
