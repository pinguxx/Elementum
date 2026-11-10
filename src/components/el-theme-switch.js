/**
 * <el-theme-switch>
 * Interactive toggle for switching between Light and Dark design system themes.
 */

import { Elementum, html, css, signal } from '../index.js';

export class ElThemeSwitch extends Elementum {
  theme = signal('light'); // 'light' | 'dark'

  static styles = css`
    :host {
      display: inline-block;
      user-select: none;
      font-family: inherit;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: var(--el-spacing-xs, 4px);
      padding: 6px 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--el-text-base, #111827);
      background: var(--el-surface-muted, #f3f4f6);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-full, 9999px);
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      outline: none;
    }

    button:hover {
      border-color: var(--el-color-primary, #2563eb);
    }

    button:focus-visible {
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
    }

    .icon {
      font-size: 1rem;
    }
  `;

  connected() {
    // Detect existing or saved theme
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elementum-theme');
      if (saved === 'dark' || saved === 'light') {
        this.setTheme(saved);
      } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        this.setTheme('dark');
      } else {
        this.setTheme('light');
      }
    }
  }

  setTheme(theme) {
    this.theme.value = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('elementum-theme', theme);
    }
    this.emit('themechange', { theme });
  }

  toggle = () => {
    const next = this.theme.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  };

  render() {
    return html`
      <button
        type="button"
        part="button"
        @click=${this.toggle}
        aria-label="Toggle color theme"
      >
        <span class="icon">${() => (this.theme.value === 'dark' ? '🌙' : '☀️')}</span>
        <span>${() => (this.theme.value === 'dark' ? 'Dark' : 'Light')}</span>
      </button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-theme-switch')) {
  customElements.define('el-theme-switch', ElThemeSwitch);
}
