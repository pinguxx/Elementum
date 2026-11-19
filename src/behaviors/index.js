/**
 * Elementum Behavior Controllers (@wcomp/elementum/behaviors)
 * Zero-dependency, React-Aria-inspired interaction, accessibility, i18n/RTL,
 * selection, reorder/DnD, and state-reflection primitives built on standard DOM APIs and AbortSignal.
 */

import { signal as createSignal } from '../signal.js';
import { html } from '../template.js';

let lastInteractionModality = 'pointer';
let modalityListenersAttached = false;

function ensureModalityTracking() {
  if (modalityListenersAttached || typeof window === 'undefined') return;
  modalityListenersAttached = true;

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      lastInteractionModality = 'keyboard';
    },
    true
  );

  const setPointer = () => {
    lastInteractionModality = 'pointer';
  };
  window.addEventListener('pointerdown', setPointer, true);
  window.addEventListener('mousedown', setPointer, true);
  window.addEventListener('touchstart', setPointer, { capture: true, passive: true });
}

/**
 * Reflect a standardized interaction/component state onto a host element
 * using BOTH `data-<name>` attributes (for universal CSS / Tailwind selectors)
 * and native `ElementInternals.states` (`:state(<name>)`) when available.
 */
export function setHostState(host, name, active) {
  if (!host || !name) return;
  const attr = `data-${name}`;
  if (active) {
    if (!host.hasAttribute?.(attr)) {
      host.setAttribute?.(attr, '');
    }
    try {
      host.internals?.states?.add(name);
    } catch {
      // Ignore environments without CustomStateSet support
    }
  } else {
    if (host.hasAttribute?.(attr)) {
      host.removeAttribute?.(attr);
    }
    try {
      host.internals?.states?.delete(name);
    } catch {
      // Ignore environments without CustomStateSet support
    }
  }
}

/**
 * Detect whether an element (or document) is in a Right-to-Left (RTL) writing direction.
 */
export function isRTL(el) {
  if (el && typeof el.closest === 'function') {
    const dirAncestor = el.closest('[dir]');
    if (dirAncestor) {
      const dir = (dirAncestor.getAttribute('dir') || '').toLowerCase();
      if (dir === 'rtl') return true;
      if (dir === 'ltr') return false;
    }
  }
  if (typeof document !== 'undefined') {
    const docDir = (document.documentElement?.getAttribute?.('dir') || document.dir || '').toLowerCase();
    if (docDir === 'rtl') return true;
  }
  return false;
}

/**
 * Locale-aware number formatting using native Intl.NumberFormat (0 runtime deps).
 */
export function formatLocaleNumber(value, locale = 'en-US', options = {}) {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? '');
  try {
    return new Intl.NumberFormat(locale || 'en-US', options).format(num);
  } catch {
    return String(num);
  }
}

/**
 * Locale-aware date formatting using native Intl.DateTimeFormat (0 runtime deps).
 */
export function formatLocaleDate(date, locale = 'en-US', options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date ?? '');
  try {
    return new Intl.DateTimeFormat(locale || 'en-US', options).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// ==========================================
// 1. LiveAnnouncer (Screen-Reader Live Region)
// ==========================================

const ANNOUNCER_STYLE =
  'position:fixed;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;';

function getLiveRegion(politeness) {
  if (typeof document === 'undefined' || !document.body) return null;
  const mode = politeness === 'assertive' ? 'assertive' : 'polite';
  const id = `el-live-announcer-${mode}`;
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', mode === 'assertive' ? 'alert' : 'status');
    region.setAttribute('aria-live', mode);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('style', ANNOUNCER_STYLE);
    document.body.appendChild(region);
  }
  return region;
}

/**
 * Announce a dynamic status update to assistive technologies (VoiceOver, NVDA, JAWS, TalkBack).
 */
export function announce(message, politeness = 'polite') {
  if (!message) return;
  const region = getLiveRegion(politeness);
  if (!region) return;
  const text = String(message);
  // Clear first so identical consecutive announcements still trigger AT output
  if (region.textContent === text) {
    region.textContent = '';
  }
  region.textContent = text;
}

/**
 * Clear active live-region announcements.
 */
export function clearAnnouncer() {
  if (typeof document === 'undefined') return;
  for (const mode of ['polite', 'assertive']) {
    const region = document.getElementById(`el-live-announcer-${mode}`);
    if (region) region.textContent = '';
  }
}

// ==========================================
// 2. Press, Hover & Focus-Visible Behavior
// ==========================================

