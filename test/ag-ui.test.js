import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import '../src/components/el-tool-call.js';
import '../src/components/el-prompt-input.js';
import '../src/components/el-streaming-text.js';
import '../src/components/el-reasoning-card.js';
import '../src/components/el-number-flow.js';
import { createAgUiStore, applyJsonPatch, getByPointer } from '../src/ag-ui.js';

test('<el-tool-call> renders attributes, formats JSON payloads, toggles disclosure, and emits HITL events', () => {
  const tool = document.createElement('el-tool-call');
  tool.setAttribute('name', 'deploy_edge_worker');
  tool.setAttribute('call-id', 'call_42');
  tool.setAttribute('status', 'awaiting-approval');
  tool.setAttribute('approval', '');
  tool.setAttribute('args', '{"region":"us-east-1","replicas":3}');
  document.body.appendChild(tool);

  assert.equal(tool.root.querySelector('.tool-name')?.textContent, 'deploy_edge_worker');
  assert.equal(tool.root.querySelector('.call-id')?.textContent, '#call_42');
  assert.ok(tool.root.querySelector('[part="args"]')?.textContent.includes('"region": "us-east-1"'));
  assert.ok(tool.root.querySelector('.hitl-footer'), 'HITL footer should render when awaiting-approval');

  // Collapsible toggle
  let toggledState = null;
  tool.addEventListener('toggle', (e) => {
    toggledState = e.detail.open;
  });
  tool.root.querySelector('.header-btn').click();
  assert.equal(tool.open.value, false);
  assert.equal(toggledState, false);
  assert.equal(tool.root.querySelector('.tool-body').classList.contains('open'), false);
  tool.root.querySelector('.header-btn').click();
  assert.equal(tool.open.value, true);

  // Approve HITL execution
  let approved = null;
  tool.addEventListener('approve', (e) => {
    approved = e.detail;
  });
  tool.root.querySelector('.approve-btn').click();
  assert.equal(tool.status.value, 'completed');
  assert.equal(tool.approval.value, false);
  assert.deepEqual(approved, {
    callId: 'call_42',
    name: 'deploy_edge_worker',
    args: '{"region":"us-east-1","replicas":3}',
  });

  // Reset to approval mode and test Reject
  tool.status = 'awaiting-approval';
  tool.approval = true;
  let rejected = null;
  tool.addEventListener('reject', (e) => {
    rejected = e.detail;
  });
  tool.root.querySelector('.reject-btn').click();
  assert.equal(tool.status.value, 'rejected');
  assert.equal(rejected.name, 'deploy_edge_worker');

  // Result display and invalid JSON raw fallback
  tool.args = '{incomplete json';
  tool.result = { ok: true, count: 5 };
  assert.equal(tool.root.querySelector('[part="args"]')?.textContent, '{incomplete json');
  assert.ok(tool.root.querySelector('[part="result"]')?.textContent.includes('"ok": true'));

  tool.remove();
});

test('applyJsonPatch & getByPointer handle RFC 6902 add/replace/remove, escaping, arrays, and safety guards', () => {
  const base = {
    metrics: { tokens: 10, 'slash/key': 'old', 'tilde~key': 't1' },
    items: ['a', 'c'],
  };

  const patched = applyJsonPatch(base, [
    { op: 'replace', path: '/metrics/tokens', value: 42 },
    { op: 'add', path: '/metrics/slash~1key', value: 'escaped-slash' },
    { op: 'replace', path: '/metrics/tilde~0key', value: 'escaped-tilde' },
    { op: 'add', path: '/items/1', value: 'b' },
    { op: 'add', path: '/items/-', value: 'd' },
    { op: 'remove', path: '/items/0' },
    { op: 'add', path: '/nested/deep', value: true },
    { op: 'replace', path: '/__proto__/polluted', value: true },
  ]);

  assert.equal(base.metrics.tokens, 10, 'Input object must not be mutated in place');
  assert.equal(patched.metrics.tokens, 42);
  assert.equal(getByPointer(patched, '/metrics/slash~1key'), 'escaped-slash');
  assert.equal(getByPointer(patched, '/metrics/tilde~0key'), 'escaped-tilde');
  assert.deepEqual(patched.items, ['b', 'c', 'd']);
  assert.equal(patched.nested.deep, true);
  assert.equal(({}).polluted, undefined);
  assert.equal(getByPointer(patched, '/__proto__/polluted'), undefined);
  assert.equal(getByPointer(patched, '/missing/path'), undefined);
});

