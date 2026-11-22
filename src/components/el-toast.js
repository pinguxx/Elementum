/**
 * <el-toast> and <el-toaster>
 * Next-generation notification toast system inspired by Sonner (Emil Kowalski).
 * Features:
 * - Ultra-smooth 60fps GPU transitions (no DOM remounting / no choppy re-render)
 * - toast.promise(promise, { loading, success, error }) with reactive in-place morphing
 * - 3D stacked card deck with butter-smooth hover expansion
 * - Gesture swipe-to-dismiss with pointer tracking
 * - Rich action and cancel buttons
 * - Zero runtime dependencies
 */

import { Elementum } from '../elementum.js';
import { css } from '../template.js';
import { signal, effect } from '../signal.js';

export class ToastManager {
  toasts = signal([]); // [{ id, message, description, variant, duration, action, cancel, dismissible, _timer }]
  #counter = 0;

  show(msgOrOpts, maybeOpts = {}) {
    const opts = typeof msgOrOpts === 'string' ? { message: msgOrOpts, ...maybeOpts } : (msgOrOpts || {});
    const id = opts.id || ++this.#counter;
    const duration = opts.duration !== undefined ? opts.duration : (opts.variant === 'loading' ? 0 : 3500);

    const item = {
      id,
      message: opts.message || '',
      description: opts.description || '',
      variant: opts.variant || 'info', // 'info' | 'success' | 'danger' | 'warning' | 'loading'
      duration,
      action: opts.action || null,
      cancel: opts.cancel || null,
      dismissible: opts.dismissible !== false,
      _timer: null
    };

    if (duration > 0) {
      item._timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    this.toasts.value = [...this.toasts.value, item];
    return id;
  }

  update(id, updates) {
    this.toasts.value = this.toasts.value.map((t) => {
      if (t.id === id) {
        if (t._timer) clearTimeout(t._timer);
        const updated = { ...t, ...updates };
        const dur = updates.duration !== undefined ? updates.duration : 3500;
        if (dur > 0) {
          updated._timer = setTimeout(() => this.dismiss(id), dur);
        }
        return updated;
      }
      return t;
    });
  }

  success(message, opts = {}) {
    return this.show(message, { ...opts, variant: 'success' });
  }

  error(message, opts = {}) {
    return this.show(message, { ...opts, variant: 'danger' });
  }

  warning(message, opts = {}) {
    return this.show(message, { ...opts, variant: 'warning' });
  }

  info(message, opts = {}) {
    return this.show(message, { ...opts, variant: 'info' });
  }

  loading(message, opts = {}) {
    return this.show(message, { ...opts, variant: 'loading', duration: 0 });
  }

  promise(prom, { loading = 'Loading...', success = 'Success', error = 'Error' } = {}) {
    const id = this.loading(
      typeof loading === 'string' ? loading : loading.message || 'Loading...',
      typeof loading === 'object' ? loading : {}
    );

    return prom
      .then((data) => {
        const successVal = typeof success === 'function' ? success(data) : success;
        const msg = typeof successVal === 'string' ? successVal : successVal.message || 'Success';
        const desc = typeof successVal === 'object' ? successVal.description : '';
        this.update(id, {
          message: msg,
          description: desc,
          variant: 'success',
          duration: 3500
        });
        return data;
      })
      .catch((err) => {
        const errorVal = typeof error === 'function' ? error(err) : error;
        const msg = typeof errorVal === 'string' ? errorVal : errorVal.message || 'Error occurred';
        const desc = typeof errorVal === 'object' ? errorVal.description : '';
        this.update(id, {
          message: msg,
          description: desc,
          variant: 'danger',
          duration: 4000
        });
        throw err;
      });
  }

  dismiss(id) {
    if (id === undefined) {
      this.toasts.value.forEach(t => { if (t._timer) clearTimeout(t._timer); });
      this.toasts.value = [];
      return;
    }
    const t = this.toasts.value.find(item => item.id === id);
    if (t && t._timer) clearTimeout(t._timer);
    this.toasts.value = this.toasts.value.filter((item) => item.id !== id);
  }
}

function createToastCallable() {
  const manager = new ToastManager();
  const fn = function (msgOrOpts, opts) {
    return manager.show(msgOrOpts, opts);
  };
  Object.setPrototypeOf(fn, ToastManager.prototype);
  fn.toasts = manager.toasts;
  fn.show = manager.show.bind(manager);
  fn.update = manager.update.bind(manager);
  fn.success = manager.success.bind(manager);
  fn.error = manager.error.bind(manager);
  fn.warning = manager.warning.bind(manager);
  fn.info = manager.info.bind(manager);
  fn.loading = manager.loading.bind(manager);
  fn.promise = manager.promise.bind(manager);
  fn.dismiss = manager.dismiss.bind(manager);
  return fn;
}

export const toast = createToastCallable();
if (typeof window !== 'undefined' && !window.toast) {
  window.toast = toast;
}

export class ElToaster extends Elementum {
  static get observedAttributes() {
    return ['position', 'expand'];
  }

