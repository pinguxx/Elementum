# Next.js App Router + Elementum DSD SSR Starter

A production-ready Next.js starter showcasing pure Node.js Declarative Shadow DOM (DSD) Server-Side Rendering (`renderComponentToDSD`) with zero Cumulative Layout Shift (CLS).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the server-rendered components.

## How It Works

1. **Server Rendering (`app/page.tsx`)**: `renderComponentToDSD` serializes `<template shadowrootmode="open">` markup on the server without needing `happy-dom` or `jsdom`.
2. **Client Hydration (`app/client-elements.tsx`)**: Dynamic import of `@wcomp/elementum` hydrates interactive event listeners seamlessly on the client.
