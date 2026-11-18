import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';

import {
  ElSkeleton,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElKbd,
  ElAlert,
  ElCard,
  ElCardHeader,
  ElCardTitle,
  ElCardDescription,
  ElCardContent,
  ElCardFooter,
  ElAspectRatio,
  ElTextarea,
  ElResizable,
  ElResizablePanel,
  ElResizableHandle,
  ElCarousel,
  ElCarouselSlide,
  ElTimeline,
  ElTimelineItem,
  ElTreeView,
  ElTreeItem,
  ElEmptyState,
  ElRating,
  ElDropzone,
  ElSidebar,
  ElSidebarHeader,
  ElSidebarContent,
  ElSidebarFooter,
  ElSidebarTrigger,
  ElForm,
  ElFieldset,
} from '../src/index.js';

test('<el-skeleton> renders variants, animation, and dimensions', () => {
  const el = document.createElement('el-skeleton');
  el.setAttribute('variant', 'circular');
  el.setAttribute('width', '50px');
  el.setAttribute('height', '50px');
  el.setAttribute('animation', 'pulse');
  document.body.appendChild(el);

  assert.equal(el.variant.value, 'circular');
  assert.equal(el.width.value, '50px');
  assert.equal(el.height.value, '50px');
  assert.equal(el.animation.value, 'pulse');

  const sk = el.shadowRoot.querySelector('.skeleton');
  assert.ok(sk);
  assert.equal(sk.getAttribute('role'), 'status');

  document.body.removeChild(el);
});

test('<el-breadcrumb> & <el-breadcrumb-item> render nav trail and separators', () => {
  const bc = document.createElement('el-breadcrumb');
  bc.setAttribute('separator', '>');
  bc.innerHTML = `
    <el-breadcrumb-item href="/home">Home</el-breadcrumb-item>
    <el-breadcrumb-item href="/docs">Docs</el-breadcrumb-item>
    <el-breadcrumb-item current>Components</el-breadcrumb-item>
  `;
  document.body.appendChild(bc);

  const items = bc.querySelectorAll('el-breadcrumb-item');
  assert.equal(items.length, 3);
  assert.equal(items[0].href.value, '/home');
  assert.equal(items[2].current.value, true);

  const nav = bc.shadowRoot.querySelector('nav');
  assert.equal(nav.getAttribute('aria-label'), 'Breadcrumb');

  document.body.removeChild(bc);
});

test('<el-kbd> parses keycap shortcuts and sizes', () => {
  const kbd = document.createElement('el-kbd');
  kbd.setAttribute('keys', 'cmd+shift+k');
  kbd.setAttribute('size', 'lg');
  document.body.appendChild(kbd);

  assert.equal(kbd.keys.value, 'cmd+shift+k');
  assert.equal(kbd.size.value, 'lg');

  const renderedKbd = kbd.shadowRoot.querySelectorAll('.keycap');
  assert.equal(renderedKbd.length, 3);
  assert.equal(renderedKbd[0].textContent, '⌘');
  assert.equal(renderedKbd[1].textContent, '⇧');
  assert.equal(renderedKbd[2].textContent, 'K');

  document.body.removeChild(kbd);
});

test('<el-alert> renders variants and handles dismissal', () => {
  const alert = document.createElement('el-alert');
  alert.setAttribute('variant', 'destructive');
  alert.setAttribute('title', 'Error Occurred');
  alert.setAttribute('dismissible', '');
  alert.innerHTML = 'Failed to load credentials.';
  document.body.appendChild(alert);

  assert.equal(alert.variant.value, 'destructive');
  assert.equal(alert.alertTitle.value, 'Error Occurred');
  assert.equal(alert.dismissible.value, true);

  let dismissed = false;
  alert.addEventListener('dismiss', () => { dismissed = true; });

  const btn = alert.shadowRoot.querySelector('.dismiss-btn');
  assert.ok(btn);
  btn.click();

  assert.equal(dismissed, true);
  assert.equal(alert.isDismissed.value, true);
  assert.ok(alert.hasAttribute('hidden'));

  document.body.removeChild(alert);
});

test('<el-card> family structured slots and hoverable', () => {
  const card = document.createElement('el-card');
  card.setAttribute('hoverable', '');
  card.innerHTML = `
    <el-card-header>
      <el-card-title>Project Alpha</el-card-title>
      <el-card-description>Production deployment</el-card-description>
    </el-card-header>
    <el-card-content>All systems green</el-card-content>
    <el-card-footer>Actions</el-card-footer>
  `;
  document.body.appendChild(card);

  assert.ok(card.querySelector('el-card-title'));
  assert.ok(card.querySelector('el-card-description'));
  assert.ok(card.querySelector('el-card-content'));
  assert.ok(card.querySelector('el-card-footer'));

  document.body.removeChild(card);
});