/**
 * Normalizes mouse, touch, and keyboard interactions on an element:
 * - Reflects `data-pressed`, `data-hovered`, `data-focused`, `data-focus-visible` (and `:state(...)`)
 * - Ignores synthetic hover on touch pointers (`pointerType === 'touch'`) to prevent sticky hover on mobile
 * - Handles Enter / Space keyboard press consistently
 */
export function createPressBehavior(
  host,
  target = host,
  { isDisabled = () => false, onPress = null, signal = host?.signal } = {}
) {
  if (!host || !target) return () => {};
  ensureModalityTracking();

  const controller = new AbortController();
  const abortSignal = controller.signal;
  if (signal) {
    if (signal.aborted) return () => {};
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let pressed = false;
  const setPressed = (val) => {
    pressed = Boolean(val);
    setHostState(host, 'pressed', pressed);
  };

  target.addEventListener(
    'pointerenter',
    (e) => {
      if (isDisabled() || e.pointerType === 'touch') return;
      setHostState(host, 'hovered', true);
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'pointerleave',
    () => {
      setHostState(host, 'hovered', false);
      if (pressed) setPressed(false);
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'pointerdown',
    (e) => {
      if (isDisabled() || (e.button !== undefined && e.button !== 0)) return;
      lastInteractionModality = 'pointer';
      setPressed(true);
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'pointerup',
    (e) => {
      if (!pressed) return;
      setPressed(false);
      if (!isDisabled() && typeof onPress === 'function') {
        onPress(e);
      }
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'pointercancel',
    () => {
      if (pressed) setPressed(false);
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'keydown',
    (e) => {
      if (isDisabled()) return;
      if (e.key === 'Enter' || e.key === ' ') {
        setPressed(true);
      }
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'keyup',
    (e) => {
      if (!pressed) return;
      if (e.key === 'Enter' || e.key === ' ') {
        setPressed(false);
        if (!isDisabled() && typeof onPress === 'function') {
          onPress(e);
        }
      }
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'focus',
    () => {
      if (isDisabled()) return;
      setHostState(host, 'focused', true);
      const isKeyboard = lastInteractionModality === 'keyboard' || Boolean(target.matches?.(':focus-visible'));
      setHostState(host, 'focus-visible', isKeyboard);
    },
    { signal: abortSignal }
  );

  target.addEventListener(
    'blur',
    () => {
      setHostState(host, 'focused', false);
      setHostState(host, 'focus-visible', false);
      if (pressed) setPressed(false);
    },
    { signal: abortSignal }
  );

  return () => {
    controller.abort();
    setHostState(host, 'pressed', false);
    setHostState(host, 'hovered', false);
    setHostState(host, 'focused', false);
    setHostState(host, 'focus-visible', false);
  };
}

// ==========================================
// 3. Roving Focus + Typeahead + RTL Behavior
// ==========================================

/**
 * Manages roving tabindex keyboard navigation across composite widgets
 * (tabs, toolbars, menus, radio groups, listboxes, tree views) with
 * automatic RTL (`dir="rtl"`) reversal and 500ms typeahead character search.
 */
export function createRovingFocus(
  host,
  {
    getItems,
    orientation = 'horizontal',
    loop = true,
    typeahead = true,
    onFocusItem = null,
    signal = host?.signal,
  } = {}
) {
  if (!host || typeof getItems !== 'function') return () => {};

  const controller = new AbortController();
  const abortSignal = controller.signal;
  if (signal) {
    if (signal.aborted) return () => {};
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let typeBuffer = '';
  let typeTimer = null;

  function focusIndex(items, idx) {
    if (!items.length) return;
    const bounded = loop
      ? (idx + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, idx));

    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === bounded ? '0' : '-1');
    });
    const target = items[bounded];
    target?.focus?.();
    if (typeof onFocusItem === 'function') {
      onFocusItem(target, bounded);
    }
  }

  host.addEventListener(
    'keydown',
    (e) => {
      const items = (getItems() || []).filter(
        (el) =>
          el &&
          !el.disabled &&
          !el.hidden &&
          !el.hasAttribute?.('disabled') &&
          !el.hasAttribute?.('hidden') &&
          el.getAttribute?.('aria-disabled') !== 'true' &&
          el.getAttribute?.('aria-hidden') !== 'true' &&
          el.style?.display !== 'none'
      );
      if (!items.length) return;

      const activeEl = host.shadowRoot?.activeElement || document.activeElement;
      const currentIdx = items.findIndex((item) => item === activeEl || item === e.target || item.contains?.(e.target));
      if (currentIdx === -1 && e.target !== host) return;
      const orient = typeof orientation === 'function' ? orientation() : orientation;
      const rtl = isRTL(host);

      const nextKey = orient === 'vertical' ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight');
      const prevKey = orient === 'vertical' ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');

      if (e.key === nextKey || (orient === 'both' && (e.key === 'ArrowRight' || e.key === 'ArrowDown'))) {
        e.preventDefault();
        e.stopPropagation();
        focusIndex(items, currentIdx === -1 ? 0 : currentIdx + 1);
        return;
      }

      if (e.key === prevKey || (orient === 'both' && (e.key === 'ArrowLeft' || e.key === 'ArrowUp'))) {
        e.preventDefault();
        e.stopPropagation();
        focusIndex(items, currentIdx === -1 ? items.length - 1 : currentIdx - 1);
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        focusIndex(items, 0);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        focusIndex(items, items.length - 1);
        return;
      }

      if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typeBuffer += e.key.toLocaleLowerCase();
        if (typeTimer) clearTimeout(typeTimer);
        typeTimer = setTimeout(() => {
          typeBuffer = '';
        }, 500);

        const start = currentIdx === -1 ? 0 : (currentIdx + 1) % items.length;
        for (let offset = 0; offset < items.length; offset++) {
          const i = (start + offset) % items.length;
          const label = (items[i].getAttribute?.('aria-label') || items[i].textContent || '').trim().toLocaleLowerCase();
          if (label.startsWith(typeBuffer)) {
            e.preventDefault();
            e.stopPropagation();
            focusIndex(items, i);
            break;
          }
        }
      }
    },
    { signal: abortSignal }
  );

  return () => {
    if (typeTimer) clearTimeout(typeTimer);
    controller.abort();
  };
}

// ==========================================
// 4. Dismissable Layer Stack (Overlays)
// ==========================================

const dismissableStack = [];

/**
 * Registers an overlay (dialog, drawer, popover, dropdown, context menu) in a
 * top-most-first stack so Escape and outside clicks dismiss only the topmost open layer.
 */
export function createDismissableLayer(
  host,
  {
    isOpen = () => true,
    onDismiss,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    signal = host?.signal,
  } = {}
) {
  if (!host || typeof onDismiss !== 'function' || typeof document === 'undefined') {
    return () => {};
  }

  const layer = { host, isOpen, onDismiss, closeOnEscape, closeOnOutsideClick };
  dismissableStack.push(layer);

  const isTopMostOpen = () => {
    for (let i = dismissableStack.length - 1; i >= 0; i--) {
      if (dismissableStack[i].isOpen()) {
        return dismissableStack[i] === layer;
      }
    }
    return false;
  };

  const controller = new AbortController();
  const abortSignal = controller.signal;
  if (signal) {
    if (signal.aborted) {
      const idx = dismissableStack.indexOf(layer);
      if (idx !== -1) dismissableStack.splice(idx, 1);
      return () => {};
    }
    signal.addEventListener('abort', () => cleanup(), { once: true });
  }

  document.addEventListener(
    'keydown',
    (e) => {
      if (!closeOnEscape || e.key !== 'Escape') return;
      if (!isTopMostOpen()) return;
      e.preventDefault();
      onDismiss('escape', e);
    },
    { signal: abortSignal }
  );

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!closeOnOutsideClick || !isTopMostOpen()) return;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      if (path.includes(host) || host.contains(e.target)) return;
      onDismiss('outside-click', e);
    },
    { signal: abortSignal }
  );

  function cleanup() {
    controller.abort();
    const idx = dismissableStack.indexOf(layer);
    if (idx !== -1) dismissableStack.splice(idx, 1);
  }

  return cleanup;
}

// ==========================================
// 5. Unified Selection Behavior (Single / Multiple / Range)
// ==========================================

/**
 * Signal-backed selection controller supporting single, multiple, and Shift-range
 * selection plus Ctrl/Cmd+A select-all and disabledKeys filtering.
 */
export function createSelectionBehavior({
  mode = 'single',
  getKeys = () => [],
  initialKeys = [],
  disabledKeys = [],
  onSelectionChange = null,
} = {}) {
  const disabledSet = new Set(disabledKeys);
  const selectedKeys = createSignal(new Set(initialKeys));
  let anchorKey = initialKeys.length > 0 ? initialKeys[initialKeys.length - 1] : null;

  function commit(nextSet) {
    selectedKeys.value = nextSet;
    if (typeof onSelectionChange === 'function') {
      onSelectionChange(nextSet);
    }
  }

  function isDisabled(key) {
    return disabledSet.has(key);
  }

  function isSelected(key) {
    return selectedKeys.value.has(key);
  }

  function selectRange(fromKey, toKey) {
    if (mode !== 'multiple') return;
    const keys = getKeys();
    const startIdx = keys.indexOf(fromKey);
    const endIdx = keys.indexOf(toKey);
    if (startIdx === -1 || endIdx === -1) return;
    const [lo, hi] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const next = new Set(selectedKeys.peek());
    for (let i = lo; i <= hi; i++) {
      if (!isDisabled(keys[i])) {
        next.add(keys[i]);
      }
    }
    commit(next);
  }

  function select(key, { shiftKey = false, ctrlKey = false, metaKey = false, toggle = false } = {}) {
    if (mode === 'none' || isDisabled(key)) return;

    if (mode === 'single') {
      const current = selectedKeys.peek();
      if (toggle && current.has(key)) {
        anchorKey = null;
        commit(new Set());
      } else {
        anchorKey = key;
        commit(new Set([key]));
      }
      return;
    }

    // Multiple mode
    if (shiftKey && anchorKey !== null) {
      selectRange(anchorKey, key);
      return;
    }

    const next = new Set(ctrlKey || metaKey || toggle ? selectedKeys.peek() : []);
    if (next.has(key) && (ctrlKey || metaKey || toggle)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    anchorKey = key;
    commit(next);
  }

  function toggleKey(key) {
    select(key, { toggle: true });
  }

  function selectAll() {
    if (mode !== 'multiple') return;
    const next = new Set(getKeys().filter((k) => !isDisabled(k)));
    commit(next);
  }

  function clear() {
    anchorKey = null;
    commit(new Set());
  }

  return {
    selectedKeys,
    isSelected,
    select,
    toggle: toggleKey,
    selectRange,
    selectAll,
    clear,
  };
}

// ==========================================
// 6. Accessible Reorder / Drag & Drop Behavior (Pointer + Keyboard)
// ==========================================

/**
 * Enables accessible pointer (HTML5 DnD) AND keyboard reordering on a list/collection:
 * - Keyboard: Space/Enter grabs item -> Arrow keys move -> Space/Enter drops, Escape cancels.
 * - Pointer: dragstart / dragover / drop with `data-dragging` and `data-drop-target` states.
 * - Announces grab, move, drop, and cancel updates to screen readers via `announce()`.
 */
export function createReorderBehavior(
  host,
  {
    getItems,
    orientation = 'vertical',
    onReorder,
    signal = host?.signal,
  } = {}
) {
  if (!host || typeof getItems !== 'function' || typeof onReorder !== 'function') {
    return () => {};
  }

  const controller = new AbortController();
  const abortSignal = controller.signal;
  if (signal) {
    if (signal.aborted) return () => {};
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let grabbedIndex = -1;
  let currentIndex = -1;
  let dragSourceIndex = -1;

  function clearStates(items) {
    for (const el of items) {
      setHostState(el, 'dragging', false);
      setHostState(el, 'drop-target', false);
    }
  }

  // Keyboard accessible reorder
  host.addEventListener(
    'keydown',
    (e) => {
      const items = getItems() || [];
      if (!items.length) return;

      const idx = items.findIndex((el) => el === e.target || el.contains?.(e.target));
      if (idx === -1) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (grabbedIndex === -1) {
          grabbedIndex = idx;
          currentIndex = idx;
          setHostState(items[idx], 'dragging', true);
          announce(`Grabbed item ${idx + 1} of ${items.length}. Use arrow keys to move, Space to drop, Escape to cancel.`);
        } else {
          const from = grabbedIndex;
          const to = currentIndex;
          const item = items[from];
          clearStates(items);
          grabbedIndex = -1;
          currentIndex = -1;
          if (from !== to) {
            onReorder({ fromIndex: from, toIndex: to, item });
          }
          announce(`Dropped item at position ${to + 1} of ${items.length}.`);
        }
        return;
      }

      if (grabbedIndex === -1) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        clearStates(items);
        grabbedIndex = -1;
        currentIndex = -1;
        announce('Reorder cancelled.');
        return;
      }

      const rtl = isRTL(host);
      const nextKey = orientation === 'horizontal' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
      const prevKey = orientation === 'horizontal' ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';

      if (e.key === nextKey && currentIndex < items.length - 1) {
        e.preventDefault();
        setHostState(items[currentIndex], 'drop-target', false);
        currentIndex++;
        setHostState(items[currentIndex], 'drop-target', true);
        announce(`Position ${currentIndex + 1} of ${items.length}.`);
      } else if (e.key === prevKey && currentIndex > 0) {
        e.preventDefault();
        setHostState(items[currentIndex], 'drop-target', false);
        currentIndex--;
        setHostState(items[currentIndex], 'drop-target', true);
        announce(`Position ${currentIndex + 1} of ${items.length}.`);
      }
    },
    { signal: abortSignal }
  );

  // Pointer HTML5 Drag & Drop
  host.addEventListener(
    'dragstart',
    (e) => {
      const items = getItems() || [];
      const idx = items.findIndex((el) => el === e.target || el.contains?.(e.target));
      if (idx === -1) return;
      dragSourceIndex = idx;
      setHostState(items[idx], 'dragging', true);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData?.('text/plain', String(idx));
      }
    },
    { signal: abortSignal }
  );

  host.addEventListener(
    'dragover',
    (e) => {
      if (dragSourceIndex === -1) return;
      const items = getItems() || [];
      const idx = items.findIndex((el) => el === e.target || el.contains?.(e.target));
      if (idx === -1) return;
      e.preventDefault();
      items.forEach((el, i) => setHostState(el, 'drop-target', i === idx && i !== dragSourceIndex));
    },
    { signal: abortSignal }
  );

  host.addEventListener(
    'drop',
    (e) => {
      if (dragSourceIndex === -1) return;
      e.preventDefault();
      const items = getItems() || [];
      const toIndex = items.findIndex((el) => el === e.target || el.contains?.(e.target));
      const fromIndex = dragSourceIndex;
      const item = items[fromIndex];
      clearStates(items);
      dragSourceIndex = -1;
      if (toIndex !== -1 && fromIndex !== toIndex) {
        onReorder({ fromIndex, toIndex, item });
        announce(`Moved item to position ${toIndex + 1} of ${items.length}.`);
      }
    },
    { signal: abortSignal }
  );

  host.addEventListener(
    'dragend',
    () => {
      const items = getItems() || [];
      clearStates(items);
      dragSourceIndex = -1;
    },
    { signal: abortSignal }
  );

  return () => {
    controller.abort();
    clearStates(getItems() || []);
  };
}

