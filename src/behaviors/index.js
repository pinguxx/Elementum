/**
 * Elementum Behavior Controllers (@wcomp/elementum/behaviors)
 * Zero-dependency, React-Aria-inspired interaction, accessibility, i18n/RTL,
 * selection, reorder/DnD, and state-reflection primitives built on standard DOM APIs and AbortSignal.
 */

import { signal as createSignal } from '../signal.js';

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
        (el) => el && !el.disabled && !el.hasAttribute?.('disabled') && el.getAttribute?.('aria-disabled') !== 'true'
      );
      if (!items.length) return;

      const activeEl = host.shadowRoot?.activeElement || document.activeElement;
      const currentIdx = items.findIndex((item) => item === activeEl || item === e.target || item.contains?.(e.target));
      const orient = typeof orientation === 'function' ? orientation() : orientation;
      const rtl = isRTL(host);

      const nextKey = orient === 'vertical' ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight');
      const prevKey = orient === 'vertical' ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');

      if (e.key === nextKey || (orient === 'both' && (e.key === 'ArrowRight' || e.key === 'ArrowDown'))) {
        e.preventDefault();
        focusIndex(items, currentIdx === -1 ? 0 : currentIdx + 1);
        return;
      }

      if (e.key === prevKey || (orient === 'both' && (e.key === 'ArrowLeft' || e.key === 'ArrowUp'))) {
        e.preventDefault();
        focusIndex(items, currentIdx === -1 ? items.length - 1 : currentIdx - 1);
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        focusIndex(items, 0);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        focusIndex(items, items.length - 1);
        return;
      }

      if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typeBuffer += e.key.toLowerCase();
        if (typeTimer) clearTimeout(typeTimer);
        typeTimer = setTimeout(() => {
          typeBuffer = '';
        }, 500);

        const start = currentIdx === -1 ? 0 : (currentIdx + 1) % items.length;
        for (let offset = 0; offset < items.length; offset++) {
          const i = (start + offset) % items.length;
          const label = (items[i].getAttribute?.('aria-label') || items[i].textContent || '').trim().toLowerCase();
          if (label.startsWith(typeBuffer)) {
            e.preventDefault();
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