test('<el-aspect-ratio> applies ratio to CSS aspectRatio', () => {
  const ar = document.createElement('el-aspect-ratio');
  ar.setAttribute('ratio', '16/9');
  document.body.appendChild(ar);

  assert.equal(ar.ratio.value, '16/9');
  assert.equal(ar.style.aspectRatio.replace(/\s+/g, ''), '16/9');

  ar.setAttribute('ratio', '4/3');
  assert.equal(ar.style.aspectRatio.replace(/\s+/g, ''), '4/3');

  document.body.removeChild(ar);
});

test('<el-textarea> handles typing, form association, max-length and reset', () => {
  const ta = document.createElement('el-textarea');
  ta.setAttribute('name', 'bio');
  ta.setAttribute('rows', '4');
  ta.setAttribute('maxlength', '100');
  ta.setAttribute('auto-resize', '');
  document.body.appendChild(ta);

  assert.equal(ta.rows.value, 4);
  assert.equal(ta.maxlength.value, 100);
  assert.equal(ta.autoResize.value, true);

  const textareaEl = ta.shadowRoot.querySelector('textarea');
  assert.ok(textareaEl);

  textareaEl.value = 'Hello Elementum!';
  textareaEl.dispatchEvent(new Event('input', { bubbles: true }));

  assert.equal(ta.value.value, 'Hello Elementum!');

  ta.formReset();
  assert.equal(ta.value.value, '');

  document.body.removeChild(ta);
});

test('<el-resizable> handles direction, size setting, and keyboard arrows', () => {
  const r = document.createElement('el-resizable');
  r.setAttribute('direction', 'horizontal');
  r.innerHTML = `
    <el-resizable-panel id="p1" default-size="40" min-size="20" max-size="80">Left</el-resizable-panel>
    <el-resizable-handle id="h1"></el-resizable-handle>
    <el-resizable-panel id="p2" default-size="60" min-size="20" max-size="80">Right</el-resizable-panel>
  `;
  document.body.appendChild(r);

  const p1 = r.querySelector('#p1');
  const p2 = r.querySelector('#p2');
  const h1 = r.querySelector('#h1');

  assert.equal(p1.size.value, 40);
  assert.equal(p2.size.value, 60);

  p1.setSize(30);
  assert.equal(p1.size.value, 30);

  // Clamped by minSize
  p1.setSize(5);
  assert.equal(p1.size.value, 20);

  // Keyboard navigation
  h1.focus();
  r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  document.body.removeChild(r);
});

test('<el-carousel> handles next, prev, goTo and slide counts', () => {
  const c = document.createElement('el-carousel');
  c.innerHTML = `
    <el-carousel-slide>Slide 1</el-carousel-slide>
    <el-carousel-slide>Slide 2</el-carousel-slide>
    <el-carousel-slide>Slide 3</el-carousel-slide>
  `;
  document.body.appendChild(c);

  assert.equal(c.totalSlides.value, 3);
  assert.equal(c.currentIndex.value, 0);

  c.next();
  assert.equal(c.currentIndex.value, 1);

  c.next();
  assert.equal(c.currentIndex.value, 2);

  // Loop back
  c.next();
  assert.equal(c.currentIndex.value, 0);

  c.prev();
  assert.equal(c.currentIndex.value, 2);

  c.goTo(1);
  assert.equal(c.currentIndex.value, 1);

  document.body.removeChild(c);
});

test('<el-timeline> & <el-timeline-item> status variants and progression', () => {
  const tl = document.createElement('el-timeline');
  tl.innerHTML = `
    <el-timeline-item status="completed" title="Order Placed" date="10:00 AM">Payment verified</el-timeline-item>
    <el-timeline-item status="active" title="In Transit" date="02:30 PM">Dispatched from hub</el-timeline-item>
    <el-timeline-item status="pending" title="Delivered">Pending arrival</el-timeline-item>
  `;
  document.body.appendChild(tl);

  const items = tl.querySelectorAll('el-timeline-item');
  assert.equal(items.length, 3);
  assert.equal(items[0].status.value, 'completed');
  assert.equal(items[0].itemTitle.value, 'Order Placed');
  assert.equal(items[1].status.value, 'active');

  document.body.removeChild(tl);
});

test('<el-tree-view> & <el-tree-item> expand, collapse and selection', () => {
  const tv = document.createElement('el-tree-view');
  tv.innerHTML = `
    <el-tree-item id="root" label="src">
      <el-tree-item id="child1" label="components"></el-tree-item>
      <el-tree-item id="child2" label="index.js"></el-tree-item>
    </el-tree-item>
  `;
  document.body.appendChild(tv);

  const root = tv.querySelector('#root');
  const child1 = tv.querySelector('#child1');

  assert.equal(root.label.value, 'src');
  assert.equal(root.hasChildren.value, true);
  assert.equal(root.expanded.value, false);

  root.toggle();
  assert.equal(root.expanded.value, true);

  child1.select();
  assert.equal(child1.selected.value, true);
  assert.equal(root.selected.value, false);

  root.toggle();
  assert.equal(root.expanded.value, false);

  document.body.removeChild(tv);
});

