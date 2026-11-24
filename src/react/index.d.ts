/**
 * Auto-generated strict TypeScript definitions for @wcomp/elementum/react (109 components).
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
  [dataAttr: `data-${string}`]: string | number | boolean | undefined;
  [ariaAttr: `aria-${string}`]: string | number | boolean | undefined;
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

export type ElAccordionProps = ElementumComponentProps<ElementFor<'el-accordion'>, {
  multiple?: boolean;
}, {
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElAccordion: ElementumReactComponent<ElAccordionProps>;

export type ElAccordionItemProps = ElementumComponentProps<ElementFor<'el-accordion-item'>, {
  title?: string;
  value?: string;
  open?: boolean;
}, {}>;
export declare const ElAccordionItem: ElementumReactComponent<ElAccordionItemProps>;

export type ElAlertDialogProps = ElementumComponentProps<ElementFor<'el-alert-dialog'>, {}, {}>;
export declare const ElAlertDialog: ElementumReactComponent<ElAlertDialogProps>;

export type ElAlertProps = ElementumComponentProps<ElementFor<'el-alert'>, {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  dismissible?: boolean;
}, {
  onDismiss?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElAlert: ElementumReactComponent<ElAlertProps>;

export type ElAspectRatioProps = ElementumComponentProps<ElementFor<'el-aspect-ratio'>, {
  ratio?: string;
}, {}>;
export declare const ElAspectRatio: ElementumReactComponent<ElAspectRatioProps>;

export type ElAutocompleteProps = ElementumComponentProps<ElementFor<'el-autocomplete'>, {
  name?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  url?: string;
  'query-param'?: string;
  debounce?: number;
  'min-chars'?: number;
  'label-key'?: string;
  'value-key'?: string;
  size?: 'sm' | 'md' | 'lg';
}, {
  onSelect?: (event: CustomEvent<any> & Event) => void;
  onRemove?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
  onClear?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElAutocomplete: ElementumReactComponent<ElAutocompleteProps>;

export type ElAvatarProps = ElementumComponentProps<ElementFor<'el-avatar'>, {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
}, {}>;
export declare const ElAvatar: ElementumReactComponent<ElAvatarProps>;

export type ElAvatarGroupProps = ElementumComponentProps<ElementFor<'el-avatar-group'>, {}, {}>;
export declare const ElAvatarGroup: ElementumReactComponent<ElAvatarGroupProps>;

export type ElBadgeProps = ElementumComponentProps<ElementFor<'el-badge'>, {
  variant?: 'default' | 'success' | 'danger';
  count?: string;
}, {}>;
export declare const ElBadge: ElementumReactComponent<ElBadgeProps>;

export type ElBorderBeamProps = ElementumComponentProps<ElementFor<'el-border-beam'>, {
  size?: number;
  duration?: number;
  'color-from'?: string;
  'color-to'?: string;
  'border-width'?: number;
  reverse?: boolean;
}, {}>;
export declare const ElBorderBeam: ElementumReactComponent<ElBorderBeamProps>;

export type ElBreadcrumbProps = ElementumComponentProps<ElementFor<'el-breadcrumb'>, {
  separator?: string;
}, {}>;
export declare const ElBreadcrumb: ElementumReactComponent<ElBreadcrumbProps>;

export type ElBreadcrumbItemProps = ElementumComponentProps<ElementFor<'el-breadcrumb-item'>, {
  href?: string;
  current?: boolean;
}, {}>;
export declare const ElBreadcrumbItem: ElementumReactComponent<ElBreadcrumbItemProps>;

export type ElButtonProps = ElementumComponentProps<ElementFor<'el-button'>, {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}, {}>;
export declare const ElButton: ElementumReactComponent<ElButtonProps>;

export type ElCalendarProps = ElementumComponentProps<ElementFor<'el-calendar'>, {
  value?: string;
}, {
  onSelect?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElCalendar: ElementumReactComponent<ElCalendarProps>;

export type ElCalloutProps = ElementumComponentProps<ElementFor<'el-callout'>, {
  variant?: string;
  size?: string;
}, {}>;
export declare const ElCallout: ElementumReactComponent<ElCalloutProps>;

export type ElCardProps = ElementumComponentProps<ElementFor<'el-card'>, {
  hoverable?: boolean;
}, {}>;
export declare const ElCard: ElementumReactComponent<ElCardProps>;

export type ElCardHeaderProps = ElementumComponentProps<ElementFor<'el-card-header'>, {}, {}>;
export declare const ElCardHeader: ElementumReactComponent<ElCardHeaderProps>;

export type ElCardTitleProps = ElementumComponentProps<ElementFor<'el-card-title'>, {}, {}>;
export declare const ElCardTitle: ElementumReactComponent<ElCardTitleProps>;

export type ElCardDescriptionProps = ElementumComponentProps<ElementFor<'el-card-description'>, {}, {}>;
export declare const ElCardDescription: ElementumReactComponent<ElCardDescriptionProps>;

export type ElCardContentProps = ElementumComponentProps<ElementFor<'el-card-content'>, {}, {}>;
export declare const ElCardContent: ElementumReactComponent<ElCardContentProps>;

export type ElCardFooterProps = ElementumComponentProps<ElementFor<'el-card-footer'>, {}, {}>;
export declare const ElCardFooter: ElementumReactComponent<ElCardFooterProps>;

export type ElCarouselProps = ElementumComponentProps<ElementFor<'el-carousel'>, {
  'auto-play'?: boolean;
  interval?: number;
  loop?: boolean;
}, {
  onSlideChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElCarousel: ElementumReactComponent<ElCarouselProps>;

export type ElCarouselSlideProps = ElementumComponentProps<ElementFor<'el-carousel-slide'>, {}, {}>;
export declare const ElCarouselSlide: ElementumReactComponent<ElCarouselSlideProps>;

export type ElChartProps = ElementumComponentProps<ElementFor<'el-chart'>, {
  type?: 'area' | 'line' | 'bar';
  'x-key'?: string;
  'y-key'?: string;
  'secondary-key'?: string;
  height?: number;
  'show-grid'?: boolean;
  'show-dots'?: boolean;
}, {}>;
export declare const ElChart: ElementumReactComponent<ElChartProps>;

export type ElCheckboxCardProps = ElementumComponentProps<ElementFor<'el-checkbox-card'>, {
  value?: string;
  checked?: string;
  disabled?: string;
}, {}>;
export declare const ElCheckboxCard: ElementumReactComponent<ElCheckboxCardProps>;

export type ElCheckboxProps = ElementumComponentProps<ElementFor<'el-checkbox'>, {}, {}>;
export declare const ElCheckbox: ElementumReactComponent<ElCheckboxProps>;

export type ElChipProps = ElementumComponentProps<ElementFor<'el-chip'>, {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'muted';
  size?: 'sm' | 'md';
  removable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  value?: string;
}, {
  onRemove?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElChip: ElementumReactComponent<ElChipProps>;

export type ElCodeBlockProps = ElementumComponentProps<ElementFor<'el-code-block'>, {
  code?: string;
  language?: string;
  copyable?: string;
  compact?: string;
}, {}>;
export declare const ElCodeBlock: ElementumReactComponent<ElCodeBlockProps>;

export type ElCollapsibleProps = ElementumComponentProps<ElementFor<'el-collapsible'>, {}, {}>;
export declare const ElCollapsible: ElementumReactComponent<ElCollapsibleProps>;

export type ElCommandProps = ElementumComponentProps<ElementFor<'el-command'>, {
  open?: boolean;
  placeholder?: string;
}, {
  onSelect?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElCommand: ElementumReactComponent<ElCommandProps>;

export type ElCommandItemProps = ElementumComponentProps<ElementFor<'el-command-item'>, {
  value?: string;
  shortcut?: string;
  disabled?: string;
}, {}>;
export declare const ElCommandItem: ElementumReactComponent<ElCommandItemProps>;

export type ElCommandGroupProps = ElementumComponentProps<ElementFor<'el-command-group'>, {
  heading?: string;
}, {}>;
export declare const ElCommandGroup: ElementumReactComponent<ElCommandGroupProps>;

export type ElContextMenuProps = ElementumComponentProps<ElementFor<'el-context-menu'>, {}, {}>;
export declare const ElContextMenu: ElementumReactComponent<ElContextMenuProps>;

export type ElDataListProps = ElementumComponentProps<ElementFor<'el-data-list'>, {
  orientation?: string;
  size?: string;
}, {}>;
export declare const ElDataList: ElementumReactComponent<ElDataListProps>;

export type ElDataListItemProps = ElementumComponentProps<ElementFor<'el-data-list-item'>, {
  label?: string;
  value?: string;
  copyable?: string;
}, {}>;
export declare const ElDataListItem: ElementumReactComponent<ElDataListItemProps>;

export type ElDatepickerProps = ElementumComponentProps<ElementFor<'el-datepicker'>, {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}, {
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElDatepicker: ElementumReactComponent<ElDatepickerProps>;

export type ElDialogProps = ElementumComponentProps<ElementFor<'el-dialog'>, {
  open?: boolean;
  title?: string;
}, {
  onOpen?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElDialog: ElementumReactComponent<ElDialogProps>;

export type ElDiffViewerProps = ElementumComponentProps<ElementFor<'el-diff-viewer'>, {
  filename?: string;
  before?: string;
  after?: string;
  mode?: string;
  approval?: string;
}, {}>;
export declare const ElDiffViewer: ElementumReactComponent<ElDiffViewerProps>;

export type ElDrawerProps = ElementumComponentProps<ElementFor<'el-drawer'>, {
  open?: boolean;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
}, {
  onOpen?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElDrawer: ElementumReactComponent<ElDrawerProps>;

export type ElDropdownProps = ElementumComponentProps<ElementFor<'el-dropdown'>, {
  open?: boolean;
}, {
  onOpen?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElDropdown: ElementumReactComponent<ElDropdownProps>;

export type ElDropzoneProps = ElementumComponentProps<ElementFor<'el-dropzone'>, {
  accept?: string;
  'max-size'?: number;
  multiple?: boolean;
  disabled?: boolean;
}, {
  onFilesSelected?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElDropzone: ElementumReactComponent<ElDropzoneProps>;

export type ElEmptyStateProps = ElementumComponentProps<ElementFor<'el-empty-state'>, {
  title?: string;
  description?: string;
}, {}>;
export declare const ElEmptyState: ElementumReactComponent<ElEmptyStateProps>;

export type ElFieldProps = ElementumComponentProps<ElementFor<'el-field'>, {}, {}>;
export declare const ElField: ElementumReactComponent<ElFieldProps>;

export type ElFormProps = ElementumComponentProps<ElementFor<'el-form'>, {}, {
  onSubmit?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElForm: ElementumReactComponent<ElFormProps>;

export type ElFieldsetProps = ElementumComponentProps<ElementFor<'el-fieldset'>, {
  legend?: string;
  disabled?: boolean;
}, {}>;
export declare const ElFieldset: ElementumReactComponent<ElFieldsetProps>;

export type ElInputProps = ElementumComponentProps<ElementFor<'el-input'>, {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  pattern?: string;
  minlength?: number;
  size?: 'sm' | 'md' | 'lg';
}, {
  onInput?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElInput: ElementumReactComponent<ElInputProps>;

export type ElInsetProps = ElementumComponentProps<ElementFor<'el-inset'>, {
  side?: string;
  clip?: string;
}, {}>;
export declare const ElInset: ElementumReactComponent<ElInsetProps>;

export type ElInsightCardProps = ElementumComponentProps<ElementFor<'el-insight-card'>, {
  title?: string;
  category?: string;
  metric?: string;
  delta?: string;
  variant?: string;
  summary?: string;
  'action-label'?: string;
}, {}>;
export declare const ElInsightCard: ElementumReactComponent<ElInsightCardProps>;

export type ElKbdProps = ElementumComponentProps<ElementFor<'el-kbd'>, {
  keys?: string;
  size?: 'sm' | 'md' | 'lg';
}, {}>;
export declare const ElKbd: ElementumReactComponent<ElKbdProps>;

export type ElMenubarProps = ElementumComponentProps<ElementFor<'el-menubar'>, {}, {}>;
export declare const ElMenubar: ElementumReactComponent<ElMenubarProps>;

export type ElMeterProps = ElementumComponentProps<ElementFor<'el-meter'>, {}, {}>;
export declare const ElMeter: ElementumReactComponent<ElMeterProps>;

export type ElNavbarProps = ElementumComponentProps<ElementFor<'el-navbar'>, {
  brand?: string;
  href?: string;
  badge?: string;
  'badge-variant'?: string;
  sticky?: string;
  open?: string;
}, {}>;
export declare const ElNavbar: ElementumReactComponent<ElNavbarProps>;

export type ElNavigationMenuProps = ElementumComponentProps<ElementFor<'el-navigation-menu'>, {
  orientation?: string;
}, {}>;
export declare const ElNavigationMenu: ElementumReactComponent<ElNavigationMenuProps>;

export type ElNavigationMenuItemProps = ElementumComponentProps<ElementFor<'el-navigation-menu-item'>, {}, {}>;
export declare const ElNavigationMenuItem: ElementumReactComponent<ElNavigationMenuItemProps>;

export type ElNavigationMenuTriggerProps = ElementumComponentProps<ElementFor<'el-navigation-menu-trigger'>, {}, {}>;
export declare const ElNavigationMenuTrigger: ElementumReactComponent<ElNavigationMenuTriggerProps>;

export type ElNavigationMenuContentProps = ElementumComponentProps<ElementFor<'el-navigation-menu-content'>, {}, {}>;
export declare const ElNavigationMenuContent: ElementumReactComponent<ElNavigationMenuContentProps>;

export type ElNumberFieldProps = ElementumComponentProps<ElementFor<'el-number-field'>, {}, {}>;
export declare const ElNumberField: ElementumReactComponent<ElNumberFieldProps>;

export type ElNumberFlowProps = ElementumComponentProps<ElementFor<'el-number-flow'>, {
  value?: number | string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  animated?: boolean;
}, {}>;
export declare const ElNumberFlow: ElementumReactComponent<ElNumberFlowProps>;

export type ElOtpInputProps = ElementumComponentProps<ElementFor<'el-otp-input'>, {
  length?: number;
  value?: string;
  type?: 'text' | 'password';
  disabled?: boolean;
  required?: boolean;
}, {
  onComplete?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElOtpInput: ElementumReactComponent<ElOtpInputProps>;

export type ElPaginationProps = ElementumComponentProps<ElementFor<'el-pagination'>, {
  page?: number;
  total?: number;
  'page-size'?: number;
  'sibling-count'?: number;
}, {
  onPageChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElPagination: ElementumReactComponent<ElPaginationProps>;

export type ElPopoverProps = ElementumComponentProps<ElementFor<'el-popover'>, {}, {}>;
export declare const ElPopover: ElementumReactComponent<ElPopoverProps>;

export type ElPreviewCardProps = ElementumComponentProps<ElementFor<'el-preview-card'>, {}, {}>;
export declare const ElPreviewCard: ElementumReactComponent<ElPreviewCardProps>;

export type ElProgressProps = ElementumComponentProps<ElementFor<'el-progress'>, {
  value?: number;
  max?: number;
  variant?: 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  striped?: boolean;
}, {}>;
export declare const ElProgress: ElementumReactComponent<ElProgressProps>;

export type ElPromptInputProps = ElementumComponentProps<ElementFor<'el-prompt-input'>, {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  'max-rows'?: number;
  'min-rows'?: number;
  'clear-on-submit'?: boolean;
}, {
  onSubmit?: (event: CustomEvent<any> & Event) => void;
  onInput?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElPromptInput: ElementumReactComponent<ElPromptInputProps>;

export type ElRadioCardProps = ElementumComponentProps<ElementFor<'el-radio-card'>, {
  value?: string;
  checked?: string;
  disabled?: string;
}, {}>;
export declare const ElRadioCard: ElementumReactComponent<ElRadioCardProps>;

export type ElRadioCardGroupProps = ElementumComponentProps<ElementFor<'el-radio-card-group'>, {
  name?: string;
  value?: string;
  columns?: string;
}, {}>;
export declare const ElRadioCardGroup: ElementumReactComponent<ElRadioCardGroupProps>;

export type ElRadioProps = ElementumComponentProps<ElementFor<'el-radio'>, {}, {}>;
export declare const ElRadio: ElementumReactComponent<ElRadioProps>;

export type ElRadioGroupProps = ElementumComponentProps<ElementFor<'el-radio-group'>, {
  value?: string;
  name?: string;
  disabled?: string;
  required?: string;
  orientation?: string;
}, {}>;
export declare const ElRadioGroup: ElementumReactComponent<ElRadioGroupProps>;

export type ElRatingProps = ElementumComponentProps<ElementFor<'el-rating'>, {
  value?: number;
  max?: number;
  readonly?: boolean;
  disabled?: boolean;
}, {
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElRating: ElementumReactComponent<ElRatingProps>;

export type ElReasoningCardProps = ElementumComponentProps<ElementFor<'el-reasoning-card'>, {
  open?: boolean;
  thinking?: boolean;
  duration?: string;
  summary?: string;
}, {
  onToggle?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElReasoningCard: ElementumReactComponent<ElReasoningCardProps>;

export type ElResizableProps = ElementumComponentProps<ElementFor<'el-resizable'>, {
  direction?: 'horizontal' | 'vertical';
  size?: number;
  min?: number;
  max?: number;
}, {
  onResize?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElResizable: ElementumReactComponent<ElResizableProps>;

export type ElResizableHandleProps = ElementumComponentProps<ElementFor<'el-resizable-handle'>, {
  disabled?: string;
}, {}>;
export declare const ElResizableHandle: ElementumReactComponent<ElResizableHandleProps>;

export type ElResizablePanelProps = ElementumComponentProps<ElementFor<'el-resizable-panel'>, {
  'default-size'?: string;
  'min-size'?: string;
  'max-size'?: string;
}, {}>;
export declare const ElResizablePanel: ElementumReactComponent<ElResizablePanelProps>;

export type ElRouteProps = ElementumComponentProps<ElementFor<'el-route'>, {
  path?: string;
  exact?: string;
}, {}>;
export declare const ElRoute: ElementumReactComponent<ElRouteProps>;

export type ElRouteLinkProps = ElementumComponentProps<ElementFor<'el-route-link'>, {
  to?: string;
  exact?: string;
}, {}>;
export declare const ElRouteLink: ElementumReactComponent<ElRouteLinkProps>;

export type ElRouterProps = ElementumComponentProps<ElementFor<'el-router'>, {
  default?: string;
}, {}>;
export declare const ElRouter: ElementumReactComponent<ElRouterProps>;

export type ElScrollAreaProps = ElementumComponentProps<ElementFor<'el-scroll-area'>, {}, {}>;
export declare const ElScrollArea: ElementumReactComponent<ElScrollAreaProps>;

export type ElSegmentedControlProps = ElementumComponentProps<ElementFor<'el-segmented-control'>, {
  value?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}, {
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElSegmentedControl: ElementumReactComponent<ElSegmentedControlProps>;

export type ElSelectProps = ElementumComponentProps<ElementFor<'el-select'>, {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}, {
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElSelect: ElementumReactComponent<ElSelectProps>;

export type ElSeparatorProps = ElementumComponentProps<ElementFor<'el-separator'>, {}, {}>;
export declare const ElSeparator: ElementumReactComponent<ElSeparatorProps>;

export type ElSidebarProps = ElementumComponentProps<ElementFor<'el-sidebar'>, {
  collapsed?: boolean;
  collapsible?: 'offcanvas' | 'icon' | 'none';
  side?: 'left' | 'right';
}, {
  onCollapse?: (event: CustomEvent<any> & Event) => void;
  onExpand?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElSidebar: ElementumReactComponent<ElSidebarProps>;

export type ElSidebarHeaderProps = ElementumComponentProps<ElementFor<'el-sidebar-header'>, {}, {}>;
export declare const ElSidebarHeader: ElementumReactComponent<ElSidebarHeaderProps>;

export type ElSidebarContentProps = ElementumComponentProps<ElementFor<'el-sidebar-content'>, {}, {}>;
export declare const ElSidebarContent: ElementumReactComponent<ElSidebarContentProps>;

export type ElSidebarFooterProps = ElementumComponentProps<ElementFor<'el-sidebar-footer'>, {}, {}>;
export declare const ElSidebarFooter: ElementumReactComponent<ElSidebarFooterProps>;

export type ElSidebarTriggerProps = ElementumComponentProps<ElementFor<'el-sidebar-trigger'>, {}, {}>;
export declare const ElSidebarTrigger: ElementumReactComponent<ElSidebarTriggerProps>;

export type ElSkeletonProps = ElementumComponentProps<ElementFor<'el-skeleton'>, {
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string;
  height?: string;
}, {}>;
export declare const ElSkeleton: ElementumReactComponent<ElSkeletonProps>;

export type ElSliderProps = ElementumComponentProps<ElementFor<'el-slider'>, {}, {}>;
export declare const ElSlider: ElementumReactComponent<ElSliderProps>;

export type ElSourcesProps = ElementumComponentProps<ElementFor<'el-sources'>, {
  sources?: string;
  label?: string;
  expanded?: string;
  open?: boolean;
}, {}>;
export declare const ElSources: ElementumReactComponent<ElSourcesProps>;

export type ElSpinnerProps = ElementumComponentProps<ElementFor<'el-spinner'>, {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'muted' | 'white';
  label?: string;
}, {}>;
export declare const ElSpinner: ElementumReactComponent<ElSpinnerProps>;

export type ElStreamingTextProps = ElementumComponentProps<ElementFor<'el-streaming-text'>, {
  text?: string;
  speed?: number;
  cursor?: boolean;
  'auto-start'?: boolean;
}, {
  onStreamStart?: (event: CustomEvent<any> & Event) => void;
  onStreamEnd?: (event: CustomEvent<any> & Event) => void;
  onStreamTick?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElStreamingText: ElementumReactComponent<ElStreamingTextProps>;

export type ElSwitchProps = ElementumComponentProps<ElementFor<'el-switch'>, {
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
}, {
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElSwitch: ElementumReactComponent<ElSwitchProps>;

export type ElTableProps = ElementumComponentProps<ElementFor<'el-table'>, {
  selectable?: boolean;
  filter?: string;
  'highlight-only'?: boolean;
}, {
  onSort?: (event: CustomEvent<any> & Event) => void;
  onSelectionChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElTable: ElementumReactComponent<ElTableProps>;

export type ElTabsProps = ElementumComponentProps<ElementFor<'el-tabs'>, {
  value?: string;
}, {
  onTabChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElTabs: ElementumReactComponent<ElTabsProps>;

export type ElTabProps = ElementumComponentProps<ElementFor<'el-tab'>, {
  label?: string;
  value?: string;
}, {}>;
export declare const ElTab: ElementumReactComponent<ElTabProps>;

export type ElTaskListProps = ElementumComponentProps<ElementFor<'el-task-list'>, {
  heading?: string;
  tasks?: string;
  compact?: string;
}, {}>;
export declare const ElTaskList: ElementumReactComponent<ElTaskListProps>;

export type ElTextareaProps = ElementumComponentProps<ElementFor<'el-textarea'>, {
  placeholder?: string;
  rows?: number;
  'auto-resize'?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxlength?: number;
}, {
  onInput?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElTextarea: ElementumReactComponent<ElTextareaProps>;

export type ElThemeSwitchProps = ElementumComponentProps<ElementFor<'el-theme-switch'>, {}, {
  onThemeChange?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElThemeSwitch: ElementumReactComponent<ElThemeSwitchProps>;

export type ElTimelineProps = ElementumComponentProps<ElementFor<'el-timeline'>, {
  orientation?: 'vertical' | 'horizontal';
}, {}>;
export declare const ElTimeline: ElementumReactComponent<ElTimelineProps>;

export type ElTimelineItemProps = ElementumComponentProps<ElementFor<'el-timeline-item'>, {
  status?: 'default' | 'active' | 'success' | 'warning' | 'destructive';
  date?: string;
}, {}>;
export declare const ElTimelineItem: ElementumReactComponent<ElTimelineItemProps>;

export type ElToasterProps = ElementumComponentProps<ElementFor<'el-toaster'>, {}, {}>;
export declare const ElToaster: ElementumReactComponent<ElToasterProps>;

export type ElToastProps = ElementumComponentProps<ElementFor<'el-toast'>, {}, {}>;
export declare const ElToast: ElementumReactComponent<ElToastProps>;

export type ElToggleProps = ElementumComponentProps<ElementFor<'el-toggle'>, {}, {}>;
export declare const ElToggle: ElementumReactComponent<ElToggleProps>;

export type ElToggleGroupProps = ElementumComponentProps<ElementFor<'el-toggle-group'>, {
  type?: string;
  value?: string;
  disabled?: string;
}, {}>;
export declare const ElToggleGroup: ElementumReactComponent<ElToggleGroupProps>;

export type ElToolCallProps = ElementumComponentProps<ElementFor<'el-tool-call'>, {
  name?: string;
  status?: string;
  args?: string;
  result?: string;
  'call-id'?: string;
  approval?: string;
  open?: string;
}, {}>;
export declare const ElToolCall: ElementumReactComponent<ElToolCallProps>;

export type ElToolbarProps = ElementumComponentProps<ElementFor<'el-toolbar'>, {}, {}>;
export declare const ElToolbar: ElementumReactComponent<ElToolbarProps>;

export type ElTooltipProps = ElementumComponentProps<ElementFor<'el-tooltip'>, {
  content?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}, {}>;
export declare const ElTooltip: ElementumReactComponent<ElTooltipProps>;

export type ElTreeViewProps = ElementumComponentProps<ElementFor<'el-tree-view'>, {}, {}>;
export declare const ElTreeView: ElementumReactComponent<ElTreeViewProps>;

export type ElTreeItemProps = ElementumComponentProps<ElementFor<'el-tree-item'>, {
  label?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
}, {
  onExpand?: (event: CustomEvent<any> & Event) => void;
  onCollapse?: (event: CustomEvent<any> & Event) => void;
  onSelect?: (event: CustomEvent<any> & Event) => void;
}>;
export declare const ElTreeItem: ElementumReactComponent<ElTreeItemProps>;

export type ElVisuallyHiddenProps = ElementumComponentProps<ElementFor<'el-visually-hidden'>, {}, {}>;
export declare const ElVisuallyHidden: ElementumReactComponent<ElVisuallyHiddenProps>;
