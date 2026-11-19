/**
 * AG-UI (Agent-User Interaction Protocol) Adapter for @wcomp/elementum
 * Bridges streaming AG-UI events (RUN_*, STEP_*, TEXT_MESSAGE_*, TOOL_CALL_*, STATE_*)
 * into fine-grained Elementum micro-signals and Web Component properties.
 */

import { signal, isSignal } from './signal.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function cloneValue(val) {
  if (val === null || typeof val !== 'object') return val;
  if (typeof structuredClone === 'function') {
    return structuredClone(val);
  }
  return JSON.parse(JSON.stringify(val));
}

function decodePointerToken(token) {
  return String(token).replace(/~1/g, '/').replace(/~0/g, '~');
}

function parsePointer(pointer) {
  if (!pointer || pointer === '/') return pointer === '/' ? [''] : [];
  const raw = String(pointer);
  const parts = (raw.startsWith('/') ? raw.slice(1) : raw).split('/');
  return parts.map(decodePointerToken);
}

/**
 * Resolve an RFC 6901 JSON Pointer against an object.
 */
export function getByPointer(obj, pointer) {
  if (!pointer) return obj;
  const tokens = parsePointer(pointer);
  let cur = obj;
  for (const key of tokens) {
    if (cur === null || typeof cur !== 'object' || FORBIDDEN_KEYS.has(key)) {
      return undefined;
    }
    cur = cur[key];
  }
  return cur;
}

/**
 * Apply an array of RFC 6902 JSON Patch operations immutably to a target object.
 */
export function applyJsonPatch(target, patch = []) {
  let root = cloneValue(target ?? {});
  if (!Array.isArray(patch) || patch.length === 0) return root;

  for (const operation of patch) {
    if (!operation || !operation.op) continue;
    const tokens = parsePointer(operation.path);
    if (tokens.length === 0) {
      if (operation.op === 'replace' || operation.op === 'add') {
        root = cloneValue(operation.value);
      }
      continue;
    }

    if (tokens.some((t) => FORBIDDEN_KEYS.has(t))) continue;

    let parent = root;
    for (let i = 0; i < tokens.length - 1; i++) {
      const seg = tokens[i];
      if (parent[seg] === undefined || parent[seg] === null || typeof parent[seg] !== 'object') {
        parent[seg] = Number.isInteger(Number(tokens[i + 1])) ? [] : {};
      }
      parent = parent[seg];
    }

    const last = tokens[tokens.length - 1];
    const op = operation.op;

    if (op === 'remove') {
      if (Array.isArray(parent)) {
        const idx = Number(last);
        if (Number.isInteger(idx) && idx >= 0 && idx < parent.length) {
          parent.splice(idx, 1);
        }
      } else if (parent && typeof parent === 'object') {
        delete parent[last];
      }
      continue;
    }

    if (op === 'add' || op === 'replace') {
      const nextVal = cloneValue(operation.value);
      if (Array.isArray(parent)) {
        if (last === '-') {
          parent.push(nextVal);
        } else {
          const idx = Number(last);
          if (Number.isInteger(idx) && idx >= 0) {
            if (op === 'add' && idx <= parent.length) {
              parent.splice(idx, 0, nextVal);
            } else {
              parent[idx] = nextVal;
            }
          }
        }
      } else if (parent && typeof parent === 'object') {
        parent[last] = nextVal;
      }
    }
  }

  return root;
}

function setElementProp(el, prop, value) {
  if (!el) return;
  const targetProp = el[prop];
  if (isSignal(targetProp)) {
    targetProp.value = value;
    return;
  }
  const attrName = prop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
  if (typeof value === 'boolean') {
    if (value) el.setAttribute(attrName, '');
    else el.removeAttribute(attrName);
    return;
  }
  el[prop] = value;
  if (typeof value !== 'object' && value !== null && value !== undefined) {
    el.setAttribute(attrName, String(value));
  }
}

/**
 * Create a reactive Elementum signal store for an AG-UI session.
 */
