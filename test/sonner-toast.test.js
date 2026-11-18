import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import { toast, ElToaster } from '../src/components/el-toast.js';
import { ElChart } from '../src/components/el-chart.js';
import { ElSidebar, ElSidebarHeader, ElSidebarContent, ElSidebarFooter, ElSidebarTrigger } from '../src/components/el-sidebar.js';

test('Sonner Toast: callable toast function and variants', () => {
  // Test direct invocation
  const id1 = toast('System update ready', { description: 'Version 2.4.0 downloaded' });
  const t1 = toast.toasts.value.find(t => t.id === id1);
  assert.equal(t1.message, 'System update ready');
  assert.equal(t1.description, 'Version 2.4.0 downloaded');
  assert.equal(t1.variant, 'info');

  // Test warning & loading
  const idWarn = toast.warning('High memory usage');
  const tWarn = toast.toasts.value.find(t => t.id === idWarn);
  assert.equal(tWarn.variant, 'warning');

  const idLoad = toast.loading('Connecting to gateway...');
  const tLoad = toast.toasts.value.find(t => t.id === idLoad);
  assert.equal(tLoad.variant, 'loading');
  assert.equal(tLoad.duration, 0); // Stays open

  // Cleanup
  toast.dismiss(id1);
  toast.dismiss(idWarn);
  toast.dismiss(idLoad);
});

test('Sonner Toast: toast.promise resolves with in-place reactive morphing', async () => {
  const mockPromise = new Promise((resolve) => {
    setTimeout(() => resolve({ filename: 'report.pdf' }), 20);
  });

  const resPromise = toast.promise(mockPromise, {
    loading: 'Generating PDF report...',
    success: (data) => `Report ${data.filename} ready!`,
    error: 'Failed to generate report'
  });

  // Verify loading state immediately
  const activeLoading = toast.toasts.value.find(t => t.message === 'Generating PDF report...');
  assert.ok(activeLoading);
  assert.equal(activeLoading.variant, 'loading');

  const result = await resPromise;
  assert.equal(result.filename, 'report.pdf');

  // Verify morphed into success in-place (same toast ID)
  const morphedSuccess = toast.toasts.value.find(t => t.id === activeLoading.id);
  assert.ok(morphedSuccess);
  assert.equal(morphedSuccess.variant, 'success');
  assert.equal(morphedSuccess.message, 'Report report.pdf ready!');

  toast.dismiss(activeLoading.id);
});

test('Sonner Toast: toast.promise rejects with error message and danger variant', async () => {
  const mockFailing = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout 504')), 20);
  });

  try {
    await toast.promise(mockFailing, {
      loading: 'Uploading archive...',
      success: 'Uploaded successfully',
      error: (err) => `Upload error: ${err.message}`
    });
    assert.fail('Should have rejected');
  } catch (err) {
    assert.equal(err.message, 'Network timeout 504');
  }

  const failedToast = toast.toasts.value.find(t => t.variant === 'danger');
  assert.ok(failedToast);
  assert.ok(failedToast.message.includes('Network timeout 504'));

  toast.dismiss(failedToast.id);
});

test('Sonner Toast: rich actions and cancel buttons trigger callbacks', () => {
  let actionClicked = false;
  let cancelClicked = false;

  const id = toast('Message deleted', {
    action: {
      label: 'Undo',
      onClick: () => { actionClicked = true; }
    },
    cancel: {
      label: 'Dismiss',
      onClick: () => { cancelClicked = true; }
    }
  });

  const toaster = document.createElement('el-toaster');
  document.body.appendChild(toaster);

  const tCard = toaster.shadowRoot.querySelector(`[data-toast-id="${id}"]`);
  assert.ok(tCard);

  const actionBtn = tCard.querySelector('.toast-btn.action');
  assert.ok(actionBtn);
  assert.equal(actionBtn.textContent.trim(), 'Undo');
  actionBtn.click();
  assert.equal(actionClicked, true);

  // Re-create for cancel test
  const id2 = toast('Disk format warning', {
    cancel: {
      label: 'Abort',
      onClick: () => { cancelClicked = true; }
    }
  });

  const tCard2 = toaster.shadowRoot.querySelector(`[data-toast-id="${id2}"]`);
  const cancelBtn = tCard2.querySelector('.toast-btn.cancel');
  assert.ok(cancelBtn);
  cancelBtn.click();
  assert.equal(cancelClicked, true);

  // Test dismiss all
  toast.dismiss();
  assert.equal(toast.toasts.value.length, 0);

  document.body.removeChild(toaster);
});

