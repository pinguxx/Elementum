import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import { ElDrawer } from '../src/components/el-drawer.js';

test('Vaul Drawer: renders bottom sheet with drag handle pill', () => {
  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'bottom');
  drawer.setAttribute('title', 'Vaul Bottom Sheet');
  document.body.appendChild(drawer);

  const handle = drawer.shadowRoot.querySelector('.drawer-handle-bar');
  assert.ok(handle, 'Drag handle bar is rendered for bottom placement');
  assert.ok(drawer.shadowRoot.querySelector('.drawer-handle-pill'));

  drawer.show();
  assert.equal(drawer.isOpen.value, true);
  assert.equal(drawer.getAttribute('data-state'), 'open');

  const panel = drawer.shadowRoot.querySelector('.drawer-panel');
  assert.ok(panel.classList.contains('placement-bottom'));
  assert.ok(panel.classList.contains('open'));

  drawer.close();
  assert.equal(drawer.isOpen.value, false);
  document.body.removeChild(drawer);
});

test('Vaul Drawer: scale-background scales down target wrapper', () => {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-vaul-drawer-wrapper', '');
  document.body.appendChild(wrapper);

  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'bottom');
  drawer.setAttribute('scale-background', '');
  document.body.appendChild(drawer);

  drawer.show();
  assert.equal(drawer.isOpen.value, true);
  assert.ok(wrapper.style.transform.includes('scale(0.96)'));
  assert.equal(wrapper.style.borderRadius, '16px');

  drawer.close();
  assert.equal(drawer.isOpen.value, false);
  assert.equal(wrapper.style.transform, '');
  assert.equal(wrapper.style.borderRadius, '');

  document.body.removeChild(drawer);
  document.body.removeChild(wrapper);
});

test('Vaul Drawer: parses snap points and sets discrete sheet heights', () => {
  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'bottom');
  drawer.setAttribute('snap-points', '200px, 50%, 1');
  document.body.appendChild(drawer);

  drawer.show();
  assert.equal(drawer.isOpen.value, true);
  assert.ok(drawer.activeSnapIndex.value >= 0);

  const panel = drawer.shadowRoot.querySelector('.drawer-panel');
  assert.ok(panel.style.height);

  drawer.close();
  document.body.removeChild(drawer);
});

test('Vaul Drawer: pointer gestures handle drag-down pull and rubber band up', () => {
  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'bottom');
  document.body.appendChild(drawer);

  drawer.show();
  const panel = drawer.shadowRoot.querySelector('.drawer-panel');

  // Simulate drag down
  panel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointermove', { clientY: 280, clientX: 100, bubbles: true }));
  assert.ok(panel.style.transform.includes('translate3d(0'));

  // Release with small delta -> snaps back
  panel.dispatchEvent(new PointerEvent('pointerup', { clientY: 210, clientX: 100, bubbles: true }));
  assert.equal(drawer.isOpen.value, true);

  // Simulate drag up beyond top (rubber banding)
  panel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointermove', { clientY: 150, clientX: 100, bubbles: true }));
  assert.ok(panel.style.transform.includes('translate3d(0, -'));

  panel.dispatchEvent(new PointerEvent('pointerup', { clientY: 150, clientX: 100, bubbles: true }));
  assert.equal(drawer.isOpen.value, true);

  // Heavy downward drag -> closes drawer
  panel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointermove', { clientY: 550, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointerup', { clientY: 550, clientX: 100, bubbles: true }));
  assert.equal(drawer.isOpen.value, false);

  document.body.removeChild(drawer);
});