// ==========================================
// 7. Search Match Highlighting Behavior
// ==========================================

/**
 * Splits `text` into matched and unmatched segments for case-insensitive search highlighting.
 * Escapes all RegExp metacharacters safely.
 * @returns {Array<{ text: string, match: boolean }>}
 */
export function splitMatchSegments(text, query) {
  const str = String(text ?? '');
  const q = String(query ?? '').trim();
  if (!q || !str) return str ? [{ text: str, match: false }] : [];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = str.split(regex);
  if (parts.length === 1) return [{ text: str, match: false }];

  const lowerQ = q.toLowerCase();
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, match: part.toLowerCase() === lowerQ }));
}

/**
 * Renders `text` with XSS-safe `<mark class="match-highlight" part="highlight">` tags
 * around substrings matching `query`. Uses Elementum `html` template parts (never innerHTML).
 */
export function highlightMatch(text, query) {
  const segments = splitMatchSegments(text, query);
  if (segments.length === 0) return '';
  if (segments.length === 1 && !segments[0].match) return segments[0].text;
  return segments.map((seg) =>
    seg.match ? html`<mark class="match-highlight" part="highlight">${seg.text}</mark>` : seg.text
  );
}

// ==========================================
// 8. Motion & Presence Lifecycle Behavior
// ==========================================

