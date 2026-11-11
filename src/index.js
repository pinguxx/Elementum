/**
 * Elementum Public API
 */

export { Elementum } from './elementum.js';
export { html, css, render, CSSResult, TemplateResult } from './template.js';
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

// Server-Side Rendering (Declarative Shadow DOM)
export { renderTemplateToString, renderComponentToDSD } from './ssr.js';