  #cards = new Map(); // id -> { el, item, exiting: bool, height: number }
  #isHovered = false;
  #cleanupEffect = null;

  static styles = css`
    :host {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      max-width: 100%;
    }

    :host([position="bottom-right"]),
    :host(:not([position])) {
      bottom: 24px;
      right: 24px;
    }

    :host([position="bottom-left"]) {
      bottom: 24px;
      left: 24px;
    }

    :host([position="top-right"]) {
      top: 24px;
      right: 24px;
    }

    :host([position="top-left"]) {
      top: 24px;
      left: 24px;
    }

    :host([position="bottom-center"]) {
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
    }

    :host([position="top-center"]) {
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
    }

    .toaster-viewport {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 340px;
      max-width: 420px;
      width: 100%;
      pointer-events: none;
    }

    .toast-list {
      position: relative;
      width: 100%;
      min-height: 64px;
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      position: absolute;
      bottom: 0;
      right: 0;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-primary, #0f172a);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      cursor: grab;
      touch-action: pan-y;
      user-select: none;
      transform-origin: bottom center;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.25s ease;
      will-change: transform, opacity;
      animation: toastSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .toast-card:active {
      cursor: grabbing;
    }

    :host([position^="top"]) .toast-card {
      bottom: auto;
      top: 0;
      transform-origin: top center;
      animation-name: toastSlideDown;
    }

    :host([position*="left"]) .toast-card {
      right: auto;
      left: 0;
    }

    :host([position*="center"]) .toast-card {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }

    :root[data-theme="dark"] .toast-card {
      background: #1e293b;
      border-color: #334155;
      color: #f8fafc;
      box-shadow: 0 14px 35px -4px rgba(0, 0, 0, 0.55), 0 4px 10px -2px rgba(0, 0, 0, 0.4);
    }

    @keyframes toastSlideUp {
      from {
        opacity: 0;
        transform: translate3d(0, 24px, 0) scale(0.92);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
    }

    @keyframes toastSlideDown {
      from {
        opacity: 0;
        transform: translate3d(0, -24px, 0) scale(0.92);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
    }

    .toast-card.is-exiting {
      animation: none !important;
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
      opacity: 0 !important;
      transform: translate3d(0, 16px, 0) scale(0.92) !important;
      pointer-events: none !important;
    }

    :host([position^="top"]) .toast-card.is-exiting {
      transform: translate3d(0, -16px, 0) scale(0.92) !important;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }

    .toast-icon.loading {
      color: var(--el-color-primary, #2563eb);
      animation: toastSpin 0.9s linear infinite;
    }

    @keyframes toastSpin {
      100% { transform: rotate(360deg); }
    }

    .toast-icon.success {
      color: var(--el-color-success, #16a34a);
    }

    .toast-icon.danger {
      color: var(--el-color-danger, #dc2626);
    }

    .toast-icon.warning {
      color: #d97706;
    }

    .toast-icon.info {
      color: var(--el-color-primary, #2563eb);
    }

    .toast-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .toast-title {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.35;
      color: inherit;
      word-break: break-word;
    }

    .toast-desc {
      font-size: 0.8125rem;
      color: var(--el-text-muted, #64748b);
      line-height: 1.35;
      word-break: break-word;
    }

    :root[data-theme="dark"] .toast-desc {
      color: #94a3b8;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .toast-btn {
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: var(--el-radius-md, 6px);
      cursor: pointer;
      outline: none;
      transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      border: 1px solid transparent;
    }

    .toast-btn.action {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }

    .toast-btn.action:hover {
      background: var(--el-color-primary-hover, #1d4ed8);
      transform: translateY(-1px);
    }

    .toast-btn.cancel {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-surface-border, #e2e8f0);
    }

    :root[data-theme="dark"] .toast-btn.cancel {
      background: #334155;
      color: #f8fafc;
      border-color: #475569;
    }

    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      color: var(--el-text-muted, #94a3b8);
      font-size: 1rem;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      border-radius: 4px;
      margin-left: 2px;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .toast-close:hover {
      color: var(--el-text-primary, #0f172a);
      background: var(--el-surface-muted, rgba(0, 0, 0, 0.05));
    }

    :root[data-theme="dark"] .toast-close:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.1);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  connected() {
    this.shadowRoot.innerHTML = `
      <style>${ElToaster.styles.cssText}</style>
      <div class="toaster-viewport" role="region" aria-label="Notifications">
        <div class="toast-list"></div>
      </div>
    `;

    const viewport = this.shadowRoot.querySelector('.toaster-viewport');
    viewport.addEventListener('mouseenter', this.#onMouseEnter);
    viewport.addEventListener('mouseleave', this.#onMouseLeave);

    this.#cleanupEffect = effect(() => {
      const items = toast.toasts.value;
      this.#syncToasts(items);
    });
  }

  disconnected() {
    if (this.#cleanupEffect) {
      this.#cleanupEffect();
      this.#cleanupEffect = null;
    }
    const viewport = this.shadowRoot.querySelector('.toaster-viewport');
    if (viewport) {
      viewport.removeEventListener('mouseenter', this.#onMouseEnter);
      viewport.removeEventListener('mouseleave', this.#onMouseLeave);
    }
  }

  #onMouseEnter = () => {
    this.#isHovered = true;
    this.#updateLayout();
  };

  #onMouseLeave = () => {
    this.#isHovered = false;
    this.#updateLayout();
  };

  #getIconSvg(variant) {
    if (variant === 'loading') {
      return `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      `;
    }
    if (variant === 'success') {
      return `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      `;
    }
    if (variant === 'danger') {
      return `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
        </svg>
      `;
    }
    if (variant === 'warning') {
      return `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
      `;
    }
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    `;
  }