function isReducedMotionNow() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

/**
 * Reactive signal tracking the user's `prefers-reduced-motion: reduce` OS preference.
 * Automatically cleans up its MediaQueryList listener when `options.signal` aborts or `.dispose()` is called.
 *
 * @param {{ signal?: AbortSignal }} [options]
 */
export function prefersReducedMotion(options = {}) {
  const reduced = createSignal(isReducedMotionNow());
  let mql = null;
  let onChange = null;

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduced.value = Boolean(mql.matches);
      onChange = (e) => {
        reduced.value = Boolean(e.matches);
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(onChange);
      }
    } catch {
      // Ignore in mock DOM environments without matchMedia support
    }
  }

  const dispose = () => {
    if (!mql || !onChange) return;
    try {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onChange);
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(onChange);
      }
    } catch {
      // Ignore cleanup errors
    }
    mql = null;
    onChange = null;
  };

  if (options.signal) {
    if (options.signal.aborted) dispose();
    else options.signal.addEventListener('abort', dispose, { once: true });
  }

  reduced.dispose = dispose;
  return reduced;
}

/**
 * Coordinates CSS enter/exit transitions with DOM presence and standardized state attributes
 * (`data-state`, `data-starting-style`, `data-ending-style`).
 * Works identically for styled Shadow DOM components and `unstyled` headless consumers.
 *
 * @param {Element | (() => Element | null)} target - Element or getter returning the animated element
 * @param {object} [options]
 * @param {boolean} [options.initialOpen=false]
 * @param {boolean} [options.respectReducedMotion=true]
 * @param {() => void} [options.onEnterComplete]
 * @param {() => void} [options.onExitComplete]
 * @param {AbortSignal} [options.signal]
 */
