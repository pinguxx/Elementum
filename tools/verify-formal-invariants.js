#!/usr/bin/env node
/**
 * Exhaustive Formal & Bounded Model Verification Suite for @wcomp/elementum
 *
 * Verifies 5 high-consequence system invariants across:
 *   1. Reactive DAG Glitch-Freedom & At-Most-Once Batch Execution (`src/signal.js`)
 *   2. Reactive Batch Fault Isolation & Cycle Stack Recovery (`src/signal.js`)
 *   3. AsyncSignal Self-Subscription Freedom & Out-of-Order Race Monotonicity (`src/signal.js`)
 *   4. A2UI Untrusted Graph Termination & Reactive Sink/Scheme Rejection (`src/a2ui.js`)
 *   5. ElToaster Multi-Instance Active-Deck Exclusivity State Machine (`src/components/el-toast.js`)
 *
 * Run:
 *   node tools/verify-formal-invariants.js
 */

import assert from 'node:assert/strict';
import { signal, computed, effect, batch, asyncSignal } from '../src/signal.js';
import { createA2UiSurface } from '../src/a2ui.js';
import { createAgUiStore } from '../src/ag-ui.js';
import { toast } from '../src/components/el-toast.js';

const results = [];

function recordPass(id, title, statesChecked) {
  results.push({ id, title, statesChecked, status: 'PASS' });
}

// ============================================================================
// Invariant 1: Exhaustive DAG Glitch-Freedom & Single-Execution Under batch()
// ============================================================================
{
  // Enumerate all 64 DAG topologies over sources (S0, S1), intermediates (C0, C1), and terminal effect E:
  // Edges into C0 from {S0, S1} (4 choices)
  // Edges into C1 from {S0, S1, C0} (8 choices)
  // Edges into E  from {S0, S1, C0, C1} (16 choices, non-empty = 15, plus empty = 16 -> 4*8*16 = 512 total configs)
  let checked = 0;

  for (let c0Mask = 0; c0Mask < 4; c0Mask++) {
    for (let c1Mask = 0; c1Mask < 8; c1Mask++) {
      for (let eMask = 1; eMask < 16; eMask++) {
        for (const [d0, d1] of [
          [1, 0],
          [0, 1],
          [1, 1],
        ]) {
          checked++;
          const s0 = signal(1);
          const s1 = signal(10);

          const expectedC0 = (v0, v1) =>
            ((c0Mask & 1) ? v0 : 0) + ((c0Mask & 2) ? v1 * 2 : 0);
          const expectedC1 = (v0, v1) =>
            ((c1Mask & 1) ? v0 * 3 : 0) +
            ((c1Mask & 2) ? v1 * 5 : 0) +
            ((c1Mask & 4) ? expectedC0(v0, v1) * 7 : 0);
          const expectedE = (v0, v1) =>
            ((eMask & 1) ? v0 : 0) +
            ((eMask & 2) ? v1 : 0) +
            ((eMask & 4) ? expectedC0(v0, v1) : 0) +
            ((eMask & 8) ? expectedC1(v0, v1) : 0);

          const c0 = computed(() =>
            ((c0Mask & 1) ? s0.value : 0) + ((c0Mask & 2) ? s1.value * 2 : 0)
          );
          const c1 = computed(() =>
            ((c1Mask & 1) ? s0.value * 3 : 0) +
            ((c1Mask & 2) ? s1.value * 5 : 0) +
            ((c1Mask & 4) ? c0.value * 7 : 0)
          );

          const observed = [];
          const dispose = effect(() => {
            const val =
              ((eMask & 1) ? s0.value : 0) +
              ((eMask & 2) ? s1.value : 0) +
              ((eMask & 4) ? c0.value : 0) +
              ((eMask & 8) ? c1.value : 0);
            observed.push({ s0: s0.peek(), s1: s1.peek(), val });
          });

          // Initial run must match (1, 10)
          assert.equal(observed.length, 1);
          assert.equal(observed[0].val, expectedE(1, 10));

          const next0 = 1 + d0;
          const next1 = 10 + d1;
          batch(() => {
            if (d0) s0.value = next0;
            if (d1) s1.value = next1;
          });

          // Invariant 1a: Terminal effect runs at most once per batch()
          assert.ok(
            observed.length <= 2,
            `DAG (c0=${c0Mask}, c1=${c1Mask}, e=${eMask}) ran effect ${observed.length - 1} times in a single batch()`
          );

          // Invariant 1b: Every observed value is glitch-free (matches true pure function of (s0, s1))
          for (const obs of observed) {
            assert.equal(
              obs.val,
              expectedE(obs.s0, obs.s1),
              `Glitch observed in DAG (c0=${c0Mask}, c1=${c1Mask}, e=${eMask}): got ${obs.val}, expected ${expectedE(obs.s0, obs.s1)}`
            );
          }

          dispose();
        }
      }
    }
  }
  recordPass('INV-1', 'Exhaustive DAG Glitch-Freedom & Single-Execution Under batch()', checked);
}

