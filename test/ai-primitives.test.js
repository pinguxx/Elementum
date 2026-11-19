import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import {
  computeLineDiff,
  ElDiffViewer,
  ElSources,
  ElTaskList,
  ElInsightCard,
} from '../src/index.js';

test('AI Primitives: computeLineDiff & <el-diff-viewer> support unified/split modes and HITL approval', () => {
  const rows = computeLineDiff('a\nb\nc', 'a\nx\nc\nd');
  assert.equal(rows.filter((r) => r.type === 'add').length, 2);
  assert.equal(rows.filter((r) => r.type === 'remove').length, 1);

  const el = document.createElement('el-diff-viewer');
  el.setAttribute('filename', 'src/app.js');
  el.setAttribute('before', 'const a = 1;\nconst b = 2;');
  el.setAttribute('after', 'const a = 1;\nconst b = 3;');
  el.setAttribute('approval', '');
  document.body.appendChild(el);

  assert.equal(el.stats.value.added, 1);
  assert.equal(el.stats.value.removed, 1);
  assert.ok(el.root.querySelector('.row.add'));
  assert.ok(el.root.querySelector('.row.remove'));

  el.setMode('split');
  assert.equal(el.mode.value, 'split');
  assert.ok(el.root.querySelector('.split-grid'));

  let accepted = null;
  let rejected = null;
  el.addEventListener('accept', (e) => { accepted = e.detail; });
  el.addEventListener('reject', (e) => { rejected = e.detail; });

  el.root.querySelector('.btn-accept').click();
  el.root.querySelector('.btn-reject').click();
  assert.equal(accepted?.filename, 'src/app.js');
  assert.equal(rejected?.filename, 'src/app.js');

  el.remove();
});

test('AI Primitives: <el-sources> renders numbered citation pills, expands cards, sanitizes URLs, and emits source-select', () => {
  const el = document.createElement('el-sources');
  el.setAttribute('label', 'Citations');
  el.setAttribute(
    'sources',
    JSON.stringify([
      { title: 'AG-UI Docs', url: 'https://docs.ag-ui.com/intro', snippet: 'Streaming agent events.' },
      { title: 'Bad Link', url: 'javascript:alert(1)', snippet: 'Should be neutralized.' },
    ])
  );
  document.body.appendChild(el);

  const pills = el.root.querySelectorAll('.pill');
  assert.equal(pills.length, 2);
  assert.equal(pills[0].getAttribute('href'), 'https://docs.ag-ui.com/intro');
  assert.equal(pills[1].getAttribute('href'), '#');

  let selected = null;
  el.addEventListener('source-select', (e) => { selected = e.detail; });
  pills[0].click();
  assert.equal(selected?.index, 0);
  assert.equal(selected?.source.title, 'AG-UI Docs');

  assert.equal(el.root.querySelectorAll('.source-card').length, 0);
  el.toggleExpanded();
  assert.equal(el.root.querySelectorAll('.source-card').length, 2);

  el.remove();
});

test('AI Primitives: <el-task-list> tracks progress counter and supports surgical updateTask()', () => {
  const el = document.createElement('el-task-list');
  el.setAttribute('heading', 'Build Plan');
  el.setAttribute(
    'tasks',
    JSON.stringify([
      { id: 't1', label: 'Lint', status: 'completed', duration: '120ms' },
      { id: 't2', label: 'Test', status: 'running', detail: 'Running suite' },
    ])
  );
  document.body.appendChild(el);

  assert.equal(el.progress.value.completed, 1);
  assert.equal(el.progress.value.total, 2);
  assert.equal(el.root.querySelectorAll('.row').length, 2);

  el.updateTask('t2', { status: 'completed', duration: '2.1s' });
  el.updateTask('t3', { label: 'Deploy', status: 'pending' });
  assert.equal(el.progress.value.completed, 2);
  assert.equal(el.progress.value.total, 3);
  assert.equal(el.root.querySelectorAll('.row').length, 3);

  el.remove();
});

test('AI Primitives: <el-insight-card> renders metric/delta, emits action, and toggles thumbs feedback', () => {
  const el = document.createElement('el-insight-card');
  el.setAttribute('category', 'Anomaly');
  el.setAttribute('variant', 'warning');
  el.setAttribute('title', 'Token Spike Detected');
  el.setAttribute('metric', '+38%');
  el.setAttribute('delta', 'last 1h');
  el.setAttribute('summary', 'Prompt size increased after tool schema update.');
  el.setAttribute('action-label', 'Inspect Trace');
  document.body.appendChild(el);

  assert.equal(el.root.querySelector('.metric-val')?.textContent, '+38%');

  let actionDetail = null;
  let feedbackDetail = null;
  el.addEventListener('action', (e) => { actionDetail = e.detail; });
  el.addEventListener('feedback', (e) => { feedbackDetail = e.detail; });

  el.root.querySelector('.cta-btn').click();
  assert.equal(actionDetail?.title, 'Token Spike Detected');

  const [upBtn] = el.root.querySelectorAll('.vote-btn');
  upBtn.click();
  assert.equal(feedbackDetail?.vote, 'up');
  upBtn.click();
  assert.equal(feedbackDetail?.vote, null);

  el.remove();
});