export function createPresenceBehavior(target, options = {}) {
  const {
    initialOpen = false,
    respectReducedMotion = true,
    onEnterComplete,
    onExitComplete,
    signal: abortSignal,
  } = options;

  const status = createSignal(initialOpen ? 'entered' : 'unmounted');
  const mounted = createSignal(Boolean(initialOpen));

  let generation = 0;
  let pendingRaf = null;
  let destroyed = false;

  const scheduleFrame = (cb) => {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(cb);
    }
    return setTimeout(cb, 0);
  };

  const cancelFrame = (id) => {
    if (id === null) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  };

  const resolveEl = () => (typeof target === 'function' ? target() : target);

  const waitForAnimations = (el, gen, onDone) => {
    if (destroyed || gen !== generation) return;
    const anims =
      el && typeof el.getAnimations === 'function'
        ? el.getAnimations().filter((a) => a.playState === 'running' || a.playState === 'pending')
        : [];
    if (anims.length === 0) {
      onDone();
      return;
    }
    Promise.allSettled(anims.map((a) => a.finished)).then(() => {
      if (!destroyed && gen === generation) {
        onDone();
      }
    });
  };

  const setOpen = (nextOpen) => {
    if (destroyed) return;
    const gen = ++generation;
    cancelFrame(pendingRaf);
    pendingRaf = null;

    const el = resolveEl();
    const reduced = respectReducedMotion && isReducedMotionNow();

    if (nextOpen) {
      mounted.value = true;
      if (!el || reduced) {
        if (el) {
          el.removeAttribute('data-starting-style');
          el.removeAttribute('data-ending-style');
          el.setAttribute('data-state', 'open');
        }
        status.value = 'entered';
        onEnterComplete?.();
        return;
      }

      status.value = 'entering';
      el.removeAttribute('data-ending-style');
      el.setAttribute('data-starting-style', '');
      el.setAttribute('data-state', 'open');

      pendingRaf = scheduleFrame(() => {
        pendingRaf = null;
        if (destroyed || gen !== generation) return;
        // Flush before-change style so CSS transitions from [data-starting-style]
        void el.offsetWidth;
        el.removeAttribute('data-starting-style');
        waitForAnimations(el, gen, () => {
          status.value = 'entered';
          onEnterComplete?.();
        });
      });
    } else {
      if (!el || reduced) {
        if (el) {
          el.removeAttribute('data-starting-style');
          el.removeAttribute('data-ending-style');
          el.setAttribute('data-state', 'closed');
        }
        status.value = 'unmounted';
        mounted.value = false;
        onExitComplete?.();
        return;
      }

      status.value = 'exiting';
      el.removeAttribute('data-starting-style');
      el.setAttribute('data-ending-style', '');
      el.setAttribute('data-state', 'closed');

      pendingRaf = scheduleFrame(() => {
        pendingRaf = null;
        waitForAnimations(el, gen, () => {
          el.removeAttribute('data-ending-style');
          status.value = 'unmounted';
          mounted.value = false;
          onExitComplete?.();
        });
      });
    }
  };

  const destroy = () => {
    destroyed = true;
    generation++;
    cancelFrame(pendingRaf);
    pendingRaf = null;
  };

  if (abortSignal) {
    if (abortSignal.aborted) destroy();
    else abortSignal.addEventListener('abort', destroy, { once: true });
  }

  return { status, mounted, setOpen, destroy };
}

