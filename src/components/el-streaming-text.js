import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-streaming-text>
 * Realistic token-by-token streaming animation for AI generation responses,
 * with customizable cadence, blinking cursor, and completion events.
 *
 * @element el-streaming-text
 * @fires stream-start - Dispatched when streaming begins
 * @fires stream-end - Dispatched when all characters/tokens have streamed
 * @fires stream-tick - Dispatched on each character/token typed
 * @csspart text - The text output container
 * @csspart cursor - The animated blinking cursor
 */
export class ElStreamingText extends Elementum {
  static observedAttributes = ['text', 'speed', 'cursor', 'auto-start'];

  text = signal('');
  displayedText = signal('');
  speed = signal(20); // ms per character
  showCursor = signal(true);
  isStreaming = signal(false);
  isComplete = signal(false);

  #timer = null;
  #targetIndex = 0;

  connected() {
    this.text.value = this.getAttribute('text') || this.textContent.trim();
    if (this.hasAttribute('speed')) {
      this.speed.value = parseInt(this.getAttribute('speed'), 10) || 20;
    }
    this.showCursor.value = this.getAttribute('cursor') !== 'false';

    const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion || this.getAttribute('auto-start') === 'false') {
      if (prefersReducedMotion) {
        this.finish();
      }
    } else if (this.text.value) {
      this.start();
    }
  }

  disconnected() {
    this.#clearTimer();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'text':
        this.text.value = newValue || '';
        if (this.isConnected && this.getAttribute('auto-start') !== 'false') {
          this.start();
        }
        break;
      case 'speed':
        this.speed.value = parseInt(newValue, 10) || 20;
        break;
      case 'cursor':
        this.showCursor.value = newValue !== 'false';
        break;
    }
  }

  #clearTimer() {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  start() {
    this.#clearTimer();
    const full = this.text.value;
    if (!full) {
      this.displayedText.value = '';
      this.isComplete.value = true;
      return;
    }

    this.#targetIndex = 0;
    this.displayedText.value = '';
    this.isStreaming.value = true;
    this.isComplete.value = false;

    this.dispatchEvent(new CustomEvent('stream-start', { bubbles: true, composed: true }));
    this.#step();
  }

  #step = () => {
    const full = this.text.value;
    if (this.#targetIndex < full.length) {
      // Chunk 1-3 chars for natural LLM token simulation
      const chunkSize = full[this.#targetIndex] === ' ' ? 1 : Math.min(3, full.length - this.#targetIndex);
      this.#targetIndex += chunkSize;
      this.displayedText.value = full.slice(0, this.#targetIndex);

      this.dispatchEvent(
        new CustomEvent('stream-tick', {
          bubbles: true,
          composed: true,
          detail: { text: this.displayedText.value }
        })
      );

      // Add micro-jitter for organic human/LLM typing rhythm
      const jitter = (Math.random() * 0.4 + 0.8) * this.speed.value;
      this.#timer = setTimeout(this.#step, jitter);
    } else {
      this.finish();
    }
  };

  pause() {
    this.#clearTimer();
    this.isStreaming.value = false;
  }

  resume() {
    if (!this.isComplete.value && !this.isStreaming.value) {
      this.isStreaming.value = true;
      this.#step();
    }
  }

  finish() {
    this.#clearTimer();
    this.displayedText.value = this.text.value;
    this.#targetIndex = this.text.value.length;
    this.isStreaming.value = false;
    this.isComplete.value = true;

    this.dispatchEvent(
      new CustomEvent('stream-end', {
        bubbles: true,
        composed: true,
        detail: { text: this.text.value }
      })
    );
  }

  static styles = css`
    :host {
      display: inline-block;
      box-sizing: border-box;
      font-family: inherit;
      line-height: inherit;
      color: inherit;
    }

    .text-content {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .cursor {
      display: inline-block;
      width: 0.55em;
      height: 1.1em;
      margin-left: 2px;
      vertical-align: -0.15em;
      background-color: var(--el-color-primary, #2563eb);
      border-radius: 1px;
      animation: cursor-blink 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    :host([complete]) .cursor {
      display: none;
    }

    @keyframes cursor-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .cursor {
        animation: none;
        opacity: 0.8;
      }
    }
  `;

  render() {
    return html`
      <span class="text-content" part="text">${this.displayedText}</span>${() => (this.showCursor.value && !this.isComplete.value
        ? html`<span class="cursor" part="cursor" aria-hidden="true"></span>`
        : null)}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-streaming-text')) {
  customElements.define('el-streaming-text', ElStreamingText);
}
