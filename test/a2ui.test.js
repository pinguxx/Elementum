import '../test-helpers/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/index.js';
import { createA2UiSurface, DEFAULT_A2UI_CATALOG } from '../src/a2ui.js';

test('A2UI Renderer: composes surface from A2UI JSON messages, binds signals two-way, and dispatches actions', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);

  const actions = [];
  const surface = createA2UiSurface({
    onAction: (ev) => actions.push(ev),
  });
  surface.mount(host);

  surface.processMessages([
    {
      dataModelUpdate: {
        path: '/',
        contents: [
          { key: 'flight', valueString: 'UA 418 · SFO -> JFK' },
          { key: 'seat', valueString: '14C' },
          { key: 'note', valueString: '' },
        ],
      },
    },
    {
      surfaceUpdate: {
        surfaceId: 'rebook',
        components: [
          { id: 'root', component: { Card: { title: { literalString: 'Rebook Delayed Flight' }, child: 'col' } } },
          { id: 'col', component: { Column: { children: ['flightText', 'chips', 'noteInput', 'confirmBtn'] } } },
          { id: 'flightText', component: { Text: { text: { path: '/flight' }, usageHint: 'body' } } },
          { id: 'chips', component: { Row: { children: ['seat14', 'seat9'] } } },
          { id: 'seat14', component: { ChoiceChip: { label: { literalString: '14C Main aisle' }, value: '14C', selected: { path: '/seat' } } } },
          { id: 'seat9', component: { ChoiceChip: { label: { literalString: '9F Exit aisle' }, value: '9F', selected: { path: '/seat' } } } },
          { id: 'noteInput', component: { TextField: { placeholder: 'Special request', value: { path: '/note' } } } },
          {
            id: 'confirmBtn',
            component: {
              Button: {
                variant: 'primary',
                label: { literalString: 'Confirm Rebooking' },
                action: {
                  name: 'confirm_rebooking',
                  context: [
                    { key: 'flight', value: { path: '/flight' } },
                    { key: 'seat', value: { path: '/seat' } },
                    { key: 'note', value: { path: '/note' } },
                  ],
                },
              },
            },
          },
        ],
      },
    },
    { beginRendering: { surfaceId: 'rebook', root: 'root' } },
  ]);

  assert.equal(surface.surfaceId.value, 'rebook');
  const card = host.querySelector('el-card');
  assert.ok(card, 'Card must render as <el-card>');
  assert.equal(host.querySelector('[data-a2ui-id="flightText"]').textContent, 'UA 418 · SFO -> JFK');

  // Fine-grained reactive update via dataModelUpdate
  surface.processMessage({
    dataModelUpdate: { path: '/flight', value: 'UA 902 · SFO -> JFK' },
  });
  assert.equal(host.querySelector('[data-a2ui-id="flightText"]').textContent, 'UA 902 · SFO -> JFK');

  // Two-way ChoiceChip binding updates dataModel
  const chip9 = host.querySelector('[data-a2ui-id="seat9"]');
  chip9.click();
  assert.equal(surface.dataModel.value.seat, '9F');

  // Two-way TextField binding updates dataModel
  const noteInput = host.querySelector('[data-a2ui-id="noteInput"]');
  noteInput.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value: 'Window if possible' } }));
  assert.equal(surface.dataModel.value.note, 'Window if possible');

  // Action button resolves live bound context
  const btn = host.querySelector('[data-a2ui-id="confirmBtn"]');
  btn.click();
  assert.equal(actions.length, 1);
  assert.deepEqual(actions[0], {
    surfaceId: 'rebook',
    actionName: 'confirm_rebooking',
    sourceComponentId: 'confirmBtn',
    context: {
      flight: 'UA 902 · SFO -> JFK',
      seat: '9F',
      note: 'Window if possible',
    },
  });

  // deleteSurface tears down cleanly
  surface.processMessage({ deleteSurface: { surfaceId: 'rebook' } });
  assert.equal(host.children.length, 0);
  surface.destroy();
  host.remove();
});

test('A2UI Renderer: enforces locked catalog allowlist, blocks unregistered/unsafe types & attributes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);

  assert.ok(DEFAULT_A2UI_CATALOG.Card.tag === 'el-card');

  const surface = createA2UiSurface({
    allowlist: ['Column', 'Text', 'Button'],
  });
  surface.mount(host);

  surface.processMessages([
    {
      updateComponents: {
        surfaceId: 'locked',
        components: [
          { id: 'root', type: 'Column', children: ['safeText', 'evilScript', 'blockedCard', 'safeBtn'] },
          { id: 'safeText', type: 'Text', props: { text: '<img src=x onerror=alert(1)>', onclick: 'alert(1)' } },
          { id: 'evilScript', type: 'RawScript', props: { text: 'alert(1)' } },
          { id: 'blockedCard', type: 'Card', props: { title: 'Not in allowlist' } },
          { id: 'safeBtn', type: 'Button', props: { label: 'OK', href: 'javascript:alert(1)' } },
        ],
      },
    },
    { createSurface: { surfaceId: 'locked', root: 'root' } },
  ]);

  // Text renders inertly via textContent (zero innerHTML / XSS)
  const safeText = host.querySelector('[data-a2ui-id="safeText"]');
  assert.equal(safeText.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(safeText.querySelector('img'), null);
  assert.equal(safeText.hasAttribute('onclick'), false);

  // Blocked & unknown types are never mounted and are recorded
  assert.equal(host.querySelector('[data-a2ui-id="evilScript"]'), null);
  assert.equal(host.querySelector('[data-a2ui-id="blockedCard"]'), null);
  assert.deepEqual(surface.blockedTypes.value, ['RawScript', 'Card']);

  // Unsafe javascript: href is stripped
  const safeBtn = host.querySelector('[data-a2ui-id="safeBtn"]');
  assert.equal(safeBtn.hasAttribute('href'), false);

  // Prototype pollution attempt in dataModelUpdate is ignored
  surface.processMessage({ dataModelUpdate: { path: '/__proto__/polluted', value: 'yes' } });
  assert.equal(({}).polluted, undefined);

  surface.destroy();
  host.remove();
});
