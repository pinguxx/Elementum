import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';

import {
  ElRouter,
  ElRoute,
  ElRouteLink,
  currentRoute,
  navigate,
  ElCallout,
  ElDataList,
  ElDataListItem,
  ElRadioCard,
  ElRadioCardGroup,
  ElCheckboxCard,
  ElNavigationMenu,
  ElNavigationMenuItem,
  ElNavigationMenuTrigger,
  ElNavigationMenuContent,
  ElInset,
  ElVisuallyHidden,
} from '../src/index.js';

test('<el-router>, <el-route>, and <el-route-link> SPA navigation', () => {
  const router = document.createElement('el-router');
  router.setAttribute('default', '/home');
  router.innerHTML = `
    <el-route path="/home" exact><div id="home-view">Home</div></el-route>
    <el-route path="/dashboard"><div id="dashboard-view">Dashboard</div></el-route>
    <el-route path="/*"><div id="not-found">404</div></el-route>
  `;

  const linkHome = document.createElement('el-route-link');
  linkHome.setAttribute('to', '/home');
  linkHome.setAttribute('exact', '');

  const linkDash = document.createElement('el-route-link');
  linkDash.setAttribute('to', '/dashboard');

  document.body.appendChild(router);
  document.body.appendChild(linkHome);
  document.body.appendChild(linkDash);

  assert.equal(currentRoute.value, '/home');

  const routeHome = router.querySelector('el-route[path="/home"]');
  const routeDash = router.querySelector('el-route[path="/dashboard"]');

  assert.ok(routeHome.hasAttribute('active'));
  assert.ok(routeDash.hasAttribute('hidden'));
  assert.ok(linkHome.hasAttribute('active'));
  assert.ok(!linkDash.hasAttribute('active'));

  // Navigate to dashboard
  navigate('/dashboard');

  assert.equal(currentRoute.value, '/dashboard');
  assert.ok(!routeHome.hasAttribute('active'));
  assert.ok(routeHome.hasAttribute('hidden'));
  assert.ok(routeDash.hasAttribute('active'));
  assert.ok(!routeDash.hasAttribute('hidden'));
  assert.ok(!linkHome.hasAttribute('active'));
  assert.ok(linkDash.hasAttribute('active'));

  // Verify rendered anchor href
  const aHome = linkHome.shadowRoot.querySelector('a');
  assert.equal(aHome.getAttribute('href'), '#/home');

  // Host click triggers navigation
  linkHome.click();
  assert.equal(currentRoute.value, '/home');
  assert.ok(linkHome.hasAttribute('active'));
  assert.ok(!linkDash.hasAttribute('active'));

  document.body.removeChild(router);
  document.body.removeChild(linkHome);
  document.body.removeChild(linkDash);
});

test('<el-callout> renders variants and size', () => {
  const callout = document.createElement('el-callout');
  callout.setAttribute('variant', 'warning');
  callout.setAttribute('size', 'lg');
  callout.innerHTML = `
    <span slot="title">Warning Notice</span>
    Please review your settings before proceeding.
  `;
  document.body.appendChild(callout);

  assert.equal(callout.variant.value, 'warning');
  assert.equal(callout.size.value, 'lg');

  const titleSlot = callout.querySelector('[slot="title"]');
  assert.equal(titleSlot.textContent.trim(), 'Warning Notice');

  document.body.removeChild(callout);
});

test('<el-data-list> & <el-data-list-item> render key-values and copyable action', async () => {
  const dl = document.createElement('el-data-list');
  dl.setAttribute('orientation', 'horizontal');
  dl.innerHTML = `
    <el-data-list-item id="item1" label="API Key" value="sec_12345" copyable></el-data-list-item>
    <el-data-list-item id="item2" label="Environment" value="Production"></el-data-list-item>
  `;
  document.body.appendChild(dl);

  assert.equal(dl.orientation.value, 'horizontal');
  const item1 = dl.querySelector('#item1');
  const item2 = dl.querySelector('#item2');

  assert.equal(item1.label.value, 'API Key');
  assert.equal(item1.value.value, 'sec_12345');
  assert.equal(item1.copyable.value, true);

  assert.equal(item2.label.value, 'Environment');
  assert.equal(item2.copyable.value, false);

  // Trigger copy
  await item1.copyValue();
  assert.equal(item1.copied.value, true);

  document.body.removeChild(dl);
});

