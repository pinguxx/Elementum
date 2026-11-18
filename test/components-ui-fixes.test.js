import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ElTooltip } from '../src/components/el-tooltip.js';
import { ElCarousel, ElCarouselSlide } from '../src/components/el-carousel.js';
import { ElResizable, ElResizablePanel, ElResizableHandle } from '../src/components/el-resizable.js';
import { ElSidebar, ElSidebarHeader, ElSidebarContent, ElSidebarTrigger } from '../src/components/el-sidebar.js';
import { ElSkeleton } from '../src/components/el-skeleton.js';
import { ElTable } from '../src/components/el-table.js';
import { ElChip } from '../src/components/el-chip.js';
import { ElTimeline, ElTimelineItem } from '../src/components/el-timeline.js';
import { ElProgress } from '../src/components/el-progress.js';

test('<el-tooltip> has dark mode tokens and accessible high contrast bubble', () => {
  const tooltip = document.createElement('el-tooltip');
  tooltip.setAttribute('content', 'Auto-synced with Penpot tokens');
  tooltip.setAttribute('delay', '0');
  const btn = document.createElement('button');
  btn.textContent = 'Hover for tip';
  tooltip.appendChild(btn);
  document.body.appendChild(tooltip);

  tooltip.show();
  assert.equal(tooltip.getAttribute('data-state'), 'open');
  assert.equal(tooltip.visible.value, true);

  const bubble = tooltip.shadowRoot.querySelector('.tooltip-bubble');
  assert.ok(bubble, 'bubble exists in shadowRoot');
  assert.ok(bubble.classList.contains('visible'));
  assert.ok(ElTooltip.styles.cssText.includes('--el-tooltip-bg'));
  assert.ok(ElTooltip.styles.cssText.includes('--el-tooltip-text'));

  tooltip.hide();
  assert.equal(tooltip.getAttribute('data-state'), 'closed');
  assert.equal(tooltip.visible.value, false);
});

test('<el-carousel> maintains resolved flex viewport, slide count, and controls', () => {
  const carousel = document.createElement('el-carousel');
  carousel.setAttribute('loop', 'true');
  const s1 = document.createElement('el-carousel-slide');
  s1.textContent = 'Slide 1';
  const s2 = document.createElement('el-carousel-slide');
  s2.textContent = 'Slide 2';
  carousel.appendChild(s1);
  carousel.appendChild(s2);
  document.body.appendChild(carousel);

  assert.equal(carousel.totalSlides.value, 2);
  assert.equal(carousel.currentIndex.value, 0);

  carousel.next();
  assert.equal(carousel.currentIndex.value, 1);

  carousel.next(); // loops back
  assert.equal(carousel.currentIndex.value, 0);

  carousel.prev(); // loops to end
  assert.equal(carousel.currentIndex.value, 1);

  assert.ok(ElCarousel.styles.cssText.includes('display: flex'));
  assert.ok(ElCarousel.styles.cssText.includes('min-height: 160px'));
});

test('<el-resizable> sets 8px grab handle and resizes panels smoothly', () => {
  const resizable = document.createElement('el-resizable');
  resizable.setAttribute('direction', 'horizontal');

  const p1 = document.createElement('el-resizable-panel');
  p1.setAttribute('default-size', '50');
  p1.innerHTML = '<div>Pane A</div>';

  const handle = document.createElement('el-resizable-handle');

  const p2 = document.createElement('el-resizable-panel');
  p2.setAttribute('default-size', '50');
  p2.innerHTML = '<div>Pane B</div>';

  resizable.appendChild(p1);
  resizable.appendChild(handle);
  resizable.appendChild(p2);
  document.body.appendChild(resizable);

  assert.equal(p1.size.value, 50);
  assert.equal(p2.size.value, 50);
  assert.equal(handle.getAttribute('role'), 'separator');

  p1.setSize(65);
  p2.setSize(35);
  assert.equal(p1.size.value, 65);
  assert.equal(p2.size.value, 35);

  assert.ok(ElResizableHandle.styles.cssText.includes('width: 8px'));
  assert.ok(ElResizableHandle.styles.cssText.includes('cursor: col-resize'));
});

