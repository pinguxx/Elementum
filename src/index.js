/**
 * Elementum Public API
 */

export { Elementum } from './elementum.js';
export { html, svg, css, render, CSSResult, TemplateResult } from './template.js';
export { signal, computed, effect, isSignal, Signal, Computed } from './signal.js';

// Component Exports
export { ElButton } from './components/el-button.js';
export { ElBadge } from './components/el-badge.js';
export { ElInput } from './components/el-input.js';
export { ElDropdown } from './components/el-dropdown.js';
export { ElCalendar } from './components/el-calendar.js';
export { ElDatepicker } from './components/el-datepicker.js';
export { ElDialog } from './components/el-dialog.js';
export { ElTabs, ElTab } from './components/el-tabs.js';
export { ElSelect } from './components/el-select.js';
export { ElToaster, toast } from './components/el-toast.js';
export { ElThemeSwitch } from './components/el-theme-switch.js';
export { ElSwitch } from './components/el-switch.js';
export { ElTooltip } from './components/el-tooltip.js';
export { ElAccordion, ElAccordionItem } from './components/el-accordion.js';
export { ElTable } from './components/el-table.js';
export { ElProgress } from './components/el-progress.js';
export { ElSpinner } from './components/el-spinner.js';
export { ElAvatar, ElAvatarGroup } from './components/el-avatar.js';
export { ElDrawer } from './components/el-drawer.js';
export { ElSegmentedControl } from './components/el-segmented-control.js';
export { ElPagination } from './components/el-pagination.js';
export { ElChip } from './components/el-chip.js';
export { ElAutocomplete } from './components/el-autocomplete.js';
export { ElNumberFlow } from './components/el-number-flow.js';
export { ElOtpInput } from './components/el-otp-input.js';
export { ElCommand, ElCommandGroup, ElCommandItem } from './components/el-command.js';
export { ElPromptInput } from './components/el-prompt-input.js';
export { ElReasoningCard } from './components/el-reasoning-card.js';
export { ElBorderBeam } from './components/el-border-beam.js';
export { ElStreamingText } from './components/el-streaming-text.js';
export { ElChart } from './components/el-chart.js';
export { ElField } from './components/el-field.js';
export { ElNumberField } from './components/el-number-field.js';

// Base UI Primitives
export { ElSlider } from './components/el-slider.js';
export { ElPopover } from './components/el-popover.js';
export { ElCollapsible } from './components/el-collapsible.js';
export { ElScrollArea } from './components/el-scroll-area.js';
export { ElToggle, ElToggleGroup } from './components/el-toggle.js';
export { ElCheckbox } from './components/el-checkbox.js';
export { ElRadio, ElRadioGroup } from './components/el-radio.js';
export { ElPreviewCard } from './components/el-preview-card.js';
export { ElAlertDialog } from './components/el-alert-dialog.js';
export { ElSeparator } from './components/el-separator.js';
export { ElMeter } from './components/el-meter.js';
export { ElToolbar } from './components/el-toolbar.js';
export { ElContextMenu } from './components/el-context-menu.js';
export { ElMenubar } from './components/el-menubar.js';

// Base UI & shadcn/ui Complete Suite
export { ElSkeleton } from './components/el-skeleton.js';
export { ElBreadcrumb, ElBreadcrumbItem } from './components/el-breadcrumb.js';
export { ElKbd } from './components/el-kbd.js';
export { ElAlert } from './components/el-alert.js';
export { ElCard, ElCardHeader, ElCardTitle, ElCardDescription, ElCardContent, ElCardFooter } from './components/el-card.js';
export { ElAspectRatio } from './components/el-aspect-ratio.js';
export { ElTextarea } from './components/el-textarea.js';
export { ElResizable, ElResizablePanel, ElResizableHandle } from './components/el-resizable.js';
export { ElCarousel, ElCarouselSlide } from './components/el-carousel.js';
export { ElTimeline, ElTimelineItem } from './components/el-timeline.js';
export { ElTreeView, ElTreeItem } from './components/el-tree-view.js';
export { ElEmptyState } from './components/el-empty-state.js';
export { ElRating } from './components/el-rating.js';
export { ElDropzone } from './components/el-dropzone.js';
export { ElSidebar, ElSidebarHeader, ElSidebarContent, ElSidebarFooter, ElSidebarTrigger } from './components/el-sidebar.js';
export { ElForm, ElFieldset } from './components/el-form.js';

// Radix Primitives & SPA Architecture Suite
export { ElRouter, ElRoute, ElRouteLink, currentRoute, navigate } from './components/el-router.js';
export { ElCallout } from './components/el-callout.js';
export { ElDataList, ElDataListItem } from './components/el-data-list.js';
export { ElRadioCard, ElRadioCardGroup } from './components/el-radio-card.js';
export { ElCheckboxCard } from './components/el-checkbox-card.js';
export { ElNavigationMenu, ElNavigationMenuItem, ElNavigationMenuTrigger, ElNavigationMenuContent } from './components/el-navigation-menu.js';
export { ElInset } from './components/el-inset.js';
export { ElVisuallyHidden } from './components/el-visually-hidden.js';
export { ElNavbar } from './components/el-navbar.js';
export { ElCodeBlock } from './components/el-code-block.js';
export { ElToolCall } from './components/el-tool-call.js';
export { ElDiffViewer, computeLineDiff } from './components/el-diff-viewer.js';
export { ElSources } from './components/el-sources.js';
export { ElTaskList } from './components/el-task-list.js';
export { ElInsightCard } from './components/el-insight-card.js';

// AG-UI Protocol Adapter (Streaming Events, State Deltas, & Signal Bindings)
export { createAgUiStore, applyJsonPatch, getByPointer } from './ag-ui.js';

// Server-Side Rendering (Declarative Shadow DOM)
export { renderTemplateToString, renderComponentToDSD } from './ssr.js';
export {
  setHostState,
  isRTL,
  formatLocaleNumber,
  formatLocaleDate,
  announce,
  clearAnnouncer,
  createPressBehavior,
  createRovingFocus,
  createDismissableLayer,
  createSelectionBehavior,
  createReorderBehavior,
  splitMatchSegments,
  highlightMatch,
  prefersReducedMotion,
  createPresenceBehavior,
} from './behaviors/index.js';
