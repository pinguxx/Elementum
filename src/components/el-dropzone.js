/**
 * <el-dropzone>
 * Accessible drag-and-drop file upload target inspired by shadcn/ui community.
 * Handles dragenter, dragover, dragleave, drop, file type filtering,
 * max file size checks, and programmatic file dialog triggers.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElDropzone extends Elementum {
  static observedAttributes = ['accept', 'max-size', 'multiple', 'disabled'];

  accept = signal('');
  maxSize = signal(null); // in bytes
  multiple = signal(false);
  disabled = signal(false);
  isDragOver = signal(false);
  selectedFiles = signal([]);

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      width: 100%;
    }

    .dropzone-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      border: 2px dashed var(--el-surface-border, #cbd5e1);
      border-radius: var(--el-radius-lg, 12px);
      background: var(--el-surface-base, #ffffff);
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s ease, background-color 0.15s ease;
      position: relative;
      box-sizing: border-box;
    }

    :host-context([data-theme="dark"]) .dropzone-box {
      background: #1e293b;
      border-color: #334155;
    }

    .dropzone-box:hover:not(.disabled),
    .dropzone-box.dragover {
      border-color: var(--el-color-primary, #2563eb);
      background: rgba(37, 99, 235, 0.03);
    }

    :host-context([data-theme="dark"]) .dropzone-box:hover:not(.disabled),
    :host-context([data-theme="dark"]) .dropzone-box.dragover {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    .dropzone-box.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--el-surface-muted, #f8fafc);
    }

    .icon {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: var(--el-surface-muted, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      color: var(--el-color-primary, #2563eb);
    }

    :host-context([data-theme="dark"]) .icon {
      background: #0f172a;
      color: #60a5fa;
    }

    .headline {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
      margin: 0 0 4px 0;
    }

    :host-context([data-theme="dark"]) .headline {
      color: #f8fafc;
    }

    .subtext {
      font-size: 0.8rem;
      color: var(--el-text-muted, #64748b);
      margin: 0;
    }

    .file-input {
      display: none;
    }

    .file-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: var(--el-surface-muted, #f1f5f9);
      border-radius: var(--el-radius-sm, 6px);
      font-size: 0.8rem;
      color: var(--el-text-secondary, #334155);
    }

    :host-context([data-theme="dark"]) .file-item {
      background: #0f172a;
      color: #94a3b8;
    }
  `;

  connected() {
    this.#syncAttrs();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.accept.value = this.getAttribute('accept') || '';
    this.maxSize.value = this.hasAttribute('max-size') ? parseInt(this.getAttribute('max-size'), 10) : null;
    this.multiple.value = this.hasAttribute('multiple');
    this.disabled.value = this.hasAttribute('disabled');
  }

  openFileDialog = () => {
    if (this.disabled.value) return;
    const input = this.shadowRoot?.querySelector('.file-input');
    input?.click();
  };

  #onDragOver = (e) => {
    e.preventDefault();
    if (this.disabled.value) return;
    this.isDragOver.value = true;
  };

  #onDragLeave = () => {
    this.isDragOver.value = false;
  };

  #onDrop = (e) => {
    e.preventDefault();
    this.isDragOver.value = false;
    if (this.disabled.value) return;

    if (e.dataTransfer?.files) {
      this.#processFiles(Array.from(e.dataTransfer.files));
    }
  };

  #onFileInputChange = (e) => {
    if (e.target.files) {
      this.#processFiles(Array.from(e.target.files));
    }
  };

  #processFiles(files) {
    let validFiles = files;

    if (this.maxSize.value) {
      validFiles = validFiles.filter(f => f.size <= this.maxSize.value);
    }

    if (!this.multiple.value && validFiles.length > 1) {
      validFiles = [validFiles[0]];
    }

    this.selectedFiles.value = validFiles;
    this.emit('files-selected', { files: validFiles });
  }

  render() {
    return html`
      <div
        class=${() => `dropzone-box ${this.isDragOver.value ? 'dragover' : ''} ${this.disabled.value ? 'disabled' : ''}`}
        part="dropzone"
        role="button"
        tabindex="0"
        onclick=${this.openFileDialog}
        ondragover=${this.#onDragOver}
        ondragleave=${this.#onDragLeave}
        ondrop=${this.#onDrop}
      >
        <input
          type="file"
          class="file-input"
          aria-label="Upload file"
          tabindex="-1"
          accept=${() => this.accept.value}
          ?multiple=${() => this.multiple.value}
          onchange=${this.#onFileInputChange}
        />
        <div class="icon" part="icon">
          <slot name="icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </slot>
        </div>
        <p class="headline" part="headline">
          <slot name="title">Click to upload or drag & drop</slot>
        </p>
        <p class="subtext" part="subtext">
          <slot name="description">Any file up to 10MB</slot>
        </p>
      </div>

      ${() => {
        const files = this.selectedFiles.value;
        if (files.length === 0) return '';
        return html`
          <div class="file-list" part="file-list">
            ${files.map(f => html`<div class="file-item"><span>📄 ${f.name}</span><span>${(f.size / 1024).toFixed(1)} KB</span></div>`)}
          </div>
        `;
      }}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-dropzone')) {
  customElements.define('el-dropzone', ElDropzone);
}
