import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Elementum } from '../src/elementum.js';
import { html, css } from '../src/template.js';
import { signal, isSignal } from '../src/signal.js';
import '../src/components/el-button.js';
import '../src/components/el-border-beam.js';
import '../src/components/el-tree-view.js';
import '../src/components/el-tabs.js';
import '../src/components/el-toggle.js';
import '../src/components/el-dropdown.js';

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

  // Verify setValidity safely handles null/undefined anchor without WebIDL TypeError
  assert.doesNotThrow(() => {
    el.setValidity({ valueMissing: true }, 'Value missing', null);
    el.setValidity({ valueMissing: true }, 'Value missing', undefined);
    el.setValidity({});
  });

  document.body.removeChild(el);
});

test('Elementum upgrades signal-backed properties for direct assignment and Shadow DOM reactivity', () => {
  const btn = document.createElement('el-button');
  document.body.appendChild(btn);

  btn.variant = 'danger';
  btn.size = 'lg';
  btn.disabled = true;
  btn.label = 'Delete';

  assert.equal(isSignal(btn.variant), true);
  assert.equal(btn.variant.value, 'danger');
  assert.equal(btn.getAttribute('variant'), 'danger');

  assert.equal(btn.size.value, 'lg');
  assert.equal(btn.getAttribute('size'), 'lg');

  assert.equal(btn.disabled.value, true);
  assert.equal(btn.hasAttribute('disabled'), true);

  assert.equal(btn.label.value, 'Delete');
  assert.equal(btn.getAttribute('label'), 'Delete');
  assert.ok(btn.shadowRoot.innerHTML.includes('Delete'));

  btn.disabled = false;
  assert.equal(btn.disabled.value, false);
  assert.equal(btn.hasAttribute('disabled'), false);

  document.body.removeChild(btn);
});

test('Elementum reflects signal .value mutations back to host HTML attributes', () => {
  const btn = document.createElement('el-button');
  document.body.appendChild(btn);

  btn.variant.value = 'secondary';
  assert.equal(btn.getAttribute('variant'), 'secondary');

  btn.disabled.value = true;
  assert.equal(btn.hasAttribute('disabled'), true);

  btn.disabled.value = false;
  assert.equal(btn.hasAttribute('disabled'), false);

  document.body.removeChild(btn);
});

test('Elementum maps camelCase JS properties to kebab-case HTML attributes', () => {
  const beam = document.createElement('el-border-beam');
  document.body.appendChild(beam);

  beam.colorFrom = '#123456';
  assert.equal(beam.colorFrom.value, '#123456');
  assert.equal(beam.getAttribute('color-from'), '#123456');

  beam.colorFrom.value = '#abcdef';
  assert.equal(beam.getAttribute('color-from'), '#abcdef');

  const tree = document.createElement('el-tree-view');
  document.body.appendChild(tree);

  tree.maxWidth = '240px';
  assert.equal(tree.maxWidth, '240px');
  assert.equal(tree.getAttribute('max-width'), '240px');
  assert.equal(tree.style.maxWidth, '240px');

  document.body.removeChild(beam);
  document.body.removeChild(tree);
});

test('Elementum supports non-signal observed attributes and method-attribute collisions', () => {
  const tabs = document.createElement('el-tabs');
  tabs.innerHTML = `
    <el-tab name="overview" label="Overview">Overview panel</el-tab>
    <el-tab name="metrics" label="Metrics">Metrics panel</el-tab>
  `;
  document.body.appendChild(tabs);

  tabs.value = 'metrics';
  assert.equal(tabs.getAttribute('value'), 'metrics');
  assert.equal(tabs.value, 'metrics');
  const metricsTab = tabs.querySelector('el-tab[name="metrics"]');
  assert.equal(metricsTab.hasAttribute('active'), true);

  const toggle = document.createElement('el-toggle');
  document.body.appendChild(toggle);

  toggle.pressed = true;
  assert.equal(toggle.hasAttribute('pressed'), true);
  assert.equal(toggle.pressed, true);
  assert.equal(toggle.isPressed.value, true);

  toggle.pressed = false;
  assert.equal(toggle.hasAttribute('pressed'), false);
  assert.equal(toggle.pressed, false);

  toggle.variant = 'outline';
  assert.equal(toggle.getAttribute('variant'), 'outline');
  assert.equal(toggle.variant.value, 'outline');

  const dropdown = document.createElement('el-dropdown');
  document.body.appendChild(dropdown);

  assert.equal(typeof dropdown.open, 'function');
  dropdown.open = true;
  assert.equal(dropdown.hasAttribute('open'), true);
  assert.equal(typeof dropdown.open, 'function');

  dropdown.open = false;
  assert.equal(dropdown.hasAttribute('open'), false);
  assert.equal(typeof dropdown.open, 'function');

  document.body.removeChild(tabs);
  document.body.removeChild(toggle);
  document.body.removeChild(dropdown);
});

