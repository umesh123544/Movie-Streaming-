'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installability just won't kick in — not worth surfacing to the user.
      });
    }
  }, []);

  return null;
}
