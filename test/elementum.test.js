import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Elementum } from '../src/elementum.js';
import { html, css } from '../src/template.js';
import { signal } from '../src/signal.js';

test('Elementum base class initializes shadow root and renders template', () => {
  class TestEl extends Elementum {
    static styles = css`:host { display: block; }`;
    render() {
      return html`<span>Rendered Inside Shadow</span>`;
    }
  }
  customElements.define('test-el', TestEl);

  const el = document.createElement('test-el');
  document.body.appendChild(el);

  assert.ok(el.shadowRoot);
  assert.ok(el.shadowRoot.innerHTML.includes('Rendered Inside Shadow'));

  document.body.removeChild(el);
});

test('Elementum supports light DOM when static shadowRoot = false', () => {
  class LightEl extends Elementum {
    static shadowRoot = false;
    render() {
      return html`<strong>Light DOM Content</strong>`;
    }
  }
  customElements.define('light-el', LightEl);

  const el = document.createElement('light-el');
  document.body.appendChild(el);

  assert.equal(el.shadowRoot, null);
  assert.ok(el.innerHTML.includes('Light DOM Content'));

  document.body.removeChild(el);
});

test('Elementum syncs observed attributes into signals and handles attribute changes', () => {
  class AttrEl extends Elementum {
    static observedAttributes = ['title', 'count'];
    title = signal('');
    count = signal(0);

    render() {
      return html`<p>${this.title}: ${this.count}</p>`;
    }
  }
  customElements.define('attr-el', AttrEl);

  const el = document.createElement('attr-el');
  el.setAttribute('title', 'Initial Title');
  el.setAttribute('count', '42');
  document.body.appendChild(el);

  assert.equal(el.title.value, 'Initial Title');
  assert.equal(el.count.value, '42');

  el.setAttribute('title', 'Updated Title');
  assert.equal(el.title.value, 'Updated Title');

  document.body.removeChild(el);
});

test('Elementum emit helper dispatches bubbling composed custom events', () => {
  class EventEl extends Elementum {
    trigger() {
      return this.emit('custom-action', { message: 'hello' });
    }
  }
  customElements.define('event-el', EventEl);

  const el = document.createElement('event-el');
  document.body.appendChild(el);

  let captured = null;
  el.addEventListener('custom-action', (e) => {
    captured = e.detail;
  });

  el.trigger();
  assert.deepEqual(captured, { message: 'hello' });

  document.body.removeChild(el);
});

test('Elementum formAssociated callbacks and setFormValue', () => {
  class FormEl extends Elementum {
    static formAssociated = true;
    resetCalled = false;
    disabledCalled = false;

    formReset() {
      this.resetCalled = true;
    }

    formDisabled(d) {
      this.disabledCalled = d;
    }
  }
  customElements.define('form-el', FormEl);

  const el = document.createElement('form-el');
  document.body.appendChild(el);

  el.setFormValue('some-value');
  el.formResetCallback();
  assert.equal(el.resetCalled, true);

  el.formDisabledCallback(true);
  assert.equal(el.disabledCalled, true);

  document.body.removeChild(el);
});