test('createAgUiStore handles full AG-UI event stream, pathSignal, bindComponents, and connectSSE', async () => {
  const promptInput = document.createElement('el-prompt-input');
  const streamingText = document.createElement('el-streaming-text');
  streamingText.setAttribute('auto-start', 'false');
  const reasoningCard = document.createElement('el-reasoning-card');
  const toolCallCard = document.createElement('el-tool-call');
  const tokenFlow = document.createElement('el-number-flow');
  tokenFlow.setAttribute('value', '0');

  document.body.append(promptInput, streamingText, reasoningCard, toolCallCard, tokenFlow);

  const store = createAgUiStore({ metrics: { tokens: 5 } });
  const tokenSig = store.pathSignal('/metrics/tokens', 0);
  const seenEvents = [];
  const offEvent = store.onEvent((e) => seenEvents.push(e.type));

  const dispose = store.bindComponents({
    promptInput,
    streamingText,
    reasoningCard,
    toolCallCard,
    stateBindings: {
      '/metrics/tokens': [tokenFlow, 'value'],
    },
  });

  // Stream bytes via Web ReadableStream SSE format
  const sseChunks = [
    'data: {"type":"RUN_STARTED","runId":"r1"}\n\n',
    'data: {"type":"STEP_STARTED","stepName":"Planning UI"}\n\n',
    'data: {"type":"THINKING_TEXT_MESSAGE_CONTENT","delta":"Checking tokens..."}\n\n',
    'data: {"type":"TOOL_CALL_START","toolCallId":"tc1","toolCallName":"fetch_tokens","requiresApproval":true}\n\n',
    'data: {"type":"TOOL_CALL_ARGS","toolCallId":"tc1","delta":"{\\"theme\\":\\"dark\\"}"}\n\n',
    'data: {"type":"TOOL_CALL_END","toolCallId":"tc1"}\n\n',
    'data: {"type":"TOOL_CALL_RESULT","toolCallId":"tc1","result":{"ok":true}}\n\n',
    'data: {"type":"STEP_FINISHED"}\n\n',
    'data: {"type":"TEXT_MESSAGE_START","messageId":"m1","role":"assistant"}\n\n',
    'data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m1","delta":"Done "}\n\n',
    'data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m1","delta":"rendering."}\n\n',
    'data: {"type":"TEXT_MESSAGE_END","messageId":"m1"}\n\n',
    'data: {"type":"STATE_SNAPSHOT","snapshot":{"metrics":{"tokens":100}}}\n\n',
    'data: {"type":"STATE_DELTA","delta":[{"op":"replace","path":"/metrics/tokens","value":250}]}\n\n',
    'data: {"type":"RUN_FINISHED"}\n\n',
    'data: [DONE]\n\n',
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const c of sseChunks) {
        controller.enqueue(encoder.encode(c));
      }
      controller.close();
    },
  });

  await store.connectSSE(new Response(stream));

  assert.equal(store.status.value, 'finished');
  assert.equal(store.runId.value, 'r1');
  assert.equal(store.thinking.value, false);
  assert.equal(store.thinkingText.value, 'Checking tokens...');
  assert.equal(store.currentText.value, 'Done rendering.');
  assert.equal(streamingText.text.value, 'Done rendering.');
  assert.equal(streamingText.displayedText.value, 'Done rendering.');
  assert.equal(tokenSig.value, 250);
  assert.equal(String(tokenFlow.value.value ?? tokenFlow.getAttribute('value')), '250');
  assert.equal(toolCallCard.name.value, 'fetch_tokens');
  assert.equal(toolCallCard.status.value, 'completed');
  assert.ok(toolCallCard.result.value.includes('"ok": true'));
  assert.equal(seenEvents.length, 15);

  // Also cover async iterable SSE / object chunks & MESSAGES_SNAPSHOT + RUN_ERROR
  async function* extraStream() {
    yield { type: 'MESSAGES_SNAPSHOT', messages: [{ id: 'm1', role: 'user', content: 'Hi' }] };
    yield { type: 'RUN_ERROR', message: 'Upstream timeout' };
  }
  await store.connectSSE(extraStream());
  assert.equal(store.status.value, 'error');
  assert.equal(store.error.value, 'Upstream timeout');
  assert.equal(store.messages.value.length, 1);

  offEvent();
  dispose();
  promptInput.remove();
  streamingText.remove();
  reasoningCard.remove();
  toolCallCard.remove();
  tokenFlow.remove();
});

test('examples/ag-ui.html live demo wires createAgUiStore, bindComponents, connectSSE, and sticky navbar', async () => {
  const fs = await import('node:fs');
  const html = fs.readFileSync(new URL('../examples/ag-ui.html', import.meta.url), 'utf8');
  assert.ok(html.includes('<el-navbar sticky'), 'should include sticky navbar');
  assert.ok(html.includes('overflow-x: clip'), 'should use overflow-x: clip so sticky navbar works');
  assert.ok(html.includes('createAgUiStore'), 'should import and instantiate createAgUiStore');
  assert.ok(html.includes('store.bindComponents'), 'should bind Elementum components via bindComponents');
  assert.ok(html.includes('store.connectSSE'), 'should stream events via connectSSE');
  assert.ok(html.includes('STATE_DELTA'), 'should demonstrate RFC 6902 STATE_DELTA patches');
  assert.ok(html.includes('<el-tool-call'), 'should include HITL <el-tool-call>');
  assert.ok(html.includes('<el-diff-viewer'), 'should include <el-diff-viewer>');
  assert.ok(html.includes('<el-sources'), 'should include <el-sources>');
  assert.ok(html.includes('<el-task-list'), 'should include <el-task-list>');
  assert.ok(!html.includes('setTasks('), 'should mutate tasks.value signal instead of non-existent setTasks()');
  assert.ok(!html.includes('setSources('), 'should mutate sources.value signal instead of non-existent setSources()');
  assert.ok(!html.includes('setDiff('), 'should mutate before/after signals instead of non-existent setDiff()');
});
