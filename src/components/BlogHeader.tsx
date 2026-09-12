import React from 'react';
import { BlogConfig, BLOG_CATEGORIES } from '../types';
import { Terminal, Shield, Sparkles } from 'lucide-react';

interface BlogHeaderProps {
  config?: BlogConfig;
  siteName?: string;
  tagline?: string;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onGoToHome: () => void;
  onOpenModal?: (modal: 'about' | 'contact' | 'privacy' | 'terms') => void;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({
  config,
  siteName,
  tagline,
  selectedCategory = 'All',
  onSelectCategory,
  onGoToHome,
  onOpenModal,
}) => {
  const displaySiteName = siteName || config?.siteName || 'Thunder Appz';

  return (
    <header
      id="blog-header"
      className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title (Single line) */}
        <button
          onClick={() => {
            if (onSelectCategory) onSelectCategory('All');
            onGoToHome();
          }}
          className="flex items-center space-x-3 text-left focus:outline-none group shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold font-mono text-sm shadow-md group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="font-serif font-extrabold text-lg text-neutral-900 dark:text-white whitespace-nowrap">
            {displaySiteName}
          </span>
        </button>

        {/* Zone 2: Navigation Links (Single-line with overflow handling) */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 text-xs font-mono overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onSelectCategory && onSelectCategory('All')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-500 dark:hover:text-rose-400'
            }`}
          >
            All
          </button>
          {BLOG_CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              onClick={() => onSelectCategory && onSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                idx >= 4 ? 'hidden lg:inline-block' : ''
              } ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onOpenModal && onOpenModal('contact')}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 hover:border-rose-500 hover:text-rose-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            Contact Us
          </button>
        </div>
      </div>
    </header>
  );
};


