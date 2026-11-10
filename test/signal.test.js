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

test('signal string conversion, primitive coercion, and string methods', () => {
  const text = signal('  hello world  ');
  assert.equal(String(text), '  hello world  ');
  assert.equal(`${text}`, '  hello world  ');
  assert.equal(text.trim(), 'hello world');
  assert.equal(text.trim().toUpperCase(), 'HELLO WORLD');
  assert.equal(text.toUpperCase(), '  HELLO WORLD  ');
  assert.equal(text.toLowerCase(), '  hello world  ');
  assert.equal(text.slice(2, 7), 'hello');
  assert.equal(text.substring(2, 7), 'hello');
  assert.equal(text.includes('world'), true);
  assert.equal(text.indexOf('hello'), 2);
  assert.equal(text.startsWith('  '), true);
  assert.equal(text.endsWith('  '), true);
  assert.equal(text.length, 15);
  assert.equal(text.valueOf(), '  hello world  ');

  const num = signal(42);
  assert.equal(Number(num), 42);
  assert.equal(+num, 42);
  assert.equal(num.valueOf(), 42);
});
