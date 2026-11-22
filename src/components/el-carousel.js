/**
 * <el-carousel> & <el-carousel-slide>
 * Accessible swipeable/clickable carousel inspired by shadcn/ui.
 * Supports auto-play, loop, swipe gestures, keyboard arrow navigation,
 * dots indicators, and previous/next buttons.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElCarouselSlide extends Elementum {
  static styles = css`
    :host {
      flex: 0 0 100%;
      width: 100%;
      min-width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      position: relative;
    }

    ::slotted(*) {
      width: 100%;
      box-sizing: border-box;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

export class ElCarousel extends Elementum {
  static observedAttributes = ['auto-play', 'autoplay', 'interval', 'loop'];

  currentIndex = signal(0);
  totalSlides = signal(0);
  autoPlay = signal(false);
  interval = signal(4000);
  loop = signal(true);

  #autoPlayTimer = null;
  #startX = 0;
  #isSwiping = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 160px;
      overflow: hidden;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      border-radius: var(--el-radius-md, 8px);
    }

    .viewport {
      overflow: hidden;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 160px;
      position: relative;
      display: flex;
      touch-action: pan-y pinch-zoom;
    }

    .track {
      display: flex;
      flex: 1;
      width: 100%;
      height: 100%;
      transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
      box-sizing: border-box;
    }

    ::slotted(el-carousel-slide) {
      flex: 0 0 100%;
      width: 100%;
      height: 100%;
      min-height: 100%;
      box-sizing: border-box;
    }

    /* Controls */
    .controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      transform: translateY(-50%);
      pointer-events: none;
      z-index: 10;
    }

    .nav-btn {
      pointer-events: auto;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 1px solid var(--el-surface-border, rgba(255, 255, 255, 0.2));
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-primary, #0f172a);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: background-color 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
      backdrop-filter: blur(8px);
    }

    .nav-btn:hover {
      background: var(--el-surface-muted, #f1f5f9);
      transform: scale(1.08);
    }

    /* Indicators (Dots) */
    .dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      position: absolute;
      bottom: 4px;
      left: 0;
      right: 0;
      z-index: 10;
    }

    .dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      min-height: 24px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .dot::after {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.45);
      border: 1px solid rgba(0, 0, 0, 0.15);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
    }

    .dot.active::after {
      width: 22px;
      background: var(--el-color-primary, #3b82f6);
      border-color: transparent;
    }
  `;

  connected() {
    this.#syncAttrs();

    this.#updateSlidesCount();

    const observer = new MutationObserver(() => this.#updateSlidesCount());
    observer.observe(this, { childList: true });
    this._observer = observer;

    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('pointerdown', this.#onPointerDown);
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
  }

  #syncAttrs() {
    const autoAttr = this.getAttribute('auto-play') ?? this.getAttribute('autoplay');
    this.autoPlay.value = (this.hasAttribute('auto-play') || this.hasAttribute('autoplay')) && autoAttr !== 'false';
    this.interval.value = parseInt(this.getAttribute('interval') || '4000', 10) || 4000;
    this.loop.value = this.getAttribute('loop') !== 'false';

    if (this.autoPlay.value) {
      this.#startAutoPlay();
    } else {
      this.#stopAutoPlay();
    }
  }

  disconnected() {
    this._observer?.disconnect();
    this.removeEventListener('keydown', this.#onKeyDown);
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.#stopAutoPlay();
  }

  #updateSlidesCount() {
    const slides = Array.from(this.querySelectorAll('el-carousel-slide'));
    this.totalSlides.value = slides.length;
  }

  #startAutoPlay() {
    this.#stopAutoPlay();
    this.#autoPlayTimer = setInterval(() => {
      this.next();
    }, this.interval.value);
  }

  #stopAutoPlay() {
    if (this.#autoPlayTimer) {
      clearInterval(this.#autoPlayTimer);
      this.#autoPlayTimer = null;
    }
  }

  next = () => {
    const total = this.totalSlides.value;
    if (total === 0) return;
    if (this.currentIndex.value < total - 1) {
      this.goTo(this.currentIndex.value + 1);
    } else if (this.loop.value) {
      this.goTo(0);
    }
  };

  prev = () => {
    const total = this.totalSlides.value;
    if (total === 0) return;
    if (this.currentIndex.value > 0) {
      this.goTo(this.currentIndex.value - 1);
    } else if (this.loop.value) {
      this.goTo(total - 1);
    }
  };

  goTo(index) {
    this.currentIndex.value = index;
    const track = this.shadowRoot?.querySelector('.track');
    if (track) {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
    this.emit('slide-change', { index });
  }

  #onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    }
  };

  #onPointerDown = (e) => {
    this.#startX = e.clientX;
    this.#isSwiping = true;
    window.addEventListener('pointerup', this.#onPointerUp, { once: true });
  };

  #onPointerUp = (e) => {
    if (!this.#isSwiping) return;
    this.#isSwiping = false;
    const deltaX = e.clientX - this.#startX;
    if (deltaX > 40) this.prev();
    else if (deltaX < -40) this.next();
  };

  render() {
    return html`
      <div class="viewport" part="viewport" tabindex="0" aria-roledescription="carousel">
        <div class="track" part="track">
          <slot></slot>
        </div>

        <div class="controls" part="controls">
          <button type="button" class="nav-btn prev" aria-label="Previous slide" onclick=${this.prev}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button type="button" class="nav-btn next" aria-label="Next slide" onclick=${this.next}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div class="dots" part="dots">
          ${() => {
            const count = this.totalSlides.value;
            const current = this.currentIndex.value;
            return Array.from({ length: count }).map((_, i) =>
              html`<button
                type="button"
                class=${() => `dot ${i === current ? 'active' : ''}`}
                aria-label=${() => `Go to slide ${i + 1}`}
                onclick=${() => this.goTo(i)}
              ></button>`
            );
          }}
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-carousel-slide')) customElements.define('el-carousel-slide', ElCarouselSlide);
  if (!customElements.get('el-carousel')) customElements.define('el-carousel', ElCarousel);
}
