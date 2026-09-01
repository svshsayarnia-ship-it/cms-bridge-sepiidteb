'use client';

import { useEffect } from 'react';

const CHATGPT_SOURCE = 'chatgpt.com';
const SESSION_KEY = 'sepiidbeauty:ai-referral:chatgpt';

function isChatGptHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/^www\./, '');
  return normalized === CHATGPT_SOURCE || normalized.endsWith(`.${CHATGPT_SOURCE}`);
}

export function AiReferralTracker() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;

      const params = new URLSearchParams(window.location.search);
      const utmSource = (params.get('utm_source') ?? '').trim().toLowerCase();
      let referrerHost = '';

      if (document.referrer) {
        try {
          referrerHost = new URL(document.referrer).hostname;
        } catch {
          referrerHost = '';
        }
      }

      const viaUtm = utmSource === CHATGPT_SOURCE;
      const viaReferrer = isChatGptHost(referrerHost);
      if (!viaUtm && !viaReferrer) return;

      const payload = JSON.stringify({
        source: CHATGPT_SOURCE,
        via: viaUtm ? 'utm_source' : 'referrer',
        landingPath: window.location.pathname,
      });

      window.sessionStorage.setItem(SESSION_KEY, '1');

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/ai-referral',
          new Blob([payload], { type: 'application/json' }),
        );
        return;
      }

      void fetch('/api/analytics/ai-referral', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    } catch {
      // Analytics must never interfere with storefront behavior.
    }
  }, []);

  return null;
}
