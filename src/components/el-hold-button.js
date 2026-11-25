import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-hold-button>
 * Press-and-hold confirmation button for deliberate actions (delete, deploy, pay).
 * Supports pointer hold and Space/Enter keyboard hold with fill-progress feedback.
 *
 * @element el-hold-button
 * @attr {number} duration - Hold duration in milliseconds (default: 1200)
 * @attr {'danger' | 'primary' | 'secondary'} variant - Visual color variant
 * @attr {'sm' | 'md' | 'lg'} size - Button size
 * @attr {boolean} disabled - Disables interaction
 * @attr {string} confirmed-label - Temporary label displayed after confirmation
 * @fires confirm - Fired when hold completes: detail: { duration }
 * @fires cancel - Fired if released before completion: detail: { progress }
 * @csspart button - Native interactive button element
 * @csspart progress - Animated fill bar behind the label
 * @csspart label - Text label container
 */
export class ElHoldButton extends Elementum {
  static observedAttributes = ['duration', 'variant', 'size', 'disabled', 'confirmed-label'];

  duration = signal(1200);
  variant = signal('danger'); // 'danger' | 'primary' | 'secondary'
  size = signal('md'); // 'sm' | 'md' | 'lg'
  disabled = signal(false);
  confirmedLabel = signal('Confirmed');

  holding = signal(false);
  confirmed = signal(false);
  progress = signal(0);

  #rafId = null;
  #resetTimer = null;
  #startTime = 0;

  connected() {
    this.#sync();
  }

  disconnected() {
    this.#stopRaf();
    if (this.#resetTimer) {
      clearTimeout(this.#resetTimer);
      this.#resetTimer = null;
    }
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    this.duration.value = Math.round(this.numAttr('duration', 1200, 200, 10000));
    this.variant.value = this.getAttribute('variant') || 'danger';
    this.size.value = this.getAttribute('size') || 'md';
    this.disabled.value = this.boolAttr('disabled');
    this.confirmedLabel.value = this.getAttribute('confirmed-label') || 'Confirmed';
  }

  #stopRaf() {
    if (this.#rafId !== null) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.#rafId);
      else clearTimeout(this.#rafId);
      this.#rafId = null;
    }
  }

  startHold() {
    if (this.disabled.value || this.holding.value) return;
    if (this.#resetTimer) {
      clearTimeout(this.#resetTimer);
      this.#resetTimer = null;
    }
    this.confirmed.value = false;
    this.holding.value = true;
    this.progress.value = 0;
    this.#startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.#tick();
  }

  #tick = () => {
    if (!this.holding.value) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const ratio = Math.max(0, Math.min(1, (now - this.#startTime) / this.duration.value));
    this.progress.value = ratio;
    if (ratio >= 1) {
      this.#completeHold();
      return;
    }
    this.#rafId =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(this.#tick)
        : setTimeout(this.#tick, 16);
  };

  #completeHold() {
    this.#stopRaf();
    this.holding.value = false;
    this.progress.value = 1;
    this.confirmed.value = true;
    this.emit('confirm', { duration: this.duration.value });
    this.#resetTimer = setTimeout(() => {
      this.confirmed.value = false;
      this.progress.value = 0;
      this.#resetTimer = null;
    }, 1400);
  }

  cancelHold() {
    if (!this.holding.value) return;
    this.#stopRaf();
    const reached = this.progress.value;
    this.holding.value = false;
    this.progress.value = 0;
    this.emit('cancel', { progress: reached });
  }

  #onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    this.startHold();
  };

  #onKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) this.startHold();
    } else if (e.key === 'Escape') {
      this.cancelHold();
    }
  };

  #onKeyUp = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.cancelHold();
    }
  };

  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      box-sizing: border-box;
    }

    .hold-btn {
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-weight: 600;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid transparent;
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      background: var(--el-color-danger, #dc2626);
      color: #ffffff;
      transition:
        background-color 0.15s ease,
        transform 0.12s var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
        opacity 0.15s ease;
    }

    :host([variant='primary']) .hold-btn {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }

    :host([variant='secondary']) .hold-btn {
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-surface-border, #e2e8f0);
    }

    :host([size='sm']) .hold-btn {
      min-height: 30px;
      padding: 5px 12px;
      font-size: 0.75rem;
    }

    .hold-btn,
    :host([size='md']) .hold-btn {
      min-height: 38px;
      padding: 8px 16px;
      font-size: 0.875rem;
    }

    :host([size='lg']) .hold-btn {
      min-height: 44px;
      padding: 10px 22px;
      font-size: 1rem;
    }

    .progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      width: var(--el-hold-progress, 0%);
      background: rgba(0, 0, 0, 0.24);
      pointer-events: none;
      z-index: 0;
    }

    :host([variant='secondary']) .progress-fill {
      background: var(--el-surface-muted, #e2e8f0);
    }

    .label {
      position: relative;
      z-index: 1;
      pointer-events: none;
    }

    .hold-btn:active:not(:disabled) {
      transform: scale(0.97);
    }

    .hold-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }

    .hold-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .hold-btn {
        transition: none;
      }
      .hold-btn:active:not(:disabled) {
        transform: none;
      }
    }
  `;

  render() {
    return html`
      <button
        type="button"
        class="hold-btn"
        part="button"
        ?disabled=${this.disabled}
        aria-busy=${() => (this.holding.value ? 'true' : 'false')}
        data-state=${() => (this.confirmed.value ? 'confirmed' : this.holding.value ? 'holding' : 'idle')}
        @pointerdown=${this.#onPointerDown}
        @pointerup=${() => this.cancelHold()}
        @pointerleave=${() => this.cancelHold()}
        @pointercancel=${() => this.cancelHold()}
        @keydown=${this.#onKeyDown}
        @keyup=${this.#onKeyUp}
        @blur=${() => this.cancelHold()}
      >
        <span
          class="progress-fill"
          part="progress"
          aria-hidden="true"
          style=${() => `--el-hold-progress:${(this.progress.value * 100).toFixed(1)}%;`}
        ></span>
        <span class="label" part="label">
          ${() => (this.confirmed.value ? this.confirmedLabel.value : html`<slot>Hold to confirm</slot>`)}
        </span>
      </button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-hold-button')) {
  customElements.define('el-hold-button', ElHoldButton);
}