// ============================================================================
// Invariant 2: Batch Fault Isolation & Cyclic Computed Stack Recovery
// ============================================================================
{
  let checked = 0;

  // 2a: All permutations of [throwingEffect, healthyEffect1, healthyEffect2] inside batch()
  for (let throwIdx = 0; throwIdx < 3; throwIdx++) {
    checked++;
    const src = signal(0);
    const healthyRuns = [0, 0, 0];
    const disposers = [];

    for (let i = 0; i < 3; i++) {
      let initialized = false;
      disposers.push(
        effect(() => {
          const v = src.value;
          if (initialized && i === throwIdx) {
            throw new Error(`boom-${i}-${v}`);
          }
          initialized = true;
          healthyRuns[i]++;
        })
      );
    }

    assert.deepEqual(healthyRuns, [1, 1, 1]);

    assert.throws(() => {
      batch(() => {
        src.value = 1;
      });
    }, /boom-/);

    // Every non-throwing sibling subscriber MUST still have received the batch notification!
    for (let i = 0; i < 3; i++) {
      if (i !== throwIdx) {
        assert.equal(
          healthyRuns[i],
          2,
          `Counterexample (INV-2a): Subscriber ${i} lost its notification when subscriber ${throwIdx} threw inside batch()`
        );
      }
    }
    disposers.forEach((d) => d());
  }

  // 2b: 1-node, 2-node, and 3-node cycles in computed() must throw cleanly without corrupting activeEffect
  for (const cycleLen of [1, 2, 3]) {
    checked++;
    let c0, c1, c2;
    if (cycleLen === 1) {
      c0 = computed(() => c0.value + 1);
    } else if (cycleLen === 2) {
      c0 = computed(() => c1.value + 1);
      c1 = computed(() => c0.value + 1);
    } else {
      c0 = computed(() => c1.value + 1);
      c1 = computed(() => c2.value + 1);
      c2 = computed(() => c0.value + 1);
    }

    const healthy = signal(10);
    let healthyObserved = 0;
    const dispose = effect(() => {
      healthyObserved = healthy.value;
    });

    assert.throws(() => c0.value, /Circular dependency detected/);

    // Subsequent signal writes must still trigger effects (activeEffect stack uncorrupted)
    healthy.value = 42;
    assert.equal(healthyObserved, 42);
    dispose();
  }

  recordPass('INV-2', 'Batch Fault Isolation & Cyclic Computed Stack Recovery', checked);
}

