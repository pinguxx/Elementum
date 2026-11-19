/**
 * Elementum Micro-Signals
 * Fine-grained reactive primitives in ~80 lines.
 */

let activeEffect = null;
const effectStack = [];
let batchDepth = 0;
const batchedSubscribers = new Set();
let pendingProbe = null;

function notifySubscribers(subscribers) {
  const subs = Array.from(subscribers);
  for (const sub of subs) {
    if (batchDepth > 0 && !sub._isComputed) {
      batchedSubscribers.add(sub);
    } else {
      sub.run();
    }
  }
}

/**
 * Group multiple signal writes into a single atomic notification pass.
 * Computed values still invalidate immediately so reads inside `batch()` stay fresh.
 */
export function batch(fn) {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && batchedSubscribers.size > 0) {
      const toRun = Array.from(batchedSubscribers);
      batchedSubscribers.clear();
      for (const sub of toRun) {
        sub.run();
      }
    }
  }
}

/**
 * Thrown by `AsyncSignal.read()` while an initial async computation is still unresolved.
 */
export class NotReadyError extends Error {
  constructor(message = 'Async signal value is not ready yet') {
    super(message);
    this.name = 'NotReadyError';
  }
}

export class Signal {
  constructor(initialValue) {
    this._value = initialValue;
    this.subscribers = new Set();
  }

  get value() {
    if (activeEffect) {
      this.subscribers.add(activeEffect);
      activeEffect.dependencies.add(this);
    }
    return this._value;
  }

  set value(newValue) {
    if (!Object.is(this._value, newValue)) {
      this._value = newValue;
      notifySubscribers(this.subscribers);
    }
  }

  peek() {
    return this._value;
  }

  subscribe(callback) {
    return effect(() => {
      callback(this.value);
    });
  }

  valueOf() {
    return this.value;
  }

  toString() {
    return String(this.value);
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return Number(this.value);
    }
    return String(this.value);
  }

  toUpperCase() {
    return String(this.value).toUpperCase();
  }

  toLowerCase() {
    return String(this.value).toLowerCase();
  }

  trim() {
    return String(this.value).trim();
  }

  slice(...args) {
    return String(this.value).slice(...args);
  }

  substring(...args) {
    return String(this.value).substring(...args);
  }

  includes(...args) {
    return String(this.value).includes(...args);
  }

  indexOf(...args) {
    return String(this.value).indexOf(...args);
  }

  startsWith(...args) {
    return String(this.value).startsWith(...args);
  }

  endsWith(...args) {
    return String(this.value).endsWith(...args);
  }

  get length() {
    return String(this.value).length;
  }
}

export function signal(initialValue) {
  return new Signal(initialValue);
}

export function isSignal(val) {
  return val instanceof Signal;
}

export class Computed extends Signal {
  constructor(getter) {
    super(undefined);
    this._getter = getter;
    this._dirty = true;
    this._computing = false;
    this._error = null;
    this._computedEffect = new ReactiveEffect(() => {
      if (this._dirty) return;
      this._dirty = true;
      notifySubscribers(this.subscribers);
    }, { isComputed: true });
  }

  get error() {
    return this._error;
  }

  #evaluate() {
    if (this._computing) {
      throw new Error('Circular dependency detected in computed signal');
    }
    this._computing = true;
    effectStack.push(activeEffect);
    activeEffect = this._computedEffect;
    this._computedEffect.cleanup();
    try {
      this._value = this._getter();
      this._error = null;
      this._dirty = false;
    } catch (err) {
      this._error = err;
      throw err;
    } finally {
      activeEffect = effectStack.pop();
      this._computing = false;
    }
  }

  get value() {
    if (this._dirty) {
      this.#evaluate();
    }
    if (activeEffect) {
      this.subscribers.add(activeEffect);
      activeEffect.dependencies.add(this);
    }
    return this._value;
  }

  peek() {
    if (this._dirty) {
      this.#evaluate();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new Computed(getter);
}

class ReactiveEffect {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.dependencies = new Set();
    this.active = true;
    this._running = false;
    this._isComputed = Boolean(options.isComputed);
    this._onError = typeof options.onError === 'function' ? options.onError : null;
  }

  run() {
    if (!this.active || this._running) return;
    this._running = true;
    this.cleanup();
    effectStack.push(activeEffect);
    activeEffect = this;
    try {
      this.fn();
    } catch (err) {
      if (this._onError) {
        this._onError(err);
      } else {
        throw err;
      }
    } finally {
      activeEffect = effectStack.pop();
      this._running = false;
    }
  }

  cleanup() {
    for (const dep of this.dependencies) {
      dep.subscribers.delete(this);
    }
    this.dependencies.clear();
  }

  stop() {
    this.active = false;
    this.cleanup();
  }
}

