import React, { useEffect, useState } from 'react';
import { BlogRenderer } from 'embed-dlsurf-blogs';
import { fetchDlSurfDoc, FALLBACK_THUNDERBOLT_POSTS } from '../lib/dlsurfApi';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  username: string;
  slug: string;
  accentColor?: string;
}

export const DlSurfArticleReader: React.FC<Props> = ({ username, slug, accentColor }) => {
  const [postData, setPostData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDoc = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const doc = await fetchDlSurfDoc(username, slug);
        if (isMounted) {
          // Ensure profile object is cleanly present for BlogRenderer
          const formattedPost = {
            ...doc,
            id: Number(doc.id) || doc.id,
            profile: doc.profile || {
              username: username || 'thunderbolt',
              display_name: `@${username || 'thunderbolt'}`,
              account_level: '1',
              profile_picture: ''
            }
          };
          setPostData(formattedPost);
        }
      } catch (err: any) {
        console.error('Error fetching document via server proxy:', err);
        // Resilient fallback to static dataset
        const norm = (slug || '').split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();
        const fallbackDoc = FALLBACK_THUNDERBOLT_POSTS.find(
          p => p.link_slug.toLowerCase() === norm || norm.includes(p.link_slug.toLowerCase()) || p.link_slug.toLowerCase().includes(norm)
        ) || FALLBACK_THUNDERBOLT_POSTS[0];

        if (isMounted) {
          setPostData({
            ...fallbackDoc,
            profile: {
              username: username || 'thunderbolt',
              display_name: `@${username || 'thunderbolt'}`,
              account_level: '1',
              profile_picture: ''
            }
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDoc();
    return () => {
      isMounted = false;
    };
  }, [username, slug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-xs font-medium font-mono tracking-wider uppercase">Loading the article...</p>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 my-6">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-rose-500">Publication Unavailable</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">{error || 'Unable to load article content.'}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white text-neutral-900 rounded-3xl p-6 sm:p-12 md:p-16 shadow-xl border border-neutral-200 w-full text-base sm:text-xl leading-relaxed [&_p]:text-neutral-850 [&_p]:leading-relaxed [&_p]:text-base sm:[&_p]:text-xl [&_h1]:text-neutral-950 [&_h1]:font-black [&_h1]:text-3xl sm:[&_h1]:text-5xl [&_h2]:text-neutral-900 [&_h2]:font-extrabold [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h3]:text-neutral-900 [&_h3]:font-bold [&_h3]:text-xl sm:[&_h3]:text-2xl [&_h4]:text-neutral-900 [&_li]:text-neutral-800 [&_a]:text-rose-600 [&_a]:font-semibold [&_a]:underline font-serif">
      <BlogRenderer
        post={postData}
        themeColor={accentColor || '#f43f5e'}
      />
    </div>
  );
};