test('Elementum handles synchronous pre-mount property assignment', () => {
  const b = document.createElement('el-button');
  b.variant = 'danger';
  b.disabled = true;
  document.body.appendChild(b);

  assert.equal(isSignal(b.variant), true);
  assert.equal(b.variant.value, 'danger');
  assert.equal(b.getAttribute('variant'), 'danger');
  assert.equal(isSignal(b.disabled), true);
  assert.equal(b.disabled.value, true);
  assert.equal(b.hasAttribute('disabled'), true);

  document.body.removeChild(b);
});

test('Elementum exposes runtime version on class, module exports, and globalThis.elementum', async () => {
  const fs = await import('node:fs');
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const { version, VERSION } = await import('../src/index.js');

  assert.equal(version, pkg.version);
  assert.equal(VERSION, pkg.version);
  assert.equal(Elementum.version, pkg.version);
  assert.equal(globalThis.elementum?.version, pkg.version);
  assert.equal(Object.isFrozen(globalThis.elementum), true);
});

test('Form controls reflect .checked, .value, and .disabled bidirectionally while preserving formReset() (#12)', async () => {
  await import('../src/components/el-switch.js');
  await import('../src/components/el-checkbox.js');
  await import('../src/components/el-segmented-control.js');
  await import('../src/components/el-select.js');
  await import('../src/components/el-input.js');

  const sw = document.createElement('el-switch');
  document.body.appendChild(sw);
  sw.checked = true;
  assert.equal(sw.hasAttribute('checked'), true);
  assert.equal(sw.getAttribute('aria-checked'), 'true');
  sw.formResetCallback();
  assert.equal(sw.checked.value, false);
  assert.equal(sw.hasAttribute('checked'), false);

  const seg = document.createElement('el-segmented-control');
  seg.setAttribute('options', '1,2,3');
  seg.setAttribute('value', '1');
  document.body.appendChild(seg);
  seg.value = '2';
  assert.equal(seg.getAttribute('value'), '2');
  seg.formResetCallback();
  assert.equal(seg.value.value, '1');

  const inp = document.createElement('el-input');
  inp.setAttribute('value', 'initial');
  document.body.appendChild(inp);
  inp.value = 'updated';
  assert.equal(inp.getAttribute('value'), 'updated');
  inp.disabled = true;
  assert.equal(inp.hasAttribute('disabled'), true);
  inp.formResetCallback();
  assert.equal(inp.value.value, 'initial');

  sw.remove();
  seg.remove();
  inp.remove();
});

test('bindAttr, bindClass, and bindText reactively sync DOM and clean up on dispose (#13)', async () => {
  const { bindAttr, bindClass, bindText } = await import('../src/index.js');
  const el = document.createElement('div');
  const active = signal(false);
  const label = signal('Ready');
  const count = signal(0);

  const stopAttr = bindAttr(el, 'data-active', active);
  const stopCls = bindClass(el, 'is-active', active);
  const stopText = bindText(el, () => `${label.value}: ${count.value}`);

  assert.equal(el.hasAttribute('data-active'), false);
  assert.equal(el.classList.contains('is-active'), false);
  assert.equal(el.textContent, 'Ready: 0');

  active.value = true;
  count.value = 3;
  assert.equal(el.hasAttribute('data-active'), true);
  assert.equal(el.classList.contains('is-active'), true);
  assert.equal(el.textContent, 'Ready: 3');

  stopAttr();
  stopCls();
  stopText();
  active.value = false;
  count.value = 9;
  assert.equal(el.hasAttribute('data-active'), true);
  assert.equal(el.textContent, 'Ready: 3');
});

test('triggerHaptic respects coarse pointer, reduced motion, and opt-in haptic attribute (#14)', async () => {
  const { triggerHaptic } = await import('../src/index.js');
  const origMatchMedia = window.matchMedia;
  const origVibrate = navigator.vibrate;
  let vibrated = 0;

  try {
    navigator.vibrate = (p) => { vibrated += Number(p); return true; };
    // Desktop fine pointer -> skipped
    window.matchMedia = (q) => ({ matches: false });
    assert.equal(triggerHaptic(10), false);
    assert.equal(vibrated, 0);

    // Coarse pointer, normal motion -> triggers
    window.matchMedia = (q) => ({ matches: q.includes('pointer: coarse') });
    assert.equal(triggerHaptic(10), true);
    assert.equal(vibrated, 10);

    // Reduced motion -> skipped even on coarse pointer
    window.matchMedia = () => ({ matches: true });
    assert.equal(triggerHaptic(10), false);
    assert.equal(vibrated, 10);

    // Opt-in haptic attribute on el-switch
    window.matchMedia = (q) => ({ matches: q.includes('pointer: coarse') });
    const sw = document.createElement('el-switch');
    sw.setAttribute('haptic', '');
    document.body.appendChild(sw);
    sw.toggle();
    assert.equal(vibrated, 20);
    sw.remove();
  } finally {
    window.matchMedia = origMatchMedia;
    navigator.vibrate = origVibrate;
  }
});