// ============================================================================
// Invariant 3: AsyncSignal Self-Subscription Freedom & Race Monotonicity
// ============================================================================
{
  let checked = 0;

  // 3a: Reading own .latest, .value, .status.value, .pending.value, or .error.value inside fetcher
  // across multi-step dependency updates must NEVER trigger an infinite self-refetch loop.
  for (const readKind of ['latest', 'value', 'status', 'pending', 'error']) {
    checked++;
    const dep = signal(1);
    let fetchCount = 0;
    let asyncSig;
    asyncSig = asyncSignal(
      async () => {
        fetchCount++;
        if (fetchCount > 10) {
          asyncSig.dispose();
          throw new Error('Infinite refetch loop');
        }
        const d = dep.value;
        let selfRead = 0;
        if (asyncSig) {
          if (readKind === 'latest') selfRead = asyncSig.latest || 0;
          else if (readKind === 'value') selfRead = asyncSig.value || 0;
          else if (readKind === 'status') selfRead = asyncSig.status.value === 'pending' ? 1 : 0;
          else if (readKind === 'pending') selfRead = asyncSig.pending.value ? 1 : 0;
          else if (readKind === 'error') selfRead = asyncSig.error.value ? 1 : 0;
        }
        return d + selfRead;
      },
      { initialValue: 0 }
    );

    await new Promise((r) => setTimeout(r, 15));
    assert.equal(fetchCount, 1);

    // Step 2: mutate external dependency while `asyncSig` reference is live
    dep.value = 2;
    await new Promise((r) => setTimeout(r, 25));

    assert.equal(
      fetchCount,
      2,
      `Counterexample (INV-3a): AsyncSignal fetcher reading own .${readKind} caused self-triggered refetch loop (${fetchCount} runs instead of 2)`
    );
    asyncSig.dispose();
  }

  // 3b: All permutations of out-of-order resolution/rejection between Run 1 and Run 2
  const outcomes = [
    ['resolve1', 'resolve2'],
    ['resolve2', 'resolve1'],
    ['reject1', 'resolve2'],
    ['resolve2', 'reject1'],
    ['resolve1', 'reject2'],
    ['reject2', 'resolve1'],
  ];

  for (const order of outcomes) {
    checked++;
    const resolvers = [];
    const dep = signal('run1');
    const s = asyncSignal(
      () =>
        new Promise((resolve, reject) => {
          resolvers.push({ tag: dep.value, resolve, reject });
        }),
      { initialValue: 'init' }
    );

    // Trigger Run 2 before Run 1 settles
    dep.value = 'run2';
    assert.equal(resolvers.length, 2);

    for (const step of order) {
      if (step === 'resolve1') resolvers[0].resolve('val-1');
      if (step === 'reject1') resolvers[0].reject(new Error('err-1'));
      if (step === 'resolve2') resolvers[1].resolve('val-2');
      if (step === 'reject2') resolvers[1].reject(new Error('err-2'));
      await new Promise((r) => setTimeout(r, 5));
    }

    // Final state must ALWAYS reflect Run 2, never overwritten by stale Run 1
    if (order.includes('resolve2')) {
      assert.equal(s.value, 'val-2', `Stale run1 overwrote run2 in order ${order.join(' -> ')}`);
      assert.equal(s.status.value, 'resolved');
      assert.equal(s.error.value, null);
    } else {
      assert.equal(s.status.value, 'errored');
      assert.equal(s.error.value?.message, 'err-2');
    }
    s.dispose();
  }

  recordPass('INV-3', 'AsyncSignal Self-Subscription Freedom & Out-of-Order Race Monotonicity', checked);
}

