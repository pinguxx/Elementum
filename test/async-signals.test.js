import test from 'node:test';
import assert from 'node:assert/strict';
import {
  signal,
  computed,
  effect,
  batch,
  asyncSignal,
  isPending,
  isSignal,
  NotReadyError,
} from '../src/signal.js';

test('batch() coalesces multiple signal writes into a single effect run while keeping computed reads fresh', () => {
  const a = signal(1);
  const b = signal(2);
  const sum = computed(() => a.value + b.value);

  const seen = [];
  const dispose = effect(() => {
    seen.push(sum.value);
  });
  assert.deepEqual(seen, [3]);

  let midBatchSum = 0;
  batch(() => {
    a.value = 10;
    b.value = 20;
    midBatchSum = sum.value; // must reflect updated value inside batch
  });

  assert.equal(midBatchSum, 30);
  assert.deepEqual(seen, [3, 30], 'Effect should only run once after batch completes');
  dispose();
});

test('asyncSignal() tracks reactive dependencies, cancels stale races via AbortSignal, and holds stale value while refreshing', async () => {
  const query = signal('first');
  const abortedSignals = [];
  const resolvers = new Map();

  const data = asyncSignal((abortSig) => {
    const q = query.value; // synchronous reactive dependency
    abortSig.addEventListener('abort', () => abortedSignals.push(q));
    return new Promise((resolve) => {
      resolvers.set(q, resolve);
    });
  });

  assert.equal(isSignal(data), true);
  assert.equal(data.pending.value, true);
  assert.equal(data.status.value, 'pending');
  assert.equal(isPending(data), true);
  assert.equal(isPending(() => data.read()), true);
  assert.throws(() => data.read(), NotReadyError);

  // Resolve initial request
  resolvers.get('first')('result-1');
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(data.value, 'result-1');
  assert.equal(data.latest, 'result-1');
  assert.equal(data.read(), 'result-1');
  assert.equal(data.pending.value, false);
  assert.equal(data.status.value, 'resolved');
  assert.equal(isPending(() => data.read()), false);

  // Trigger rapid second & third queries -> second must be aborted, stale value stays visible
  query.value = 'second';
  assert.equal(data.pending.value, true);
  assert.equal(data.value, 'result-1', 'Stale-while-revalidate preserves last resolved value');
  assert.equal(isPending(() => data.read()), true);

  query.value = 'third';
  assert.deepEqual(abortedSignals, ['second'], 'In-flight stale request must be aborted');

  // Even if stale "second" resolves AFTER "third", it must be ignored
  resolvers.get('third')('result-3');
  await Promise.resolve();
  resolvers.get('second')('stale-2');
  await Promise.resolve();

  assert.equal(data.value, 'result-3');
  assert.equal(data.pending.value, false);
  assert.equal(data.status.value, 'resolved');

  data.dispose();
});

test('asyncSignal() exposes structured error details, onError hook, refetch, mutate, abort, and AbortSignal disposal', async () => {
  const errors = [];
  let shouldFail = true;
  const ac = new AbortController();

  const res = asyncSignal(
    async () => {
      if (shouldFail) {
        const err = new Error('Gateway timeout');
        err.status = 504;
        throw err;
      }
      return { ok: true };
    },
    { onError: (details) => errors.push(details), signal: ac.signal }
  );

  await new Promise((r) => setTimeout(r, 10));
  assert.equal(res.status.value, 'errored');
  assert.equal(res.pending.value, false);
  assert.equal(res.error.value.message, 'Gateway timeout');
  assert.equal(res.error.value.status, 504);
  assert.equal(res.error.value.attempt, 1);
  assert.equal(errors.length, 1);
  assert.throws(() => res.read(), /Gateway timeout/);

  // Retry succeeds and clears error
  shouldFail = false;
  res.refetch();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(res.status.value, 'resolved');
  assert.equal(res.error.value, null);
  assert.deepEqual(res.value, { ok: true });

  // Optimistic mutate
  res.mutate({ ok: 'optimistic' });
  assert.deepEqual(res.value, { ok: 'optimistic' });

  // Abort cancels pending without setting error
  const slow = asyncSignal(() => new Promise(() => {}));
  assert.equal(slow.pending.value, true);
  slow.abort();
  assert.equal(slow.pending.value, false);
  assert.equal(slow.error.value, null);
  slow.dispose();

  ac.abort();
});

test('Computed.error and effect({ onError }) isolate and report reactive exceptions cleanly', () => {
  const count = signal(1);
  const risky = computed(() => {
    if (count.value === 0) throw new Error('Division by zero');
    return 100 / count.value;
  });

  const caught = [];
  const dispose = effect(
    () => {
      void risky.value;
    },
    { onError: (err) => caught.push(err.message) }
  );

  assert.equal(risky.value, 100);
  assert.equal(risky.error, null);

  count.value = 0;
  assert.deepEqual(caught, ['Division by zero']);
  assert.ok(risky.error instanceof Error);

  // Recovers automatically when dependency becomes valid again
  count.value = 4;
  assert.equal(risky.value, 25);
  assert.equal(risky.error, null);
  dispose();
});

test('Computed throwing on initial evaluation still re-runs dependent effect and recovers when upstream changes', () => {
  const denom = signal(0);
  const ratio = computed(() => {
    if (denom.value === 0) throw new Error('Zero denominator');
    return 100 / denom.value;
  });

  const seen = [];
  const errs = [];
  const dispose = effect(
    () => {
      seen.push(ratio.value);
    },
    { onError: (e) => errs.push(e.message) }
  );

  assert.deepEqual(errs, ['Zero denominator']);
  assert.deepEqual(seen, []);
  // Cached error also re-throws cleanly on direct peek() while dirty is false
  assert.throws(() => ratio.peek(), /Zero denominator/);

  // Updating upstream dependency automatically invalidates & recovers the effect
  denom.value = 2;
  assert.deepEqual(seen, [50]);
  assert.equal(ratio.error, null);
  assert.equal(ratio.peek(), 50);

  // Toggling back to error and recovering again also works automatically
  denom.value = 0;
  assert.equal(errs.length, 2);
  denom.value = 5;
  assert.deepEqual(seen, [50, 20]);
  dispose();
});