test('<el-sidebar> toggles collapse/expand smoothly and coordinates with trigger', () => {
  const wrap = document.createElement('div');
  const sidebar = document.createElement('el-sidebar');
  sidebar.id = 'test-sidebar';

  const header = document.createElement('el-sidebar-header');
  const title = document.createElement('span');
  title.className = 'collapsible-text';
  title.textContent = 'Test App';
  const trigger = document.createElement('el-sidebar-trigger');
  trigger.setAttribute('for', 'test-sidebar');
  header.appendChild(title);
  header.appendChild(trigger);

  const content = document.createElement('el-sidebar-content');
  content.innerHTML = '<div class="collapsible-text">Nav item</div>';

  sidebar.appendChild(header);
  sidebar.appendChild(content);
  wrap.appendChild(sidebar);
  document.body.appendChild(wrap);

  assert.equal(sidebar.collapsed.value, false);
  assert.equal(sidebar.hasAttribute('collapsed'), false);
  assert.equal(header.hasAttribute('collapsed'), false);

  sidebar.toggle();
  assert.equal(sidebar.collapsed.value, true);
  assert.equal(sidebar.hasAttribute('collapsed'), true);
  assert.equal(header.hasAttribute('collapsed'), true);
  assert.equal(content.hasAttribute('collapsed'), true);

  sidebar.toggle();
  assert.equal(sidebar.collapsed.value, false);
  assert.equal(sidebar.hasAttribute('collapsed'), false);
  assert.equal(header.hasAttribute('collapsed'), false);
  assert.equal(content.hasAttribute('collapsed'), false);
});

test('<el-skeleton> renders circular and rectangular variants with shimmer', () => {
  const skCircular = document.createElement('el-skeleton');
  skCircular.setAttribute('variant', 'circular');
  skCircular.setAttribute('width', '40px');
  skCircular.setAttribute('height', '40px');
  document.body.appendChild(skCircular);

  assert.equal(skCircular.variant.value, 'circular');
  assert.equal(skCircular.width.value, '40px');
  assert.equal(skCircular.height.value, '40px');

  const skWave = document.createElement('el-skeleton');
  skWave.setAttribute('variant', 'text');
  skWave.setAttribute('animation', 'wave');
  skWave.setAttribute('width', '80%');
  document.body.appendChild(skWave);

  assert.equal(skWave.variant.value, 'text');
  assert.equal(skWave.animation.value, 'wave');
  assert.ok(ElSkeleton.styles.cssText.includes('--el-skeleton-bg'));
});

test('<el-table> supports hover and striped attributes and reactive styling', () => {
  const table = document.createElement('el-table');
  table.setAttribute('hover', '');
  table.setAttribute('striped', '');
  table.setAttribute('data', JSON.stringify([
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' }
  ]));
  document.body.appendChild(table);

  assert.equal(table.hover.value, true);
  assert.equal(table.striped.value, true);
  assert.ok(ElTable.styles.cssText.includes(':host([striped]) tbody tr:nth-child(even) td'));
  assert.ok(ElTable.styles.cssText.includes(':host([hover]) tbody tr:hover td'));

  table.removeAttribute('hover');
  table.removeAttribute('striped');
  assert.equal(table.hover.value, false);
  assert.equal(table.striped.value, false);
});

test('<el-chip> supports selected, size, and self-removes on remove button click', () => {
  const chip = document.createElement('el-chip');
  chip.setAttribute('variant', 'primary');
  chip.setAttribute('size', 'lg');
  chip.setAttribute('selectable', '');
  chip.setAttribute('selected', '');
  chip.setAttribute('removable', '');
  chip.setAttribute('auto-remove', '');
  chip.textContent = 'Active Tag';
  document.body.appendChild(chip);

  assert.equal(chip.selected.value, true);
  assert.equal(chip.size.value, 'lg');
  assert.equal(chip.removable.value, true);
  assert.ok(ElChip.styles.cssText.includes('.size-lg'));
  assert.ok(ElChip.styles.cssText.includes(':host([selected]) .chip'));

  // Test remove click
  const removeBtn = chip.root.querySelector('.remove-btn');
  assert.ok(removeBtn, 'remove button exists');
  removeBtn.click();
  assert.equal(chip.isConnected, false, 'chip removed from DOM after dismiss click');
});

