/**
 * @wc/elementum TypeScript Declarations
 * Fine-grained reactive Web Component framework & design system.
 */

export interface AbortableOptions {
  signal?: AbortSignal;
}

// ==========================================
// Signal Reactivity Primitives
// ==========================================

export class Signal<T = any> {
  constructor(initialValue: T);
  get value(): T;
  set value(newValue: T);
  peek(): T;
  valueOf(): T;
  toString(): string;
  toUpperCase(): string;
  toLowerCase(): string;
  trim(): string;
  slice(start?: number, end?: number): string;
  substring(start: number, end?: number): string;
  includes(searchString: string, position?: number): boolean;
  indexOf(searchString: string, position?: number): number;
  startsWith(searchString: string, position?: number): boolean;
  endsWith(searchString: string, position?: number): boolean;
  get length(): number;
  [Symbol.toPrimitive](hint: string): string | number;
}

export function signal<T>(initialValue: T): Signal<T>;
export function isSignal(val: any): val is Signal<any>;

export class Computed<T = any> extends Signal<T> {
  constructor(getter: () => T);
}

export function computed<T>(getter: () => T): Computed<T>;
export function effect(fn: () => void, options?: AbortableOptions): () => void;

// ==========================================
// Template & CSS Engine
// ==========================================

export class CSSResult {
  readonly cssText: string;
  readonly sheet: CSSStyleSheet | null;
}

export class TemplateResult {
  readonly strings: TemplateStringsArray;
  readonly values: any[];
}

export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult;
export function css(strings: TemplateStringsArray, ...values: any[]): CSSResult;
export function render(result: TemplateResult, container: HTMLElement | ShadowRoot, signal?: AbortSignal): void;

// ==========================================
// Elementum Base Class
// ==========================================

export class Elementum extends HTMLElement {
  static shadowRoot: boolean;
  static formAssociated: boolean;
  static styles: CSSResult | CSSResult[] | null;
  static observedAttributes: string[];

  internals: ElementInternals | null;
  root: HTMLElement | ShadowRoot;

  get signal(): AbortSignal | undefined;
  get validity(): ValidityState | undefined;
  get validationMessage(): string;
  get willValidate(): boolean;

  checkValidity(): boolean;
  reportValidity(): boolean;
  setValidity(flags?: Partial<ValidityStateFlags>, message?: string, anchor?: HTMLElement): void;
  setCustomValidity(message?: string): void;

  connected(): void;
  rendered(): void;
  disconnected(): void;
  attributeChanged(name: string, oldValue: string | null, newValue: string | null): void;
  formReset(): void;
  formDisabled?(disabled: boolean): void;

  setFormValue(value: File | string | FormData | null): void;
  emit<T = any>(eventName: string, detail?: T, options?: CustomEventInit<T>): boolean;
  render(): TemplateResult | void;
}

// ==========================================
// Component Primitives
// ==========================================

export class ElButton extends Elementum {
  variant: Signal<'primary' | 'secondary' | 'danger' | 'ghost'>;
  size: Signal<'sm' | 'md' | 'lg'>;
  disabled: Signal<boolean>;
  loading: Signal<boolean>;
  type: Signal<'button' | 'submit' | 'reset'>;
}

export class ElBadge extends Elementum {
  variant: Signal<'default' | 'success' | 'danger'>;
  count: Signal<string | number>;
}

export class ElInput extends Elementum {
  value: Signal<string>;
  placeholder: Signal<string>;
  disabled: Signal<boolean>;
  readonly: Signal<boolean>;
  required: Signal<boolean>;
  pattern: Signal<string>;
  minlength: Signal<number>;
  type: Signal<string>;
  size: Signal<'sm' | 'md' | 'lg'>;
  validate(): boolean;
}

export class ElDropdown extends Elementum {
  isOpen: Signal<boolean>;
  placement: Signal<'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'>;
  open(): void;
  close(): void;
  toggle(): void;
}

export class ElCalendar extends Elementum {
  value: Signal<string>;
  viewYear: Signal<number>;
  viewMonth: Signal<number>;
  selectDate(isoDate: string): void;
}

export class ElDatepicker extends Elementum {
  value: Signal<string>;
  placeholder: Signal<string>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  validate(): boolean;
}

export class ElDialog extends Elementum {
  isOpen: Signal<boolean>;
  dialogTitle: Signal<string>;
  showModal(): void;
  close(returnValue?: string): void;
}

export class ElTab extends Elementum {
  label: Signal<string>;
  value: Signal<string>;
}

export class ElTabs extends Elementum {
  activeTab: Signal<string>;
  selectTab(val: string): void;
}

export class ElSelect extends Elementum {
  value: Signal<string>;
  placeholder: Signal<string>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  name: Signal<string>;
  validate(): boolean;
}

export class ElSwitch extends Elementum {
  checked: Signal<boolean>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  name: Signal<string>;
  value: Signal<string>;
  size: Signal<'sm' | 'md' | 'lg'>;
  toggle(): void;
  validate(): boolean;
}

