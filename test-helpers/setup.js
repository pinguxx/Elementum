import { GlobalWindow } from 'happy-dom';

const window = new GlobalWindow({ url: 'http://localhost' });

globalThis.window = window;
globalThis.document = window.document;
globalThis.Document = window.Document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.customElements = window.customElements;
globalThis.DocumentFragment = window.DocumentFragment;
globalThis.NodeFilter = window.NodeFilter;
globalThis.CSSStyleSheet = window.CSSStyleSheet;
globalThis.MutationObserver = window.MutationObserver;
globalThis.CustomEvent = window.CustomEvent;
globalThis.Event = window.Event;
globalThis.MouseEvent = window.MouseEvent;
globalThis.PointerEvent = window.PointerEvent || window.MouseEvent;
globalThis.KeyboardEvent = window.KeyboardEvent;
globalThis.localStorage = window.localStorage;