  #createCardElement(item) {
    const card = document.createElement('div');
    card.className = `toast-card ${item.variant}`;
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.setAttribute('data-toast-id', String(item.id));

    card.innerHTML = `
      <span class="toast-icon ${item.variant}" aria-hidden="true">
        ${this.#getIconSvg(item.variant)}
      </span>
      <div class="toast-body">
        <div class="toast-title"></div>
        <div class="toast-desc" style="display: none;"></div>
        <div class="toast-actions" style="display: none;"></div>
      </div>
      <button type="button" class="toast-close" aria-label="Dismiss notification" style="display: none;">✕</button>
    `;

    this.#updateCardContent(card, item);
    this.#setupGesture(card, item.id);
    return card;
  }

  #updateCardContent(card, item) {
    // Update classes
    card.className = `toast-card ${item.variant}`;

    // Update icon
    const iconEl = card.querySelector('.toast-icon');
    if (iconEl) {
      iconEl.className = `toast-icon ${item.variant}`;
      iconEl.innerHTML = this.#getIconSvg(item.variant);
    }

    // Update title
    const titleEl = card.querySelector('.toast-title');
    if (titleEl) {
      titleEl.textContent = item.message;
    }

    // Update description
    const descEl = card.querySelector('.toast-desc');
    if (descEl) {
      if (item.description) {
        descEl.textContent = item.description;
        descEl.style.display = 'block';
      } else {
        descEl.textContent = '';
        descEl.style.display = 'none';
      }
    }

    // Update actions
    const actionsEl = card.querySelector('.toast-actions');
    if (actionsEl) {
      actionsEl.innerHTML = '';
      if (item.action || item.cancel) {
        actionsEl.style.display = 'flex';
        if (item.action) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'toast-btn action';
          btn.textContent = item.action.label || 'Action';
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof item.action.onClick === 'function') item.action.onClick(item);
            toast.dismiss(item.id);
          });
          actionsEl.appendChild(btn);
        }
        if (item.cancel) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'toast-btn cancel';
          btn.textContent = item.cancel.label || 'Cancel';
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof item.cancel.onClick === 'function') item.cancel.onClick(item);
            toast.dismiss(item.id);
          });
          actionsEl.appendChild(btn);
        }
      } else {
        actionsEl.style.display = 'none';
      }
    }

    // Update close button
    const closeEl = card.querySelector('.toast-close');
    if (closeEl) {
      if (item.dismissible) {
        closeEl.style.display = 'inline-flex';
        closeEl.onclick = (e) => {
          e.stopPropagation();
          toast.dismiss(item.id);
        };
      } else {
        closeEl.style.display = 'none';
      }
    }
  }

  #setupGesture(cardEl, id) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const onPointerDown = (e) => {
      if (e.target.closest('button')) return;
      startX = e.clientX;
      currentX = 0;
      isDragging = true;
      cardEl.style.transition = 'none';
      if (cardEl.setPointerCapture) cardEl.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      currentX = e.clientX - startX;
      cardEl.style.transform = `translate3d(${currentX}px, 0, 0)`;
      cardEl.style.opacity = `${Math.max(0.2, 1 - Math.abs(currentX) / 180)}`;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      cardEl.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease';

      if (Math.abs(currentX) > 75) {
        const flyDir = currentX > 0 ? 350 : -350;
        cardEl.style.transform = `translate3d(${flyDir}px, 0, 0)`;
        cardEl.style.opacity = '0';
        setTimeout(() => toast.dismiss(id), 180);
      } else {
        this.#updateLayout();
      }
    };

    cardEl.addEventListener('pointerdown', onPointerDown);
    cardEl.addEventListener('pointermove', onPointerMove);
    cardEl.addEventListener('pointerup', onPointerUp);
    cardEl.addEventListener('pointercancel', onPointerUp);
  }

  #syncToasts(items) {
    const listEl = this.shadowRoot.querySelector('.toast-list');
    if (!listEl) return;

    const currentIds = new Set(items.map(t => t.id));

    // 1. Remove or start exit animation for items not in current list
    for (const [id, record] of this.#cards.entries()) {
      if (!currentIds.has(id) && !record.exiting) {
        record.exiting = true;
        record.el.classList.add('is-exiting');
        setTimeout(() => {
          if (record.el.parentNode === listEl) {
            listEl.removeChild(record.el);
          }
          this.#cards.delete(id);
          this.#updateLayout();
        }, 220);
      }
    }

    // 2. Add or update items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let record = this.#cards.get(item.id);

      if (!record) {
        const cardEl = this.#createCardElement(item);
        listEl.appendChild(cardEl);
        record = { el: cardEl, item, exiting: false, height: 60 };
        this.#cards.set(item.id, record);

        const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
        raf(() => {
          if (cardEl.offsetHeight) record.height = cardEl.offsetHeight;
          this.#updateLayout();
        });
      } else {
        this.#updateCardContent(record.el, item);
        record.item = item;
      }
    }

    this.#updateLayout();
  }

  #updateLayout() {
    const activeRecords = [];
    const isTop = (this.getAttribute('position') || '').startsWith('top');
    const isHovered = this.#isHovered;

    for (const item of toast.toasts.value) {
      const rec = this.#cards.get(item.id);
      if (rec && !rec.exiting) {
        activeRecords.push(rec);
      }
    }

    const total = activeRecords.length;
    let accumulatedOffset = 0;
    const gap = 12;

    for (let i = 0; i < total; i++) {
      const rec = activeRecords[i];
      const stackIndex = total - 1 - i; // 0 is newest / front card
      const cardEl = rec.el;

      if (isHovered) {
        const yOffset = isTop ? accumulatedOffset : -accumulatedOffset;
        cardEl.style.transform = `translate3d(0, ${yOffset}px, 0) scale(1)`;
        cardEl.style.zIndex = `${30 - stackIndex}`;
        cardEl.style.opacity = '1';
        cardEl.style.pointerEvents = 'auto';

        const h = rec.height || cardEl.offsetHeight || 60;
        accumulatedOffset += h + gap;
      } else {
        if (stackIndex === 0) {
          cardEl.style.transform = 'translate3d(0, 0, 0) scale(1)';
          cardEl.style.zIndex = '20';
          cardEl.style.opacity = '1';
          cardEl.style.pointerEvents = 'auto';
        } else if (stackIndex === 1) {
          const dir = isTop ? 14 : -14;
          cardEl.style.transform = `translate3d(0, ${dir}px, 0) scale(0.95)`;
          cardEl.style.zIndex = '19';
          cardEl.style.opacity = '0.92';
          cardEl.style.pointerEvents = 'auto';
        } else if (stackIndex === 2) {
          const dir = isTop ? 28 : -28;
          cardEl.style.transform = `translate3d(0, ${dir}px, 0) scale(0.90)`;
          cardEl.style.zIndex = '18';
          cardEl.style.opacity = '0.78';
          cardEl.style.pointerEvents = 'auto';
        } else {
          const dir = isTop ? 42 : -42;
          cardEl.style.transform = `translate3d(0, ${dir}px, 0) scale(0.85)`;
          cardEl.style.zIndex = '15';
          cardEl.style.opacity = '0';
          cardEl.style.pointerEvents = 'none';
        }
      }
    }
  }

  render() {
    return '';
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-toaster')) {
  customElements.define('el-toaster', ElToaster);
}