// ==========================================
// 9. Focus Recovery, Shortcuts, Disclosure & Popup Positioning
// ==========================================

/**
 * Prevents focus from dropping to `document.body` when a focused element
 * inside `container` is removed, hidden, or disabled.
 *
 * @param {Element} container - Observed container (or ShadowRoot)
 * @param {object} options
 * @param {() => HTMLElement | null} options.fallback - Returns fallback focus target
 * @param {AbortSignal} [options.signal]
 */
export function createFocusRecovery(container, options = {}) {
  const { fallback, signal: abortSignal } = options;
  if (!container || typeof fallback !== 'function') {
    return { recover: () => false, destroy: () => {} };
  }

  let lastFocused = null;
  const controller = new AbortController();
  const sig = abortSignal ? AbortSignal.any([controller.signal, abortSignal]) : controller.signal;

  const recover = () => {
    const active = (container.getRootNode?.()?.activeElement) || document.activeElement;
    const isLost =
      !active ||
      active === document.body ||
      active === document.documentElement ||
      (lastFocused && (!lastFocused.isConnected || lastFocused.hasAttribute('disabled') || lastFocused.hidden));
    if (!isLost) return false;
    const target = fallback();
    if (target && typeof target.focus === 'function' && target.isConnected && !target.hasAttribute('disabled')) {
      target.focus();
      lastFocused = target;
      return true;
    }
    return false;
  };

  container.addEventListener(
    'focusin',
    (e) => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [e.target];
      lastFocused = path[0] || e.target;
    },
    { signal: sig }
  );

  let observer = null;
  if (typeof MutationObserver === 'function') {
    observer = new MutationObserver(() => {
      if (lastFocused && (!lastFocused.isConnected || lastFocused.hasAttribute('disabled') || lastFocused.hidden)) {
        recover();
      }
    });
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
  }

  const destroy = () => {
    controller.abort();
    observer?.disconnect();
    observer = null;
  };

  if (abortSignal) {
    if (abortSignal.aborted) destroy();
    else abortSignal.addEventListener('abort', destroy, { once: true });
  }

  return { recover, destroy };
}