export function createAgUiStore(initialState = {}) {
  const state = signal(cloneValue(initialState));
  const status = signal('idle');
  const runId = signal('');
  const stepName = signal('');
  const thinking = signal(false);
  const thinkingText = signal('');
  const currentText = signal('');
  const messages = signal([]);
  const toolCalls = signal([]);
  const error = signal(null);
  const events = signal([]);

  const listeners = new Set();

  function upsertToolCall(callId, updater) {
    const list = [...toolCalls.peek()];
    const idx = list.findIndex((tc) => tc.id === callId);
    if (idx === -1) {
      list.push(updater({ id: callId, name: 'tool_call', args: '', result: '', status: 'running', approval: false }));
    } else {
      list[idx] = updater({ ...list[idx] });
    }
    toolCalls.value = list;
  }

  function dispatch(event) {
    if (!event || !event.type) return;
    events.value = [...events.peek(), event];

    switch (event.type) {
      case 'RUN_STARTED':
        status.value = 'running';
        runId.value = event.runId || '';
        error.value = null;
        break;

      case 'RUN_FINISHED':
        status.value = 'finished';
        thinking.value = false;
        break;

      case 'RUN_ERROR':
        status.value = 'error';
        error.value = event.message || 'AG-UI run error';
        thinking.value = false;
        break;

      case 'STEP_STARTED':
      case 'THINKING_START':
        thinking.value = true;
        if (event.stepName || event.title) {
          stepName.value = event.stepName || event.title;
        }
        break;

      case 'THINKING_TEXT_MESSAGE_CONTENT':
        thinkingText.value = thinkingText.peek() + (event.delta || '');
        break;

      case 'STEP_FINISHED':
      case 'THINKING_END':
        thinking.value = false;
        break;

      case 'TEXT_MESSAGE_START': {
        const msgId = event.messageId || `msg-${Date.now()}`;
        currentText.value = '';
        messages.value = [
          ...messages.peek(),
          { id: msgId, role: event.role || 'assistant', content: '' },
        ];
        break;
      }

      case 'TEXT_MESSAGE_CONTENT': {
        const delta = event.delta || '';
        const nextText = currentText.peek() + delta;
        currentText.value = nextText;

        const list = [...messages.peek()];
        const msgId = event.messageId;
        let idx = msgId ? list.findIndex((m) => m.id === msgId) : list.length - 1;
        if (idx === -1) {
          list.push({ id: msgId || `msg-${Date.now()}`, role: 'assistant', content: nextText });
        } else {
          list[idx] = { ...list[idx], content: (list[idx].content || '') + delta };
        }
        messages.value = list;
        break;
      }

      case 'TEXT_MESSAGE_END':
        break;

      case 'TOOL_CALL_START': {
        const callId = event.toolCallId || `tc-${toolCalls.peek().length + 1}`;
        const requiresApproval = Boolean(event.requiresApproval);
        upsertToolCall(callId, (prev) => ({
          ...prev,
          name: event.toolCallName || event.name || prev.name,
          args: '',
          result: '',
          approval: requiresApproval,
          status: requiresApproval ? 'awaiting-approval' : 'running',
        }));
        break;
      }

      case 'TOOL_CALL_ARGS': {
        const callId = event.toolCallId || toolCalls.peek().at(-1)?.id || 'tc-1';
        upsertToolCall(callId, (prev) => ({
          ...prev,
          args: (prev.args || '') + (event.delta || ''),
        }));
        break;
      }

      case 'TOOL_CALL_END': {
        const callId = event.toolCallId || toolCalls.peek().at(-1)?.id || 'tc-1';
        upsertToolCall(callId, (prev) => ({
          ...prev,
          status: prev.approval ? 'awaiting-approval' : (event.status || 'completed'),
        }));
        break;
      }

      case 'TOOL_CALL_RESULT': {
        const callId = event.toolCallId || toolCalls.peek().at(-1)?.id || 'tc-1';
        const resVal = typeof event.result === 'string' ? event.result : JSON.stringify(event.result ?? '', null, 2);
        upsertToolCall(callId, (prev) => ({
          ...prev,
          result: resVal,
          approval: false,
          status: event.status || 'completed',
        }));
        break;
      }

      case 'STATE_SNAPSHOT':
        state.value = cloneValue(event.snapshot || {});
        break;

      case 'STATE_DELTA':
        state.value = applyJsonPatch(state.peek(), event.delta || []);
        break;

      case 'MESSAGES_SNAPSHOT':
        messages.value = Array.isArray(event.messages) ? cloneValue(event.messages) : [];
        break;

      default:
        break;
    }

    for (const fn of listeners) {
      fn(event);
    }
  }

  function pathSignal(pointer, fallback = undefined) {
    const initial = getByPointer(state.peek(), pointer);
    const derived = signal(initial !== undefined ? initial : fallback);
    state.subscribe((nextState) => {
      const val = getByPointer(nextState, pointer);
      derived.value = val !== undefined ? val : fallback;
    });
    return derived;
  }

  function onEvent(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function bindComponents({
    promptInput = null,
    streamingText = null,
    reasoningCard = null,
    toolCallCard = null,
    stateBindings = {},
  } = {}) {
    const unsubs = [];

    if (promptInput) {
      unsubs.push(
        status.subscribe((st) => {
          setElementProp(promptInput, 'loading', st === 'running');
        })
      );
    }

    if (streamingText) {
      unsubs.push(
        status.subscribe((st) => {
          if (st !== 'running') {
            if (isSignal(streamingText.isStreaming)) streamingText.isStreaming.value = false;
            if (currentText.peek() && isSignal(streamingText.isComplete)) streamingText.isComplete.value = true;
          }
        }),
        currentText.subscribe((txt) => {
          if (isSignal(streamingText.text)) {
            streamingText.text.value = txt;
          } else {
            streamingText.setAttribute?.('text', txt);
          }
          if (isSignal(streamingText.displayedText)) {
            streamingText.displayedText.value = txt;
          }
          if (isSignal(streamingText.isStreaming)) {
            streamingText.isStreaming.value = status.peek() === 'running';
          }
          if (isSignal(streamingText.isComplete)) {
            streamingText.isComplete.value = status.peek() !== 'running' && Boolean(txt);
          }
        })
      );
    }

    if (reasoningCard) {
      unsubs.push(
        thinking.subscribe((isThinking) => {
          setElementProp(reasoningCard, 'thinking', isThinking);
        }),
        stepName.subscribe((summary) => {
          if (summary) setElementProp(reasoningCard, 'summary', summary);
        })
      );
    }

    if (toolCallCard) {
      unsubs.push(
        toolCalls.subscribe((list) => {
          const latest = list.at(-1);
          if (!latest) return;
          setElementProp(toolCallCard, 'callId', latest.id);
          setElementProp(toolCallCard, 'name', latest.name);
          setElementProp(toolCallCard, 'status', latest.status);
          setElementProp(toolCallCard, 'args', latest.args);
          setElementProp(toolCallCard, 'result', latest.result);
          setElementProp(toolCallCard, 'approval', Boolean(latest.approval));
        })
      );
    }

    for (const [pointer, binding] of Object.entries(stateBindings)) {
      if (!binding) continue;
      const [el, propName = 'value'] = Array.isArray(binding) ? binding : [binding.element, binding.prop || 'value'];
      if (!el) continue;
      const pSig = pathSignal(pointer);
      unsubs.push(
        pSig.subscribe((val) => {
          if (val !== undefined) {
            setElementProp(el, propName, val);
          }
        })
      );
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }

  async function connectSSE(source) {
    if (!source) return;

    // 1. Fetch Response or ReadableStream of bytes
    const stream = typeof source.getReader === 'function'
      ? source
      : (source.body && typeof source.body.getReader === 'function' ? source.body : null);

    if (stream) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += typeof value === 'string' ? value : decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const payload = trimmed.slice(5).trim();
            if (payload && payload !== '[DONE]') {
              dispatch(JSON.parse(payload));
            }
          }
        }
      }

      if (buffer.trim().startsWith('data:')) {
        const payload = buffer.trim().slice(5).trim();
        if (payload && payload !== '[DONE]') {
          dispatch(JSON.parse(payload));
        }
      }
      return;
    }

    // 2. Async or sync iterable of AG-UI event objects or SSE strings
    for await (const chunk of source) {
      if (typeof chunk === 'string') {
        for (const line of chunk.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const payload = trimmed.slice(5).trim();
            if (payload && payload !== '[DONE]') {
              dispatch(JSON.parse(payload));
            }
          }
        }
      } else if (chunk && typeof chunk === 'object') {
        dispatch(chunk);
      }
    }
  }

  return {
    state,
    status,
    runId,
    stepName,
    thinking,
    thinkingText,
    currentText,
    messages,
    toolCalls,
    error,
    events,
    dispatch,
    pathSignal,
    onEvent,
    bindComponents,
    connectSSE,
  };
}
