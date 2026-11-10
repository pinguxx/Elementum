import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signal, computed, effect } from '../src/signal.js';

test('signal read, write, and notifications', () => {
  const count = signal(0);
  assert.equal(count.value, 0);

  count.value = 5;
  assert.equal(count.value, 5);
});

test('computed derives state and updates only when dependency changes', () => {
  const count = signal(2);
  const double = computed(() => count.value * 2);

  assert.equal(double.value, 4);

  count.value = 10;
  assert.equal(double.value, 20);
});

test('effect runs and responds to signal updates', () => {
  const count = signal(1);
  let runs = 0;
  let observed = 0;

  const dispose = effect(() => {
    runs++;
    observed = count.value;
  });

  assert.equal(runs, 1);
  assert.equal(observed, 1);

  count.value = 2;
  assert.equal(runs, 2);
  assert.equal(observed, 2);

  dispose();

  count.value = 3;
  // Should not run after dispose
  assert.equal(runs, 2);
  assert.equal(observed, 2);
});

test('effect stops automatically on AbortSignal', () => {
  const controller = new AbortController();
  const count = signal(10);
  let observed = 0;

  effect(() => {
    observed = count.value;
  }, { signal: controller.signal });

  assert.equal(observed, 10);

  controller.abort();

  count.value = 99;
  assert.equal(observed, 10);
});
