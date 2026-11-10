import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, css, render, CSSResult } from '../src/template.js';
import { signal } from '../src/signal.js';

test('css tagged template returns CSSResult and caches stylesheet', () => {
  const result = css`button { color: red; }`;
  assert.ok(result instanceof CSSResult);
  assert.ok(result.cssText.includes('color: red'));
  assert.equal(result.toString(), result.cssText);
});

test('render mounts static template and text node', () => {
  const container = document.createElement('div');
  const tpl = html`<p>Hello World</p>`;
  render(tpl, container);
  assert.equal(container.innerHTML, '<p>Hello World</p>');
});

test('render dynamic signal updates text node reactively', () => {
  const container = document.createElement('div');
  const name = signal('Alice');
  render(html`<span>Hello ${name}!</span>`, container);

  assert.ok(container.innerHTML.includes('Alice'));
  name.value = 'Bob';
  assert.ok(container.innerHTML.includes('Bob'));
});

test('render dynamic attributes, boolean attributes, properties, and events', () => {
  const container = document.createElement('div');
  const cls = signal('active');
  const isDisabled = signal(false);
  const myProp = signal('custom-data');
  let clicked = false;

  const tpl = html`
    <button
      class=${cls}
      ?disabled=${isDisabled}
      .customData=${myProp}
      @click=${() => { clicked = true; }}
    >
      Click
    </button>
  `;

  render(tpl, container);
  const btn = container.querySelector('button');
  assert.ok(btn);
  assert.equal(btn.getAttribute('class'), 'active');
  assert.equal(btn.hasAttribute('disabled'), false);
  assert.equal(btn.customData, 'custom-data');

  // Trigger event
  btn.click();
  assert.equal(clicked, true);

  // Update signals
  cls.value = 'inactive';
  isDisabled.value = true;
  myProp.value = 'updated-data';

  assert.equal(btn.getAttribute('class'), 'inactive');
  assert.equal(btn.hasAttribute('disabled'), true);
  assert.equal(btn.customData, 'updated-data');
});

test('render array of items and sub-templates', () => {
  const container = document.createElement('div');
  const items = signal(['Item 1', 'Item 2']);

  render(html`
    <ul>
      ${() => items.value.map(it => html`<li>${it}</li>`)}
    </ul>
  `, container);

  const lis = container.querySelectorAll('li');
  assert.equal(lis.length, 2);
  assert.equal(lis[0].textContent.trim(), 'Item 1');
  assert.equal(lis[1].textContent.trim(), 'Item 2');

  items.value = ['Item 1', 'Item 2', 'Item 3'];
  const updatedLis = container.querySelectorAll('li');
  assert.equal(updatedLis.length, 3);
  assert.equal(updatedLis[2].textContent.trim(), 'Item 3');
});

test('render cleanup on abort signal stops reactivity', () => {
  const container = document.createElement('div');
  const controller = new AbortController();
  const text = signal('Initial');

  render(html`<div>${text}</div>`, container, controller.signal);
  assert.ok(container.innerHTML.includes('Initial'));

  controller.abort();
  text.value = 'Changed';
  // Should remain Initial because effect was aborted
  assert.ok(container.innerHTML.includes('Initial'));
});

test('render handles null or invalid template input gracefully', () => {
  const container = document.createElement('div');
  container.innerHTML = '<p>Old</p>';
  render(null, container);
  assert.equal(container.innerHTML, '');
});
