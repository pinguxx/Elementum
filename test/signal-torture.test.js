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

test('Signal Torture 8: exception inside effect restores activeEffect stack cleanly', () => {
  const trigger = signal(0);
  const healthy = signal('ok');

  let threw = false;
  const disposeBad = effect(() => {
    if (trigger.value === 1) {
      throw new Error('boom inside effect');
    }
  });

  assert.throws(() => {
    trigger.value = 1;
  }, /boom inside effect/);
  threw = true;
  assert.equal(threw, true);

  // Subsequent effects must track cleanly (activeEffect was properly popped in finally)
  let observed = '';
  const disposeGood = effect(() => {
    observed = healthy.value;
  });
  healthy.value = 'still-reactive';
  assert.equal(observed, 'still-reactive');

  disposeBad();
  disposeGood();
});

test('Signal Torture 9: 1,000-graph multi-seed DAG fuzzer with deep chains & random disposal', () => {
  const SEEDS = [0x51a9a1, 0xc0ffee, 0xdeadbeef, 0x20260301, 0x99887766];
  const GRAPHS_PER_SEED = 200; // 5 seeds x 200 = 1,000 randomized graphs

  for (const initialSeed of SEEDS) {
    let seed = initialSeed;
    const rand = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let trial = 0; trial < GRAPHS_PER_SEED; trial++) {
      const numRoots = 5;
      const numDerived = 12; // Deeper chains
      const rootVals = Array.from({ length: numRoots }, () => Math.floor(rand() * 20) - 10);
      const rootSigs = rootVals.map((v) => signal(v));

      const nodes = rootSigs.map((sig, idx) => ({ sig, evalRef: () => rootVals[idx] }));

      for (let i = 0; i < numDerived; i++) {
        const parentA = Math.floor(rand() * nodes.length);
        const parentB = Math.floor(rand() * nodes.length);
        const op = Math.floor(rand() * 4); // add, sub, conditional, max

        const nodeA = nodes[parentA];
        const nodeB = nodes[parentB];

        const sig = computed(() => {
          if (op === 0) return nodeA.sig.value + nodeB.sig.value;
          if (op === 1) return nodeA.sig.value - nodeB.sig.value;
          if (op === 2) return nodeA.sig.value > 0 ? nodeB.sig.value * 2 : -nodeB.sig.value;
          return Math.max(nodeA.sig.value, nodeB.sig.value);
        });
        const evalRef = () => {
          if (op === 0) return nodeA.evalRef() + nodeB.evalRef();
          if (op === 1) return nodeA.evalRef() - nodeB.evalRef();
          if (op === 2) return nodeA.evalRef() > 0 ? nodeB.evalRef() * 2 : -nodeB.evalRef();
          return Math.max(nodeA.evalRef(), nodeB.evalRef());
        };
        nodes.push({ sig, evalRef });
      }

      const leaf = nodes[nodes.length - 1];
      let observed = null;
      let auxObserved = null;
      const disposeLeaf = effect(() => {
        observed = leaf.sig.value;
      });
      const disposeAux = effect(() => {
        auxObserved = nodes[Math.floor(nodes.length / 2)].sig.value;
      });

      assert.equal(observed, leaf.evalRef(), `Initial mismatch seed=${initialSeed} trial=${trial}`);

      for (let step = 0; step < 8; step++) {
        if (step === 4) disposeAux(); // Mid-run subscription disposal
        const idx = Math.floor(rand() * numRoots);
        const nextVal = Math.floor(rand() * 40) - 20;
        rootVals[idx] = nextVal;
        rootSigs[idx].value = nextVal;
        assert.equal(observed, leaf.evalRef(), `Mismatch seed=${initialSeed} trial=${trial} step=${step}`);
      }

      const frozenAux = auxObserved;
      rootSigs[0].value = rootVals[0] + 99;
      assert.equal(auxObserved, frozenAux, 'Disposed aux effect must not re-run');

      disposeLeaf();
    }
  }
});

test('Signal Torture 10: dynamic topology rewiring fuzzer (500 runs) verifies exact values & zero stale subscribers', () => {
  let seed = 0x70f0106;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const mode = signal(0); // dynamically selects which branch is active: 0, 1, or 2
  const branches = [signal(1), signal(2), signal(3)];
  const nested = [
    computed(() => branches[0].value * 10),
    computed(() => branches[1].value * 20),
    computed(() => branches[2].value * 30),
  ];
  const dynamicRouter = computed(() => nested[mode.value].value + mode.value);

  let observed = null;
  let effectRuns = 0;
  const dispose = effect(() => {
    effectRuns++;
    observed = dynamicRouter.value;
  });

  const evalRef = () => {
    const m = mode.peek();
    const mult = (m + 1) * 10;
    return branches[m].peek() * mult + m;
  };

  assert.equal(observed, evalRef());

  for (let i = 0; i < 500; i++) {
    const action = Math.floor(rand() * 3);
    if (action === 0) {
      // Switch active topology branch
      mode.value = Math.floor(rand() * 3);
      assert.equal(observed, evalRef(), `Mode switch mismatch at step ${i}`);
      // Verify ONLY the currently active nested computed is subscribed to the active branch
      const activeIdx = mode.peek();
      for (let b = 0; b < 3; b++) {
        if (b !== activeIdx) {
          const runsBefore = effectRuns;
          branches[b].value = branches[b].peek() + 1;
          assert.equal(effectRuns, runsBefore, `Inactive branch ${b} leaked subscriber at step ${i}`);
        }
      }
    } else {
      // Mutate active branch
      const activeIdx = mode.peek();
      branches[activeIdx].value = Math.floor(rand() * 100) - 50;
      assert.equal(observed, evalRef(), `Active branch mismatch at step ${i}`);
    }
  }

  dispose();
  assert.equal(dynamicRouter.subscribers.size, 0);
});
