import React, { useEffect } from 'react';
import { BlogConfig } from '../types';

declare global {
  interface Window {
    ADSLAB_INT?: string;
    ADSLAB_REW?: string;
    ADSLAB_USER?: string;
    showint_adslab?: () => Promise<void>;
    showrew_adslab?: () => Promise<void>;
    adslabShowInterstitial?: () => void;
    adslabShowRewarded?: () => void;
    triggerAdslabInterstitial?: () => boolean;
    triggerAdslabRewarded?: () => boolean;
  }
}

interface AdsLabSdkInitProps {
  config: BlogConfig;
}

export const AdsLabSdkInit: React.FC<AdsLabSdkInitProps> = ({ config }) => {
  const safelinkCfg = config.safelinkConfig || {};

  const intKey = safelinkCfg.adslabInterstitialPlacementId || 'int-46FOXZxueFfc';
  const rewKey = safelinkCfg.adslabRewardedPlacementId || 'rew-wBuPOOmM7YwY';
  const userId = safelinkCfg.adslabUserId || 'USER_UNIQUE_ID';

  useEffect(() => {
    // 1. Set global configuration variables required by AdsLab SDK
    window.ADSLAB_INT = intKey;
    window.ADSLAB_REW = rewKey;
    window.ADSLAB_USER = String(userId);

    // 2. Helper wrappers for interstitial & rewarded triggers
    window.triggerAdslabInterstitial = () => {
      if (typeof window.showint_adslab === 'function') {
        window.showint_adslab().then(() => console.log('AdsLab Interstitial closed')).catch(e => console.error('No ad available:', e));
        return true;
      } else if (typeof window.adslabShowInterstitial === 'function') {
        try {
          window.adslabShowInterstitial();
          return true;
        } catch (err) {
          console.warn('AdsLab Interstitial trigger failed:', err);
        }
      }
      return false;
    };

    window.triggerAdslabRewarded = () => {
      if (typeof window.showrew_adslab === 'function') {
        window.showrew_adslab().then(() => console.log('AdsLab Rewarded completed')).catch(e => console.error('Ad failed/skipped:', e));
        return true;
      } else if (typeof window.adslabShowRewarded === 'function') {
        try {
          window.adslabShowRewarded();
          return true;
        } catch (err) {
          console.warn('AdsLab Rewarded trigger failed:', err);
        }
      }
      return false;
    };

    // 3. Inject AdsLab SDK script if not already present
    const existingScript = document.getElementById('adslab-sdk-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'adslab-sdk-script';
      script.src = 'https://adslab.me/api/sdk.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, [intKey, rewKey, userId]);

  return null;
};
