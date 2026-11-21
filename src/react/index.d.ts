/**
 * Auto-generated strict TypeScript definitions for @wcomp/elementum/react (109 components).
 * Self-contained React-compatible types (no @types/react dependency required).
 */

import '../index.js';

export type ElementFor<Tag extends string> = Tag extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[Tag]
  : HTMLElement;

export type ReactRef<T> = ((instance: T | null) => void) | { current: T | null } | null;

export interface ElementumReactBaseProps<E extends HTMLElement = HTMLElement> {
  id?: string;
  className?: string;
  style?: string | Record<string, string | number | undefined>;
  slot?: string;
  role?: string;
  title?: string;
  tabIndex?: number;
  hidden?: boolean;
  dir?: 'ltr' | 'rtl' | 'auto';
  lang?: string;
  children?: unknown;
  ref?: ReactRef<E>;
  onChange?: (event: CustomEvent<any> & Event) => void;
  onInput?: (event: CustomEvent<any> & Event) => void;
  onSelect?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
  onClick?: (event: MouseEvent) => void;
  [prop: string]: any;
}

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

export interface ElAccordionProps extends ElementumReactBaseProps<ElementFor<'el-accordion'>> {
  multiple?: boolean;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElAccordion: ElementumReactComponent<ElAccordionProps>;

export interface ElAccordionItemProps extends ElementumReactBaseProps<ElementFor<'el-accordion-item'>> {
  title?: string;
  value?: string;
  open?: boolean;
}
export declare const ElAccordionItem: ElementumReactComponent<ElAccordionItemProps>;

export interface ElAlertDialogProps extends ElementumReactBaseProps<ElementFor<'el-alert-dialog'>> {
}
export declare const ElAlertDialog: ElementumReactComponent<ElAlertDialogProps>;

export interface ElAlertProps extends ElementumReactBaseProps<ElementFor<'el-alert'>> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
  dismissible?: boolean;
  onDismiss?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElAlert: ElementumReactComponent<ElAlertProps>;

export interface ElAspectRatioProps extends ElementumReactBaseProps<ElementFor<'el-aspect-ratio'>> {
  ratio?: string;
}
export declare const ElAspectRatio: ElementumReactComponent<ElAspectRatioProps>;

export interface ElAutocompleteProps extends ElementumReactBaseProps<ElementFor<'el-autocomplete'>> {
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
  onSelect?: (event: CustomEvent<any> & Event) => void;
  onRemove?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
  onClear?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElAutocomplete: ElementumReactComponent<ElAutocompleteProps>;

export interface ElAvatarProps extends ElementumReactBaseProps<ElementFor<'el-avatar'>> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
}
export declare const ElAvatar: ElementumReactComponent<ElAvatarProps>;

export interface ElAvatarGroupProps extends ElementumReactBaseProps<ElementFor<'el-avatar-group'>> {
}
export declare const ElAvatarGroup: ElementumReactComponent<ElAvatarGroupProps>;

export interface ElBadgeProps extends ElementumReactBaseProps<ElementFor<'el-badge'>> {
  variant?: 'default' | 'success' | 'danger';
  count?: string;
}
export declare const ElBadge: ElementumReactComponent<ElBadgeProps>;

export interface ElBorderBeamProps extends ElementumReactBaseProps<ElementFor<'el-border-beam'>> {
  size?: number;
  duration?: number;
  'color-from'?: string;
  'color-to'?: string;
  'border-width'?: number;
  reverse?: boolean;
}
export declare const ElBorderBeam: ElementumReactComponent<ElBorderBeamProps>;

export interface ElBreadcrumbProps extends ElementumReactBaseProps<ElementFor<'el-breadcrumb'>> {
  separator?: string;
}
export declare const ElBreadcrumb: ElementumReactComponent<ElBreadcrumbProps>;

export interface ElBreadcrumbItemProps extends ElementumReactBaseProps<ElementFor<'el-breadcrumb-item'>> {
  href?: string;
  current?: boolean;
}
export declare const ElBreadcrumbItem: ElementumReactComponent<ElBreadcrumbItemProps>;

export interface ElButtonProps extends ElementumReactBaseProps<ElementFor<'el-button'>> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
export declare const ElButton: ElementumReactComponent<ElButtonProps>;

export interface ElCalendarProps extends ElementumReactBaseProps<ElementFor<'el-calendar'>> {
  value?: string;
  onSelect?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElCalendar: ElementumReactComponent<ElCalendarProps>;

export interface ElCalloutProps extends ElementumReactBaseProps<ElementFor<'el-callout'>> {
  variant?: string;
  size?: string;
}
export declare const ElCallout: ElementumReactComponent<ElCalloutProps>;

export interface ElCardProps extends ElementumReactBaseProps<ElementFor<'el-card'>> {
  hoverable?: boolean;
}
export declare const ElCard: ElementumReactComponent<ElCardProps>;

export interface ElCardHeaderProps extends ElementumReactBaseProps<ElementFor<'el-card-header'>> {
}
export declare const ElCardHeader: ElementumReactComponent<ElCardHeaderProps>;

export interface ElCardTitleProps extends ElementumReactBaseProps<ElementFor<'el-card-title'>> {
}
export declare const ElCardTitle: ElementumReactComponent<ElCardTitleProps>;

export interface ElCardDescriptionProps extends ElementumReactBaseProps<ElementFor<'el-card-description'>> {
}
export declare const ElCardDescription: ElementumReactComponent<ElCardDescriptionProps>;

export interface ElCardContentProps extends ElementumReactBaseProps<ElementFor<'el-card-content'>> {
}
export declare const ElCardContent: ElementumReactComponent<ElCardContentProps>;

export interface ElCardFooterProps extends ElementumReactBaseProps<ElementFor<'el-card-footer'>> {
}
export declare const ElCardFooter: ElementumReactComponent<ElCardFooterProps>;

export interface ElCarouselProps extends ElementumReactBaseProps<ElementFor<'el-carousel'>> {
  'auto-play'?: boolean;
  interval?: number;
  loop?: boolean;
  onSlideChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElCarousel: ElementumReactComponent<ElCarouselProps>;

export interface ElCarouselSlideProps extends ElementumReactBaseProps<ElementFor<'el-carousel-slide'>> {
}
export declare const ElCarouselSlide: ElementumReactComponent<ElCarouselSlideProps>;

export interface ElChartProps extends ElementumReactBaseProps<ElementFor<'el-chart'>> {
  type?: 'area' | 'line' | 'bar';
  'x-key'?: string;
  'y-key'?: string;
  'secondary-key'?: string;
  height?: number;
  'show-grid'?: boolean;
  'show-dots'?: boolean;
}
export declare const ElChart: ElementumReactComponent<ElChartProps>;

export interface ElCheckboxCardProps extends ElementumReactBaseProps<ElementFor<'el-checkbox-card'>> {
  value?: string;
  checked?: string;
  disabled?: string;
}
export declare const ElCheckboxCard: ElementumReactComponent<ElCheckboxCardProps>;

export interface ElCheckboxProps extends ElementumReactBaseProps<ElementFor<'el-checkbox'>> {
}
export declare const ElCheckbox: ElementumReactComponent<ElCheckboxProps>;

export interface ElChipProps extends ElementumReactBaseProps<ElementFor<'el-chip'>> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'muted';
  size?: 'sm' | 'md';
  removable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  value?: string;
  onRemove?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElChip: ElementumReactComponent<ElChipProps>;

export interface ElCodeBlockProps extends ElementumReactBaseProps<ElementFor<'el-code-block'>> {
  code?: string;
  language?: string;
  copyable?: string;
  compact?: string;
}
export declare const ElCodeBlock: ElementumReactComponent<ElCodeBlockProps>;

export interface ElCollapsibleProps extends ElementumReactBaseProps<ElementFor<'el-collapsible'>> {
}
export declare const ElCollapsible: ElementumReactComponent<ElCollapsibleProps>;

export interface ElCommandProps extends ElementumReactBaseProps<ElementFor<'el-command'>> {
  open?: boolean;
  placeholder?: string;
  onSelect?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElCommand: ElementumReactComponent<ElCommandProps>;

export interface ElCommandItemProps extends ElementumReactBaseProps<ElementFor<'el-command-item'>> {
  value?: string;
  shortcut?: string;
  disabled?: string;
}
export declare const ElCommandItem: ElementumReactComponent<ElCommandItemProps>;

export interface ElCommandGroupProps extends ElementumReactBaseProps<ElementFor<'el-command-group'>> {
  heading?: string;
}
export declare const ElCommandGroup: ElementumReactComponent<ElCommandGroupProps>;

export interface ElContextMenuProps extends ElementumReactBaseProps<ElementFor<'el-context-menu'>> {
}
export declare const ElContextMenu: ElementumReactComponent<ElContextMenuProps>;

export interface ElDataListProps extends ElementumReactBaseProps<ElementFor<'el-data-list'>> {
  orientation?: string;
  size?: string;
}
export declare const ElDataList: ElementumReactComponent<ElDataListProps>;

export interface ElDataListItemProps extends ElementumReactBaseProps<ElementFor<'el-data-list-item'>> {
  label?: string;
  value?: string;
  copyable?: string;
}
export declare const ElDataListItem: ElementumReactComponent<ElDataListItemProps>;

export interface ElDatepickerProps extends ElementumReactBaseProps<ElementFor<'el-datepicker'>> {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElDatepicker: ElementumReactComponent<ElDatepickerProps>;

export interface ElDialogProps extends ElementumReactBaseProps<ElementFor<'el-dialog'>> {
  open?: boolean;
  title?: string;
  onOpen?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElDialog: ElementumReactComponent<ElDialogProps>;

export interface ElDiffViewerProps extends ElementumReactBaseProps<ElementFor<'el-diff-viewer'>> {
  filename?: string;
  before?: string;
  after?: string;
  mode?: string;
  approval?: string;
}
export declare const ElDiffViewer: ElementumReactComponent<ElDiffViewerProps>;

export interface ElDrawerProps extends ElementumReactBaseProps<ElementFor<'el-drawer'>> {
  open?: boolean;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  onOpen?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElDrawer: ElementumReactComponent<ElDrawerProps>;

export interface ElDropdownProps extends ElementumReactBaseProps<ElementFor<'el-dropdown'>> {
  open?: boolean;
  onOpen?: (event: CustomEvent<any> & Event) => void;
  onClose?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElDropdown: ElementumReactComponent<ElDropdownProps>;

export interface ElDropzoneProps extends ElementumReactBaseProps<ElementFor<'el-dropzone'>> {
  accept?: string;
  'max-size'?: number;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElDropzone: ElementumReactComponent<ElDropzoneProps>;

export interface ElEmptyStateProps extends ElementumReactBaseProps<ElementFor<'el-empty-state'>> {
  title?: string;
  description?: string;
}
export declare const ElEmptyState: ElementumReactComponent<ElEmptyStateProps>;

export interface ElFieldProps extends ElementumReactBaseProps<ElementFor<'el-field'>> {
}
export declare const ElField: ElementumReactComponent<ElFieldProps>;

export interface ElFormProps extends ElementumReactBaseProps<ElementFor<'el-form'>> {
  onSubmit?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElForm: ElementumReactComponent<ElFormProps>;

export interface ElFieldsetProps extends ElementumReactBaseProps<ElementFor<'el-fieldset'>> {
  legend?: string;
  disabled?: boolean;
}
export declare const ElFieldset: ElementumReactComponent<ElFieldsetProps>;

export interface ElInputProps extends ElementumReactBaseProps<ElementFor<'el-input'>> {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  pattern?: string;
  minlength?: number;
  size?: 'sm' | 'md' | 'lg';
  onInput?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElInput: ElementumReactComponent<ElInputProps>;

export interface ElInsetProps extends ElementumReactBaseProps<ElementFor<'el-inset'>> {
  side?: string;
  clip?: string;
}
export declare const ElInset: ElementumReactComponent<ElInsetProps>;

export interface ElInsightCardProps extends ElementumReactBaseProps<ElementFor<'el-insight-card'>> {
  title?: string;
  category?: string;
  metric?: string;
  delta?: string;
  variant?: string;
  summary?: string;
  'action-label'?: string;
}
export declare const ElInsightCard: ElementumReactComponent<ElInsightCardProps>;

export interface ElKbdProps extends ElementumReactBaseProps<ElementFor<'el-kbd'>> {
  keys?: string;
  size?: 'sm' | 'md' | 'lg';
}
export declare const ElKbd: ElementumReactComponent<ElKbdProps>;

export interface ElMenubarProps extends ElementumReactBaseProps<ElementFor<'el-menubar'>> {
}
export declare const ElMenubar: ElementumReactComponent<ElMenubarProps>;

export interface ElMeterProps extends ElementumReactBaseProps<ElementFor<'el-meter'>> {
}
export declare const ElMeter: ElementumReactComponent<ElMeterProps>;

export interface ElNavbarProps extends ElementumReactBaseProps<ElementFor<'el-navbar'>> {
  brand?: string;
  href?: string;
  badge?: string;
  'badge-variant'?: string;
  sticky?: string;
  open?: string;
}
export declare const ElNavbar: ElementumReactComponent<ElNavbarProps>;

export interface ElNavigationMenuProps extends ElementumReactBaseProps<ElementFor<'el-navigation-menu'>> {
  orientation?: string;
}
export declare const ElNavigationMenu: ElementumReactComponent<ElNavigationMenuProps>;

export interface ElNavigationMenuItemProps extends ElementumReactBaseProps<ElementFor<'el-navigation-menu-item'>> {
}
export declare const ElNavigationMenuItem: ElementumReactComponent<ElNavigationMenuItemProps>;

export interface ElNavigationMenuTriggerProps extends ElementumReactBaseProps<ElementFor<'el-navigation-menu-trigger'>> {
}
export declare const ElNavigationMenuTrigger: ElementumReactComponent<ElNavigationMenuTriggerProps>;

export interface ElNavigationMenuContentProps extends ElementumReactBaseProps<ElementFor<'el-navigation-menu-content'>> {
}
export declare const ElNavigationMenuContent: ElementumReactComponent<ElNavigationMenuContentProps>;

export interface ElNumberFieldProps extends ElementumReactBaseProps<ElementFor<'el-number-field'>> {
}
export declare const ElNumberField: ElementumReactComponent<ElNumberFieldProps>;

export interface ElNumberFlowProps extends ElementumReactBaseProps<ElementFor<'el-number-flow'>> {
  value?: number | string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  animated?: boolean;
}
export declare const ElNumberFlow: ElementumReactComponent<ElNumberFlowProps>;

export interface ElOtpInputProps extends ElementumReactBaseProps<ElementFor<'el-otp-input'>> {
  length?: number;
  value?: string;
  type?: 'text' | 'password';
  disabled?: boolean;
  required?: boolean;
  onComplete?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElOtpInput: ElementumReactComponent<ElOtpInputProps>;

export interface ElPaginationProps extends ElementumReactBaseProps<ElementFor<'el-pagination'>> {
  page?: number;
  total?: number;
  'page-size'?: number;
  'sibling-count'?: number;
  onPageChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElPagination: ElementumReactComponent<ElPaginationProps>;

export interface ElPopoverProps extends ElementumReactBaseProps<ElementFor<'el-popover'>> {
}
export declare const ElPopover: ElementumReactComponent<ElPopoverProps>;

export interface ElPreviewCardProps extends ElementumReactBaseProps<ElementFor<'el-preview-card'>> {
}
export declare const ElPreviewCard: ElementumReactComponent<ElPreviewCardProps>;

export interface ElProgressProps extends ElementumReactBaseProps<ElementFor<'el-progress'>> {
  value?: number;
  max?: number;
  variant?: 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  striped?: boolean;
}
export declare const ElProgress: ElementumReactComponent<ElProgressProps>;

export interface ElPromptInputProps extends ElementumReactBaseProps<ElementFor<'el-prompt-input'>> {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  'max-rows'?: number;
  'min-rows'?: number;
  'clear-on-submit'?: boolean;
  onSubmit?: (event: CustomEvent<any> & Event) => void;
  onInput?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElPromptInput: ElementumReactComponent<ElPromptInputProps>;

export interface ElRadioCardProps extends ElementumReactBaseProps<ElementFor<'el-radio-card'>> {
  value?: string;
  checked?: string;
  disabled?: string;
}
export declare const ElRadioCard: ElementumReactComponent<ElRadioCardProps>;

export interface ElRadioCardGroupProps extends ElementumReactBaseProps<ElementFor<'el-radio-card-group'>> {
  name?: string;
  value?: string;
  columns?: string;
}
export declare const ElRadioCardGroup: ElementumReactComponent<ElRadioCardGroupProps>;

export interface ElRadioProps extends ElementumReactBaseProps<ElementFor<'el-radio'>> {
}
export declare const ElRadio: ElementumReactComponent<ElRadioProps>;

export interface ElRadioGroupProps extends ElementumReactBaseProps<ElementFor<'el-radio-group'>> {
  value?: string;
  name?: string;
  disabled?: string;
  required?: string;
  orientation?: string;
}
export declare const ElRadioGroup: ElementumReactComponent<ElRadioGroupProps>;

export interface ElRatingProps extends ElementumReactBaseProps<ElementFor<'el-rating'>> {
  value?: number;
  max?: number;
  readonly?: boolean;
  disabled?: boolean;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElRating: ElementumReactComponent<ElRatingProps>;

export interface ElReasoningCardProps extends ElementumReactBaseProps<ElementFor<'el-reasoning-card'>> {
  open?: boolean;
  thinking?: boolean;
  duration?: string;
  summary?: string;
  onToggle?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElReasoningCard: ElementumReactComponent<ElReasoningCardProps>;

export interface ElResizableProps extends ElementumReactBaseProps<ElementFor<'el-resizable'>> {
  direction?: 'horizontal' | 'vertical';
  size?: number;
  min?: number;
  max?: number;
  onResize?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElResizable: ElementumReactComponent<ElResizableProps>;

export interface ElResizableHandleProps extends ElementumReactBaseProps<ElementFor<'el-resizable-handle'>> {
  disabled?: string;
}
export declare const ElResizableHandle: ElementumReactComponent<ElResizableHandleProps>;

export interface ElResizablePanelProps extends ElementumReactBaseProps<ElementFor<'el-resizable-panel'>> {
  'default-size'?: string;
  'min-size'?: string;
  'max-size'?: string;
}
export declare const ElResizablePanel: ElementumReactComponent<ElResizablePanelProps>;

export interface ElRouteProps extends ElementumReactBaseProps<ElementFor<'el-route'>> {
  path?: string;
  exact?: string;
}
export declare const ElRoute: ElementumReactComponent<ElRouteProps>;

export interface ElRouteLinkProps extends ElementumReactBaseProps<ElementFor<'el-route-link'>> {
  to?: string;
  exact?: string;
}
export declare const ElRouteLink: ElementumReactComponent<ElRouteLinkProps>;

export interface ElRouterProps extends ElementumReactBaseProps<ElementFor<'el-router'>> {
  default?: string;
}
export declare const ElRouter: ElementumReactComponent<ElRouterProps>;

export interface ElScrollAreaProps extends ElementumReactBaseProps<ElementFor<'el-scroll-area'>> {
}
export declare const ElScrollArea: ElementumReactComponent<ElScrollAreaProps>;

export interface ElSegmentedControlProps extends ElementumReactBaseProps<ElementFor<'el-segmented-control'>> {
  value?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElSegmentedControl: ElementumReactComponent<ElSegmentedControlProps>;

export interface ElSelectProps extends ElementumReactBaseProps<ElementFor<'el-select'>> {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElSelect: ElementumReactComponent<ElSelectProps>;

export interface ElSeparatorProps extends ElementumReactBaseProps<ElementFor<'el-separator'>> {
}
export declare const ElSeparator: ElementumReactComponent<ElSeparatorProps>;

export interface ElSidebarProps extends ElementumReactBaseProps<ElementFor<'el-sidebar'>> {
  collapsed?: boolean;
  collapsible?: 'offcanvas' | 'icon' | 'none';
  side?: 'left' | 'right';
  onCollapse?: (event: CustomEvent<any> & Event) => void;
  onExpand?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElSidebar: ElementumReactComponent<ElSidebarProps>;

export interface ElSidebarHeaderProps extends ElementumReactBaseProps<ElementFor<'el-sidebar-header'>> {
}
export declare const ElSidebarHeader: ElementumReactComponent<ElSidebarHeaderProps>;

export interface ElSidebarContentProps extends ElementumReactBaseProps<ElementFor<'el-sidebar-content'>> {
}
export declare const ElSidebarContent: ElementumReactComponent<ElSidebarContentProps>;

export interface ElSidebarFooterProps extends ElementumReactBaseProps<ElementFor<'el-sidebar-footer'>> {
}
export declare const ElSidebarFooter: ElementumReactComponent<ElSidebarFooterProps>;

export interface ElSidebarTriggerProps extends ElementumReactBaseProps<ElementFor<'el-sidebar-trigger'>> {
}
export declare const ElSidebarTrigger: ElementumReactComponent<ElSidebarTriggerProps>;

export interface ElSkeletonProps extends ElementumReactBaseProps<ElementFor<'el-skeleton'>> {
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string;
  height?: string;
}
export declare const ElSkeleton: ElementumReactComponent<ElSkeletonProps>;

export interface ElSliderProps extends ElementumReactBaseProps<ElementFor<'el-slider'>> {
}
export declare const ElSlider: ElementumReactComponent<ElSliderProps>;

export interface ElSourcesProps extends ElementumReactBaseProps<ElementFor<'el-sources'>> {
  sources?: string;
  label?: string;
  expanded?: string;
}
export declare const ElSources: ElementumReactComponent<ElSourcesProps>;

export interface ElSpinnerProps extends ElementumReactBaseProps<ElementFor<'el-spinner'>> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'muted' | 'white';
  label?: string;
}
export declare const ElSpinner: ElementumReactComponent<ElSpinnerProps>;

export interface ElStreamingTextProps extends ElementumReactBaseProps<ElementFor<'el-streaming-text'>> {
  text?: string;
  speed?: number;
  cursor?: boolean;
  'auto-start'?: boolean;
  onStreamStart?: (event: CustomEvent<any> & Event) => void;
  onStreamEnd?: (event: CustomEvent<any> & Event) => void;
  onStreamTick?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElStreamingText: ElementumReactComponent<ElStreamingTextProps>;

export interface ElSwitchProps extends ElementumReactBaseProps<ElementFor<'el-switch'>> {
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElSwitch: ElementumReactComponent<ElSwitchProps>;

export interface ElTableProps extends ElementumReactBaseProps<ElementFor<'el-table'>> {
  selectable?: boolean;
  onSort?: (event: CustomEvent<any> & Event) => void;
  onSelectionChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElTable: ElementumReactComponent<ElTableProps>;

export interface ElTabsProps extends ElementumReactBaseProps<ElementFor<'el-tabs'>> {
  value?: string;
  onTabChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElTabs: ElementumReactComponent<ElTabsProps>;

export interface ElTabProps extends ElementumReactBaseProps<ElementFor<'el-tab'>> {
  label?: string;
  value?: string;
}
export declare const ElTab: ElementumReactComponent<ElTabProps>;

export interface ElTaskListProps extends ElementumReactBaseProps<ElementFor<'el-task-list'>> {
  heading?: string;
  tasks?: string;
  compact?: string;
}
export declare const ElTaskList: ElementumReactComponent<ElTaskListProps>;

export interface ElTextareaProps extends ElementumReactBaseProps<ElementFor<'el-textarea'>> {
  placeholder?: string;
  rows?: number;
  'auto-resize'?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxlength?: number;
  onInput?: (event: CustomEvent<any> & Event) => void;
  onChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElTextarea: ElementumReactComponent<ElTextareaProps>;

export interface ElThemeSwitchProps extends ElementumReactBaseProps<ElementFor<'el-theme-switch'>> {
  onThemeChange?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElThemeSwitch: ElementumReactComponent<ElThemeSwitchProps>;

export interface ElTimelineProps extends ElementumReactBaseProps<ElementFor<'el-timeline'>> {
  orientation?: 'vertical' | 'horizontal';
}
export declare const ElTimeline: ElementumReactComponent<ElTimelineProps>;

export interface ElTimelineItemProps extends ElementumReactBaseProps<ElementFor<'el-timeline-item'>> {
  status?: 'default' | 'active' | 'success' | 'warning' | 'destructive';
  date?: string;
}
export declare const ElTimelineItem: ElementumReactComponent<ElTimelineItemProps>;

export interface ElToasterProps extends ElementumReactBaseProps<ElementFor<'el-toaster'>> {
}
export declare const ElToaster: ElementumReactComponent<ElToasterProps>;

export interface ElToastProps extends ElementumReactBaseProps<ElementFor<'el-toast'>> {
}
export declare const ElToast: ElementumReactComponent<ElToastProps>;

export interface ElToggleProps extends ElementumReactBaseProps<ElementFor<'el-toggle'>> {
}
export declare const ElToggle: ElementumReactComponent<ElToggleProps>;

export interface ElToggleGroupProps extends ElementumReactBaseProps<ElementFor<'el-toggle-group'>> {
  type?: string;
  value?: string;
  disabled?: string;
}
export declare const ElToggleGroup: ElementumReactComponent<ElToggleGroupProps>;

export interface ElToolCallProps extends ElementumReactBaseProps<ElementFor<'el-tool-call'>> {
  name?: string;
  status?: string;
  args?: string;
  result?: string;
  'call-id'?: string;
  approval?: string;
  open?: string;
}
export declare const ElToolCall: ElementumReactComponent<ElToolCallProps>;

export interface ElToolbarProps extends ElementumReactBaseProps<ElementFor<'el-toolbar'>> {
}
export declare const ElToolbar: ElementumReactComponent<ElToolbarProps>;

export interface ElTooltipProps extends ElementumReactBaseProps<ElementFor<'el-tooltip'>> {
  content?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}
export declare const ElTooltip: ElementumReactComponent<ElTooltipProps>;

export interface ElTreeViewProps extends ElementumReactBaseProps<ElementFor<'el-tree-view'>> {
}
export declare const ElTreeView: ElementumReactComponent<ElTreeViewProps>;

export interface ElTreeItemProps extends ElementumReactBaseProps<ElementFor<'el-tree-item'>> {
  label?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onExpand?: (event: CustomEvent<any> & Event) => void;
  onCollapse?: (event: CustomEvent<any> & Event) => void;
  onSelect?: (event: CustomEvent<any> & Event) => void;
}
export declare const ElTreeItem: ElementumReactComponent<ElTreeItemProps>;

export interface ElVisuallyHiddenProps extends ElementumReactBaseProps<ElementFor<'el-visually-hidden'>> {
}
export declare const ElVisuallyHidden: ElementumReactComponent<ElVisuallyHiddenProps>;
