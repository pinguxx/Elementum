/**
 * Zero-dependency motion primitives (springs, WAAPI FLIP, IntersectionObserver reveal, pointer tracking).
 */

import { signal as createSignal } from '../signal.js';

function isReducedMotionNow() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

const SPRING_PRESETS = {
  snappy: { stiffness: 320, damping: 28, mass: 1 },
  gentle: { stiffness: 160, damping: 22, mass: 1 },
  bouncy: { stiffness: 280, damping: 16, mass: 1 },
  stiff: { stiffness: 450, damping: 34, mass: 1 },
};

function evaluateSpring(t, stiffness, damping, mass, velocity) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1 - 1e-6) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const b = (zeta * w0 - velocity) / wd;
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + b * Math.sin(wd * t));
  }
  if (zeta <= 1 + 1e-6) {
    return 1 - Math.exp(-w0 * t) * (1 + (w0 - velocity) * t);
  }
  const g = w0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * zeta + g;
  const r2 = -w0 * zeta - g;
  const c2 = (r1 + velocity) / (2 * g);
  return 1 - ((1 - c2) * Math.exp(r1 * t) + c2 * Math.exp(r2 * t));
}

/**
 * Computes a CSS `linear(...)` damped harmonic spring timing function with zero runtime dependencies.
 *
 * @param {{ preset?: 'snappy'|'gentle'|'bouncy'|'stiff', stiffness?: number, damping?: number, mass?: number, velocity?: number, steps?: number }} [options]
 */
export function createSpringEasing(options = {}) {
  const preset = options.preset ? SPRING_PRESETS[options.preset] : null;
  const stiffness = Math.max(10, Number(options.stiffness ?? preset?.stiffness) || 260);
  const damping = Math.max(1, Number(options.damping ?? preset?.damping) || 24);
  const mass = Math.max(0.1, Number(options.mass ?? preset?.mass) || 1);
  const velocity = Number(options.velocity) || 0;
  const steps = Math.max(4, Math.min(64, Math.round(Number(options.steps) || 32)));

  let settled = 0.01;
  for (let t = 0.01, prev = 0, calm = 0; t <= 2.0; t += 0.01) {
    const val = evaluateSpring(t, stiffness, damping, mass, velocity);
    calm = Math.abs(1 - val) < 0.001 && Math.abs(val - prev) < 0.0005 ? calm + 1 : 0;
    prev = val;
    settled = t;
    if (calm >= 5) break;
  }

  const duration = Math.max(100, Math.round(settled * 1000));
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    if (i === 0) return 0;
    if (i === steps) return 1;
    const t = (i / steps) * (duration / 1000);
    return Math.round(evaluateSpring(t, stiffness, damping, mass, velocity) * 10000) / 10000;
  });

  return { easing: `linear(${points.join(', ')})`, duration, points };
}

/**
 * WAAPI First-Last-Invert-Play (FLIP) transition & sliding indicator controller.
 *
 * @param {HTMLElement | ShadowRoot | null} [container]
 * @param {{ duration?: number, easing?: string, respectReducedMotion?: boolean }} [options]
 */
export function createFlipBehavior(container, options = {}) {
  const { duration = 260, easing = 'cubic-bezier(0.16, 1, 0.3, 1)', respectReducedMotion = true } = options;
  const rects = new WeakMap();

  const capture = (elements) => {
    for (const el of Array.from(elements || [])) {
      if (el && typeof el.getBoundingClientRect === 'function') {
        rects.set(el, el.getBoundingClientRect());
      }
    }
  };

  const play = (elements) => {
    const reduced = respectReducedMotion && isReducedMotionNow();
    let animatedCount = 0;
    for (const el of Array.from(elements || [])) {
      const prev = rects.get(el);
      if (!prev || !el || typeof el.getBoundingClientRect !== 'function') continue;
      const next = el.getBoundingClientRect();
      rects.set(el, next);

      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      const sx = next.width ? prev.width / next.width : 1;
      const sy = next.height ? prev.height / next.height : 1;
      if (reduced || typeof el.animate !== 'function') continue;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01) {
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: 'none' }],
          { duration, easing }
        );
        animatedCount++;
      }
    }
    return animatedCount;
  };

  const glideIndicator = (indicator, target, glideOpts = {}) => {
    if (!indicator || !target) return false;
    let x = target.offsetLeft || 0;
    let y = target.offsetTop || 0;
    let width = target.offsetWidth || 0;
    let height = target.offsetHeight || 0;
    if (width <= 0 && typeof target.getBoundingClientRect === 'function') {
      const targetRect = target.getBoundingClientRect();
      const parentRect = (container || target.parentElement)?.getBoundingClientRect?.();
      if (targetRect.width > 0 && parentRect) {
        x = targetRect.left - parentRect.left;
        y = targetRect.top - parentRect.top;
        width = targetRect.width;
        height = targetRect.height;
      }
    }
    if (width <= 0) return false;

    const rx = Math.round(x);
    const ry = Math.round(y);
    const rw = Math.round(width);
    const rh = Math.round(height);
    for (const [key, val] of [['x', rx], ['y', ry], ['width', rw], ['height', rh]]) {
      indicator.style.setProperty(`--el-indicator-${key}`, `${val}px`);
    }
    indicator.style.width = `${rw}px`;
    indicator.style.transform = glideOpts.vertical ? `translateY(${ry}px)` : `translateX(${rx}px)`;
    indicator.setAttribute('data-ready', 'true');
    return true;
  };

  return { capture, play, glideIndicator };
}

