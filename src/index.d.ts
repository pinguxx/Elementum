/**
 * @wcomp/elementum TypeScript Declarations
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
  readonly error: unknown;
}

export class NotReadyError extends Error {
  constructor(message?: string);
}

export interface AsyncErrorDetails {
  message: string;
  name: string;
  cause: unknown;
  status?: number;
  timestamp: number;
  attempt: number;
}

export type AsyncSignalStatus = 'idle' | 'pending' | 'resolved' | 'errored';

export class AsyncSignal<T = any> extends Signal<T | undefined> {
  readonly pending: Signal<boolean>;
  readonly status: Signal<AsyncSignalStatus>;
  readonly error: Signal<AsyncErrorDetails | null>;
  readonly latest: T | undefined;
  read(): T;
  refetch(): void;
  abort(): void;
  mutate(nextValue: T): void;
  dispose(): void;
}

export function computed<T>(getter: () => T): Computed<T>;
export function effect(
  fn: () => void,
  options?: AbortableOptions & { onError?: (err: unknown) => void }
): () => void;
export function batch<T>(fn: () => T): T;
export function asyncSignal<T>(
  fetcher: (abortSignal: AbortSignal) => Promise<T> | T,
  options?: AbortableOptions & {
    initialValue?: T;
    immediate?: boolean;
    onError?: (err: AsyncErrorDetails) => void;
  }
): AsyncSignal<T>;
export function isPending(source: AsyncSignal<any> | (() => unknown)): boolean;

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
  get form(): HTMLFormElement | ElForm | null;
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
  open: boolean;
  isOpen: Signal<boolean>;
  dialogTitle: Signal<string>;
  show(): void;
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

export class ElPagination extends Elementum {
  page: Signal<number>;
  total: Signal<number>;
  pageSize: Signal<number>;
  siblingCount: Signal<number>;
  totalPages: Computed<number>;
  setPage(p: number): void;
  next(): void;
  prev(): void;
}

export class ElChip extends Elementum {
  variant: Signal<'primary' | 'success' | 'danger' | 'warning' | 'muted'>;
  size: Signal<'sm' | 'md'>;
  removable: Signal<boolean>;
  selectable: Signal<boolean>;
  selected: Signal<boolean>;
  value: Signal<string>;
  disabled: Signal<boolean>;
  toggleSelected(): void;
}

export class ElAutocomplete extends Elementum {
  name: Signal<string>;
  value: Signal<string | number | any[]>;
  displayLabel: Signal<string>;
  placeholder: Signal<string>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  multiple: Signal<boolean>;
  url: Signal<string>;
  queryParam: Signal<string>;
  debounce: Signal<number>;
  minChars: Signal<number>;
  labelKey: Signal<string>;
  valueKey: Signal<string>;
  size: Signal<'sm' | 'md' | 'lg'>;
  data: Signal<any[]>;
  suggestions: Signal<any[]>;
  isOpen: Signal<boolean>;
  isLoading: Signal<boolean>;
  activeIndex: Signal<number>;
  selectedItem: Signal<any>;
  selectedItems: Signal<any[]>;
  setData(items: any[]): void;
  search(query: string): Promise<void>;
  select(item: any): void;
  removeItem(index: number): void;
  clear(): void;
  open(): void;
  close(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
}

export class ElNumberFlow extends Elementum {
  value: Signal<number | string>;
  format: Signal<string>;
  // Compatible with Element.prototype.prefix (string | null) and Signal<string>
  prefix: any;
  suffix: Signal<string>;
  duration: Signal<number>;
  animated: Signal<boolean>;
  locale: Signal<string>;
}

export class ElOtpInput extends Elementum {
  length: Signal<number>;
  value: Signal<string>;
  type: Signal<'text' | 'password'>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  // Compatible with HTMLElement.prototype.autofocus (boolean) and Signal<boolean>
  autofocus: any;
  focus(): void;
  blur(): void;
  clear(): void;
}

export class ElCommand extends Elementum {
  open: Signal<boolean>;
  query: Signal<string>;
  placeholder: Signal<string>;
  shortcut: Signal<string>;
  toggle(): void;
  show(): void;
  close(): void;
}

export class ElCommandGroup extends Elementum {
  heading: Signal<string>;
}

export class ElCommandItem extends Elementum {
  value: Signal<string>;
  shortcut: Signal<string>;
  disabled: Signal<boolean>;
  active: Signal<boolean>;
}

export class ElPromptInput extends Elementum {
  value: Signal<string>;
  placeholder: Signal<string>;
  disabled: Signal<boolean>;
  loading: Signal<boolean>;
  maxRows: Signal<number>;
  minRows: Signal<number>;
  clearOnSubmit: Signal<boolean>;
  submit(): void;
  focus(): void;
  blur(): void;
}

export class ElReasoningCard extends Elementum {
  open: Signal<boolean>;
  thinking: Signal<boolean>;
  duration: Signal<string>;
  summary: Signal<string>;
  toggle(): void;
}

export class ElBorderBeam extends Elementum {
  size: Signal<number>;
  duration: Signal<number>;
  colorFrom: Signal<string>;
  colorTo: Signal<string>;
  borderWidth: Signal<number>;
  reverse: Signal<boolean>;
}

export class ElStreamingText extends Elementum {
  text: Signal<string>;
  displayedText: Signal<string>;
  speed: Signal<number>;
  showCursor: Signal<boolean>;
  isStreaming: Signal<boolean>;
  isComplete: Signal<boolean>;
  start(): void;
  pause(): void;
  resume(): void;
  finish(): void;
}

export class ElChart extends Elementum {
  type: Signal<'area' | 'line' | 'bar'>;
  xKey: Signal<string>;
  yKey: Signal<string>;
  secondaryKey: Signal<string>;
  height: Signal<number>;
  showGrid: Signal<boolean>;
  showDots: Signal<boolean>;
  data: Record<string, any>[];
}

export class ElField extends Elementum {
  label: Signal<string>;
  description: Signal<string>;
  error: Signal<string>;
  required: Signal<boolean>;
  disabled: Signal<boolean>;
  invalid: Signal<boolean>;
}

export class ElNumberField extends Elementum {
  value: Signal<number>;
  min: Signal<number>;
  max: Signal<number>;
  step: Signal<number>;
  precision: Signal<number>;
  scrub: Signal<boolean>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  stepUp(multiplier?: number): void;
  stepDown(multiplier?: number): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
}

export class ElSlider extends Elementum {
  value: Signal<number>;
  min: Signal<number>;
  max: Signal<number>;
  step: Signal<number>;
  orientation: Signal<'horizontal' | 'vertical'>;
  disabled: Signal<boolean>;
}

export class ElPopover extends Elementum {
  isOpen: Signal<boolean>;
  placement: Signal<string>;
  offset: Signal<number>;
  hasArrow: Signal<boolean>;
  open(): void;
  close(): void;
  toggle(): void;
}

export class ElCollapsible extends Elementum {
  isOpen: Signal<boolean>;
  disabled: Signal<boolean>;
  open(): void;
  close(): void;
  toggle(): void;
}

export class ElScrollArea extends Elementum {
  type: Signal<'auto' | 'always' | 'hover'>;
  maxHeight: Signal<string>;
  maxWidth: Signal<string>;
}

export class ElToggle extends Elementum {
  isPressed: Signal<boolean>;
  disabled: Signal<boolean>;
  value: Signal<string>;
  size: Signal<string>;
  toggle(): void;
}

export class ElToggleGroup extends Elementum {
  type: Signal<'single' | 'multiple'>;
  value: Signal<string>;
  disabled: Signal<boolean>;
}

export class ElCheckbox extends Elementum {
  checked: Signal<boolean>;
  indeterminate: Signal<boolean>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  value: Signal<string>;
  toggle(): void;
}

export class ElRadio extends Elementum {
  value: Signal<string>;
  disabled: Signal<boolean>;
  checked: Signal<boolean>;
  select(): void;
}

export class ElRadioGroup extends Elementum {
  value: Signal<string>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  orientation: Signal<string>;
  selectValue(val: string): void;
}

export class ElPreviewCard extends Elementum {
  isOpen: Signal<boolean>;
  openDelay: Signal<number>;
  closeDelay: Signal<number>;
  placement: Signal<string>;
  open(): void;
  close(): void;
}

export class ElAlertDialog extends Elementum {
  isOpen: Signal<boolean>;
  heading: Signal<string>;
  open(): void;
  close(): void;
  showModal(): void;
}

export class ElSeparator extends Elementum {
  orientation: Signal<'horizontal' | 'vertical'>;
  decorative: Signal<boolean>;
}

export class ElMeter extends Elementum {
  value: Signal<number>;
  min: Signal<number>;
  max: Signal<number>;
  low: Signal<number | null>;
  high: Signal<number | null>;
  optimum: Signal<number | null>;
  size: Signal<'sm' | 'md' | 'lg'>;
}

export class ElToolbar extends Elementum {
  orientation: Signal<'horizontal' | 'vertical'>;
  disabled: Signal<boolean>;
}

export class ElContextMenu extends Elementum {
  isOpen: Signal<boolean>;
  disabled: Signal<boolean>;
  open(x?: number, y?: number): void;
  close(): void;
  toggle(x?: number, y?: number): void;
}

export class ElMenubar extends Elementum {
  activeMenu: Signal<HTMLElement | null>;
  disabled: Signal<boolean>;
  openMenu(item: HTMLElement): void;
  closeMenu(): void;
}

export class ElSkeleton extends Elementum {
  variant: Signal<'text' | 'circular' | 'rectangular'>;
  animation: Signal<'pulse' | 'wave' | 'none'>;
  width: Signal<string>;
  height: Signal<string>;
}

export class ElBreadcrumb extends Elementum {
  separator: Signal<string>;
}

export class ElBreadcrumbItem extends Elementum {
  href: Signal<string | null>;
  current: Signal<boolean>;
}

export class ElKbd extends Elementum {
  keys: Signal<string[]>;
  size: Signal<'sm' | 'md' | 'lg'>;
}

export class ElAlert extends Elementum {
  variant: Signal<'default' | 'info' | 'success' | 'warning' | 'destructive'>;
  alertTitle: Signal<string>;
  dismissible: Signal<boolean>;
  isDismissed: Signal<boolean>;
  dismiss(): void;
}

export class ElCard extends Elementum {
  hoverable: Signal<boolean>;
}

export class ElCardHeader extends Elementum {}
export class ElCardTitle extends Elementum {}
export class ElCardDescription extends Elementum {}
export class ElCardContent extends Elementum {}
export class ElCardFooter extends Elementum {}

export class ElAspectRatio extends Elementum {
  ratio: Signal<string>;
}

export class ElTextarea extends Elementum {
  value: Signal<string>;
  placeholder: Signal<string>;
  rows: Signal<number>;
  autoResize: Signal<boolean>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  maxlength: Signal<number | null>;
  focus(): void;
  blur(): void;
}

export class ElResizable extends Elementum {
  direction: Signal<'horizontal' | 'vertical'>;
  size: Signal<number>;
  min: Signal<number>;
  max: Signal<number>;
  disabled: Signal<boolean>;
  setSize(val: number): void;
}

export class ElCarousel extends Elementum {
  currentIndex: Signal<number>;
  totalSlides: Signal<number>;
  loop: Signal<boolean>;
  autoPlay: Signal<boolean>;
  interval: Signal<number>;
  next(): void;
  prev(): void;
  goTo(index: number): void;
}

export class ElCarouselSlide extends Elementum {}

export class ElTimeline extends Elementum {
  orientation: Signal<'vertical' | 'horizontal'>;
}

export class ElTimelineItem extends Elementum {
  status: Signal<'default' | 'active' | 'success' | 'warning' | 'destructive'>;
  date: Signal<string>;
}

export class ElTreeView extends Elementum {}

export class ElTreeItem extends Elementum {
  label: Signal<string>;
  expanded: Signal<boolean>;
  selected: Signal<boolean>;
  disabled: Signal<boolean>;
  hasChildren: Signal<boolean>;
  toggle(e?: Event): void;
  select(): void;
}

export class ElEmptyState extends Elementum {
  emptyTitle: Signal<string>;
  description: Signal<string>;
}

export class ElRating extends Elementum {
  value: Signal<number>;
  max: Signal<number>;
  readonly: Signal<boolean>;
  disabled: Signal<boolean>;
  hoverValue: Signal<number>;
  setValue(val: number): void;
}

export class ElDropzone extends Elementum {
  accept: Signal<string>;
  maxSize: Signal<number | null>;
  multiple: Signal<boolean>;
  disabled: Signal<boolean>;
  isDragOver: Signal<boolean>;
  selectedFiles: Signal<File[]>;
  openFileDialog(): void;
}

export class ElSidebar extends Elementum {
  collapsed: Signal<boolean>;
  collapsible: Signal<'offcanvas' | 'icon' | 'none'>;
  side: Signal<'left' | 'right'>;
  toggle(): void;
  collapse(): void;
  expand(): void;
}

export class ElSidebarHeader extends Elementum {}
export class ElSidebarContent extends Elementum {}
export class ElSidebarFooter extends Elementum {}
export class ElSidebarTrigger extends Elementum {}

export class ElForm extends Elementum {
  get form(): HTMLFormElement | null;
  get elements(): HTMLElement[];
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  requestSubmit(): void;
  toFormData(): FormData;
  getFormData(): Record<string, any>;
  getData(): Record<string, any>;
  reset(): void;
}

export class ElFieldset extends Elementum {
  legend: Signal<string>;
  disabled: Signal<boolean>;
}

export class ElCallout extends Elementum {}
export class ElCheckboxCard extends Elementum {}
export class ElCodeBlock extends Elementum {}
export class ElDataList extends Elementum {}
export class ElDataListItem extends Elementum {}
export class ElDiffViewer extends Elementum {}
export class ElInset extends Elementum {}
export class ElInsightCard extends Elementum {}
export class ElNavbar extends Elementum {}
export class ElNavigationMenu extends Elementum {}
export class ElNavigationMenuItem extends Elementum {}
export class ElNavigationMenuTrigger extends Elementum {}
export class ElNavigationMenuContent extends Elementum {}
export class ElRadioCard extends Elementum {}
export class ElRadioCardGroup extends Elementum {}
export class ElResizableHandle extends Elementum {}
export class ElResizablePanel extends Elementum {}
export class ElRoute extends Elementum {}
export class ElRouteLink extends Elementum {}
export class ElRouter extends Elementum {}
export class ElSources extends Elementum {}
export class ElTaskList extends Elementum {}
export class ElToolCall extends Elementum {}
export class ElVisuallyHidden extends Elementum {}

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
// AG-UI Protocol Adapter
// ==========================================

export function getByPointer(obj: any, pointer: string): any;
export function applyJsonPatch<T = any>(target: T, patch?: Array<{ op: 'add' | 'replace' | 'remove'; path: string; value?: any }>): T;
export function createAgUiStore<T extends Record<string, any> = Record<string, any>>(initialState?: T): {
  state: Signal<T>;
  status: Signal<'idle' | 'running' | 'finished' | 'error'>;
  runId: Signal<string>;
  stepName: Signal<string>;
  thinking: Signal<boolean>;
  thinkingText: Signal<string>;
  currentText: Signal<string>;
  messages: Signal<any[]>;
  toolCalls: Signal<any[]>;
  error: Signal<string | null>;
  events: Signal<any[]>;
  dispatch: (event: any) => void;
  pathSignal: <V = any>(pointer: string, fallback?: V) => Signal<V>;
  onEvent: (listener: (event: any) => void) => () => void;
  bindComponents: (bindings?: Record<string, any>) => () => void;
  connectSSE: (source: Response | ReadableStream | AsyncIterable<any>) => Promise<void>;
};

// ==========================================
// Behavior Controllers (React-Aria-Inspired)
// ==========================================

export function setHostState(host: Element, name: string, active: boolean): void;
export function isRTL(el?: Element | null): boolean;
export function formatLocaleNumber(value: number | string, locale?: string, options?: Intl.NumberFormatOptions): string;
export function formatLocaleDate(date: Date | number | string, locale?: string, options?: Intl.DateTimeFormatOptions): string;
export function announce(message: string, politeness?: 'polite' | 'assertive'): void;
export function clearAnnouncer(): void;
export function createPressBehavior(
  host: Element,
  target?: EventTarget,
  options?: { isDisabled?: () => boolean; onPress?: (e: Event) => void; signal?: AbortSignal }
): () => void;
export function createRovingFocus(
  host: Element,
  options?: {
    getItems: () => HTMLElement[];
    orientation?: 'horizontal' | 'vertical' | 'both' | (() => 'horizontal' | 'vertical' | 'both');
    loop?: boolean;
    typeahead?: boolean;
    onFocusItem?: (el: HTMLElement, index: number) => void;
    signal?: AbortSignal;
  }
): () => void;
export function createDismissableLayer(
  host: Element,
  options?: {
    isOpen?: () => boolean;
    onDismiss: (reason: 'escape' | 'outside-click', event: Event) => void;
    closeOnEscape?: boolean;
    closeOnOutsideClick?: boolean;
    signal?: AbortSignal;
  }
): () => void;
export function createSelectionBehavior<K = string>(options?: {
  mode?: 'single' | 'multiple' | 'none';
  getKeys?: () => K[];
  initialKeys?: K[];
  disabledKeys?: K[];
  onSelectionChange?: (selected: Set<K>) => void;
}): {
  selectedKeys: Signal<Set<K>>;
  isSelected: (key: K) => boolean;
  select: (key: K, opts?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; toggle?: boolean }) => void;
  toggle: (key: K) => void;
  selectRange: (fromKey: K, toKey: K) => void;
  selectAll: () => void;
  clear: () => void;
};
export function createReorderBehavior(
  host: Element,
  options: {
    getItems: () => HTMLElement[];
    orientation?: 'vertical' | 'horizontal';
    onReorder: (detail: { fromIndex: number; toIndex: number; item: HTMLElement }) => void;
    signal?: AbortSignal;
  }
): () => void;
export function splitMatchSegments(text: string, query: string): Array<{ text: string; match: boolean }>;
export function highlightMatch(text: string, query: string): string | Array<string | TemplateResult>;
export function prefersReducedMotion(options?: { signal?: AbortSignal }): Signal<boolean> & { dispose(): void };
export type PresenceStatus = 'unmounted' | 'entering' | 'entered' | 'exiting';
export function createPresenceBehavior(
  target: Element | (() => Element | null),
  options?: {
    initialOpen?: boolean;
    respectReducedMotion?: boolean;
    onEnterComplete?: () => void;
    onExitComplete?: () => void;
    signal?: AbortSignal;
  }
): {
  status: Signal<PresenceStatus>;
  mounted: Signal<boolean>;
  setOpen: (open: boolean) => void;
  destroy: () => void;
};
export function createFocusRecovery(
  container: Element | ShadowRoot,
  options: {
    fallback: () => HTMLElement | null;
    signal?: AbortSignal;
  }
): {
  recover: () => boolean;
  destroy: () => void;
};
export function createShortcuts(
  target: EventTarget,
  shortcuts: Record<string, (e: KeyboardEvent) => void>,
  options?: {
    ignoreInputs?: boolean;
    preventDefault?: boolean;
    isMac?: boolean;
    signal?: AbortSignal;
  }
): () => void;
export function createDisclosureBehavior(
  trigger: HTMLElement,
  panel: HTMLElement,
  options?: {
    initialOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    signal?: AbortSignal;
  }
): {
  isOpen: Signal<boolean>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  destroy: () => void;
};
export function createPopupPositioner(
  anchor: HTMLElement,
  floating: HTMLElement,
  options?: {
    placement?: 'bottom' | 'top' | 'left' | 'right';
    offset?: number;
    flip?: boolean;
    signal?: AbortSignal;
  }
): {
  update: () => { side: string; top: number; left: number; availableHeight?: number };
  destroy: () => void;
};
export function createHistory<T>(
  initialState: T,
  options?: { limit?: number }
): {
  state: Signal<T>;
  past: Signal<T[]>;
  future: Signal<T[]>;
  canUndo: Signal<boolean>;
  canRedo: Signal<boolean>;
  push: (nextState: T) => void;
  undo: () => boolean;
  redo: () => boolean;
  reset: (nextInitial?: T) => void;
};

// Agent Runtime Bridge (@wcomp/elementum/agent)
export interface AgentSnapshotNode {
  ref: string;
  tag: string;
  role: string;
  name: string;
  value?: string | number;
  state: Record<string, boolean | string>;
  actions: string[];
  warnings?: string[];
}
export function snapshot(
  root?: Element | Document | ShadowRoot | null,
  options?: { includeShadow?: boolean; maxNodes?: number }
): { nodes: AgentSnapshotNode[]; count: number; warnings: string[] };
export function act(
  root: Element | Document | ShadowRoot,
  command: {
    ref?: string;
    selector?: string;
    role?: string;
    name?: string;
    index?: number;
    strict?: boolean;
    action: 'click' | 'toggle' | 'type' | 'fill' | 'open' | 'close' | 'focus' | 'press' | string;
    value?: unknown;
    key?: string;
  },
  options?: {
    guard?: (ctx: { element: Element; action: string; command: Record<string, unknown> }) => boolean;
  }
): {
  ok: boolean;
  blocked?: boolean;
  stale?: boolean;
  disabled?: boolean;
  ambiguous?: boolean;
  matchCount?: number;
  matches?: string[];
  action?: string;
  tag?: string;
  value?: unknown;
  state?: Record<string, boolean | string>;
  error?: string;
};
export function registerWebMCP(
  root?: Element | Document | ShadowRoot | null,
  options?: {
    prefix?: string;
    guard?: (ctx: { element: Element; action: string; command: Record<string, unknown> }) => boolean;
    modelContext?: unknown;
  }
): { registered: boolean; tools?: string[]; unregister: () => void };

// WAI-ARIA, RTL, SSR & Declarative Component Testing (@wcomp/elementum/testing)
export type AriaPattern = 'button' | 'checkbox' | 'switch' | 'dialog' | 'tabs' | 'accordion' | 'combobox' | 'slider' | 'progressbar';
export function checkAriaPattern(
  el: HTMLElement,
  pattern: AriaPattern
): { ok: boolean; pattern: string; violations: string[]; passed: string[] };
export function checkDirection(
  el: HTMLElement
): { ok: boolean; ltrDetected: boolean; rtlDetected: boolean };
export function checkServerRender(
  tagName: string,
  ComponentClass: typeof Elementum,
  attrs?: Record<string, unknown>
): { ok: boolean; html: string; violations: string[] };
export function testComponent(
  tagOrElement: string | HTMLElement,
  spec?: {
    attrs?: Record<string, string | boolean>;
    html?: string;
    actions?: Array<Record<string, unknown>>;
    assertions?: Array<Record<string, unknown>>;
    cleanup?: boolean;
  }
): Promise<{
  ok: boolean;
  tag: string;
  actionResults: Array<Record<string, unknown>>;
  assertionResults: Array<Record<string, unknown>>;
  failures: string[];
}>;

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
    'el-toast': ElToaster;
    'el-toaster': ElToaster;
    'el-progress': ElProgress;
    'el-spinner': ElSpinner;
    'el-avatar': ElAvatar;
    'el-avatar-group': ElAvatarGroup;
    'el-drawer': ElDrawer;
    'el-segmented-control': ElSegmentedControl;
    'el-pagination': ElPagination;
    'el-chip': ElChip;
    'el-autocomplete': ElAutocomplete;
    'el-number-flow': ElNumberFlow;
    'el-otp-input': ElOtpInput;
    'el-command': ElCommand;
    'el-command-group': ElCommandGroup;
    'el-command-item': ElCommandItem;
    'el-prompt-input': ElPromptInput;
    'el-reasoning-card': ElReasoningCard;
    'el-border-beam': ElBorderBeam;
    'el-streaming-text': ElStreamingText;
    'el-chart': ElChart;
    'el-field': ElField;
    'el-number-field': ElNumberField;
    'el-slider': ElSlider;
    'el-popover': ElPopover;
    'el-collapsible': ElCollapsible;
    'el-scroll-area': ElScrollArea;
    'el-toggle': ElToggle;
    'el-toggle-group': ElToggleGroup;
    'el-checkbox': ElCheckbox;
    'el-radio': ElRadio;
    'el-radio-group': ElRadioGroup;
    'el-preview-card': ElPreviewCard;
    'el-alert-dialog': ElAlertDialog;
    'el-separator': ElSeparator;
    'el-meter': ElMeter;
    'el-toolbar': ElToolbar;
    'el-context-menu': ElContextMenu;
    'el-menubar': ElMenubar;
    'el-skeleton': ElSkeleton;
    'el-breadcrumb': ElBreadcrumb;
    'el-breadcrumb-item': ElBreadcrumbItem;
    'el-kbd': ElKbd;
    'el-alert': ElAlert;
    'el-card': ElCard;
    'el-card-header': ElCardHeader;
    'el-card-title': ElCardTitle;
    'el-card-description': ElCardDescription;
    'el-card-content': ElCardContent;
    'el-card-footer': ElCardFooter;
    'el-aspect-ratio': ElAspectRatio;
    'el-textarea': ElTextarea;
    'el-resizable': ElResizable;
    'el-carousel': ElCarousel;
    'el-carousel-slide': ElCarouselSlide;
    'el-timeline': ElTimeline;
    'el-timeline-item': ElTimelineItem;
    'el-tree-view': ElTreeView;
    'el-tree-item': ElTreeItem;
    'el-empty-state': ElEmptyState;
    'el-rating': ElRating;
    'el-dropzone': ElDropzone;
    'el-sidebar': ElSidebar;
    'el-sidebar-header': ElSidebarHeader;
    'el-sidebar-content': ElSidebarContent;
    'el-sidebar-footer': ElSidebarFooter;
    'el-sidebar-trigger': ElSidebarTrigger;
    'el-form': ElForm;
    'el-fieldset': ElFieldset;
    'el-callout': ElCallout;
    'el-checkbox-card': ElCheckboxCard;
    'el-code-block': ElCodeBlock;
    'el-data-list': ElDataList;
    'el-data-list-item': ElDataListItem;
    'el-diff-viewer': ElDiffViewer;
    'el-inset': ElInset;
    'el-insight-card': ElInsightCard;
    'el-navbar': ElNavbar;
    'el-navigation-menu': ElNavigationMenu;
    'el-navigation-menu-item': ElNavigationMenuItem;
    'el-navigation-menu-trigger': ElNavigationMenuTrigger;
    'el-navigation-menu-content': ElNavigationMenuContent;
    'el-radio-card': ElRadioCard;
    'el-radio-card-group': ElRadioCardGroup;
    'el-resizable-handle': ElResizableHandle;
    'el-resizable-panel': ElResizablePanel;
    'el-route': ElRoute;
    'el-route-link': ElRouteLink;
    'el-router': ElRouter;
    'el-sources': ElSources;
    'el-task-list': ElTaskList;
    'el-tool-call': ElToolCall;
    'el-visually-hidden': ElVisuallyHidden;
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
      'el-pagination': any;
      'el-chip': any;
      'el-autocomplete': any;
      'el-number-flow': any;
      'el-otp-input': any;
      'el-command': any;
      'el-command-group': any;
      'el-command-item': any;
      'el-prompt-input': any;
      'el-reasoning-card': any;
      'el-border-beam': any;
      'el-streaming-text': any;
      'el-chart': any;
      'el-field': any;
      'el-number-field': any;
      'el-slider': any;
      'el-popover': any;
      'el-collapsible': any;
      'el-scroll-area': any;
      'el-toggle': any;
      'el-toggle-group': any;
      'el-checkbox': any;
      'el-radio': any;
      'el-radio-group': any;
      'el-preview-card': any;
      'el-alert-dialog': any;
      'el-separator': any;
      'el-meter': any;
      'el-toolbar': any;
      'el-context-menu': any;
      'el-menubar': any;
      'el-skeleton': any;
      'el-breadcrumb': any;
      'el-breadcrumb-item': any;
      'el-kbd': any;
      'el-alert': any;
      'el-card': any;
      'el-card-header': any;
      'el-card-title': any;
      'el-card-description': any;
      'el-card-content': any;
      'el-card-footer': any;
      'el-aspect-ratio': any;
      'el-textarea': any;
      'el-resizable': any;
      'el-carousel': any;
      'el-carousel-slide': any;
      'el-timeline': any;
      'el-timeline-item': any;
      'el-tree-view': any;
      'el-tree-item': any;
      'el-empty-state': any;
      'el-rating': any;
      'el-dropzone': any;
      'el-sidebar': any;
      'el-sidebar-header': any;
      'el-sidebar-content': any;
      'el-sidebar-footer': any;
      'el-sidebar-trigger': any;
      'el-form': any;
      'el-fieldset': any;
      'el-callout': any;
      'el-checkbox-card': any;
      'el-code-block': any;
      'el-data-list': any;
      'el-data-list-item': any;
      'el-diff-viewer': any;
      'el-inset': any;
      'el-insight-card': any;
      'el-navbar': any;
      'el-navigation-menu': any;
      'el-navigation-menu-item': any;
      'el-navigation-menu-trigger': any;
      'el-navigation-menu-content': any;
      'el-radio-card': any;
      'el-radio-card-group': any;
      'el-resizable-handle': any;
      'el-resizable-panel': any;
      'el-route': any;
      'el-route-link': any;
      'el-router': any;
      'el-sources': any;
      'el-task-list': any;
      'el-tool-call': any;
      'el-visually-hidden': any;
    }
  }
}

import './ide-types.d.ts';

