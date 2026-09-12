import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck,
  Lock, 
  Save, 
  Eye, 
  Code, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Settings, 
  Sliders, 
  Sparkles,
  FileText,
  Key,
  Layers,
  MousePointer,
  MousePointerClick,
  Cpu,
  ShieldAlert,
  Globe,
  Ban
} from 'lucide-react';
import { BlogConfig, SafelinkAdminConfig } from '../types';
import { SecurityShield } from './SecurityShield';

interface SafelinkAdminPanelProps {
  config: BlogConfig;
  onUpdateConfig: (newConfig: BlogConfig) => void;
  onNavigate: (view: 'home' | 'post' | 'admin' | 'safelinkAdmin' | 'go', slug?: string) => void;
}

export const SafelinkAdminPanel: React.FC<SafelinkAdminPanelProps> = ({
  config,
  onUpdateConfig,
  onNavigate,
}) => {
  const currentSafelinkConfig: SafelinkAdminConfig = {
    adminPassword: config.safelinkConfig?.adminPassword || 'Thunderffyt123@',
    headerBanner: config.safelinkConfig?.headerBanner || '',
    footerBanner: config.safelinkConfig?.footerBanner || '',
    sidebarBanner: config.safelinkConfig?.sidebarBanner || '',
    middleBanner: config.safelinkConfig?.middleBanner || '',
    aboveTimerBanner: config.safelinkConfig?.aboveTimerBanner || '',
    belowTimerBanner: config.safelinkConfig?.belowTimerBanner || '',
    headerBannerSize: config.safelinkConfig?.headerBannerSize || '728x90',
    aboveTimerBannerSize: config.safelinkConfig?.aboveTimerBannerSize || '300x250',
    belowTimerBannerSize: config.safelinkConfig?.belowTimerBannerSize || '468x60',
    sidebarBannerSize: config.safelinkConfig?.sidebarBannerSize || '300x600',
    footerBannerSize: config.safelinkConfig?.footerBannerSize || '320x50',
    popunderCode: config.safelinkConfig?.popunderCode || '',
    clickAdDelay: config.safelinkConfig?.clickAdDelay ?? 0,
    clickAdOpenNewTab: config.safelinkConfig?.clickAdOpenNewTab ?? true,
    adsLabApiKey: config.safelinkConfig?.adsLabApiKey || 'QAjfJLFhc9pfDOlZAg6lAdc7qpdt5ctE0FgquqNr',
    adsLabCaptchaSecretKey: config.safelinkConfig?.adsLabCaptchaSecretKey || 'IUzRsZbtL4JmR197MRVUn5vIcavB8ksX',
    adsLabPtcPlacementId: config.safelinkConfig?.adsLabPtcPlacementId || 'task-WdjEOqaZBE5l',
    step1Timer: config.safelinkConfig?.step1Timer ?? 15,
    step2Timer: config.safelinkConfig?.step2Timer ?? 3,
    step1Message: config.safelinkConfig?.step1Message || 'Please scroll down and wait for timer to unlock Step 2.',
    step2Message: config.safelinkConfig?.step2Message || 'Final security check. Your destination link is ready.',
    step1ButtonLabel: config.safelinkConfig?.step1ButtonLabel || 'Verify & Continue to Step 2',
    step2ButtonLabel: config.safelinkConfig?.step2ButtonLabel || 'Get Destination Link',
    enablePtcTasks: config.safelinkConfig?.enablePtcTasks ?? false,
    enableCaptcha: config.safelinkConfig?.enableCaptcha ?? false,
    autoSafelinkDomains: config.safelinkConfig?.autoSafelinkDomains || 'drive.google.com, mega.nz, mediafire.com, zippyshare.com, dropbox.com',
    enableAdBlockDetector: config.safelinkConfig?.enableAdBlockDetector ?? true,
    strictAdBlock: config.safelinkConfig?.strictAdBlock ?? true,
    adBlockMessage: config.safelinkConfig?.adBlockMessage || 'An active Ad Blocker was detected. Please disable your Ad Blocker for this site to continue accessing your shortlink destination.',
    enableVpnDetector: config.safelinkConfig?.enableVpnDetector ?? true,
    strictVpn: config.safelinkConfig?.strictVpn ?? true,
    vpnMessage: config.safelinkConfig?.vpnMessage || 'You are accessing this page using a VPN, proxy server, or datacenter IP connection. To protect link authenticity and prevent automated bot requests, VPN access is strictly restricted.',
    
    // Click Ads to Continue Gate & Multiple Click Ads Configuration
    enableClickAdGate: config.safelinkConfig?.enableClickAdGate ?? true,
    requiredClickAdsCount: config.safelinkConfig?.requiredClickAdsCount ?? 2,
    requireTabFocusReturnTimer: config.safelinkConfig?.requireTabFocusReturnTimer ?? true,
    tabFocusReturnSeconds: config.safelinkConfig?.tabFocusReturnSeconds ?? 5,
    clickTrackedSlots: config.safelinkConfig?.clickTrackedSlots || ['headerBanner', 'footerBanner', 'sidebarBanner', 'aboveTimerBanner', 'belowTimerBanner'],
  };

  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [formConfig, setFormConfig] = useState<SafelinkAdminConfig>(currentSafelinkConfig);
  const [activeTab, setActiveTab] = useState<'ads' | 'adslab' | 'timers' | 'security' | 'autoScript' | 'tester'>('ads');
  const [testShieldOpen, setTestShieldOpen] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  
  // Test link generator state
  const [testTargetUrl, setTestTargetUrl] = useState<string>('https://example.com/download-file.zip');
  const [generatedTestCode, setGeneratedTestCode] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPassword = currentSafelinkConfig.adminPassword || 'Thunderffyt123@';
    if (passwordInput === targetPassword) {
      setAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid password. Access denied.');
    }
  };

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      safelinkConfig: formConfig,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleGenerateTestLink = () => {
    try {
      const b64 = btoa(testTargetUrl);
      const code = 'st_' + b64.replace(/=/g, '');
      setGeneratedTestCode(code);
    } catch {
      setGeneratedTestCode('st_demo123');
    }
  };

  const domainList = formConfig.autoSafelinkDomains
    ? formConfig.autoSafelinkDomains.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  const autoScriptCode = `<script type="text/javascript">
  // AdLinkFly / TG Links Auto-Safelink Converter Script
  (function() {
    var safelinkDomain = "${window.location.origin}";
    var targetDomains = [${domainList.map((d) => `"${d}"`).join(', ')}];
    
    document.addEventListener("DOMContentLoaded", function() {
      var links = document.getElementsByTagName("a");
      for (var i = 0; i < links.length; i++) {
        var href = links[i].href;
        if (!href) continue;
        var matches = targetDomains.some(function(domain) {
          return href.indexOf(domain) !== -1;
        });
        if (matches && href.indexOf(safelinkDomain) === -1) {
          var encodedUrl = btoa(href).replace(/=/g, '');
          links[i].href = safelinkDomain + "/go/st_" + encodedUrl + "?token=AUTOLINK&sub_id=safelink";
          links[i].target = "${formConfig.clickAdOpenNewTab ? '_blank' : '_self'}";
        }
      }
    });
  })();
</script>`;

  const copyToClipboard = (text: string, type: 'script' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Safelink Admin Panel</h1>
            <p className="text-sm text-slate-400 mt-2">
              Protected AdLinkFly & TG Links Monetization Settings
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              </div>
              {authError && <p className="text-xs text-rose-400 mt-2">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              Unlock Admin Panel
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              &larr; Return to Main Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Safelink Admin Panel</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                AdLinkFly / TG Links Monetization, AdsLab PTC Tasks, & Banner Slots
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('go', 'demo')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview /go/demo
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Safelink configuration and Ad placements saved successfully!</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Step 1 Timer</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{formConfig.step1Timer ?? 5} sec</p>
          <p className="text-[11px] text-slate-500 mt-1">Countdown delay before Step 2</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Step 2 Timer</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{formConfig.step2Timer ?? 3} sec</p>
          <p className="text-[11px] text-slate-500 mt-1">Final Get Link countdown</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">AdsLab PTC Task Gate</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {formConfig.enablePtcTasks ? 'Active' : 'Inactive'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Placement: {formConfig.adsLabPtcPlacementId || 'task-WdjEOqaZBE5l'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Security Shields</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {formConfig.enableAdBlockDetector && formConfig.enableVpnDetector
              ? 'AdBlock + VPN'
              : formConfig.enableAdBlockDetector
              ? 'AdBlock Only'
              : formConfig.enableVpnDetector
              ? 'VPN Only'
              : 'Disabled'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Real-time anti-bypass enforcement</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('ads')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ads'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Banner & Popunder Ads
        </button>

        <button
          onClick={() => setActiveTab('adslab')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'adslab'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AdsLab PTC & Captcha
        </button>

        <button
          onClick={() => setActiveTab('timers')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'timers'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Timers & Step Customization
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Security (AdBlock & VPN)
        </button>

        <button
          onClick={() => setActiveTab('autoScript')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'autoScript'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          Auto-Safelink Script
        </button>

        <button
          onClick={() => setActiveTab('tester')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tester'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          Test Link Generator
        </button>
      </div>

      {/* Tab 1: Banner & Popunder Ad Placements */}
      {activeTab === 'ads' && (
        <div className="space-y-6">

          {/* IAB Standard Ad Dimensions Guide Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-400" />
                Supported Standard Ad Dimensions (IAB Presets)
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                8 Standard Formats Enabled
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Select any of the official IAB standard banner sizes for your ad placements below. The containers will automatically frame and center your ad scripts based on the selected dimension.
            </p>

            {/* Quick Badge Grid of the 8 Sizes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
              {[
                { size: '300x250', label: '300×250', desc: 'Medium Rectangle' },
                { size: '300x600', label: '300×600', desc: 'Half Page' },
                { size: '160x600', label: '160×600', desc: 'Wide Skyscraper' },
                { size: '336x280', label: '336×280', desc: 'Large Rectangle' },
                { size: '320x100', label: '320×100', desc: 'Large Mobile' },
                { size: '320x50', label: '320×50', desc: 'Mobile Banner' },
                { size: '468x60', label: '468×60', desc: 'Full Banner' },
                { size: '728x90', label: '728×90', desc: 'Leaderboard' }
              ].map((item) => (
                <div 
                  key={item.size}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center hover:border-rose-500/50 transition-all"
                >
                  <div className="text-xs font-mono font-bold text-rose-400">{item.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Leaderboard Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-400" />
                  Top Header Banner
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rendered at the top of the Safelink page above article header.
                </p>
              </div>

              <div className="shrink-0">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Target Ad Size Format
                </label>
                <select
                  value={formConfig.headerBannerSize || '728x90'}
                  onChange={(e) => setFormConfig({ ...formConfig, headerBannerSize: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="728x90">728×90 (Leaderboard)</option>
                  <option value="468x60">468×60 (Full Banner)</option>
                  <option value="336x280">336×280 (Large Rectangle)</option>
                  <option value="300x250">300×250 (Medium Rectangle)</option>
                  <option value="320x100">320×100 (Large Mobile Banner)</option>
                  <option value="320x50">320×50 (Mobile Banner)</option>
                  <option value="300x600">300×600 (Half Page)</option>
                  <option value="160x600">160×600 (Wide Skyscraper)</option>
                  <option value="responsive">Responsive / Fluid</option>
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={formConfig.headerBanner || ''}
              onChange={(e) => setFormConfig({ ...formConfig, headerBanner: e.target.value })}
              placeholder="<!-- Paste Header Ad Code here (e.g. 728x90, 468x60, 320x100) -->"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Above Timer Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Above Timer Banner
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Rendered directly above the verification timer box.
                  </p>
                </div>

                <div>
                  <select
                    value={formConfig.aboveTimerBannerSize || '300x250'}
                    onChange={(e) => setFormConfig({ ...formConfig, aboveTimerBannerSize: e.target.value as any })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="300x250">300×250 (Medium Rectangle)</option>
                    <option value="300x600">300×600 (Half Page)</option>
                    <option value="160x600">160×600 (Wide Skyscraper)</option>
                    <option value="336x280">336×280 (Large Rectangle)</option>
                    <option value="320x100">320×100 (Large Mobile Banner)</option>
                    <option value="320x50">320×50 (Mobile Banner)</option>
                    <option value="468x60">468×60 (Full Banner)</option>
                    <option value="728x90">728×90 (Leaderboard)</option>
                    <option value="responsive">Responsive / Fluid</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={formConfig.aboveTimerBanner || ''}
                onChange={(e) => setFormConfig({ ...formConfig, aboveTimerBanner: e.target.value })}
                placeholder="<!-- Paste Above-Timer Ad Code here -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Below Timer Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Below Timer Banner
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Rendered right below the countdown box.
                  </p>
                </div>

                <div>
                  <select
                    value={formConfig.belowTimerBannerSize || '468x60'}
                    onChange={(e) => setFormConfig({ ...formConfig, belowTimerBannerSize: e.target.value as any })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="300x250">300×250 (Medium Rectangle)</option>
                    <option value="300x600">300×600 (Half Page)</option>
                    <option value="160x600">160×600 (Wide Skyscraper)</option>
                    <option value="336x280">336×280 (Large Rectangle)</option>
                    <option value="320x100">320×100 (Large Mobile Banner)</option>
                    <option value="320x50">320×50 (Mobile Banner)</option>
                    <option value="468x60">468×60 (Full Banner)</option>
                    <option value="728x90">728×90 (Leaderboard)</option>
                    <option value="responsive">Responsive / Fluid</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={formConfig.belowTimerBanner || ''}
                onChange={(e) => setFormConfig({ ...formConfig, belowTimerBanner: e.target.value })}
                placeholder="<!-- Paste Below-Timer Ad Code here -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sidebar Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    Sidebar Banner
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Rendered inside the sticky sidebar column.
                  </p>
                </div>

                <div>
                  <select
                    value={formConfig.sidebarBannerSize || '300x600'}
                    onChange={(e) => setFormConfig({ ...formConfig, sidebarBannerSize: e.target.value as any })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="300x600">300×600 (Half Page)</option>
                    <option value="300x250">300×250 (Medium Rectangle)</option>
                    <option value="160x600">160×600 (Wide Skyscraper)</option>
                    <option value="336x280">336×280 (Large Rectangle)</option>
                    <option value="320x100">320×100 (Large Mobile Banner)</option>
                    <option value="320x50">320×50 (Mobile Banner)</option>
                    <option value="468x60">468×60 (Full Banner)</option>
                    <option value="728x90">728×90 (Leaderboard)</option>
                    <option value="responsive">Responsive / Fluid</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={formConfig.sidebarBanner || ''}
                onChange={(e) => setFormConfig({ ...formConfig, sidebarBanner: e.target.value })}
                placeholder="<!-- Paste Sidebar Ad Code here (300x250, 300x600, 160x600) -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Bottom Leaderboard Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Bottom Footer Banner
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Rendered above the final continue button.
                  </p>
                </div>

                <div>
                  <select
                    value={formConfig.footerBannerSize || '320x50'}
                    onChange={(e) => setFormConfig({ ...formConfig, footerBannerSize: e.target.value as any })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="320x50">320×50 (Mobile Banner)</option>
                    <option value="728x90">728×90 (Leaderboard)</option>
                    <option value="468x60">468×60 (Full Banner)</option>
                    <option value="336x280">336×280 (Large Rectangle)</option>
                    <option value="300x250">300×250 (Medium Rectangle)</option>
                    <option value="320x100">320×100 (Large Mobile Banner)</option>
                    <option value="300x600">300×600 (Half Page)</option>
                    <option value="160x600">160×600 (Wide Skyscraper)</option>
                    <option value="responsive">Responsive / Fluid</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={formConfig.footerBanner || ''}
                onChange={(e) => setFormConfig({ ...formConfig, footerBanner: e.target.value })}
                placeholder="<!-- Paste Footer Ad Code here (728x90, 468x60) -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-rose-400" />
              Popunder & Click Ad Settings
            </h3>
            <p className="text-xs text-slate-400">
              Configure popunder monetization script code and click triggers.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Direct Link / Popunder JavaScript Ad Code Input
              </label>
              <textarea
                rows={3}
                value={formConfig.popunderCode || ''}
                onChange={(e) => setFormConfig({ ...formConfig, popunderCode: e.target.value })}
                placeholder="<!-- Paste Popunder JavaScript or Direct Link Code here -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Click Ad Trigger Delay (Seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formConfig.clickAdDelay ?? 0}
                  onChange={(e) => setFormConfig({ ...formConfig, clickAdDelay: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={formConfig.clickAdOpenNewTab ?? true}
                    onChange={(e) => setFormConfig({ ...formConfig, clickAdOpenNewTab: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-slate-700 bg-slate-950 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-200">Open Destination Links in New Tab</span>
                    <p className="text-[11px] text-slate-400">Forces target link to open in new browser window/tab</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Click Ads to Continue & Multiple Click Ads Gate Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-rose-400" />
                "Click Ads to Continue" Gate & Multiple Click Ads Settings
              </h3>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                High CPM Monetization
              </span>
            </div>

            <div className="space-y-4">
              {/* Enable Click Ad Gate */}
              <label className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={formConfig.enableClickAdGate ?? true}
                  onChange={(e) => setFormConfig({ ...formConfig, enableClickAdGate: e.target.checked })}
                  className="mt-1 w-4 h-4 text-rose-600 rounded border-slate-700 bg-slate-900 focus:ring-rose-500"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-200">
                    Enable "Click Ad to Continue" Gate
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Requires visitors to click on banner ads to unlock the final "Get Destination Link" button.
                  </p>
                </div>
              </label>

              {formConfig.enableClickAdGate && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-5 animate-fadeIn">
                  
                  {/* Required Click Ads Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Required Click Ads Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={formConfig.requiredClickAdsCount ?? 2}
                        onChange={(e) => setFormConfig({ ...formConfig, requiredClickAdsCount: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-rose-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Number of ad banners visitors must click (e.g., 1, 2, or 3 ads required)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Focus Return Timer (Seconds)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formConfig.tabFocusReturnSeconds ?? 5}
                        onChange={(e) => setFormConfig({ ...formConfig, tabFocusReturnSeconds: parseInt(e.target.value) || 5 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-rose-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Duration visitors must stay/wait on the tab after clicking ad banner</p>
                    </div>
                  </div>

                  {/* Window Focus Return Check Toggle */}
                  <label className="flex items-start gap-3 pt-2 border-t border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConfig.requireTabFocusReturnTimer ?? true}
                      onChange={(e) => setFormConfig({ ...formConfig, requireTabFocusReturnTimer: e.target.checked })}
                      className="mt-1 w-4 h-4 text-rose-600 rounded border-slate-700 bg-slate-900 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">
                        Window Focus Return Check (Require 5s stay on ad tab)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When enabled, visitors must switch back to the safelink tab and wait for a 5-second verification countdown to register each ad click.
                      </p>
                    </div>
                  </label>

                  {/* Custom Banner Slot Selectors for Click-Tracking */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Click-Tracked Banner Slots
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Select which banner slots participate in the click-ad verification count:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'headerBanner', label: 'Top Leaderboard Banner' },
                        { id: 'aboveTimerBanner', label: 'Above Timer Banner' },
                        { id: 'belowTimerBanner', label: 'Below Timer Banner' },
                        { id: 'sidebarBanner', label: 'Sidebar Banner' },
                        { id: 'footerBanner', label: 'Bottom Footer Banner' }
                      ].map((slot) => {
                        const currentSlots = formConfig.clickTrackedSlots || ['headerBanner', 'footerBanner', 'sidebarBanner', 'aboveTimerBanner', 'belowTimerBanner'];
                        const isChecked = currentSlots.includes(slot.id);
                        return (
                          <label key={slot.id} className="flex items-center gap-2.5 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:border-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...currentSlots, slot.id]
                                  : currentSlots.filter(s => s !== slot.id);
                                setFormConfig({ ...formConfig, clickTrackedSlots: updated });
                              }}
                              className="w-3.5 h-3.5 text-rose-600 rounded border-slate-700 bg-slate-950 focus:ring-rose-500"
                            />
                            <span>{slot.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AdsLab SDK & PTC Settings */}
      {activeTab === 'adslab' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-rose-400" />
                AdsLab SDK & Placement Configurations
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure your official AdsLab Interstitial, Rewarded, PTC API, and User ID placements for automatic SDK initialization across all pages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Interstitial Placement ID (ADSLAB_INT)
                </label>
                <input
                  type="text"
                  value={formConfig.adslabInterstitialPlacementId || 'int-46FOXZxueFfc'}
                  onChange={(e) => setFormConfig({ ...formConfig, adslabInterstitialPlacementId: e.target.value })}
                  placeholder="int-46FOXZxueFfc"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Default: int-46FOXZxueFfc</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Rewarded Placement ID (ADSLAB_REW)
                </label>
                <input
                  type="text"
                  value={formConfig.adslabRewardedPlacementId || 'rew-wBuPOOmM7YwY'}
                  onChange={(e) => setFormConfig({ ...formConfig, adslabRewardedPlacementId: e.target.value })}
                  placeholder="rew-wBuPOOmM7YwY"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Default: rew-wBuPOOmM7YwY</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  AdsLab System User ID (ADSLAB_USER)
                </label>
                <input
                  type="text"
                  value={formConfig.adslabUserId || 'USER_ID_FROM_YOUR_SYSTEM'}
                  onChange={(e) => setFormConfig({ ...formConfig, adslabUserId: e.target.value })}
                  placeholder="USER_ID_FROM_YOUR_SYSTEM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Dynamic or system user string</p>
              </div>
            </div>

            {/* Automatic Interstitial Trigger Toggle */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formConfig.enableInterstitials}
                  onChange={(e) => setFormConfig({ ...formConfig, enableInterstitials: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-200">
                    Enable Automatic Interstitial Ads on Link Click (Currently Disabled)
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When enabled, clicking the Continue button triggers the AdsLab interstitial ad popup before redirecting.
                  </p>
                </div>
              </label>
            </div>

            {/* Test Trigger Buttons for AdsLab SDK */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AdsLab Interactive Ad Testers
              </h4>
              <p className="text-xs text-slate-400">
                Test calling AdsLab SDK interstitial and rewarded ads directly in your browser:
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window.showint_adslab === 'function') {
                      window.showint_adslab()
                        .then(() => alert('AdsLab Interstitial Closed Successfully!'))
                        .catch(e => alert('AdsLab Interstitial unavailable or skipped: ' + (e?.message || e)));
                    } else if (window.adslabShowInterstitial) {
                      window.adslabShowInterstitial();
                    } else {
                      alert('AdsLab SDK loading or blocked by ad blocker extension. Please check console/network logs.');
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Trigger Interstitial Ad (showint_adslab)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window.showrew_adslab === 'function') {
                      window.showrew_adslab()
                        .then(() => alert('AdsLab Rewarded Ad Completed Successfully!'))
                        .catch(e => alert('AdsLab Rewarded Ad failed or skipped: ' + (e?.message || e)));
                    } else if (window.adslabShowRewarded) {
                      window.adslabShowRewarded();
                    } else {
                      alert('AdsLab SDK loading or blocked by ad blocker extension. Please check console/network logs.');
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Trigger Rewarded Ad (showrew_adslab)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  AdsLab Publisher API Key (CAPTCHA / Init)
                </label>
                <input
                  type="text"
                  value={formConfig.adsLabApiKey || 'SDFM8H5AMK95EC4kLz9irGiwI86qEPvt3DjPpCM0'}
                  onChange={(e) => setFormConfig({ ...formConfig, adsLabApiKey: e.target.value })}
                  placeholder="SDFM8H5AMK95EC4kLz9irGiwI86qEPvt3DjPpCM0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Used for POST https://adslab.me/api/v1/captcha/init S2S calls</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Security Hash / Secret Key (secretKey)
                </label>
                <input
                  type="text"
                  value={formConfig.adsLabCaptchaSecretKey || 'fCgagENH5uucsf2Vn40Sos2ZRl0fomRN'}
                  onChange={(e) => setFormConfig({ ...formConfig, adsLabCaptchaSecretKey: e.target.value })}
                  placeholder="fCgagENH5uucsf2Vn40Sos2ZRl0fomRN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">HMAC-SHA256 signature verification key for S2S webhook</p>
              </div>
            </div>

            {/* S2S Webhook Postback URL Display Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Your Website S2S Captcha Postback URL
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  HMAC-SHA256 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Copy and set this URL into your AdsLab Website Settings as your <strong>Captcha Postback URL</strong>:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/captcha/postback`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-rose-400 text-xs font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/captcha/postback`);
                    alert('Copied S2S Captcha Postback URL to clipboard!');
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer transition-all"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <label className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={formConfig.enablePtcTasks ?? true}
                  onChange={(e) => setFormConfig({ ...formConfig, enablePtcTasks: e.target.checked })}
                  className="mt-1 w-4 h-4 text-rose-600 rounded border-slate-700 bg-slate-900 focus:ring-rose-500"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-200">
                    Enable AdsLab Sponsored PTC Tasks
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Renders high-CPM sponsored task feed on the safelink page.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={formConfig.enableCaptcha ?? true}
                  onChange={(e) => setFormConfig({ ...formConfig, enableCaptcha: e.target.checked })}
                  className="mt-1 w-4 h-4 text-rose-600 rounded border-slate-700 bg-slate-900 focus:ring-rose-500"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-200">
                    Enable AdsLab High-CPM CAPTCHA Verification
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Requires users to complete AdsLab CAPTCHA & signed S2S webhook verification.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Timers & Step Customization */}
      {activeTab === 'timers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-400" />
              Dual-Step Timer & Labels Customization
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Step 1 Countdown Timer (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formConfig.step1Timer ?? 15}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, step1Timer: parseInt(e.target.value) || 15 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">Default: 15 seconds (adjustable from panel).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Step 2 Countdown Timer (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formConfig.step2Timer ?? 3}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, step2Timer: parseInt(e.target.value) || 3 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">Default: 3 seconds.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Step 1 Instructions Message
                </label>
                <input
                  type="text"
                  value={formConfig.step1Message || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, step1Message: e.target.value })}
                  placeholder="Please scroll down and wait for timer to unlock Step 2."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Step 1 Button Label
                </label>
                <input
                  type="text"
                  value={formConfig.step1ButtonLabel || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, step1ButtonLabel: e.target.value })}
                  placeholder="Verify & Continue to Step 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Step 2 Instructions Message
                </label>
                <input
                  type="text"
                  value={formConfig.step2Message || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, step2Message: e.target.value })}
                  placeholder="Final security check. Your destination link is ready."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Step 2 Action Button Label
                </label>
                <input
                  type="text"
                  value={formConfig.step2ButtonLabel || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, step2ButtonLabel: e.target.value })}
                  placeholder="Get Destination Link"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Admin Panel Security Password
              </label>
              <input
                type="password"
                value={formConfig.adminPassword || 'Thunderffyt123@'}
                onChange={(e) => setFormConfig({ ...formConfig, adminPassword: e.target.value })}
                placeholder="Enter new admin password"
                className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm font-mono focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Password required to login at <code className="text-slate-300">/safelink/admin</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security Shields (Ad Blocker & VPN Detector) */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Ad Blocker & VPN Detection Shield Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enforce strict real-time verification when visitors open the site to maximize ad impression revenue and prevent bot / proxy fraud.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTestShieldOpen(true)}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Test Security Shield Modal
              </button>
            </div>

            {/* AD BLOCKER DETECTOR SETTINGS */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-slate-100 text-sm">
                  <Ban className="w-4 h-4 text-rose-500" />
                  <span>Ad Blocker Detector</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.enableAdBlockDetector !== false}
                    onChange={(e) => setFormConfig({ ...formConfig, enableAdBlockDetector: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-400">
                Detects uBlock Origin, AdGuard, Brave Shield, AdBlock Plus, and network script blocks immediately when a visitor opens the site.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Ad Blocker Warning Message
                </label>
                <textarea
                  rows={2}
                  value={formConfig.adBlockMessage || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, adBlockMessage: e.target.value })}
                  placeholder="An active Ad Blocker was detected. Please disable your Ad Blocker for this site to continue accessing your shortlink destination."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* VPN / PROXY DETECTOR SETTINGS */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-slate-100 text-sm">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>VPN & Proxy Detector</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.enableVpnDetector !== false}
                    onChange={(e) => setFormConfig({ ...formConfig, enableVpnDetector: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-400">
                Inspects client request headers, IP datacenter ranges (M247, DigitalOcean, ExpressVPN, NordVPN, Datacamp, Hetzner, etc.), proxy signatures, and timezone mismatches.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  VPN Warning Message
                </label>
                <textarea
                  rows={2}
                  value={formConfig.vpnMessage || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, vpnMessage: e.target.value })}
                  placeholder="You are accessing this page using a VPN, proxy server, or datacenter IP connection. To protect link authenticity and prevent automated bot requests, VPN access is strictly restricted."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Security Shield Test Overlay */}
      {testShieldOpen && (
        <SecurityShield 
          config={{ ...config, safelinkConfig: formConfig }} 
          onBypass={() => setTestShieldOpen(false)} 
        />
      )}

      {/* Tab 4: Auto-Safelink Script Generator */}
      {activeTab === 'autoScript' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <Code className="w-5 h-5 text-rose-400" />
              Target Monitored File Host Domains
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Comma-separated list of download or file hosting domains to automatically convert into safelinks.
            </p>

            <input
              type="text"
              value={formConfig.autoSafelinkDomains || ''}
              onChange={(e) => setFormConfig({ ...formConfig, autoSafelinkDomains: e.target.value })}
              placeholder="drive.google.com, mega.nz, mediafire.com, zippyshare.com, dropbox.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Embeddable Auto-Link Converter Script
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy and paste this snippet before the <code className="text-slate-300">&lt;/body&gt;</code> tag of your blog or website.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(autoScriptCode, 'script')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {copiedScript ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedScript ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              {autoScriptCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Test Link Generator */}
      {activeTab === 'tester' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Safelink Dynamic URL Generator
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Generate and test safelink URLs instantly to test the complete dual-step flow.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Destination Target URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={testTargetUrl}
                    onChange={(e) => setTestTargetUrl(e.target.value)}
                    placeholder="https://example.com/download-file.zip"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={handleGenerateTestLink}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20 whitespace-nowrap cursor-pointer"
                  >
                    Generate Link
                  </button>
                </div>
              </div>

              {generatedTestCode && (
                <div className="mt-6 p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Generated Safelink Path
                    </span>
                    <p className="text-sm font-mono text-slate-200 mt-1">
                      /go/{generatedTestCode}?token=DEMO123&sub_id=admin_test
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Full Safelink URL
                    </span>
                    <p className="text-sm font-mono text-rose-400 mt-1 break-all">
                      {window.location.origin}/go/{generatedTestCode}?token=DEMO123&sub_id=admin_test
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/go/${generatedTestCode}?token=DEMO123&sub_id=admin_test`,
                          'link'
                        )
                      }
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
                    >
                      {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>

                    <button
                      onClick={() => onNavigate('go', generatedTestCode)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Link Live
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