/**
 * IntersectionObserver scroll-reveal signal helper with automatic `prefers-reduced-motion` fallback.
 *
 * @param {Element | (() => Element | null)} target
 * @param {{ threshold?: number | number[], rootMargin?: string, once?: boolean, respectReducedMotion?: boolean, onEnter?: () => void, onLeave?: () => void, signal?: AbortSignal }} [options]
 */
export function createInViewBehavior(target, options = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px',
    once = true,
    respectReducedMotion = true,
    onEnter,
    onLeave,
    signal: abortSignal,
  } = options;
  const inView = createSignal(false);
  const el = typeof target === 'function' ? target() : target;
  let observer = null;

  const destroy = () => {
    observer?.disconnect();
    observer = null;
  };

  const setState = (next) => {
    inView.value = next;
    el?.setAttribute('data-in-view', next ? 'true' : 'false');
    if (next) onEnter?.();
    else onLeave?.();
  };

  if (!el || (respectReducedMotion && isReducedMotionNow()) || typeof IntersectionObserver !== 'function') {
    setState(true);
    return { inView, destroy };
  }

  el.setAttribute('data-in-view', 'false');
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        if (!inView.value) setState(true);
        if (once) destroy();
      } else if (!once && inView.value) {
        setState(false);
      }
    },
    { threshold, rootMargin }
  );
  observer.observe(el);

  if (abortSignal) {
    if (abortSignal.aborted) destroy();
    else abortSignal.addEventListener('abort', destroy, { once: true });
  }

  return { inView, destroy };
}

/**
 * Tracks pointer movement on an element and writes normalized CSS variables
 * (`--el-pointer-x`, `--el-pointer-y`, `--el-tilt-x`, `--el-tilt-y`, `--el-shift-x`, `--el-shift-y`).
 *
 * @param {HTMLElement} target
 * @param {{ maxTilt?: number, maxShift?: number, respectReducedMotion?: boolean, signal?: AbortSignal }} [options]
 */
export function createPointerTracker(target, options = {}) {
  const { maxTilt = 8, maxShift = 8, respectReducedMotion = true, signal: abortSignal } = options;
  const active = createSignal(false);
  if (!target || typeof target.addEventListener !== 'function') {
    return { active, reset: () => {}, destroy: () => {} };
  }

  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const setVars = (px, py, tx, ty, sx, sy, isActive) => {
    active.value = isActive;
    for (const [key, val] of [
      ['pointer-x', `${px.toFixed(1)}%`],
      ['pointer-y', `${py.toFixed(1)}%`],
      ['tilt-x', `${tx.toFixed(2)}deg`],
      ['tilt-y', `${ty.toFixed(2)}deg`],
      ['shift-x', `${sx.toFixed(2)}px`],
      ['shift-y', `${sy.toFixed(2)}px`],
    ]) {
      target.style.setProperty(`--el-${key}`, val);
    }
    if (isActive) target.setAttribute('data-pointer-active', 'true');
    else target.removeAttribute('data-pointer-active');
  };

  const reset = () => setVars(50, 50, 0, 0, 0, 0, false);
  reset();

  const controller = new AbortController();
  const sig = abortSignal ? AbortSignal.any([controller.signal, abortSignal]) : controller.signal;

  target.addEventListener(
    'pointermove',
    (e) => {
      if (respectReducedMotion && isReducedMotionNow()) return;
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = clamp01((e.clientX - rect.left) / rect.width);
      const ny = clamp01((e.clientY - rect.top) / rect.height);
      const dx = nx * 2 - 1;
      const dy = ny * 2 - 1;
      setVars(nx * 100, ny * 100, -dy * maxTilt, dx * maxTilt, dx * maxShift, dy * maxShift, true);
    },
    { signal: sig }
  );

  for (const evName of ['pointerleave', 'pointercancel']) {
    target.addEventListener(evName, reset, { signal: sig });
  }

  return {
    active,
    reset,
    destroy: () => {
      controller.abort();
      reset();
    },
  };
}
