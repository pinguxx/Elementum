import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export class ElAvatar extends Elementum {
  static observedAttributes = ['src', 'alt', 'name', 'size', 'shape', 'status'];

  src = signal('');
  alt = signal('');
  name = signal('');
  size = signal('md'); // 'sm' | 'md' | 'lg'
  shape = signal('circle'); // 'circle' | 'square'
  status = signal(''); // 'online' | 'offline' | 'busy' | 'away'
  #imageError = signal(false);

  connected() {
    this.#sync();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'src') {
      this.#imageError.value = false;
    }
    this.#sync();
  }

  #sync() {
    this.src.value = this.getAttribute('src') || '';
    this.alt.value = this.getAttribute('alt') || '';
    this.name.value = this.getAttribute('name') || '';
    this.size.value = this.getAttribute('size') || 'md';
    this.shape.value = this.getAttribute('shape') || 'circle';
    this.status.value = this.getAttribute('status') || '';
  }

  static styles = css`
    :host {
      display: inline-flex;
      position: relative;
      vertical-align: middle;
      box-sizing: border-box;
      user-select: none;
      border-radius: var(--el-radius-full, 9999px);
    }

    :host([shape="square"]) {
      border-radius: var(--el-radius-md, 8px);
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
      font-weight: 600;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      border: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .shape-circle {
      border-radius: var(--el-radius-full, 9999px);
    }

    .shape-square {
      border-radius: var(--el-radius-md, 8px);
    }

    /* Sizes */
    .size-sm {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }

    .size-md {
      width: 38px;
      height: 38px;
      font-size: 14px;
    }

    .size-lg {
      width: 48px;
      height: 48px;
      font-size: 18px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Status dot */
    .status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: var(--el-radius-full, 9999px);
      border: 2px solid var(--el-surface-card, #ffffff);
    }

    .size-lg .status-dot {
      width: 12px;
      height: 12px;
    }

    .status-online {
      background: var(--el-color-success, #10b981);
    }

    .status-busy {
      background: var(--el-color-danger, #ef4444);
    }

    .status-away {
      background: #f59e0b;
    }

    .status-offline {
      background: var(--el-text-muted, #94a3b8);
    }
  `;

  #onImageError = () => {
    this.#imageError.value = true;
  };

  render() {
    const showImage = () => Boolean(this.src.value) && !this.#imageError.value;
    const initials = () => getInitials(this.name.value);

    return html`
      <div
        class=${() => `avatar size-${this.size.value} shape-${this.shape.value}`}
        part="avatar"
        role="img"
        aria-label=${() => this.alt.value || this.name.value || 'User avatar'}
      >
        ${() =>
          showImage()
            ? html`<img
                src=${() => this.src.value}
                alt=${() => this.alt.value || this.name.value}
                @error=${this.#onImageError}
              />`
            : html`<span part="initials">${initials() || '👤'}</span>`}

        ${() =>
          this.status.value
            ? html`<span class=${() => `status-dot status-${this.status.value}`} part="status"></span>`
            : null}
      </div>
    `;
  }
}

export class ElAvatarGroup extends Elementum {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
    }

    ::slotted(el-avatar) {
      border-radius: var(--el-radius-full, 9999px);
      position: relative;
    }

    ::slotted(el-avatar[shape="square"]) {
      border-radius: var(--el-radius-md, 8px);
    }

    ::slotted(el-avatar:not(:first-child)) {
      margin-left: var(--el-avatar-overlap, -10px);
      box-shadow: 0 0 0 2px var(--el-surface-card, #ffffff);
    }

    ::slotted(el-avatar:hover) {
      z-index: 10;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-avatar')) customElements.define('el-avatar', ElAvatar);
  if (!customElements.get('el-avatar-group')) customElements.define('el-avatar-group', ElAvatarGroup);
}