test('<el-timeline> supports orientation, reverse, and el-timeline-item updates', () => {
  const timeline = document.createElement('el-timeline');
  timeline.setAttribute('orientation', 'horizontal');
  timeline.setAttribute('reverse', '');

  const item1 = document.createElement('el-timeline-item');
  item1.setAttribute('status', 'active');
  item1.setAttribute('title', 'Deploy Step');
  item1.setAttribute('date', '11:00 AM');
  item1.setAttribute('label', 'Deploying to cluster');

  timeline.appendChild(item1);
  document.body.appendChild(timeline);

  assert.equal(timeline.orientation.value, 'horizontal');
  assert.equal(timeline.reverse.value, true);
  assert.equal(item1.status.value, 'active');
  assert.equal(item1.itemTitle.value, 'Deploy Step');
  assert.equal(item1.date.value, '11:00 AM');
  assert.equal(item1.label.value, 'Deploying to cluster');

  assert.ok(ElTimeline.styles.cssText.includes(':host([orientation="horizontal"])'));
  assert.ok(ElTimelineItem.styles.cssText.includes(':host([orientation="horizontal"])'));

  item1.setAttribute('status', 'error');
  assert.equal(item1.status.value, 'error');
});

test('<el-progress> supports striped attribute and renders animated pattern', () => {
  const prog = document.createElement('el-progress');
  prog.setAttribute('value', '50');
  prog.setAttribute('striped', '');
  document.body.appendChild(prog);

  assert.equal(prog.striped.value, true);
  assert.ok(ElProgress.styles.cssText.includes(':host([striped]) .bar'));
  assert.ok(ElProgress.styles.cssText.includes('linear-gradient'));
});

