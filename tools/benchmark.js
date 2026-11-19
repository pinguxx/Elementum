#!/usr/bin/env node
/**
 * Reproducible Performance Benchmark for @wcomp/elementum
 * Measures:
 *   1. Reactive signal propagation (1,000 & 10,000 updates)
 *   2. Component mount/unmount throughput (100, 500, 1,000 instances)
 *   3. Declarative Shadow DOM SSR throughput (1,000 components)
 *
 * Usage:
 *   npm run bench
 */

import { performance } from 'node:perf_hooks';
import '../test-helpers/setup.js';
import { signal, computed, effect } from '../src/signal.js';
import { ElButton } from '../src/components/el-button.js';
import { ElBadge } from '../src/components/el-badge.js';
import { renderComponentToDSD } from '../src/ssr.js';

function bench(label, fn) {
  const start = performance.now();
  fn();
  const ms = performance.now() - start;
  console.log(`${label.padEnd(46)} ${ms.toFixed(2).padStart(8)} ms`);
  return ms;
}

console.log('\n⚡ @wcomp/elementum Performance Benchmark\n' + '─'.repeat(58));

// 1. Signal propagation
bench('Signals: 1,000 updates (signal -> computed -> effect)', () => {
  const s = signal(0);
  const c = computed(() => s.value * 2 + 1);
  let sink = 0;
  const dispose = effect(() => {
    sink = c.value;
  });
  for (let i = 1; i <= 1000; i++) s.value = i;
  dispose();
  if (sink !== 2001) throw new Error('Unexpected sink value');
});

bench('Signals: 10,000 updates (signal -> computed -> effect)', () => {
  const s = signal(0);
  const c = computed(() => s.value * 2 + 1);
  let sink = 0;
  const dispose = effect(() => {
    sink = c.value;
  });
  for (let i = 1; i <= 10000; i++) s.value = i;
  dispose();
  if (sink !== 20001) throw new Error('Unexpected sink value');
});

// 2. Component mount + unmount
for (const count of [100, 500, 1000]) {
  bench(`DOM Mount + Unmount: ${count} <el-badge> elements`, () => {
    const frag = document.createDocumentFragment();
    const els = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('el-badge');
      el.setAttribute('count', String(i));
      frag.appendChild(el);
      els.push(el);
    }
    document.body.appendChild(frag);
    for (const el of els) el.remove();
  });
}

// 3. Pure-Node DSD SSR throughput
bench('SSR DSD: 1,000 <el-button> renders', () => {
  let bytes = 0;
  for (let i = 0; i < 1000; i++) {
    bytes += renderComponentToDSD('el-button', ElButton, { variant: 'primary', size: 'md' }, `Action ${i}`).length;
  }
  if (bytes === 0) throw new Error('Empty SSR output');
});

console.log('─'.repeat(58) + '\nDone.\n');