test('<el-radio-card> & <el-radio-card-group> handle selection and keyboard arrows', () => {
  const group = document.createElement('el-radio-card-group');
  group.setAttribute('name', 'plan');
  group.setAttribute('value', 'pro');
  group.setAttribute('columns', '2');
  group.innerHTML = `
    <el-radio-card value="starter">
      <span slot="title">Starter</span>
      <span slot="description">For individuals</span>
    </el-radio-card>
    <el-radio-card value="pro">
      <span slot="title">Pro</span>
      <span slot="description">For growing teams</span>
    </el-radio-card>
  `;
  document.body.appendChild(group);

  const starter = group.querySelector('el-radio-card[value="starter"]');
  const pro = group.querySelector('el-radio-card[value="pro"]');

  assert.equal(group.value.value, 'pro');
  assert.equal(pro.checked.value, true);
  assert.equal(starter.checked.value, false);

  // Select starter
  starter.select();
  assert.equal(group.value.value, 'starter');
  assert.equal(starter.checked.value, true);
  assert.equal(pro.checked.value, false);

  // Keyboard navigation
  group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(group.value.value, 'pro');

  document.body.removeChild(group);
});

test('<el-checkbox-card> toggles state and space key', () => {
  const card = document.createElement('el-checkbox-card');
  card.setAttribute('value', 'analytics');
  card.innerHTML = `
    <span slot="title">Advanced Analytics</span>
    <span slot="description">Real-time metrics export</span>
  `;
  document.body.appendChild(card);

  assert.equal(card.checked.value, false);

  card.toggle();
  assert.equal(card.checked.value, true);
  assert.ok(card.hasAttribute('checked'));

  // Keyboard Space
  card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(card.checked.value, false);
  assert.ok(!card.hasAttribute('checked'));

  document.body.removeChild(card);
});

test('<el-navigation-menu> opens, closes, and toggles items', () => {
  const nav = document.createElement('el-navigation-menu');
  nav.innerHTML = `
    <el-navigation-menu-item id="item1">
      <el-navigation-menu-trigger>Products</el-navigation-menu-trigger>
      <el-navigation-menu-content>
        <div>Product list</div>
      </el-navigation-menu-content>
    </el-navigation-menu-item>
  `;
  document.body.appendChild(nav);

  const item = nav.querySelector('#item1');
  const btn = nav.querySelector('el-navigation-menu-trigger')?.shadowRoot?.querySelector('button');
  assert.ok(btn);
  assert.equal(item.open.value, false);
  assert.equal(btn.getAttribute('aria-expanded'), 'false');

  btn.click();
  assert.equal(item.open.value, true);
  assert.ok(item.hasAttribute('open'));
  assert.equal(btn.getAttribute('aria-expanded'), 'true');

  btn.click();
  assert.equal(item.open.value, false);
  assert.ok(!item.hasAttribute('open'));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');

  item.openMenu();
  assert.equal(item.open.value, true);
  assert.ok(item.hasAttribute('open'));
  assert.equal(btn.getAttribute('aria-expanded'), 'true');

  item.closeMenu();
  assert.equal(item.open.value, false);
  assert.ok(!item.hasAttribute('open'));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');

  document.body.removeChild(nav);
});

test('<el-inset> & <el-visually-hidden> layout primitives', () => {
  const inset = document.createElement('el-inset');
  inset.setAttribute('side', 'top');
  inset.innerHTML = `<img src="hero.jpg" alt="Hero" />`;
  document.body.appendChild(inset);

  assert.equal(inset.side.value, 'top');

  const vh = document.createElement('el-visually-hidden');
  vh.textContent = 'Screen reader announcement';
  document.body.appendChild(vh);

  assert.equal(vh.textContent, 'Screen reader announcement');

  document.body.removeChild(inset);
  document.body.removeChild(vh);
});
