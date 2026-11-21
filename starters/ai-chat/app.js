import { signal } from 'https://unpkg.com/@wcomp/elementum/src/signal.js';

const promptInput = document.getElementById('prompt-input');
const responseCard = document.getElementById('response-card');
const streamOutput = document.getElementById('stream-output');
const reasoningCard = document.getElementById('reasoning');
const toolCall = document.getElementById('tool-call');
const sources = document.getElementById('sources');

let currentAbortController = null;

promptInput.addEventListener('submit', async (e) => {
  const promptText = e.detail?.value || promptInput.value;
  if (!promptText) return;

  // Cancel prior in-flight request if present
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  const { signal: abortSignal } = currentAbortController;

  // 1. Reset and display UI states
  responseCard.style.display = 'none';
  streamOutput.finish();
  streamOutput.setAttribute('text', '');

  reasoningCard.style.display = 'block';
  reasoningCard.setAttribute('open', '');
  reasoningCard.setAttribute('thinking', '');
  reasoningCard.textContent = `Analyzing prompt: "${promptText}" and executing tools...`;

  toolCall.style.display = 'block';
  toolCall.setAttribute('name', 'search_docs');
  toolCall.setAttribute('status', 'running');
  toolCall.setAttribute('args', JSON.stringify({ query: promptText }, null, 2));
  toolCall.removeAttribute('result');

  sources.style.display = 'none';

  try {
    // 2. Simulate tool execution
    await sleep(1000, abortSignal);
    if (abortSignal.aborted) return;

    toolCall.setAttribute('status', 'completed');
    toolCall.setAttribute('result', JSON.stringify({ matches: 2, status: 'ok' }, null, 2));
    reasoningCard.removeAttribute('thinking');

    // 3. Display response and trigger streaming animation
    responseCard.style.display = 'block';
    const responseText = `Elementum provides 109 zero-dependency Web Components with fine-grained micro-signals and DSD SSR. In response to your question about "${promptText}", you can compose specialized AI primitives like <el-prompt-input>, <el-reasoning-card>, and <el-tool-call> directly in any framework or vanilla HTML.`;
    
    streamOutput.setAttribute('text', responseText);

    // 4. Reveal grounding sources when streaming finishes
    streamOutput.addEventListener('stream-end', () => {
      sources.setAttribute(
        'sources',
        JSON.stringify([
          { title: 'Elementum Documentation', url: 'https://elementum-sage.vercel.app/docs.html', domain: 'elementum-sage.vercel.app' },
          { title: 'GitHub Repository', url: 'https://github.com/pinguxx/Elementum', domain: 'github.com' }
        ])
      );
      sources.style.display = 'block';
    }, { once: true });

  } catch (err) {
    if (err.name !== 'AbortError') {
      responseCard.style.display = 'block';
      streamOutput.setAttribute('text', 'An error occurred while generating response.');
    }
  }
});

function sleep(ms, abortSignal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    abortSignal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
