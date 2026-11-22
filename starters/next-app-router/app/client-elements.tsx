'use client';

import { useEffect } from 'react';
import '@wcomp/elementum/tokens.css';

export function ClientElementRegistration() {
  useEffect(() => {
    let cleanup = () => {};

    // Register custom elements dynamically on client hydration & wire the server-rendered button
    import('@wcomp/elementum').then(({ toast }) => {
      const btn = document.getElementById('dsd-action-btn');
      const status = document.getElementById('dsd-hydration-status');
      let clicks = 0;

      if (status) {
        status.textContent = 'Hydrated on client — click the server-rendered button below.';
      }

      if (btn) {
        const onClick = () => {
          clicks += 1;
          toast.success(`Server-rendered <el-button> hydrated! Clicks: ${clicks}`);
          if (status) {
            status.textContent = `Hydrated & interactive! Button clicked ${clicks} time${clicks === 1 ? '' : 's'}.`;
          }
        };
        btn.addEventListener('click', onClick);
        cleanup = () => btn.removeEventListener('click', onClick);
      }
    });

    return () => cleanup();
  }, []);

  return null;
}