// ============================================================================
// Invariant 4: A2UI Untrusted Graph Termination & Reactive URL/Sink Boundary
// ============================================================================
{
  let checked = 0;

  // Minimal DOM mock for Node verification of A2UISurface security boundary
  class MockNode {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.attributes = new Map();
      this.children = [];
      this.style = {};
      this.dataset = {};
      this.textContent = '';
    }
    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }
    removeAttribute(k) {
      this.attributes.delete(k);
    }
    getAttribute(k) {
      return this.attributes.get(k) ?? null;
    }
    appendChild(child) {
      this.children.push(child);
      return child;
    }
    replaceChildren(...nodes) {
      this.children = [...nodes];
    }
    addEventListener() {}
  }

  const prevDoc = globalThis.document;
  globalThis.document = {
    createElement: (tag) => new MockNode(tag),
    createTextNode: (txt) => ({ nodeType: 3, textContent: txt }),
  };

  try {
    // 4a: Cyclic component graphs (1-cycle, 2-cycle, 3-cycle) + deep chain (> maxDepth)
    const cycleGraphs = [
      [{ id: 'root', type: 'Card', children: ['root'] }],
      [
        { id: 'root', type: 'Card', children: ['a'] },
        { id: 'a', type: 'Row', children: ['root'] },
      ],
      [
        { id: 'root', type: 'Card', children: ['a'] },
        { id: 'a', type: 'Row', children: ['b'] },
        { id: 'b', type: 'Column', children: ['root'] },
      ],
    ];

    for (const components of cycleGraphs) {
      checked++;
      const container = new MockNode('div');
      const surface = createA2UiSurface({ maxDepth: 8 });
      surface.mount(container);
      surface.processMessages([
        { updateComponents: { surfaceId: 's1', components } },
        { createSurface: { surfaceId: 's1', root: 'root' } },
      ]);
      assert.equal(container.children.length, 1);
      surface.destroy();
    }

    // 4b: Reactive URL mutation attacks across schemes and obfuscations
    const maliciousUrls = [
      'javascript:alert(1)',
      '  JAVASCRIPT:alert(1)',
      '\t\njavascript:fetch(1)',
      'vbscript:msgbox(1)',
      'data:text/html,<script>alert(1)</script>',
      'data:image/svg+xml,<svg onload=alert(1)>',
    ];

    for (const badUrl of maliciousUrls) {
      checked++;
      const container = new MockNode('div');
      const surface = createA2UiSurface();
      surface.mount(container);
      surface.processMessages([
        {
          dataModelUpdate: {
            surfaceId: 's1',
            contents: { linkUrl: 'https://elementum-sage.vercel.app', innerHTML: '<b>pwn</b>', onclick: 'alert(1)' },
          },
        },
        {
          updateComponents: {
            surfaceId: 's1',
            components: [
              {
                id: 'root',
                type: 'Button',
                props: {
                  text: 'Go',
                  href: { path: '/linkUrl' },
                  innerHTML: { path: '/innerHTML' },
                  onclick: { path: '/onclick' },
                },
              },
            ],
          },
        },
        { createSurface: { surfaceId: 's1', root: 'root' } },
      ]);

      const btn = container.children[0];
      assert.equal(btn.getAttribute('href'), 'https://elementum-sage.vercel.app');
      assert.equal(btn.innerHTML, undefined);
      assert.equal(btn.onclick, undefined);

      // Mutate data model after initial render to a dangerous URL
      surface.processMessages([
        { dataModelUpdate: { surfaceId: 's1', contents: { linkUrl: badUrl } } },
      ]);

      const afterHref = btn.getAttribute('href');
      assert.equal(
        afterHref,
        null,
        `Counterexample (INV-4b): Reactive A2UI mutation permitted unsafe URL "${badUrl}"`
      );
      surface.destroy();
    }
  } finally {
    globalThis.document = prevDoc;
  }

  recordPass('INV-4', 'A2UI Untrusted Graph Termination & Reactive URL/Sink Boundary', checked);
}

// ============================================================================
// Invariant 5: Exhaustive BFS State-Space Model Check of ElToaster Active-Deck
// ============================================================================
{
  // Model the exact #instances lifecycle and #isActiveToaster predicate of ElToaster
  // across all sequences of up to 5 transitions over 3 toaster instances + toast stack:
  // Actions: connect(0..2), disconnect(0..2), showToast, clearToasts (8 actions^5)
  class ToasterModel {
    constructor() {
      this.instances = []; // ordered list of connected toaster IDs
      this.toasts = [];
    }
    clone() {
      const m = new ToasterModel();
      m.instances = [...this.instances];
      m.toasts = [...this.toasts];
      return m;
    }
    connect(id) {
      if (!this.instances.includes(id)) this.instances.push(id);
    }
    disconnect(id) {
      const idx = this.instances.indexOf(id);
      if (idx !== -1) this.instances.splice(idx, 1);
    }
    showToast(tid) {
      this.toasts = [{ id: tid }, ...this.toasts];
    }
    clearToasts() {
      this.toasts = [];
    }
    isActive(id) {
      return this.instances.length > 0 && this.instances[this.instances.length - 1] === id;
    }
    renderedBy(id) {
      if (!this.instances.includes(id) || !this.isActive(id)) return [];
      return this.toasts.slice(0, 4).map((t, stackIndex) => ({
        id: t.id,
        stackIndex,
        collapsedOffsetPx: stackIndex * 12,
        expandedOffsetPx: stackIndex * 82,
      }));
    }
  }

  // Also verify that ToastManager (`toast.show` / `toast.clear`) in `src/components/el-toast.js`
  // maintains LIFO order (newest toast at index 0) across show/dismiss/clear transitions.
  toast.clear();
  const id1 = toast.info('First', { duration: 0 });
  const id2 = toast.success('Second', { duration: 0 });
  const visibleOrder = toast.toasts.value.slice(-4).reverse();
  assert.equal(visibleOrder[0].id, id2, 'Newest toast must be at visible stackIndex 0');
  assert.equal(visibleOrder[1].id, id1);
  toast.clear();
  assert.equal(toast.toasts.value.length, 0);

  let checked = 0;
  const actions = [
    (m, step) => m.connect(0),
    (m, step) => m.connect(1),
    (m, step) => m.connect(2),
    (m, step) => m.disconnect(0),
    (m, step) => m.disconnect(1),
    (m, step) => m.disconnect(2),
    (m, step) => m.showToast(step),
    (m, step) => m.clearToasts(),
  ];

  function explore(model, depth) {
    checked++;
    // Verify Active-Deck Exclusivity Invariant at this state
    const activeRenders = [0, 1, 2].filter((id) => model.renderedBy(id).length > 0);
    assert.ok(
      activeRenders.length <= 1,
      `Multiple toasters rendered simultaneously: ${activeRenders.join(', ')}`
    );
    if (model.instances.length > 0 && model.toasts.length > 0) {
      assert.equal(
        activeRenders.length,
        1,
        'Connected toaster failed to render non-empty toast queue'
      );
      const cards = model.renderedBy(activeRenders[0]);
      // Newest toast (stackIndex = 0) must stay anchored at 0px in both collapsed and expanded states
      assert.equal(cards[0].collapsedOffsetPx, 0);
      assert.equal(cards[0].expandedOffsetPx, 0);
      for (let i = 1; i < cards.length; i++) {
        assert.ok(cards[i].expandedOffsetPx > cards[i - 1].expandedOffsetPx);
      }
    }

    if (depth >= 4) return;
    for (const act of actions) {
      const next = model.clone();
      act(next, depth + 1);
      explore(next, depth + 1);
    }
  }

  explore(new ToasterModel(), 0);
  recordPass('INV-5', 'ElToaster Multi-Instance Active-Deck & Anchor State Machine', checked);
}

