import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-drawer>
 * Accessible, mobile-first slide-over drawer and iOS-style bottom sheet inspired by Vaul (Emil Kowalski).
 * Features:
 * - Four placements: bottom (sheet), right, left, top
 * - iOS-style background scaling (scale-background) with proportional drag interpolation
 * - Multi-stop snap points (snap-points="0.35, 0.75, 1") with inertia velocity flicking
 * - Fluid touch/pointer drag-to-dismiss with rubber-band physics damping
 * - Centered drag handle bar (.drawer-handle)
 * - Coordinated scrollable content locking (scrollTop === 0 check)
 * - Mobile virtual viewport / software keyboard adaptation
 */
export class ElDrawer extends Elementum {
  static observedAttributes = ['open', 'placement', 'title', 'heading', 'scale-background', 'snap-points', 'handle', 'inline-at', 'mode'];

  isOpen = signal(false);
  isInline = signal(false);
  placement = signal('right'); // 'right' | 'left' | 'top' | 'bottom'
  titleText = signal('');
  activeSnapIndex = signal(-1);
  hasHandle = signal(true);

  #previousActiveElement = null;
  #scaleWrapper = null;
  #originalWrapperStyles = null;
  #parsedSnapPoints = []; // array of pixel heights
  #dragState = null;
  #viewportHandler = null;
  #justDragged = false;
  #focusTimer = null;
  #dragResetTimer = null;
  #inlineMqlCleanups = [];

  get open() {
    return this.isOpen.value;
  }

  set open(val) {
    if (Boolean(val)) {
      this.show();
    } else {
      this.close();
    }
  }

