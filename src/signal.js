/**
 * Elementum Micro-Signals
 * Fine-grained reactive primitives in ~80 lines.
 */

let activeEffect = null;
const effectStack = [];

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
      // Copy subscribers set before iterating in case effects modify subscriptions
      const subs = Array.from(this.subscribers);
      for (const sub of subs) {
        sub.run();
      }
    }
  }

  peek() {
    return this._value;
  }

  toString() {
    return String(this.value);
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
    this._computedEffect = new ReactiveEffect(() => {
      this._dirty = true;
      // Notify downstreams
      const subs = Array.from(this.subscribers);
      for (const sub of subs) {
        sub.run();
      }
    });
  }

  get value() {
    if (this._dirty) {
      effectStack.push(activeEffect);
      activeEffect = this._computedEffect;
      this._computedEffect.cleanup();
      try {
        this._value = this._getter();
        this._dirty = false;
      } finally {
        activeEffect = effectStack.pop();
      }
    }
    if (activeEffect) {
      this.subscribers.add(activeEffect);
      activeEffect.dependencies.add(this);
    }
    return this._value;
  }
}

export function computed(getter) {
  return new Computed(getter);
}

class ReactiveEffect {
  constructor(fn) {
    this.fn = fn;
    this.dependencies = new Set();
    this.active = true;
  }

  run() {
    if (!this.active) return;
    this.cleanup();
    effectStack.push(activeEffect);
    activeEffect = this;
    try {
      this.fn();
    } finally {
      activeEffect = effectStack.pop();
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
  const reactiveEffect = new ReactiveEffect(fn);
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