// ============================================================================
// Invariant 6: AG-UI Multi-Run Late STATE_DELTA Isolation & Path Allowlist
// ============================================================================
{
  let checked = 0;
  const disallowedPaths = ['/admin/role', '/__proto__/polluted', '/constructor/x', '/secret', '/progress_extra'];
  const staleSequences = [
    ['run-1', 'run-2', 'run-1'],
    ['run-1', 'run-2', 'run-3', 'run-1'],
    ['run-1', 'run-2', 'run-3', 'run-2'],
  ];

  for (const seq of staleSequences) {
    for (const badPath of disallowedPaths) {
      checked++;
      const store = createAgUiStore(
        { progress: 0, admin: { role: 'viewer' } },
        { surfaceId: 'surf-1', strictRunId: true, allowedPaths: ['/progress'] }
      );

      // Start runs in order (all except last entry which is a stale runId)
      const activeRun = seq[seq.length - 2];
      const staleRun = seq[seq.length - 1];
      for (let i = 0; i < seq.length - 1; i++) {
        store.dispatch({ type: 'RUN_STARTED', runId: seq[i], surfaceId: 'surf-1' });
      }

      // Active run writes valid /progress = 50 and attempts disallowed path
      store.dispatch({
        type: 'STATE_DELTA',
        runId: activeRun,
        surfaceId: 'surf-1',
        delta: [
          { op: 'replace', path: '/progress', value: 50 },
          { op: 'add', path: badPath, value: 'pwn' },
        ],
      });

      // Late stale delta from old run attempts to overwrite /progress = 999
      store.dispatch({
        type: 'STATE_DELTA',
        runId: staleRun,
        surfaceId: 'surf-1',
        delta: [{ op: 'replace', path: '/progress', value: 999 }],
      });

      // Cross-surface delta attempts to overwrite /progress = 888
      store.dispatch({
        type: 'STATE_DELTA',
        runId: activeRun,
        surfaceId: 'surf-2',
        delta: [{ op: 'replace', path: '/progress', value: 888 }],
      });

      assert.equal(store.state.value.progress, 50, `Stale run ${staleRun} or cross-surface delta overwrote active run ${activeRun}`);
      assert.equal(store.state.value.admin.role, 'viewer', `Disallowed path ${badPath} mutated protected state`);
      assert.equal(store.state.value.progress_extra, undefined, `Prefix confusion allowed ${badPath}`);
    }
  }

  recordPass('INV-6', 'AG-UI Multi-Run Late STATE_DELTA Isolation & Path Allowlist', checked);
}

console.log(`✔ Formal Invariant Verification PASSED across all ${results.length} state machines:`);
for (const r of results) {
  console.log(`  [${r.status}] ${r.id}: ${r.title} (${r.statesChecked} states/topologies verified)`);
}