  connected() {
    this.isOpen.value = this.hasAttribute('open') && this.getAttribute('open') !== 'false';
    this.placement.value = this.getAttribute('placement') || 'right';
    this.titleText.value = this.getAttribute('heading') || this.getAttribute('title') || '';
    this.hasHandle.value = this.getAttribute('handle') !== 'false';
    this.setAttribute('data-state', this.isOpen.value ? 'open' : 'closed');
    this.setAttribute('data-side', this.placement.value);

    this.#parseSnapPoints();
    this.#setupInlineMode();

    window.addEventListener('keydown', this.#onKeyDown);

    if (typeof window !== 'undefined' && window.visualViewport) {
      this.#viewportHandler = () => this.#onViewportResize();
      window.visualViewport.addEventListener('resize', this.#viewportHandler);
    }

    if (this.isOpen.value && !this.isInline.value) {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'hidden';
      }
      this.#applyBackgroundScale(true);
    }
  }

  rendered() {
    if (this.isOpen.value && !this.isInline.value && this.placement.value === 'bottom' && this.#parsedSnapPoints.length > 0) {
      const idx = this.activeSnapIndex.value >= 0 ? this.activeSnapIndex.value : 0;
      this.#setSheetHeight(this.#parsedSnapPoints[idx]);
    }
  }

  disconnected() {
    window.removeEventListener('keydown', this.#onKeyDown);
    if (this.#viewportHandler && typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.#viewportHandler);
    }
    this.#cleanupInlineMqls();
    if (this.#focusTimer) {
      clearTimeout(this.#focusTimer);
      this.#focusTimer = null;
    }
    if (this.#dragResetTimer) {
      clearTimeout(this.#dragResetTimer);
      this.#dragResetTimer = null;
    }
    this.#applyBackgroundScale(false);
    this.#releaseBodyScroll();
  }

  #cleanupInlineMqls() {
    for (const off of this.#inlineMqlCleanups) off();
    this.#inlineMqlCleanups = [];
  }

  #setupInlineMode() {
    this.#cleanupInlineMqls();
    const mode = (this.getAttribute('mode') || '').toLowerCase();
    const inlineAt = (this.getAttribute('inline-at') || '').trim();

    if (mode === 'inline') {
      this.#applyInlineState(true);
      return;
    }
    if (mode === 'overlay' || (!inlineAt && mode !== 'auto')) {
      this.#applyInlineState(false);
      return;
    }

    const queries = [];
    if (inlineAt && /^\d+(?:\.\d+)?(?:px|rem|em|vw)$/.test(inlineAt)) {
      queries.push(`(min-width: ${inlineAt})`);
    }
    if (mode === 'auto') {
      queries.push('(horizontal-viewport-segments: 2)');
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || queries.length === 0) {
      this.#applyInlineState(false);
      return;
    }

    const mqls = queries.map((q) => window.matchMedia(q));
    const evaluate = () => this.#applyInlineState(mqls.some((m) => Boolean(m.matches)));
    for (const mql of mqls) {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', evaluate);
        this.#inlineMqlCleanups.push(() => mql.removeEventListener('change', evaluate));
      }
    }
    evaluate();
  }

  #applyInlineState(inline) {
    const next = Boolean(inline);
    const prev = this.isInline.value;
    this.isInline.value = next;
    this.setAttribute('data-mode', next ? 'inline' : 'overlay');
    if (next) {
      this.#applyBackgroundScale(false);
      this.#releaseBodyScroll();
    }
    if (prev !== next) {
      this.emit('modechange', { mode: next ? 'inline' : 'overlay' });
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const shouldOpen = newValue !== null && newValue !== 'false';
      if (shouldOpen) this.show();
      else this.close();
    } else if (name === 'inline-at' || name === 'mode') {
      this.#setupInlineMode();
    } else if (name === 'placement') {
      this.placement.value = newValue || 'right';
      this.setAttribute('data-side', this.placement.value);
      const panel = this.root?.querySelector('.drawer-panel');
      if (panel && this.placement.value !== 'bottom') {
        panel.style.height = '';
        panel.style.maxHeight = '';
      }
    } else if (name === 'title' || name === 'heading') {
      this.titleText.value = newValue || this.getAttribute('heading') || this.getAttribute('title') || '';
    } else if (name === 'snap-points') {
      this.#parseSnapPoints();
    } else if (name === 'handle') {
      this.hasHandle.value = newValue !== 'false';
    }
  }

  #parseSnapPoints() {
    const attr = this.getAttribute('snap-points');
    if (!attr) {
      this.#parsedSnapPoints = [];
      return;
    }
    const raw = attr.split(',').map((s) => s.trim());
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    this.#parsedSnapPoints = raw.map((val) => {
      if (val.endsWith('%')) {
        return (parseFloat(val) / 100) * vh;
      }
      if (val.endsWith('px')) {
        return parseFloat(val);
      }
      const num = parseFloat(val);
      if (num > 0 && num <= 1) {
        return num * vh;
      }
      return num || vh;
    }).sort((a, b) => a - b);

    if (this.activeSnapIndex.value < 0 && this.#parsedSnapPoints.length > 0) {
      this.activeSnapIndex.value = this.#parsedSnapPoints[0] >= 220
        ? 0
        : Math.min(1, this.#parsedSnapPoints.length - 1);
    }
  }

  #releaseBodyScroll() {
    if (typeof document === 'undefined' || !document.body) return;
    const otherOpen = Array.from(document.querySelectorAll('el-drawer[data-state="open"]')).some(
      (el) => el !== this && el.isConnected
    );
    if (!otherOpen) {
      document.body.style.overflow = '';
      document.body.style.transform = '';
      document.body.style.borderRadius = '';
    }
  }

  show() {
    if (this.isOpen.value) return;
    if (typeof document !== 'undefined' && document.activeElement) {
      this.#previousActiveElement = document.activeElement;
    }
    this.isOpen.value = true;
    this.setAttribute('data-state', 'open');
    this.setAttribute('data-side', this.placement.value);

    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'hidden';
    }
    this.#applyBackgroundScale(true);
    this.emit('open');

    // If bottom sheet with snap points, apply initial height
    if (this.placement.value === 'bottom' && this.#parsedSnapPoints.length > 0) {
      const idx = this.activeSnapIndex.value >= 0 ? this.activeSnapIndex.value : 0;
      this.#setSheetHeight(this.#parsedSnapPoints[idx]);
    } else {
      const panel = this.root?.querySelector('.drawer-panel');
      if (panel) {
        panel.style.height = '';
        panel.style.maxHeight = '';
      }
    }

    if (this.#focusTimer) clearTimeout(this.#focusTimer);
    this.#focusTimer = setTimeout(() => {
      this.#focusTimer = null;
      const closeBtn = this.root?.querySelector('.close-btn');
      closeBtn?.focus?.();
    }, 50);
  }

  close() {
    if (!this.isOpen.value) return;
    this.isOpen.value = false;
    this.setAttribute('data-state', 'closed');
    if (this.hasAttribute('open')) {
      this.removeAttribute('open');
    }

    // Reset panel transform and sheet height
    const panel = this.root?.querySelector('.drawer-panel');
    if (panel) {
      panel.style.transform = '';
    }

    this.#applyBackgroundScale(false);
    this.#releaseBodyScroll();
    this.emit('close');

    if (this.#previousActiveElement && typeof this.#previousActiveElement.focus === 'function') {
      try {
        this.#previousActiveElement.focus();
      } catch {
        // Ignore if detached
      }
      this.#previousActiveElement = null;
    }
  }

  #getScaleWrapper() {
    if (typeof document === 'undefined') return null;
    const candidate =
      document.querySelector('[data-vaul-drawer-wrapper]') ||
      document.querySelector('[data-drawer-wrapper]');
    if (candidate && !candidate.contains(this)) {
      return candidate;
    }
    return null;
  }

  #applyBackgroundScale(active, dragFraction = 0) {
    if (!this.hasAttribute('scale-background')) return;
    const wrapper = this.#getScaleWrapper();
    if (!wrapper) return;

    if (active) {
      if (!this.#originalWrapperStyles) {
        this.#originalWrapperStyles = {
          transform: wrapper.style.transform,
          borderRadius: wrapper.style.borderRadius,
          transition: wrapper.style.transition,
          overflow: wrapper.style.overflow
        };
      }

      if (dragFraction > 0) {
        // Continuous scale interpolation during active drag
        const scaleVal = 0.96 + 0.04 * Math.min(1, dragFraction);
        const yVal = 8 * (1 - Math.min(1, dragFraction));
        wrapper.style.transition = 'none';
        wrapper.style.transform = `scale(${scaleVal}) translateY(${yVal}px)`;
      } else {
        wrapper.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        wrapper.style.transform = 'scale(0.96) translateY(8px)';
        wrapper.style.borderRadius = '16px';
        wrapper.style.overflow = 'hidden';
      }
    } else {
      if (this.#originalWrapperStyles) {
        wrapper.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.32s ease';
        wrapper.style.transform = this.#originalWrapperStyles.transform || '';
        wrapper.style.borderRadius = this.#originalWrapperStyles.borderRadius || '';
        wrapper.style.overflow = this.#originalWrapperStyles.overflow || '';
        this.#originalWrapperStyles = null;
      }
    }
  }

  #setSheetHeight(pixels) {
    const panel = this.root?.querySelector('.drawer-panel');
    if (!panel) return;
    panel.style.height = `${Math.round(pixels)}px`;
    panel.style.maxHeight = '96vh';
  }

  #onKeyDown = (e) => {
    if (this.isOpen.value && e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    }
  };

  #onBackdropClick = (e) => {
    if (this.#justDragged) {
      this.#justDragged = false;
      return;
    }
    if (e.target === e.currentTarget) {
      this.close();
    }
  };

  #onViewportResize = () => {
    if (!this.isOpen.value || this.placement.value !== 'bottom' || typeof window === 'undefined') return;
    const panel = this.root?.querySelector('.drawer-panel');
    if (!panel || !window.visualViewport) return;

    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    if (keyboardHeight > 100) {
      panel.style.bottom = `${keyboardHeight}px`;
    } else {
      panel.style.bottom = '0px';
    }
  };

  // =========================================================================
  // GESTURE PHYSICS: Touch & Pointer Drag / Snapping / Pull-to-Dismiss
  // =========================================================================

  #onPointerDown = (e) => {
    const interactiveSelector = 'button, a, input, select, textarea, el-button, el-input, el-select, el-textarea, el-switch, el-checkbox';
    if (e.target.closest?.(interactiveSelector)) return;
    if (typeof e.composedPath === 'function' && e.composedPath().some((n) => n?.matches?.(interactiveSelector))) {
      return;
    }
    const panel = this.root?.querySelector('.drawer-panel');
    if (!panel) return;

    // Content scroll lock check: if dragging inside body, only allow sheet drag if scrollTop === 0
    const bodyEl = this.root?.querySelector('.drawer-body');
    if (bodyEl && bodyEl.contains(e.target) && bodyEl.scrollTop > 0) {
      return;
    }

    const isHandleOrHeader = Boolean(e.target.closest?.('.drawer-handle-bar, .drawer-header'));
    if (isHandleOrHeader && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    this.#dragState = {
      startY: e.clientY,
      startX: e.clientX,
      lastY: e.clientY,
      lastTime: Date.now(),
      currentDeltaY: 0,
      currentDeltaX: 0,
      isDragging: false,
      pointerId: e.pointerId,
      initialHeight: panel.offsetHeight || 320
    };
  };

  #onPointerMove = (e) => {
    if (!this.#dragState) return;
    const panel = this.root?.querySelector('.drawer-panel');
    if (!panel) return;

    const deltaY = e.clientY - this.#dragState.startY;
    const deltaX = e.clientX - this.#dragState.startX;
    const now = Date.now();

    this.#dragState.lastY = e.clientY;
    this.#dragState.lastTime = now;
    this.#dragState.currentDeltaY = deltaY;
    this.#dragState.currentDeltaX = deltaX;

    if (!this.#dragState.isDragging && (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5)) {
      this.#dragState.isDragging = true;
      try {
        if (e.pointerId !== undefined) {
          panel.setPointerCapture?.(e.pointerId);
        }
      } catch {
        // Ignore
      }
    }

    if (!this.#dragState.isDragging) return;

    if (this.placement.value === 'bottom') {
      if (deltaY > 0) {
        // Dragging down (pulling toward close)
        panel.style.transform = `translate3d(0, ${deltaY}px, 0)`;
        this.#applyBackgroundScale(true, deltaY / this.#dragState.initialHeight);
      } else {
        // Dragging up beyond bounds (Rubber-band resistance)
        const resistance = Math.pow(Math.abs(deltaY), 0.72);
        panel.style.transform = `translate3d(0, -${resistance}px, 0)`;
      }
    } else if (this.placement.value === 'top') {
      if (deltaY < 0) {
        // Dragging up (pulling toward close)
        panel.style.transform = `translate3d(0, ${deltaY}px, 0)`;
        this.#applyBackgroundScale(true, Math.abs(deltaY) / this.#dragState.initialHeight);
      } else {
        // Dragging down beyond bounds (Rubber-band resistance)
        const resistance = Math.pow(Math.abs(deltaY), 0.72);
        panel.style.transform = `translate3d(0, ${resistance}px, 0)`;
      }
    } else if (this.placement.value === 'right') {
      if (deltaX > 0) {
        panel.style.transform = `translate3d(${deltaX}px, 0, 0)`;
      } else {
        const resistance = Math.pow(Math.abs(deltaX), 0.72);
        panel.style.transform = `translate3d(-${resistance}px, 0, 0)`;
      }
    } else if (this.placement.value === 'left') {
      if (deltaX < 0) {
        panel.style.transform = `translate3d(${deltaX}px, 0, 0)`;
      } else {
        const resistance = Math.pow(Math.abs(deltaX), 0.72);
        panel.style.transform = `translate3d(${resistance}px, 0, 0)`;
      }
    }
  };

  #onPointerUp = (e) => {
    if (!this.#dragState) return;
    const panel = this.root?.querySelector('.drawer-panel');
    const state = this.#dragState;
    this.#dragState = null;

    try {
      if (e.pointerId !== undefined) {
        panel?.releasePointerCapture?.(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (!panel || !state.isDragging) {
      if (panel) panel.style.transition = '';
      return;
    }

    this.#justDragged = true;
    if (this.#dragResetTimer) clearTimeout(this.#dragResetTimer);
    this.#dragResetTimer = setTimeout(() => {
      this.#dragResetTimer = null;
      this.#justDragged = false;
    }, 80);

    panel.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), height 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    const deltaY = state.currentDeltaY;
    const timeDelta = Math.max(1, Date.now() - state.lastTime);
    const velocityY = (e.clientY - state.lastY) / timeDelta; // px/ms

    if (this.placement.value === 'bottom') {
      // Downward velocity flick or heavy pull -> close
      if (velocityY > 0.6 || deltaY > state.initialHeight * 0.45) {
        this.close();
        return;
      }

      // Check snap points if defined
      if (this.#parsedSnapPoints.length > 0) {
        const currentTotalH = state.initialHeight - deltaY;
        let closestIdx = 0;
        let minDiff = Infinity;

        this.#parsedSnapPoints.forEach((pt, idx) => {
          const diff = Math.abs(pt - currentTotalH);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        // Upward flick promotes to next snap point
        if (velocityY < -0.4 && closestIdx < this.#parsedSnapPoints.length - 1) {
          closestIdx++;
        }

        this.activeSnapIndex.value = closestIdx;
        this.#setSheetHeight(this.#parsedSnapPoints[closestIdx]);
        panel.style.transform = 'translate3d(0, 0, 0)';
        this.#applyBackgroundScale(true);
      } else {
        // Snap back to open position
        panel.style.transform = 'translate3d(0, 0, 0)';
        this.#applyBackgroundScale(true);
      }
    } else if (this.placement.value === 'top') {
      // Upward velocity flick or heavy pull up -> close
      if (velocityY < -0.5 || deltaY < -state.initialHeight * 0.4) {
        this.close();
        return;
      }
      panel.style.transform = 'translate3d(0, 0, 0)';
      this.#applyBackgroundScale(true);
    } else {
      // Side drawer flick
      if (Math.abs(state.currentDeltaX) > 100) {
        this.close();
      } else {
        panel.style.transform = 'translate3d(0, 0, 0)';
      }
    }
  };

  static styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .drawer-panel {
      position: fixed;
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-primary, #0f172a);
      box-shadow: var(--el-shadow-popover, 0 25px 50px -12px rgba(0, 0, 0, 0.28));
      display: flex;
      flex-direction: column;
      z-index: 1001;
      visibility: hidden;
      pointer-events: none;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      max-width: 100vw;
      max-height: 100vh;
      max-height: 100dvh;
      overscroll-behavior: contain;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      touch-action: none;
      user-select: none;
      will-change: transform;
    }

    /* Placements */
    .placement-right {
      top: 0;
      right: 0;
      bottom: 0;
      width: var(--el-drawer-size, 380px);
      transform: translate3d(100%, 0, 0);
      border-left: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .placement-left {
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--el-drawer-size, 380px);
      transform: translate3d(-100%, 0, 0);
      border-right: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .placement-top {
      top: 0;
      left: 0;
      right: 0;
      height: var(--el-drawer-size, auto);
      min-height: 220px;
      max-height: 90vh;
      transform: translate3d(0, -100%, 0);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: 0 0 var(--el-radius-xl, 16px) var(--el-radius-xl, 16px);
    }

    /* Vaul iOS Bottom Sheet */
    .placement-bottom {
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--el-drawer-size, auto);
      min-height: 240px;
      max-height: 96vh;
      transform: translate3d(0, 100%, 0);
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-xl, 16px) var(--el-radius-xl, 16px) 0 0;
    }

    .drawer-panel.open {
      transform: translate3d(0, 0, 0);
      visibility: visible;
      pointer-events: auto;
    }

    /* Vaul Drag Handle Pill */
    .drawer-handle-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 0 4px 0;
      cursor: grab;
      touch-action: none;
      flex-shrink: 0;
    }

    .drawer-handle-bar.handle-bottom {
      padding: 6px 0 10px 0;
    }

    .drawer-handle-pill {
      width: 38px;
      height: 4.5px;
      border-radius: 9999px;
      background: var(--el-text-muted, #94a3b8);
      opacity: 0.45;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .drawer-handle-bar:hover .drawer-handle-pill,
    .drawer-handle-bar:active .drawer-handle-pill {
      opacity: 0.8;
      transform: scaleY(1.2);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--el-spacing-md, 14px) var(--el-spacing-lg, 24px);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      cursor: grab;
    }

    .drawer-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      letter-spacing: -0.015em;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--el-text-muted, #64748b);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--el-radius-md, 8px);
      transition: background 0.15s ease, color 0.15s ease;
    }

    .close-btn:hover {
      background: var(--el-step-4, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
    }

    .close-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--el-spacing-lg, 24px);
      font-family: var(--el-font-sans, system-ui, sans-serif);
      touch-action: pan-y;
      user-select: text;
    }

    .drawer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--el-spacing-sm, 8px);
      padding: var(--el-spacing-md, 14px) var(--el-spacing-lg, 24px);
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-step-2, #f8fafc);
    }

    @media (max-width: 640px) {
      .placement-left,
      .placement-right {
        width: 100vw !important;
        max-width: 100vw !important;
      }

      .drawer-header,
      .drawer-body,
      .drawer-footer {
        padding-left: var(--el-spacing-md, 16px);
        padding-right: var(--el-spacing-md, 16px);
      }
    }

    :host([data-mode="inline"]) {
      display: block;
    }

    :host([data-mode="inline"]) .backdrop,
    :host([data-mode="inline"]) .drawer-handle-bar,
    :host([data-mode="inline"]) .close-btn {
      display: none !important;
    }

    :host([data-mode="inline"]) .drawer-panel {
      position: sticky;
      top: 0;
      left: auto;
      right: auto;
      bottom: auto;
      transform: none !important;
      opacity: 1;
      pointer-events: auto;
      z-index: auto;
      box-shadow: none;
      width: 100%;
      max-width: 100%;
      height: auto;
      max-height: 100dvh;
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
    }
  `;

  render() {
    return html`
      <div
        class=${() => `backdrop ${this.isOpen.value ? 'open' : ''}`}
        @click=${this.#onBackdropClick}
        aria-hidden="true"
      ></div>

      <div
        class=${() =>
          `drawer-panel placement-${this.placement.value} ${this.isOpen.value ? 'open' : ''}`}
        part="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        @pointerup=${this.#onPointerUp}
        @pointercancel=${this.#onPointerUp}
      >
        ${() =>
          this.hasHandle.value &&
          (this.placement.value === 'bottom' ||
            (this.hasAttribute('handle') && this.placement.value !== 'top'))
            ? html`
                <div class="drawer-handle-bar" part="handle">
                  <div class="drawer-handle-pill"></div>
                </div>
              `
            : null}

        <div class="drawer-header" part="header">
          <h2 id="drawer-title" class="drawer-title">
            <slot name="header">${() => this.titleText.value}</slot>
          </h2>
          <button
            type="button"
            class="close-btn"
            aria-label="Close drawer"
            @click=${() => this.close()}
          >
            ✕
          </button>
        </div>

        <div class="drawer-body" part="body">
          <slot></slot>
        </div>

        <div class="drawer-footer" part="footer">
          <slot name="footer"></slot>
        </div>

        ${() =>
          this.hasHandle.value && this.placement.value === 'top'
            ? html`
                <div class="drawer-handle-bar handle-bottom" part="handle">
                  <div class="drawer-handle-pill"></div>
                </div>
              `
            : null}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-drawer')) {
  customElements.define('el-drawer', ElDrawer);
}
