import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle /ads.txt intercept before mounting React
if (window.location.pathname === '/ads.txt' || window.location.pathname === '/ads.txt/') {
  let adsTxtContent = 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0';
  const storedConfig = localStorage.getItem('dlsurf_blog_config');
  if (storedConfig) {
    try {
      const parsed = JSON.parse(storedConfig);
      if (parsed.adsTxt !== undefined) {
        adsTxtContent = parsed.adsTxt;
      }
    } catch (e) {
      console.error('Failed to parse config for ads.txt', e);
    }
  }
  document.documentElement.innerHTML = `<html><head><title>ads.txt</title></head><body><pre style="word-wrap: break-word; white-space: pre-wrap; font-family: monospace; padding: 20px; font-size: 14px; line-height: 1.5; color: #1a1a1a; background: #ffffff;">${adsTxtContent}</pre></body></html>`;
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