test('Overlays, Navigation, Card, Tabs, Breadcrumb, and Router comprehensive fixes', async () => {
  await import('../src/index.js');

  // 1. el-drawer: top placement, handle at bottom, drag gestures, and body scroll lock restoration
  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('placement', 'top');
  drawer.setAttribute('handle', '');
  drawer.setAttribute('heading', 'Top Sheet Drawer');
  document.body.appendChild(drawer);
  drawer.show();
  assert.equal(drawer.isOpen.value, true);
  assert.equal(drawer.titleText.value, 'Top Sheet Drawer');
  assert.ok(drawer.shadowRoot.querySelector('.drawer-handle-bar.handle-bottom'));
  const dPanel = drawer.shadowRoot.querySelector('.drawer-panel');
  dPanel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  dPanel.dispatchEvent(new PointerEvent('pointermove', { clientY: 250, clientX: 100, bubbles: true }));
  dPanel.dispatchEvent(new PointerEvent('pointerup', { clientY: 250, clientX: 100, bubbles: true }));
  assert.equal(drawer.isOpen.value, true);
  dPanel.dispatchEvent(new PointerEvent('pointerdown', { clientY: 200, clientX: 100, bubbles: true }));
  dPanel.dispatchEvent(new PointerEvent('pointermove', { clientY: 20, clientX: 100, bubbles: true }));
  dPanel.dispatchEvent(new PointerEvent('pointerup', { clientY: 20, clientX: 100, bubbles: true }));
  assert.equal(drawer.isOpen.value, false);
  assert.equal(document.body.style.overflow, '');
  document.body.removeChild(drawer);

  // 2. el-dialog: open attribute on mount and heading support
  const dlg = document.createElement('el-dialog');
  dlg.setAttribute('heading', 'Release Deployment');
  dlg.setAttribute('open', '');
  document.body.appendChild(dlg);
  assert.equal(dlg.isOpen.value, true);
  assert.equal(dlg.titleText.value, 'Release Deployment');
  dlg.close();
  assert.equal(dlg.isOpen.value, false);
  document.body.removeChild(dlg);

  // 3. el-dropdown: open attribute on mount does not clobber open() method
  const dd = document.createElement('el-dropdown');
  dd.setAttribute('open', '');
  document.body.appendChild(dd);
  assert.equal(typeof dd.open, 'function');
  assert.equal(dd.isOpen.value, true);
  dd.removeAttribute('open');
  assert.equal(dd.isOpen.value, false);
  document.body.removeChild(dd);

  // 4. el-popover: offset, arrow, and open attribute
  const pop = document.createElement('el-popover');
  pop.setAttribute('open', '');
  pop.setAttribute('offset', '16');
  pop.setAttribute('arrow', '');
  pop.setAttribute('placement', 'right');
  document.body.appendChild(pop);
  assert.equal(typeof pop.open, 'function');
  assert.equal(pop.isOpen.value, true);
  assert.equal(pop.offset.value, 16);
  assert.equal(pop.hasArrow.value, true);
  assert.equal(pop.style.getPropertyValue('--popover-offset'), '16px');
  pop.setAttribute('offset', '24');
  assert.equal(pop.style.getPropertyValue('--popover-offset'), '24px');
  document.body.removeChild(pop);

  // 5. el-preview-card: open attribute, delay, placement, and preview slot
  const pc = document.createElement('el-preview-card');
  pc.setAttribute('open', '');
  pc.setAttribute('delay', '250');
  pc.setAttribute('placement', 'left');
  pc.innerHTML = '<span slot="trigger">@user</span><div slot="preview">Bio</div>';
  document.body.appendChild(pc);
  assert.equal(typeof pc.open, 'function');
  assert.equal(pc.isOpen.value, true);
  assert.equal(pc.openDelay.value, 250);
  assert.equal(pc.placement.value, 'left');
  assert.ok(pc.shadowRoot.querySelector('slot[name="preview"]'));
  document.body.removeChild(pc);

  // 6. el-command, el-command-item, el-command-group reactive attributes and inline mode
  const cmd = document.createElement('el-command');
  cmd.setAttribute('inline', '');
  cmd.innerHTML = '<el-command-group heading="Ops"><el-command-item value="run" shortcut="⌘R">Run</el-command-item></el-command-group>';
  document.body.appendChild(cmd);
  assert.equal(cmd.inline.value, true);
  const grp = cmd.querySelector('el-command-group');
  const item = cmd.querySelector('el-command-item');
  grp.setAttribute('heading', 'Updated Ops');
  item.setAttribute('shortcut', '⌘U');
  item.setAttribute('disabled', '');
  assert.equal(grp.heading.value, 'Updated Ops');
  assert.equal(item.shortcut.value, '⌘U');
  assert.equal(item.disabled.value, true);
  document.body.removeChild(cmd);

  // 7. el-tabs and el-tab: name/value/label/disabled support
  const tabs = document.createElement('el-tabs');
  tabs.setAttribute('value', 'metrics');
  tabs.innerHTML = `
    <el-tab name="overview">Overview</el-tab>
    <el-tab name="metrics">Metrics</el-tab>
    <el-tab name="settings" disabled>Settings</el-tab>
  `;
  document.body.appendChild(tabs);
  assert.equal(tabs.activeTab.value, 'metrics');
  assert.ok(tabs.querySelector('el-tab[name="metrics"]').hasAttribute('active'));
  document.body.removeChild(tabs);

  // 8. el-breadcrumb & el-breadcrumb-item reactive separator
  const bc = document.createElement('el-breadcrumb');
  bc.setAttribute('separator', '>');
  bc.innerHTML = '<el-breadcrumb-item href="#a">A</el-breadcrumb-item><el-breadcrumb-item current>B</el-breadcrumb-item>';
  document.body.appendChild(bc);
  const items = bc.querySelectorAll('el-breadcrumb-item');
  assert.equal(items[0].separator.value, '>');
  assert.equal(items[0].isLast.value, false);
  assert.equal(items[1].isLast.value, true);
  document.body.removeChild(bc);

  // 9. el-navigation-menu vertical orientation & hover grace timer
  const nav = document.createElement('el-navigation-menu');
  nav.setAttribute('orientation', 'vertical');
  nav.innerHTML = '<el-navigation-menu-item><el-navigation-menu-trigger>Menu</el-navigation-menu-trigger><el-navigation-menu-content><a href="#1">Link</a></el-navigation-menu-content></el-navigation-menu-item>';
  document.body.appendChild(nav);
  const navItem = nav.querySelector('el-navigation-menu-item');
  assert.equal(navItem.getAttribute('data-orientation'), 'vertical');
  document.body.removeChild(nav);

  // 10. el-card title, bordered, glass, hoverable
  const card = document.createElement('el-card');
  card.setAttribute('title', 'Cluster Node');
  card.setAttribute('glass', '');
  card.setAttribute('hoverable', '');
  document.body.appendChild(card);
  assert.equal(card.title.value, 'Cluster Node');
  assert.equal(card.glass.value, true);
  assert.equal(card.hoverable.value, true);
  assert.ok(card.shadowRoot.querySelector('.card-auto-header'));
  document.body.removeChild(card);

  // 11. el-router fallback to default when window.location.hash is an unrelated anchor
  window.location.hash = '#el-router';
  const router = document.createElement('el-router');
  router.setAttribute('default', '/home');
  router.innerHTML = '<el-route path="/home">Home</el-route><el-route path="/analytics">Analytics</el-route>';
  document.body.appendChild(router);
  assert.ok(router.querySelector('el-route[path="/home"]').hasAttribute('active'));
  router.setAttribute('default', '/analytics');
  assert.ok(router.querySelector('el-route[path="/analytics"]').hasAttribute('active'));
  document.body.removeChild(router);
});