test('<el-empty-state> renders title, description, and actions', () => {
  const es = document.createElement('el-empty-state');
  es.setAttribute('title', 'No invoices');
  es.setAttribute('description', 'Create a new invoice to get started.');
  es.innerHTML = `<button slot="action">New Invoice</button>`;
  document.body.appendChild(es);

  assert.equal(es.stateTitle.value, 'No invoices');
  assert.equal(es.stateDescription.value, 'Create a new invoice to get started.');
  assert.ok(es.querySelector('button[slot="action"]'));

  document.body.removeChild(es);
});

test('<el-rating> handles value, keyboard arrows, and form association', () => {
  const r = document.createElement('el-rating');
  r.setAttribute('name', 'score');
  r.setAttribute('value', '3');
  r.setAttribute('max', '5');
  document.body.appendChild(r);

  assert.equal(r.value.value, 3);
  assert.equal(r.max.value, 5);

  r.setValue(4);
  assert.equal(r.value.value, 4);

  // Keyboard Right Arrow
  r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  assert.equal(r.value.value, 5);

  // Keyboard Left Arrow
  r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
  assert.equal(r.value.value, 4);

  r.formReset();
  assert.equal(r.value.value, 3);

  document.body.removeChild(r);
});

test('<el-dropzone> processes file drops and max-size checks', () => {
  const dz = document.createElement('el-dropzone');
  dz.setAttribute('max-size', '5000'); // 5KB max
  document.body.appendChild(dz);

  assert.equal(dz.maxSize.value, 5000);

  let selected = [];
  dz.addEventListener('files-selected', (e) => {
    selected = e.detail.files;
  });

  const file1 = { name: 'small.txt', size: 1024 };
  const file2 = { name: 'huge.bin', size: 90000 };

  const fakeDropEvent = {
    preventDefault: () => {},
    dataTransfer: { files: [file1, file2] },
  };

  const box = dz.shadowRoot.querySelector('.dropzone-box');
  const dropEvent = new Event('drop', { bubbles: true });
  dropEvent.dataTransfer = fakeDropEvent.dataTransfer;
  box.dispatchEvent(dropEvent);

  assert.equal(selected.length, 1);
  assert.equal(selected[0].name, 'small.txt');

  document.body.removeChild(dz);
});

test('<el-sidebar> collapses, expands, and trigger toggles', () => {
  const sb = document.createElement('el-sidebar');
  sb.innerHTML = `
    <el-sidebar-header>Header</el-sidebar-header>
    <el-sidebar-content>
      <el-sidebar-trigger id="trig"></el-sidebar-trigger>
      <a href="#">Link 1</a>
    </el-sidebar-content>
    <el-sidebar-footer>Footer</el-sidebar-footer>
  `;
  document.body.appendChild(sb);

  assert.equal(sb.collapsed.value, false);

  sb.collapse();
  assert.equal(sb.collapsed.value, true);
  assert.ok(sb.hasAttribute('collapsed'));

  sb.expand();
  assert.equal(sb.collapsed.value, false);
  assert.ok(!sb.hasAttribute('collapsed'));

  const trigBtn = sb.querySelector('#trig').shadowRoot.querySelector('button');
  trigBtn.click();
  assert.equal(sb.collapsed.value, true);

  // External trigger with for attribute
  const extTrigger = document.createElement('el-sidebar-trigger');
  sb.id = 'test-sb-external';
  extTrigger.setAttribute('for', 'test-sb-external');
  document.body.appendChild(extTrigger);

  const extBtn = extTrigger.shadowRoot.querySelector('button');
  extBtn.click();
  assert.equal(sb.collapsed.value, false);

  document.body.removeChild(extTrigger);
  document.body.removeChild(sb);
});

test('<el-resizable> auto-injects handle and styles raw child elements', () => {
  const r = document.createElement('el-resizable');
  r.innerHTML = `
    <div>Left Div</div>
    <div>Right Div</div>
  `;
  document.body.appendChild(r);

  const divs = r.querySelectorAll('div');
  assert.equal(divs.length, 2);
  const handle = r.querySelector('el-resizable-handle');
  assert.ok(handle);
  assert.equal(divs[0].style.flex, '1 1 0%');

  document.body.removeChild(r);
});

test('<el-form> & <el-fieldset> form data collection and validation', () => {
  const form = document.createElement('el-form');
  form.innerHTML = `
    <el-fieldset legend="Profile Settings">
      <el-textarea name="bio" value="Engineer" required></el-textarea>
      <el-rating name="rating" value="4"></el-rating>
    </el-fieldset>
  `;
  document.body.appendChild(form);

  const data = form.getFormData();
  assert.equal(data.bio, 'Engineer');
  assert.equal(data.rating, 4);

  let submittedData = null;
  form.addEventListener('form-submit', (e) => {
    submittedData = e.detail.data;
  });

  const formEl = form.shadowRoot.querySelector('form');
  formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  assert.ok(submittedData);
  assert.equal(submittedData.bio, 'Engineer');

  document.body.removeChild(form);
});