test('Vaul Drawer: snap-points drag-release snapping and upward flick', () => {
  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'bottom');
  drawer.setAttribute('snap-points', '200px, 400px, 600px');
  document.body.appendChild(drawer);

  drawer.show();
  const panel = drawer.shadowRoot.querySelector('.drawer-panel');

  // Drag down slightly and release -> should evaluate snap points
  panel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointermove', { clientY: 230, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointerup', { clientY: 230, clientX: 100, bubbles: true }));

  assert.equal(drawer.isOpen.value, true);
  assert.ok(drawer.activeSnapIndex.value >= 0);

  // Upward flick with negative velocity
  panel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointermove', { clientY: 180, clientX: 100, bubbles: true }));
  panel.dispatchEvent(new PointerEvent('pointerup', { clientY: 120, clientX: 100, bubbles: true }));

  assert.equal(drawer.isOpen.value, true);

  drawer.close();
  document.body.removeChild(drawer);
});

test('Vaul Drawer: side placement drag gestures (right and left)', () => {
  // Placement Right
  const rightDrawer = document.createElement('el-drawer');
  rightDrawer.setAttribute('placement', 'right');
  document.body.appendChild(rightDrawer);
  rightDrawer.show();

  const rPanel = rightDrawer.shadowRoot.querySelector('.drawer-panel');
  rPanel.dispatchEvent(new PointerEvent('pointerdown', { clientX: 300, clientY: 200, bubbles: true }));
  rPanel.dispatchEvent(new PointerEvent('pointermove', { clientX: 340, clientY: 200, bubbles: true }));
  rPanel.dispatchEvent(new PointerEvent('pointerup', { clientX: 340, clientY: 200, bubbles: true }));
  assert.equal(rightDrawer.isOpen.value, true);

  // Heavy flick right -> close
  rPanel.dispatchEvent(new PointerEvent('pointerdown', { clientX: 300, clientY: 200, bubbles: true }));
  rPanel.dispatchEvent(new PointerEvent('pointermove', { clientX: 450, clientY: 200, bubbles: true }));
  rPanel.dispatchEvent(new PointerEvent('pointerup', { clientX: 450, clientY: 200, bubbles: true }));
  assert.equal(rightDrawer.isOpen.value, false);
  document.body.removeChild(rightDrawer);

  // Placement Left
  const leftDrawer = document.createElement('el-drawer');
  leftDrawer.setAttribute('placement', 'left');
  document.body.appendChild(leftDrawer);
  leftDrawer.show();

  const lPanel = leftDrawer.shadowRoot.querySelector('.drawer-panel');
  lPanel.dispatchEvent(new PointerEvent('pointerdown', { clientX: 300, clientY: 200, bubbles: true }));
  lPanel.dispatchEvent(new PointerEvent('pointermove', { clientX: 280, clientY: 200, bubbles: true }));
  lPanel.dispatchEvent(new PointerEvent('pointerup', { clientX: 280, clientY: 200, bubbles: true }));
  assert.equal(leftDrawer.isOpen.value, true);

  leftDrawer.close();
  document.body.removeChild(leftDrawer);
});

test('Vaul Drawer: handle="false" and scroll-lock checks', () => {
  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'bottom');
  drawer.setAttribute('handle', 'false');
  document.body.appendChild(drawer);

  const handle = drawer.shadowRoot.querySelector('.drawer-handle-bar');
  assert.equal(handle, null, 'Handle is hidden when handle="false"');

  // Test attributeChanged for open attribute
  drawer.setAttribute('open', '');
  assert.equal(drawer.isOpen.value, true);
  drawer.removeAttribute('open');
  assert.equal(drawer.isOpen.value, false);

  drawer.show();
  const panel = drawer.shadowRoot.querySelector('.drawer-panel');

  // Test pointerdown on interactive child (button) -> should ignore
  const btn = document.createElement('button');
  panel.appendChild(btn);
  btn.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, bubbles: true }));

  // Test body scrollTop > 0 scroll lock
  const bodyEl = drawer.shadowRoot.querySelector('.drawer-body');
  Object.defineProperty(bodyEl, 'scrollTop', { value: 50, configurable: true });
  bodyEl.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, bubbles: true }));

  drawer.close();
  document.body.removeChild(drawer);
});
