#!/usr/bin/env node
/**
 * Generates `@wcomp/elementum/react` wrapper entrypoints (`src/react/index.js` and
 * `src/react/index.d.ts`) directly from `custom-elements.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cemPath = path.join(rootDir, 'custom-elements.json');
const outJsPath = path.join(rootDir, 'src', 'react', 'index.js');
const outDtsPath = path.join(rootDir, 'src', 'react', 'index.d.ts');

const COMPOUND_EVENT_NAMES = {
  selectionchange: 'onSelectionChange',
  tabchange: 'onTabChange',
  pagechange: 'onPageChange',
  themechange: 'onThemeChange',
};

function toReactEventProp(eventName) {
  const lower = String(eventName || '').toLowerCase();
  if (COMPOUND_EVENT_NAMES[lower]) return COMPOUND_EVENT_NAMES[lower];
  const camel = lower.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
  return `on${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

function formatAttrProp(attr) {
  const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(attr.name) ? attr.name : `'${attr.name}'`;
  const typeText = attr.type?.text || 'string';
  return `  ${safeName}?: ${typeText};`;
}

const cem = JSON.parse(fs.readFileSync(cemPath, 'utf8'));
const declarations = (cem.modules || [])
  .flatMap((m) => m.declarations || [])
  .filter((d) => d.kind === 'class' && d.tagName && d.name);

const jsExports = [];
const tagEntries = [];
const dtsBlocks = [];

for (const decl of declarations) {
  const eventEntries = (decl.events || [])
    .filter((ev) => ev.name && ev.name !== 'click')
    .map((ev) => [toReactEventProp(ev.name), ev.name]);

  const eventMapLiteral = eventEntries.length > 0
    ? `{ ${eventEntries.map(([k, v]) => `${k}: '${v}'`).join(', ')} }`
    : '{}';

  jsExports.push(
    `export const ${decl.name} = createElementumReactComponent(React, '${decl.tagName}', ${eventMapLiteral});`
  );
  tagEntries.push(`  '${decl.tagName}',`);

  const attrLines = (decl.attributes || []).map(formatAttrProp);
  const eventLines = eventEntries.map(
    ([propName]) => `  ${propName}?: (event: CustomEvent<any> & Event) => void;`
  );
  const attrBody = attrLines.join('\n');
  const eventBody = eventLines.join('\n');
  const propsInterface = `${decl.name}Props`;

  const attrsType = attrBody ? `{\n${attrBody}\n}` : '{}';
  const eventsType = eventBody ? `{\n${eventBody}\n}` : '{}';

  dtsBlocks.push(
    `export type ${propsInterface} = ElementumComponentProps<ElementFor<'${decl.tagName}'>, ${attrsType}, ${eventsType}>;\nexport declare const ${decl.name}: ElementumReactComponent<${propsInterface}>;`
  );
}

const jsContent = `/**
 * Auto-generated React wrappers for all ${declarations.length} @wcomp/elementum Web Components.
 * Generated from custom-elements.json via tools/generate-react-wrappers.js.
 */

import React from 'react';
import '../index.js';
import { createElementumReactComponent } from './runtime.js';

export { createElementumReactComponent } from './runtime.js';

export const ELEMENTUM_REACT_TAGS = Object.freeze([
${tagEntries.join('\n')}
]);

${jsExports.join('\n')}
`;

const dtsContent = `/**
 * Auto-generated strict TypeScript definitions for @wcomp/elementum/react (${declarations.length} components).
 * Self-contained React-compatible types (no @types/react dependency required).
 */

import '../index.js';

export type ElementFor<Tag extends string> = Tag extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[Tag]
  : HTMLElement;

export type ReactRef<T> = ((instance: T | null) => void) | { current: T | null } | null;

type UnwrapSignal<T> = T extends { value: infer V; peek: () => any } ? V : never;

type SignalPropKeys<E> = {
  [K in keyof E]-?: E[K] extends { value: any; peek: () => any } ? K : never;
}[keyof E];

export type ElementSignalProps<E> = {
  [K in SignalPropKeys<E>]?: UnwrapSignal<E[K]>;
};

export interface ElementumReactBaseProps<E extends HTMLElement = HTMLElement> {
  key?: string | number | null;
  id?: string;
  name?: string;
  form?: string;
  className?: string;
  style?: string | Record<string, string | number | undefined>;
  slot?: string;
  part?: string;
  exportparts?: string;
  role?: string;
  title?: string;
  tabIndex?: number;
  hidden?: boolean;
  unstyled?: boolean;
  draggable?: boolean;
  spellCheck?: boolean;
  dir?: 'ltr' | 'rtl' | 'auto';
  lang?: string;
  children?: unknown;
  ref?: ReactRef<E>;
  [dataAttr: \`data-\${string}\`]: string | number | boolean | undefined;
  [ariaAttr: \`aria-\${string}\`]: string | number | boolean | undefined;
  onChange?: (event: CustomEvent<any> & Event) => void;
  onInput?: (event: CustomEvent<any> & Event) => void;
  onSelect?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
  onClick?: (event: MouseEvent) => void;
  onDoubleClick?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onKeyPress?: (event: KeyboardEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onMouseUp?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onPointerDown?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onSubmit?: (event: Event) => void;
  onReset?: (event: Event) => void;
}

export type ElementumComponentProps<
  E extends HTMLElement,
  Attrs extends Record<string, any> = {},
  Events extends Record<string, any> = {}
> = Omit<ElementumReactBaseProps<E>, keyof Attrs | keyof Events> &
  Omit<ElementSignalProps<E>, keyof Attrs | keyof Events> & {
    [K in keyof Attrs]?: K extends keyof ElementSignalProps<E>
      ? Attrs[K] | ElementSignalProps<E>[K]
      : Attrs[K];
  } & Events;

export interface ElementumReactComponent<P = ElementumReactBaseProps> {
  (props: P): any;
  displayName?: string;
}

export declare function createElementumReactComponent<
  E extends HTMLElement = HTMLElement,
  P extends ElementumReactBaseProps<E> = ElementumReactBaseProps<E>
>(
  React: unknown,
  tagName: string,
  eventMap?: Record<string, string>
): ElementumReactComponent<P>;

export declare const ELEMENTUM_REACT_TAGS: readonly string[];

${dtsBlocks.join('\n\n')}
`;

fs.mkdirSync(path.dirname(outJsPath), { recursive: true });
fs.writeFileSync(outJsPath, jsContent, 'utf8');
fs.writeFileSync(outDtsPath, dtsContent, 'utf8');
console.log(`Generated @wcomp/elementum/react wrappers (${declarations.length} components) -> src/react/index.js & index.d.ts`);