function isEditableElement(target) {
  if (!target || target.nodeType !== 1) return false;
  const tag = (target.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

function parseShortcut(combo) {
  const parts = String(combo).toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const key = parts.pop() || '';
  return {
    key,
    mod: parts.includes('mod'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
  };
}

/**
 * Cross-platform keyboard shortcut controller (`Mod+K`, `Shift+?`, `Escape`, etc.).
 * Automatically maps `Mod` to `Meta` on macOS and `Ctrl` on Windows/Linux.
 *
 * @param {EventTarget} target - Usually `window`, `document`, or a host element
 * @param {Record<string, (e: KeyboardEvent) => void>} shortcuts - Map of combo strings to handlers
 * @param {{ ignoreInputs?: boolean, preventDefault?: boolean, isMac?: boolean, signal?: AbortSignal }} [options]
 */
export function createShortcuts(target, shortcuts = {}, options = {}) {
  if (!target || typeof target.addEventListener !== 'function') return () => {};
  const {
    ignoreInputs = true,
    preventDefault = true,
    isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || ''),
    signal: abortSignal,
  } = options;

  const parsed = Object.entries(shortcuts).map(([combo, handler]) => ({
    ...parseShortcut(combo),
    handler,
  }));

  const controller = new AbortController();
  const sig = abortSignal ? AbortSignal.any([controller.signal, abortSignal]) : controller.signal;

  target.addEventListener(
    'keydown',
    (e) => {
      if (ignoreInputs) {
        const path = typeof e.composedPath === 'function' ? e.composedPath() : [e.target];
        if (path.some((n) => isEditableElement(n))) return;
      }
      const eventKey = (e.key || '').toLowerCase();
      for (const spec of parsed) {
        if (eventKey !== spec.key) continue;
        const needCtrl = spec.ctrl || (spec.mod && !isMac);
        const needMeta = spec.meta || (spec.mod && isMac);
        if (Boolean(e.ctrlKey) !== needCtrl) continue;
        if (Boolean(e.metaKey) !== needMeta) continue;
        if (Boolean(e.shiftKey) !== spec.shift) continue;
        if (Boolean(e.altKey) !== spec.alt) continue;
        if (preventDefault && typeof e.preventDefault === 'function') e.preventDefault();
        spec.handler(e);
        return;
      }
    },
    { signal: sig }
  );

  return () => controller.abort();
}

let disclosureCounter = 0;

/**
 * Standardized WAI-ARIA disclosure wiring for trigger + panel pairs.
 * Manages `aria-expanded`, `aria-controls`, `data-state="open"|"closed"`, and click toggling.
 *
 * @param {HTMLElement} trigger
 * @param {HTMLElement} panel
 * @param {{ initialOpen?: boolean, onOpenChange?: (open: boolean) => void, signal?: AbortSignal }} [options]
 */
export function createDisclosureBehavior(trigger, panel, options = {}) {
  const { initialOpen = false, onOpenChange, signal: abortSignal } = options;
  const isOpen = createSignal(Boolean(initialOpen));

  if (panel && !panel.id) {
    panel.id = `el-disclosure-${++disclosureCounter}`;
  }

  const syncDom = (open) => {
    const state = open ? 'open' : 'closed';
    if (trigger) {
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (panel?.id) trigger.setAttribute('aria-controls', panel.id);
      trigger.setAttribute('data-state', state);
    }
    if (panel) {
      panel.setAttribute('data-state', state);
      panel.hidden = !open;
    }
  };

  syncDom(isOpen.value);

  const setOpen = (next) => {
    const val = Boolean(next);
    if (isOpen.value === val) return;
    isOpen.value = val;
    syncDom(val);
    onOpenChange?.(val);
  };

  const toggle = () => setOpen(!isOpen.value);

  const controller = new AbortController();
  const sig = abortSignal ? AbortSignal.any([controller.signal, abortSignal]) : controller.signal;

  if (trigger && typeof trigger.addEventListener === 'function') {
    trigger.addEventListener('click', toggle, { signal: sig });
  }

  return {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle,
    setOpen,
    destroy: () => controller.abort(),
  };
}

/**
 * Viewport-aware anchor positioning with automatic collision flipping (`bottom`<->`top`, `right`<->`left`).
 * Sets `--anchor-width`, `--available-height`, `data-side`, and computed `top`/`left` on `floating`.
 *
 * @param {HTMLElement} anchor
 * @param {HTMLElement} floating
 * @param {{ placement?: 'bottom'|'top'|'left'|'right', offset?: number, flip?: boolean, signal?: AbortSignal }} [options]
 */
export function createPopupPositioner(anchor, floating, options = {}) {
  const { placement = 'bottom', offset = 8, flip = true, signal: abortSignal } = options;
  if (!anchor || !floating) {
    return { update: () => ({ side: placement, top: 0, left: 0 }), destroy: () => {} };
  }

  const update = () => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const aRect = typeof anchor.getBoundingClientRect === 'function'
      ? anchor.getBoundingClientRect()
      : { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    const fRect = typeof floating.getBoundingClientRect === 'function'
      ? floating.getBoundingClientRect()
      : { width: 200, height: 120 };

    let side = placement;
    const spaceBelow = vh - aRect.bottom - offset;
    const spaceAbove = aRect.top - offset;
    const spaceRight = vw - aRect.right - offset;
    const spaceLeft = aRect.left - offset;

    if (flip) {
      if (side === 'bottom' && fRect.height > spaceBelow && spaceAbove > spaceBelow) side = 'top';
      else if (side === 'top' && fRect.height > spaceAbove && spaceBelow > spaceAbove) side = 'bottom';
      else if (side === 'right' && fRect.width > spaceRight && spaceLeft > spaceRight) side = 'left';
      else if (side === 'left' && fRect.width > spaceLeft && spaceRight > spaceLeft) side = 'right';
    }

    let top = 0;
    let left = 0;
    if (side === 'bottom') {
      top = aRect.bottom + offset;
      left = Math.max(8, Math.min(vw - fRect.width - 8, aRect.left));
    } else if (side === 'top') {
      top = Math.max(8, aRect.top - fRect.height - offset);
      left = Math.max(8, Math.min(vw - fRect.width - 8, aRect.left));
    } else if (side === 'right') {
      top = Math.max(8, Math.min(vh - fRect.height - 8, aRect.top));
      left = aRect.right + offset;
    } else {
      top = Math.max(8, Math.min(vh - fRect.height - 8, aRect.top));
      left = Math.max(8, aRect.left - fRect.width - offset);
    }

    const availableHeight = Math.max(120, Math.round(side === 'top' ? spaceAbove : spaceBelow));
    floating.setAttribute('data-side', side);
    floating.style.setProperty('--anchor-width', `${Math.round(aRect.width)}px`);
    floating.style.setProperty('--available-height', `${availableHeight}px`);
    floating.style.top = `${Math.round(top)}px`;
    floating.style.left = `${Math.round(left)}px`;

    return { side, top: Math.round(top), left: Math.round(left), availableHeight };
  };

  const controller = new AbortController();
  const sig = abortSignal ? AbortSignal.any([controller.signal, abortSignal]) : controller.signal;
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', update, { signal: sig });
    window.addEventListener('scroll', update, { capture: true, passive: true, signal: sig });
  }

  return { update, destroy: () => controller.abort() };
}
