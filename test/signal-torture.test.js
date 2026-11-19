import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import { signal, computed, effect } from '../src/signal.js';
import '../src/components/el-badge.js';

test('Signal Torture 1: basic update, Object.is equality (NaN, -0/+0), and multiple subscribers', () => {
  const s = signal(1);
  const logA = [];
  const logB = [];
  const d1 = s.subscribe((v) => logA.push(v));
  const d2 = s.subscribe((v) => logB.push(v));

  s.value = 1; // identical -> no re-run
  s.value = 2;
  s.value = NaN;
  s.value = NaN; // Object.is(NaN, NaN) === true -> no re-run

  assert.deepEqual(logA, [1, 2, NaN]);
  assert.deepEqual(logB, [1, 2, NaN]);
  d1();
  d2();
});

test('Signal Torture 2: nested computed chains, diamond dependencies, and peek()', () => {
  const root = signal(2);
  const left = computed(() => root.value * 3);
  const right = computed(() => root.value + 10);
  const diamond = computed(() => left.value + right.value);

  assert.equal(diamond.peek(), 18); // 6 + 12 without active effect
  root.value = 5;
  assert.equal(diamond.value, 30); // 15 + 15
  root.value = 10;
  assert.equal(diamond.peek(), 50); // 30 + 20
});

test('Signal Torture 3: conditional dependencies drop stale subscriptions completely', () => {
  const toggle = signal(true);
  const a = signal('A1');
  const b = signal('B1');
  let runs = 0;
  let last = '';

  const dispose = effect(() => {
    runs++;
    last = toggle.value ? a.value : b.value;
  });

  assert.equal(runs, 1);
  assert.equal(last, 'A1');
  assert.equal(a.subscribers.size, 1);
  assert.equal(b.subscribers.size, 0);

  // Switch branch to B -> A must no longer have subscriber!
  toggle.value = false;
  assert.equal(runs, 2);
  assert.equal(last, 'B1');
  assert.equal(a.subscribers.size, 0);
  assert.equal(b.subscribers.size, 1);

  // Mutating A must NOT trigger the effect
  a.value = 'A2';
  assert.equal(runs, 2);

  // Mutating B triggers the effect
  b.value = 'B2';
  assert.equal(runs, 3);
  assert.equal(last, 'B2');

  dispose();
  assert.equal(toggle.subscribers.size, 0);
  assert.equal(b.subscribers.size, 0);
});

test('Signal Torture 4: disposed effects and aborted AbortSignal never execute again', () => {
  const s = signal(0);
  let manualRuns = 0;
  const dispose = effect(() => {
    void s.value;
    manualRuns++;
  });
  dispose();
  s.value = 1;
  s.value = 2;
  assert.equal(manualRuns, 1);
  assert.equal(s.subscribers.size, 0);

  const ac = new AbortController();
  let abortRuns = 0;
  effect(() => {
    void s.value;
    abortRuns++;
  }, { signal: ac.signal });
  assert.equal(abortRuns, 1);
  ac.abort();
  s.value = 3;
  assert.equal(abortRuns, 1);
  assert.equal(s.subscribers.size, 0);

  // Pre-aborted signal immediately disposes
  let preAbortedRuns = 0;
  effect(() => {
    void s.value;
    preAbortedRuns++;
  }, { signal: ac.signal });
  s.value = 4;
  assert.equal(preAbortedRuns, 1);
  assert.equal(s.subscribers.size, 0);
});

test('Signal Torture 5: repeated updates never create duplicate subscriptions', () => {
  const s = signal(0);
  let runs = 0;
  const dispose = effect(() => {
    // Read same signal 3 times in one effect
    void (s.value + s.value + s.value);
    runs++;
  });

  for (let i = 1; i <= 50; i++) {
    s.value = i;
  }
  assert.equal(runs, 51);
  assert.equal(s.subscribers.size, 1);
  dispose();
});

test('Signal Torture 6: circular computed throws safely and self-mutating effect does not hang', () => {
  const a = computed(() => b.value + 1);
  const b = computed(() => a.value + 1);

  assert.throws(() => a.value, /Circular dependency/);

  // Self-mutating effect terminates cleanly instead of recursing infinitely
  const counter = signal(0);
  let runs = 0;
  const dispose = effect(() => {
    runs++;
    counter.value = counter.value + 1;
  });
  assert.equal(runs, 1);
  assert.equal(counter.value, 1);
  dispose();
});

test('Signal Torture 7: multiple components have zero cross-component state leakage', () => {
  const b1 = document.createElement('el-badge');
  const b2 = document.createElement('el-badge');
  b1.setAttribute('count', '10');
  b2.setAttribute('count', '99');
  document.body.append(b1, b2);

  b1.count.value = '42';
  assert.equal(b1.count.value, '42');
  assert.equal(b2.count.value, '99');
  b1.remove();
  b2.remove();
});

test('Signal Torture 8: randomized DAG fuzzing matches reference evaluator across 100 random graphs', () => {
  // Deterministic PRNG (Mulberry32) so CI is 100% reproducible
  let seed = 0x51a9a1;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let trial = 0; trial < 100; trial++) {
    const numRoots = 4;
    const numDerived = 8;
    const rootVals = Array.from({ length: numRoots }, () => Math.floor(rand() * 20) - 10);
    const rootSigs = rootVals.map((v) => signal(v));

    // Build random DAG where node i only depends on nodes < i
    const nodes = rootSigs.map((sig, idx) => ({ sig, evalRef: () => rootVals[idx] }));

    for (let i = 0; i < numDerived; i++) {
      const parentA = Math.floor(rand() * nodes.length);
      const parentB = Math.floor(rand() * nodes.length);
      const op = Math.floor(rand() * 3); // 0: add, 1: sub, 2: conditional

      const nodeA = nodes[parentA];
      const nodeB = nodes[parentB];

      const sig = computed(() => {
        if (op === 0) return nodeA.sig.value + nodeB.sig.value;
        if (op === 1) return nodeA.sig.value - nodeB.sig.value;
        return nodeA.sig.value > 0 ? nodeB.sig.value * 2 : -nodeB.sig.value;
      });
      const evalRef = () => {
        if (op === 0) return nodeA.evalRef() + nodeB.evalRef();
        if (op === 1) return nodeA.evalRef() - nodeB.evalRef();
        return nodeA.evalRef() > 0 ? nodeB.evalRef() * 2 : -nodeB.evalRef();
      };
      nodes.push({ sig, evalRef });
    }

    const leaf = nodes[nodes.length - 1];
    let observed = null;
    const dispose = effect(() => {
      observed = leaf.sig.value;
    });

    assert.equal(observed, leaf.evalRef());

    // Mutate random roots 10 times per graph and verify exact equivalence
    for (let step = 0; step < 10; step++) {
      const idx = Math.floor(rand() * numRoots);
      const nextVal = Math.floor(rand() * 40) - 20;
      rootVals[idx] = nextVal;
      rootSigs[idx].value = nextVal;
      assert.equal(observed, leaf.evalRef(), `Mismatch at trial=${trial} step=${step}`);
    }

    dispose();
  }
});