export class ElTooltip extends Elementum {
  content: Signal<string>;
  placement: Signal<'top' | 'bottom' | 'left' | 'right'>;
  delay: Signal<number>;
  disabled: Signal<boolean>;
  visible: Signal<boolean>;
  show(): void;
  hide(): void;
}

export class ElAccordionItem extends Elementum {
  itemTitle: Signal<string>;
  value: Signal<string>;
  isOpen: Signal<boolean>;
  disabled: Signal<boolean>;
  toggle(): void;
}

export class ElAccordion extends Elementum {
  multiple: Signal<boolean>;
}

export interface TableColumn {
  key: string;
  label?: string;
  sortable?: boolean;
  width?: string;
}

export class ElTable extends Elementum {
  data: Signal<Record<string, any>[]>;
  columns: Signal<TableColumn[]>;
  selectable: Signal<boolean>;
  selected: Signal<number[]>;
  sortKey: Signal<string>;
  sortDirection: Signal<'asc' | 'desc' | ''>;
  sortBy(key: string): void;
  toggleSelectAll(): void;
  toggleRow(index: number): void;
  isRowSelected(index: number): boolean;
}

export class ElThemeSwitch extends Elementum {
  theme: Signal<'light' | 'dark'>;
  toggle(): void;
  setTheme(theme: 'light' | 'dark'): void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'danger' | 'warning';
  duration: number;
}

export interface ToastManager {
  toasts: Signal<ToastItem[]>;
  show(message: string, type?: ToastItem['type'], duration?: number): string;
  info(msg: string, dur?: number): string;
  success(msg: string, dur?: number): string;
  error(msg: string, dur?: number): string;
  warning(msg: string, dur?: number): string;
  dismiss(id: string): void;
}

export const toast: ToastManager;

export class ElToaster extends Elementum {}

export class ElProgress extends Elementum {
  value: Signal<number>;
  max: Signal<number>;
  variant: Signal<'primary' | 'success' | 'danger'>;
  size: Signal<'sm' | 'md' | 'lg'>;
  indeterminate: Signal<boolean>;
  striped: Signal<boolean>;
}

export class ElSpinner extends Elementum {
  size: Signal<'sm' | 'md' | 'lg'>;
  variant: Signal<'primary' | 'muted' | 'white'>;
  label: Signal<string>;
}

export class ElAvatar extends Elementum {
  src: Signal<string>;
  alt: Signal<string>;
  name: Signal<string>;
  size: Signal<'sm' | 'md' | 'lg'>;
  shape: Signal<'circle' | 'square'>;
  status: Signal<'online' | 'offline' | 'busy' | 'away' | ''>;
}

export class ElAvatarGroup extends Elementum {}

export class ElDrawer extends Elementum {
  isOpen: Signal<boolean>;
  placement: Signal<'left' | 'right' | 'top' | 'bottom'>;
  titleText: Signal<string>;
  show(): void;
  close(): void;
}

export class ElSegmentedControl extends Elementum {
  value: Signal<string>;
  disabled: Signal<boolean>;
  size: Signal<'sm' | 'md' | 'lg'>;
  name: Signal<string>;
  selectOption(val: string): void;
}

// ==========================================
// SSR (Declarative Shadow DOM)
// ==========================================

export function renderTemplateToString(templateResult: TemplateResult | any): string;
export function renderComponentToDSD(
  tagName: string,
  ComponentClass: any,
  attributes?: Record<string, any>,
  lightDOMChildren?: string
): string;

// ==========================================
// DOM & JSX Global Typings
// ==========================================

declare global {
  interface HTMLElementTagNameMap {
    'el-button': ElButton;
    'el-badge': ElBadge;
    'el-input': ElInput;
    'el-dropdown': ElDropdown;
    'el-calendar': ElCalendar;
    'el-datepicker': ElDatepicker;
    'el-dialog': ElDialog;
    'el-tabs': ElTabs;
    'el-tab': ElTab;
    'el-select': ElSelect;
    'el-switch': ElSwitch;
    'el-tooltip': ElTooltip;
    'el-accordion': ElAccordion;
    'el-accordion-item': ElAccordionItem;
    'el-table': ElTable;
    'el-theme-switch': ElThemeSwitch;
    'el-toaster': ElToaster;
    'el-progress': ElProgress;
    'el-spinner': ElSpinner;
    'el-avatar': ElAvatar;
    'el-avatar-group': ElAvatarGroup;
    'el-drawer': ElDrawer;
    'el-segmented-control': ElSegmentedControl;
  }

  namespace JSX {
    interface IntrinsicElements {
      'el-button': any;
      'el-badge': any;
      'el-input': any;
      'el-dropdown': any;
      'el-calendar': any;
      'el-datepicker': any;
      'el-dialog': any;
      'el-tabs': any;
      'el-tab': any;
      'el-select': any;
      'el-switch': any;
      'el-tooltip': any;
      'el-accordion': any;
      'el-accordion-item': any;
      'el-table': any;
      'el-theme-switch': any;
      'el-toaster': any;
      'el-progress': any;
      'el-spinner': any;
      'el-avatar': any;
      'el-avatar-group': any;
      'el-drawer': any;
      'el-segmented-control': any;
    }
  }
}