export function effect(fn, options = {}) {
  const reactiveEffect = new ReactiveEffect(fn, { onError: options.onError });
  reactiveEffect.run();

  const dispose = () => reactiveEffect.stop();

  if (options.signal) {
    if (options.signal.aborted) {
      dispose();
    } else {
      options.signal.addEventListener('abort', dispose, { once: true });
    }
  }

  return dispose;
}

function toStructuredError(err, attempt) {
  return {
    message: err instanceof Error ? err.message : String(err ?? 'Unknown async error'),
    name: err instanceof Error ? err.name : 'Error',
    cause: err,
    status: typeof err?.status === 'number' ? err.status : undefined,
    timestamp: Date.now(),
    attempt,
  };
}

/**
 * First-class reactive async signal with automatic dependency tracking,
 * AbortSignal race-condition cancellation, stale-while-revalidate `.value`,
 * structured `.error` details, and `.read()` (`NotReadyError`) support.
 */
export class AsyncSignal extends Signal {
  constructor(fetcher, options = {}) {
    super(options.initialValue);
    this._fetcher = fetcher;
    this._onError = typeof options.onError === 'function' ? options.onError : null;
    this._hasResolved = options.initialValue !== undefined;
    this._runId = 0;
    this._attempt = 0;
    this._abortController = null;
    this._disposed = false;

    this.pending = signal(false);
    this.status = signal(this._hasResolved ? 'resolved' : 'idle');
    this.error = signal(null);

    this._tracker = new ReactiveEffect(() => {
      this.#execute();
    });

    if (options.immediate !== false) {
      this._tracker.run();
    }

    if (options.signal) {
      if (options.signal.aborted) {
        this.dispose();
      } else {
        options.signal.addEventListener('abort', () => this.dispose(), { once: true });
      }
    }
  }

  #execute() {
    if (this._disposed) return;
    if (this._abortController) {
      this._abortController.abort();
    }
    const controller = new AbortController();
    this._abortController = controller;
    const runId = ++this._runId;
    const attempt = ++this._attempt;

    batch(() => {
      this.pending.value = true;
      this.status.value = 'pending';
    });

    let result;
    try {
      result = this._fetcher(controller.signal);
    } catch (err) {
      this.#handleFailure(runId, attempt, controller.signal, err);
      return;
    }

    Promise.resolve(result).then(
      (resolved) => {
        if (this._disposed || runId !== this._runId || controller.signal.aborted) return;
        if (this._abortController === controller) this._abortController = null;
        this._hasResolved = true;
        batch(() => {
          this.value = resolved;
          this.error.value = null;
          this.pending.value = false;
          this.status.value = 'resolved';
        });
      },
      (err) => {
        if (this._abortController === controller) this._abortController = null;
        this.#handleFailure(runId, attempt, controller.signal, err);
      }
    );
  }

  #handleFailure(runId, attempt, abortSig, err) {
    if (this._disposed || runId !== this._runId || abortSig.aborted || err?.name === 'AbortError') {
      return;
    }
    const details = toStructuredError(err, attempt);
    batch(() => {
      this.error.value = details;
      this.pending.value = false;
      this.status.value = 'errored';
    });
    if (this._onError) {
      this._onError(details);
    }
  }

  /**
   * Suspense-style strict read: throws `NotReadyError` while initial value is unresolved,
   * or re-throws the error if initial load failed. Keeps stale `.value` during refreshes.
   */
  read() {
    const isPend = this.pending.value;
    if (pendingProbe && isPend) {
      pendingProbe.pending = true;
    }
    const val = this.value;
    if (!this._hasResolved) {
      if (isPend || this.status.value === 'idle') {
        throw new NotReadyError();
      }
      if (this.error.value) {
        throw this.error.value.cause || new Error(this.error.value.message);
      }
    }
    return val;
  }

  get latest() {
    return this.value;
  }

  refetch() {
    if (this._disposed) return;
    this._tracker.run();
  }

  abort() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this.pending.value) {
      batch(() => {
        this.pending.value = false;
        this.status.value = this._hasResolved ? 'resolved' : 'idle';
      });
    }
  }

  mutate(nextValue) {
    this._hasResolved = true;
    batch(() => {
      this.value = nextValue;
      this.error.value = null;
      this.status.value = 'resolved';
    });
  }

  dispose() {
    this._disposed = true;
    this._runId++;
    this._tracker.stop();
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }
}

export function asyncSignal(fetcher, options = {}) {
  return new AsyncSignal(fetcher, options);
}

/**
 * Checks whether an `AsyncSignal` or reactive getter reading `.read()` is currently pending,
 * safely catching `NotReadyError` without crashing on unresolved async boundaries.
 */
export function isPending(source) {
  if (source instanceof AsyncSignal) {
    return source.pending.value;
  }
  if (typeof source !== 'function') return false;
  const prevProbe = pendingProbe;
  const probe = { pending: false };
  pendingProbe = probe;
  try {
    source();
    return probe.pending;
  } catch (err) {
    if (err instanceof NotReadyError) return true;
    throw err;
  } finally {
    pendingProbe = prevProbe;
  }
}
