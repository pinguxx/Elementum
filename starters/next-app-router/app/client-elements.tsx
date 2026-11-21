'use client';

import { useEffect } from 'react';
import '@wcomp/elementum/tokens.css';

export function ClientElementRegistration() {
  useEffect(() => {
    // Register custom elements dynamically on client hydration
    import('@wcomp/elementum');
  }, []);

  return null;
}