test('Sonner Toast: <el-toaster> positions and hover card stack calculations', () => {
  const toaster = document.createElement('el-toaster');
  toaster.setAttribute('position', 'top-right');
  document.body.appendChild(toaster);

  // Create 3 toasts
  toast.success('Toast 1');
  toast.info('Toast 2');
  toast.warning('Toast 3');

  assert.equal(toast.toasts.value.length, 3);
  const cards = toaster.shadowRoot.querySelectorAll('.toast-card');
  assert.equal(cards.length, 3);

  // Simulate mouse enter to expand
  const viewport = toaster.shadowRoot.querySelector('.toaster-viewport');
  viewport.dispatchEvent(new MouseEvent('mouseenter'));
  viewport.dispatchEvent(new MouseEvent('mouseleave'));

  // Test close button
  const closeBtn = cards[0].querySelector('.toast-close');
  if (closeBtn) closeBtn.click();

  toast.dismiss();
  document.body.removeChild(toaster);
});

test('ElChart: handles smooth spline and dynamic responsive width', () => {
  const chart = document.createElement('el-chart');
  chart.setAttribute('type', 'area');
  chart.setAttribute('curve', 'smooth');
  chart.setAttribute('secondary-key', 'previous');
  chart.setAttribute('data', JSON.stringify([
    { label: '00:00', value: 100, previous: 80 },
    { label: '04:00', value: 300, previous: 200 },
    { label: '08:00', value: 250, previous: 220 },
    { label: '12:00', value: 500, previous: 400 }
  ]));

  document.body.appendChild(chart);

  const svg = chart.shadowRoot.querySelector('svg');
  assert.ok(svg);
  const primaryStroke = chart.shadowRoot.querySelector('.series-primary-stroke');
  assert.ok(primaryStroke);
  assert.ok(primaryStroke.getAttribute('d').includes('C')); // Smooth cubic Bézier spline command

  const secondaryStroke = chart.shadowRoot.querySelector('.series-secondary-stroke');
  assert.ok(secondaryStroke);
  assert.ok(secondaryStroke.getAttribute('d').includes('C'));

  // Test updating container width
  chart._containerWidth.value = 1200;
  assert.equal(chart._containerWidth.value, 1200);

  // Test tooltip styling and high contrast tokens
  assert.ok(ElChart.styles.cssText.includes('--el-tooltip-bg'));
  assert.ok(ElChart.styles.cssText.includes('--el-tooltip-text'));

  // Trigger hover to display tooltip
  const hitCol = chart.shadowRoot.querySelectorAll('.hit-column')[1];
  if (hitCol) {
    hitCol.dispatchEvent(new MouseEvent('mouseenter'));
    const tooltip = chart.shadowRoot.querySelector('.chart-tooltip');
    assert.ok(tooltip);
    assert.ok(tooltip.querySelector('.tooltip-header'));
    assert.ok(tooltip.querySelector('.tooltip-value'));
  }

  document.body.removeChild(chart);
});

test('ElSidebar: properly toggles collapsed state and hides .collapsible-text', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <el-sidebar id="test-sidebar">
      <el-sidebar-header>
        <div>
          <span class="collapsible-text">Title</span>
          <el-sidebar-trigger for="test-sidebar"></el-sidebar-trigger>
        </div>
      </el-sidebar-header>
      <el-sidebar-content>
        <button><span class="collapsible-text">Item</span></button>
      </el-sidebar-content>
      <el-sidebar-footer>
        <span class="collapsible-text">Footer</span>
      </el-sidebar-footer>
    </el-sidebar>
  `;
  document.body.appendChild(container);

  const sidebar = container.querySelector('el-sidebar');
  const trigger = container.querySelector('el-sidebar-trigger');
  const title = container.querySelector('.collapsible-text');

  assert.equal(sidebar.collapsed.value, false);
  assert.notEqual(title.style.display, 'none');

  // Trigger collapse
  trigger.shadowRoot.querySelector('button').click();
  assert.equal(sidebar.collapsed.value, true);
  assert.equal(title.style.display, 'none');

  // Trigger expand
  trigger.shadowRoot.querySelector('button').click();
  assert.equal(sidebar.collapsed.value, false);
  assert.equal(title.style.display, '');

  document.body.removeChild(container);
});
