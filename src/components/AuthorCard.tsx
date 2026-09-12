import React from 'react';
import { Github, Twitter, Linkedin, Mail, ExternalLink, Globe, Copy, Check, Sparkles, BookOpen } from 'lucide-react';
import { BlogConfig } from '../types';

interface AuthorCardProps {
  config: BlogConfig;
  onOpenCustomizer: () => void;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({ config, onOpenCustomizer }) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const isDark = config.theme === 'dark';

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`https://dl.surf/${config.username}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Generate simple fallback avatar with initials or stylish gradient
  const initials = config.username.substring(0, 2).toUpperCase();

  return (
    <div
      id="author-card"
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isDark
          ? 'glass-panel text-neutral-100 shadow-xl accent-glow'
          : 'glass-panel-light border-neutral-200 text-neutral-800 shadow-md'
      }`}
    >
      {/* Visual Top Accent Pattern */}
      <div
        className="h-24 w-full relative"
        style={{
          background: `linear-gradient(135deg, ${config.accentColor}dd, ${config.accentColor}33)`,
        }}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      {/* Profile Detail Content */}
      <div className="px-6 pb-6 relative">
        {/* Avatar Container */}
        <div className="relative -mt-12 mb-4 inline-block">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-xl border-4 shadow-md transition-colors duration-300 overflow-hidden ${
              isDark ? 'bg-neutral-800 border-neutral-900 text-white' : 'bg-white border-white text-neutral-800'
            }`}
            style={{ borderColor: isDark ? '#171717' : '#ffffff' }}
          >
            <img
              src="/logo.svg"
              alt="@thunderbolt logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-emerald-400 border-2 border-white dark:border-neutral-900 animate-pulse"></span>
        </div>

        {/* Name and Tagline */}
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold tracking-tight">@{config.username}</h2>
          <p
            className="text-xs font-semibold uppercase tracking-wider font-mono"
            style={{ color: config.accentColor }}
          >
            Chief Publisher
          </p>
        </div>

        {config.tagline ? (
          <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {config.tagline}
          </p>
        ) : null}

        {/* Metadata Grid */}
        <div className={`my-5 grid grid-cols-2 gap-3 py-3 px-4 rounded-xl text-xs ${
          isDark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-neutral-50 border border-neutral-100'
        }`}>
          <div>
            <span className={`block text-[10px] uppercase tracking-wider font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Source
            </span>
            <span className="font-semibold text-neutral-500 dark:text-neutral-300">dl.surf/{config.username}</span>
          </div>
          <div>
            <span className={`block text-[10px] uppercase tracking-wider font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Platform
            </span>
            <span className="font-semibold text-neutral-500 dark:text-neutral-300">Cloudflare Pages</span>
          </div>
        </div>

        {/* Social Link row */}
        <div className="flex items-center space-x-3 my-4">
          {config.githubUrl && (
            <a
              href={config.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {config.twitterUrl && (
            <a
              href={config.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {config.linkedinUrl && (
            <a
              href={config.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {config.email && (
            <a
              href={`mailto:${config.email}`}
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Divider */}
        <hr className={`my-4 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} />

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={`https://dl.surf/${config.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              isDark
                ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-200'
                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <span>Visit DL.surf Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={copyProfileLink}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              copiedLink
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : isDark
                ? 'bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                : 'bg-neutral-100/50 border-neutral-200 hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Profile Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy DL.surf Username</span>
              </>
            )}
          </button>
        </div>

        {/* Tip */}
        <div className="mt-5 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 text-[11px] text-sky-500/90 leading-normal flex items-start space-x-2">
          <Globe className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This blog is automatically loaded directly from DL.surf frame endpoints using native server integration.
          </span>
        </div>
      </div>
    </div>
  );
};
