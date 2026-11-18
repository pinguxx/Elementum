import fs from 'fs';
import path from 'path';

const categories = [
  { id: 'actions', title: 'Actions & Buttons', icon: '⚡', description: 'Trigger actions, keyboard commands, and toolbars' },
  { id: 'forms', title: 'Forms & Inputs', icon: '📝', description: 'Form-associated controls, validation, and rich data entry' },
  { id: 'data', title: 'Data Display', icon: '📊', description: 'Tabular data, charts, metrics, trees, and avatars' },
  { id: 'feedback', title: 'Feedback & Status', icon: '🔔', description: 'Toasts, alerts, spinners, and loading states' },
  { id: 'overlays', title: 'Overlays & Dialogs', icon: '🪟', description: 'Modals, Vaul-style bottom sheets, popovers, and tooltips' },
  { id: 'navigation', title: 'Navigation', icon: '🧭', description: 'Tabs, menus, breadcrumbs, pagination, and sidebars' },
  { id: 'layout', title: 'Layout & Primitives', icon: '📐', description: 'Cards, scroll areas, split resizers, and accordions' },
  { id: 'ai', title: 'AI & Specialist', icon: '✨', description: 'Generative prompt inputs, token streaming, and reasoning cards' }
];

const catalog = {
  // 1. Actions & Buttons
  'el-button': {
    tag: 'el-button',
    name: 'Button',
    category: 'actions',
    description: 'Frameworkless, signal-driven button with Figma variant parity, form submission, and accessible states.',
    formAssociated: true,
    props: [
      { name: 'variant', type: 'select', options: ['primary', 'secondary', 'danger', 'ghost'], default: 'primary', description: 'Visual style variant matching design tokens.' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], default: 'md', description: 'Button size scaling padding and font size.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Disables interaction, washes out tone, and sets cursor to not-allowed.' },
      { name: 'type', type: 'select', options: ['button', 'submit', 'reset'], default: 'button', description: 'Native HTML button behavior in forms.' },
      { name: 'label', type: 'text', default: 'Interactive Button', description: 'Button text rendered via slot or label attribute fallback.' }
    ],
    slots: [
      { name: 'default', description: 'Main button label content.' },
      { name: 'prefix', description: 'Icon or badge prepended before the label.' },
      { name: 'suffix', description: 'Icon or badge appended after the label.' }
    ],
    events: [
      { name: 'click', description: 'Standard native click event (blocked when disabled).' }
    ],
    cssParts: [
      { name: 'button', description: 'The internal native button element.' }
    ],
    cssVars: [
      { name: '--el-color-primary', default: '#2563eb', description: 'Primary button background.' },
      { name: '--el-color-primary-hover', default: '#1d4ed8', description: 'Hover background.' }
    ],
    render: (p) => `<el-button variant="${p.variant}" size="${p.size}" ${p.disabled ? 'disabled' : ''} type="${p.type}">${p.label}</el-button>`,
    examples: [
      { title: 'Primary & Variants', code: '<el-button variant="primary">Primary</el-button>\n<el-button variant="secondary">Secondary</el-button>\n<el-button variant="danger">Delete</el-button>\n<el-button variant="ghost">Ghost</el-button>' },
      { title: 'Sizes & Icons', code: '<el-button size="sm">Small</el-button>\n<el-button size="md">\n  <span slot="prefix">⚡</span> Medium\n</el-button>\n<el-button size="lg">\n  Large <span slot="suffix">→</span>\n</el-button>' },
      { title: 'Disabled State', code: '<el-button variant="primary" disabled>Disabled Primary</el-button>\n<el-button variant="secondary" disabled>Disabled Secondary</el-button>' }
    ]
  },
  'el-toggle': {
    tag: 'el-toggle',
    name: 'Toggle',
    category: 'actions',
    description: 'Two-state button that can be either on (pressed) or off (unpressed) with full ARIA press state.',
    props: [
      { name: 'pressed', type: 'boolean', default: false, description: 'Whether the toggle button is pressed.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Disables user interaction.' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], default: 'md', description: 'Component sizing.' },
      { name: 'label', type: 'text', default: 'Toggle Item', description: 'Text label.' }
    ],
    slots: [{ name: 'default', description: 'Toggle label or icon.' }],
    events: [{ name: 'change', description: 'Fired when pressed state changes: detail: { pressed }' }],
    render: (p) => `<el-toggle ${p.pressed ? 'pressed' : ''} ${p.disabled ? 'disabled' : ''} size="${p.size}">${p.label}</el-toggle>`,
    examples: [{ title: 'Basic Toggle', code: '<el-toggle pressed>Bold</el-toggle>\n<el-toggle>Italic</el-toggle>' }]
  },
  'el-kbd': {
    tag: 'el-kbd',
    name: 'Kbd',
    category: 'actions',
    description: 'Accessible keyboard shortcut pill rendering symbols and keys with clean typographic alignment.',
    props: [
      { name: 'keys', type: 'text', default: 'Cmd+K', description: 'Key combination string.' },
      { name: 'size', type: 'select', options: ['sm', 'md'], default: 'md', description: 'Display scale.' }
    ],
    slots: [{ name: 'default', description: 'Raw keys or text.' }],
    events: [],
    render: (p) => `<el-kbd keys="${p.keys}" size="${p.size}"></el-kbd>`,
    examples: [{ title: 'Shortcut Badges', code: '<el-kbd keys="Cmd+K"></el-kbd>\n<el-kbd keys="Ctrl+Shift+P"></el-kbd>' }]
  },

  // 2. Forms & Inputs
  'el-input': {
    tag: 'el-input',
    name: 'Input',
    category: 'forms',
    description: 'Form-associated text input with constraint validation, clear button, and prefix/suffix slots.',
    formAssociated: true,
    props: [
      { name: 'value', type: 'text', default: '', description: 'Current text value.' },
      { name: 'placeholder', type: 'text', default: 'Type something...', description: 'Placeholder hint text.' },
      { name: 'type', type: 'select', options: ['text', 'email', 'password', 'search', 'url', 'tel'], default: 'text', description: 'HTML input type.' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], default: 'md', description: 'Visual scale.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Disables the input.' },
      { name: 'required', type: 'boolean', default: false, description: 'Enforces required constraint validation.' }
    ],
    slots: [
      { name: 'prefix', description: 'Icon or text inside the left edge.' },
      { name: 'suffix', description: 'Icon or action button inside the right edge.' }
    ],
    events: [
      { name: 'input', description: 'Fired immediately on value change: detail: { value }' },
      { name: 'change', description: 'Fired on commit/blur: detail: { value }' }
    ],
    render: (p) => `<el-input placeholder="${p.placeholder}" value="${p.value}" type="${p.type}" size="${p.size}" ${p.disabled ? 'disabled' : ''} ${p.required ? 'required' : ''}></el-input>`,
    examples: [
      { title: 'Standard Input', code: '<el-input placeholder="Enter work email..." type="email"></el-input>' },
      { title: 'With Prefix Icon', code: '<el-input placeholder="Search records...">\n  <span slot="prefix">🔍</span>\n</el-input>' }
    ]
  },
  'el-slider': {
    tag: 'el-slider',
    name: 'Slider',
    category: 'forms',
    description: 'Precision range slider with keyboard step navigation, accessible ARIA slider role, and custom fills.',
    formAssociated: true,
    props: [
      { name: 'value', type: 'number', default: 45, description: 'Current numerical value.' },
      { name: 'min', type: 'number', default: 0, description: 'Minimum allowed value.' },
      { name: 'max', type: 'number', default: 100, description: 'Maximum allowed value.' },
      { name: 'step', type: 'number', default: 1, description: 'Step granularity.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Locks the slider value.' }
    ],
    slots: [],
    events: [
      { name: 'input', description: 'Fired during slider drag: detail: { value }' },
      { name: 'change', description: 'Fired upon releasing thumb: detail: { value }' }
    ],
    render: (p) => `<el-slider value="${p.value}" min="${p.min}" max="${p.max}" step="${p.step}" ${p.disabled ? 'disabled' : ''}></el-slider>`,
    examples: [{ title: 'Volume Slider', code: '<el-slider min="0" max="100" value="70"></el-slider>' }]
  },
  'el-switch': {
    tag: 'el-switch',
    name: 'Switch',
    category: 'forms',
    description: 'Toggle control that switches between on and off states with smooth GPU sliding thumb.',
    formAssociated: true,
    props: [
      { name: 'checked', type: 'boolean', default: true, description: 'Whether switch is active.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Locks switch interaction.' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], default: 'md', description: 'Switch scale.' },
      { name: 'label', type: 'text', default: 'Enable real-time telemetry', description: 'Switch text label rendered via slot or attribute fallback.' }
    ],
    slots: [{ name: 'default', description: 'Label text adjacent to switch.' }],
    events: [{ name: 'change', description: 'Fired on toggle: detail: { checked }' }],
    render: (p) => `<el-switch ${p.checked ? 'checked' : ''} ${p.disabled ? 'disabled' : ''} size="${p.size}">${p.label}</el-switch>`,
    examples: [{ title: 'Feature Toggle', code: '<el-switch checked>Dark Mode</el-switch>' }]
  },
  'el-select': {
    tag: 'el-select',
    name: 'Select',
    category: 'forms',
    description: 'Custom accessible select dropdown with keyboard roving focus, option slotting, and search filter.',
    formAssociated: true,
    props: [
      { name: 'value', type: 'text', default: 'us-east', description: 'Currently selected option value.' },
      { name: 'placeholder', type: 'text', default: 'Select Region...', description: 'Empty state placeholder.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Disables dropdown interaction.' }
    ],
    slots: [{ name: 'default', description: '<option> items.' }],
    events: [{ name: 'change', description: 'Fired on selection: detail: { value, label }' }],
    render: (p) => `<el-select value="${p.value}" placeholder="${p.placeholder}" ${p.disabled ? 'disabled' : ''}>
  <option value="us-east">US East (N. Virginia)</option>
  <option value="us-west">US West (Oregon)</option>
  <option value="eu-west">EU West (Dublin)</option>
  <option value="ap-east">Asia Pacific (Tokyo)</option>
</el-select>`,
    examples: [{ title: 'Region Picker', code: '<el-select value="us-east">\n  <option value="us-east">US East</option>\n  <option value="eu-west">EU West</option>\n</el-select>' }]
  },
  'el-segmented-control': {
    tag: 'el-segmented-control',
    name: 'Segmented Control',
    category: 'forms',
    description: 'Horizontal pill selector with animated sliding pill indicator and keyboard arrow navigation.',
    formAssociated: true,
    props: [
      { name: 'value', type: 'text', default: 'analytics', description: 'Selected segment option.' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], default: 'md', description: 'Control scale.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Disables segment selection.' }
    ],
    slots: [{ name: 'default', description: '<option> items representing segments.' }],
    events: [{ name: 'change', description: 'Fired on option select: detail: { value }' }],
    render: (p) => `<el-segmented-control value="${p.value}" size="${p.size}" ${p.disabled ? 'disabled' : ''}>
  <option value="overview">Overview</option>
  <option value="analytics">Analytics</option>
  <option value="reports">Reports</option>
  <option value="settings">Settings</option>
</el-segmented-control>`,
    examples: [{ title: 'View Switcher', code: '<el-segmented-control value="monthly">\n  <option value="monthly">Monthly</option>\n  <option value="annual">Annual (-20%)</option>\n</el-segmented-control>' }]
  },
  'el-number-field': {
    tag: 'el-number-field',
    name: 'Number Field',
    category: 'forms',
    description: 'Numeric input with increment/decrement steppers, arrow key acceleration, and min/max clamping.',
    formAssociated: true,
    props: [
      { name: 'value', type: 'number', default: 3, description: 'Current numeric value.' },
      { name: 'min', type: 'number', default: 1, description: 'Minimum allowed value.' },
      { name: 'max', type: 'number', default: 10, description: 'Maximum allowed value.' },
      { name: 'step', type: 'number', default: 1, description: 'Step size per increment.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Locks numeric changes.' }
    ],
    slots: [],
    events: [{ name: 'change', description: 'Fired on number change: detail: { value }' }],
    render: (p) => `<el-number-field value="${p.value}" min="${p.min}" max="${p.max}" step="${p.step}" ${p.disabled ? 'disabled' : ''}></el-number-field>`,
    examples: [{ title: 'Replica Stepper', code: '<el-number-field min="1" max="100" value="5"></el-number-field>' }]
  },
  'el-otp-input': {
    tag: 'el-otp-input',
    name: 'OTP Input',
    category: 'forms',
    description: 'Multi-cell one-time passcode verification input with auto-advance, backspace handling, and paste support.',
    formAssociated: true,
    props: [
      { name: 'length', type: 'number', default: 6, description: 'Number of passcode digits.' },
      { name: 'value', type: 'text', default: '', description: 'Current OTP value.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Locks OTP input.' }
    ],
    slots: [],
    events: [{ name: 'complete', description: 'Fired when all cells are filled: detail: { value }' }],
    render: (p) => `<el-otp-input length="${p.length}" value="${p.value}" ${p.disabled ? 'disabled' : ''}></el-otp-input>`,
    examples: [{ title: '2FA Passcode', code: '<el-otp-input length="6"></el-otp-input>' }]
  },

  // 3. Data Display
  'el-table': {
    tag: 'el-table',
    name: 'Table',
    category: 'data',
    description: 'High-performance reactive data table with column sorting, checkbox row multi-selection, and pagination.',
    props: [
      { name: 'selectable', type: 'boolean', default: true, description: 'Enables row selection checkboxes.' },
      { name: 'sortable', type: 'boolean', default: true, description: 'Enables interactive column sorting.' }
    ],
    slots: [],
    events: [
      { name: 'selection-change', description: 'Fired when row selection changes: detail: { selectedRows }' },
      { name: 'sort-change', description: 'Fired on column sort: detail: { column, direction }' }
    ],
    render: (p) => `<el-table ${p.selectable ? 'selectable' : ''} ${p.sortable ? 'sortable' : ''} id="catalog-demo-table" style="width:100%;"></el-table>`,
    examples: [{ title: 'Reactive Table', code: 'const table = document.querySelector("el-table");\ntable.columns = [\n  { key: "id", label: "ID" },\n  { key: "service", label: "Service" },\n  { key: "status", label: "Status" }\n];\ntable.data = [\n  { id: "SRV-01", service: "Gateway API", status: "Healthy" },\n  { id: "SRV-02", service: "Auth Service", status: "Healthy" }\n];' }]
  },
  'el-chart': {
    tag: 'el-chart',
    name: 'Chart',
    category: 'data',
    description: 'GPU-accelerated SVG time-series chart with smooth Bezier curves, secondary baseline, and high-contrast tooltip.',
    props: [
      { name: 'curve', type: 'select', options: ['smooth', 'linear', 'step'], default: 'smooth', description: 'SVG line interpolation curve.' },
      { name: 'secondary-key', type: 'text', default: 'previous', description: 'Key for dotted baseline comparison curve.' },
      { name: 'title', type: 'text', default: 'Throughput (Req/sec)', description: 'Chart header title.' }
    ],
    slots: [],
    events: [],
    render: (p) => `<el-chart title="${p.title}" curve="${p.curve}" secondary-key="${p.secondaryKey || 'previous'}" id="catalog-demo-chart" style="width:100%; max-width:680px;"></el-chart>`,
    examples: [{ title: 'Traffic Chart', code: '<el-chart title="Network Traffic" curve="smooth" secondary-key="baseline"></el-chart>' }]
  },
  'el-badge': {
    tag: 'el-badge',
    name: 'Badge',
    category: 'data',
    description: 'Small numeric or text pill highlighting status, unread counts, and metadata tags.',
    props: [
      { name: 'variant', type: 'select', options: ['primary', 'secondary', 'success', 'warning', 'danger', 'outline'], default: 'success', description: 'Color token variant.' },
      { name: 'count', type: 'text', default: 'Active', description: 'Badge display label or count.' }
    ],
    slots: [{ name: 'default', description: 'Optional slotted content.' }],
    events: [],
    render: (p) => `<el-badge variant="${p.variant}" count="${p.count}"></el-badge>`,
    examples: [{ title: 'Status Badges', code: '<el-badge variant="success" count="Healthy"></el-badge>\n<el-badge variant="danger" count="Degraded"></el-badge>' }]
  },
  'el-avatar': {
    tag: 'el-avatar',
    name: 'Avatar',
    category: 'data',
    description: 'User avatar supporting image photos, automatic initials derivation, and presence status indicators.',
    props: [
      { name: 'name', type: 'text', default: 'Alex Mercer', description: 'User full name used to derive initials.' },
      { name: 'src', type: 'text', default: '', description: 'Image URL.' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], default: 'md', description: 'Avatar dimensions.' },
      { name: 'status', type: 'select', options: ['online', 'offline', 'busy', 'away', 'none'], default: 'online', description: 'Online presence indicator dot.' }
    ],
    slots: [],
    events: [],
    render: (p) => `<el-avatar name="${p.name}" ${p.src ? `src="${p.src}"` : ''} size="${p.size}" status="${p.status}"></el-avatar>`,
    examples: [{ title: 'Avatar with Status', code: '<el-avatar name="Sarah Chen" status="online"></el-avatar>' }]
  },

  // 4. Feedback & Status
  'el-toast': {
    tag: 'el-toast',
    name: 'Toast / Toaster',
    category: 'feedback',
    description: 'Sonner-grade notification cards with 3D stacking, hover expansion, swipe dismissal, and in-place reactive promises.',
    props: [
      { name: 'variant', type: 'select', options: ['info', 'success', 'error', 'warning'], default: 'success', description: 'Visual status variant.' },
      { name: 'title', type: 'text', default: 'Deployment Successful', description: 'Toast title message.' },
      { name: 'description', type: 'text', default: 'All 5 edge clusters running v2.4.0.', description: 'Toast secondary description.' }
    ],
    slots: [],
    events: [],
    render: (p) => `<el-button variant="primary" onclick="toast.${p.variant}('${p.title}', { description: '${p.description}', action: { label: 'View', onClick: () => alert('Viewing deploy!') } })">Trigger Toast 🔔</el-button>`,
    examples: [
      { title: 'Standard Toast', code: 'toast.success("Build deployed successfully!");' },
      { title: 'Reactive Promise', code: 'toast.promise(fetch("/api/data"), {\n  loading: "Syncing data...",\n  success: "All records synced!",\n  error: "Sync failed"\n});' }
    ]
  },
  'el-alert': {
    tag: 'el-alert',
    name: 'Alert',
    category: 'feedback',
    description: 'Prominent contextual alert banner with icon slots and optional dismiss button.',
    props: [
      { name: 'variant', type: 'select', options: ['default', 'info', 'success', 'warning', 'destructive'], default: 'warning', description: 'Alert semantic variant.' },
      { name: 'title', type: 'text', default: 'Maintenance Scheduled', description: 'Alert headline.' },
      { name: 'dismissible', type: 'boolean', default: true, description: 'Shows close dismiss button.' },
      { name: 'message', type: 'text', default: 'Cluster node failover rehearsal begins at 02:00 UTC.', description: 'Body text.' }
    ],
    slots: [{ name: 'default', description: 'Alert description.' }],
    events: [{ name: 'dismiss', description: 'Emitted when user dismisses the alert.' }],
    render: (p) => `<el-alert variant="${p.variant}" title="${p.title}" ${p.dismissible ? 'dismissible' : ''}>${p.message}</el-alert>`,
    examples: [{ title: 'Warning Banner', code: '<el-alert variant="warning" title="Warning" dismissible>High memory usage detected.</el-alert>' }]
  },

  // 5. Overlays & Dialogs
  'el-drawer': {
    tag: 'el-drawer',
    name: 'Drawer (Vaul Bottom Sheet)',
    category: 'overlays',
    description: 'Vaul-inspired bottom sheet with background scaling, multi-stop snap points, drag physics, and pull-to-dismiss.',
    props: [
      { name: 'placement', type: 'select', options: ['bottom', 'right', 'left', 'top'], default: 'bottom', description: 'Drawer slide-in placement.' },
      { name: 'scale-background', type: 'boolean', default: true, description: 'Scales down underlying wrapper for iOS depth effect.' },
      { name: 'snap-points', type: 'text', default: '0.38, 0.72, 1', description: 'Discrete resting snap heights (ratios, percentages, or px).' },
      { name: 'handle', type: 'boolean', default: true, description: 'Renders top drag handle affordance bar.' },
      { name: 'title', type: 'text', default: 'Diagnostics & Metrics', description: 'Drawer header title.' }
    ],
    slots: [
      { name: 'default', description: 'Body content of drawer.' },
      { name: 'footer', description: 'Action buttons container.' }
    ],
    events: [
      { name: 'open', description: 'Emitted when drawer opens.' },
      { name: 'close', description: 'Emitted when drawer closes.' }
    ],
    render: (p) => `<el-button variant="primary" onclick="document.getElementById('catalog-live-drawer')?.show()">Open ${p.placement === 'bottom' ? 'Vaul Bottom Sheet' : 'Drawer'} 📱</el-button>
<el-drawer id="catalog-live-drawer" placement="${p.placement}" ${p.scaleBackground ? 'scale-background' : ''} snap-points="${p.snapPoints}" handle="${p.handle}" title="${p.title}">
  <p style="color:var(--el-text-secondary); margin:0 0 16px 0;">Interactive iOS-style drawer featuring gesture tracking, snap points (${p.snapPoints}), and background scaling.</p>
  <el-slider value="65"></el-slider>
  <div slot="footer">
    <el-button variant="secondary" onclick="document.getElementById('catalog-live-drawer')?.close()">Dismiss</el-button>
    <el-button variant="primary" onclick="toast.success('Settings saved'); document.getElementById('catalog-live-drawer')?.close()">Confirm</el-button>
  </div>
</el-drawer>`,
    examples: [
      { title: 'Vaul Bottom Sheet', code: '<el-drawer placement="bottom" scale-background snap-points="0.4, 0.75, 1" handle title="Details">\n  <p>Scrollable sheet content...</p>\n</el-drawer>' },
      { title: 'Side Slide-Over', code: '<el-drawer placement="right" title="Filter Records">\n  <p>Filters form...</p>\n</el-drawer>' }
    ]
  },
  'el-dialog': {
    tag: 'el-dialog',
    name: 'Dialog',
    category: 'overlays',
    description: 'Accessible modal dialog with native focus trapping, backdrop click dismissal, and escape key handling.',
    props: [
      { name: 'title', type: 'text', default: 'Confirm Configuration', description: 'Modal header title.' },
      { name: 'message', type: 'text', default: 'Are you sure you want to deploy configuration changes across all nodes?', description: 'Dialog content.' }
    ],
    slots: [
      { name: 'default', description: 'Dialog body.' },
      { name: 'footer', description: 'Action button row.' }
    ],
    events: [
      { name: 'open', description: 'Emitted on showModal.' },
      { name: 'close', description: 'Emitted on dialog dismiss.' }
    ],
    render: (p) => `<el-button variant="secondary" onclick="document.getElementById('catalog-live-dialog')?.showModal()">Open Dialog 🪟</el-button>
<el-dialog id="catalog-live-dialog" title="${p.title}">
  <p style="color:var(--el-text-secondary); margin:0;">${p.message}</p>
  <div slot="footer">
    <el-button variant="secondary" onclick="document.getElementById('catalog-live-dialog')?.close()">Cancel</el-button>
    <el-button variant="primary" onclick="toast.success('Confirmed!'); document.getElementById('catalog-live-dialog')?.close()">Proceed</el-button>
  </div>
</el-dialog>`,
    examples: [{ title: 'Modal Dialog', code: '<el-dialog title="Confirm Delete">\n  <p>Cannot be undone.</p>\n  <div slot="footer">\n    <el-button variant="danger">Delete</el-button>\n  </div>\n</el-dialog>' }]
  },
  'el-tooltip': {
    tag: 'el-tooltip',
    name: 'Tooltip',
    category: 'overlays',
    description: 'Accessible floating tooltip bubble with high-contrast theme tokens and smart screen positioning.',
    props: [
      { name: 'content', type: 'text', default: 'Quick search anything across clusters (Cmd+K)', description: 'Tooltip bubble message.' },
      { name: 'placement', type: 'select', options: ['top', 'bottom', 'left', 'right'], default: 'top', description: 'Placement relative to anchor.' }
    ],
    slots: [{ name: 'default', description: 'Anchor element.' }],
    events: [],
    render: (p) => `<el-tooltip content="${p.content}" placement="${p.placement}">
  <el-button variant="secondary">Hover or Focus Me 🎯</el-button>
</el-tooltip>`,
    examples: [{ title: 'Tooltip Anchor', code: '<el-tooltip content="Click to duplicate" placement="top">\n  <el-button size="sm">Duplicate</el-button>\n</el-tooltip>' }]
  },

  // 6. Navigation
  'el-tabs': {
    tag: 'el-tabs',
    name: 'Tabs',
    category: 'navigation',
    description: 'Accessible tab strip supporting horizontal arrow roving navigation and declarative panel switching.',
    props: [
      { name: 'value', type: 'text', default: 'tab-1', description: 'Active tab value.' }
    ],
    slots: [{ name: 'default', description: '<el-tab> and content panels.' }],
    events: [{ name: 'change', description: 'Fired when active tab switches: detail: { value }' }],
    render: (p) => `<el-tabs value="${p.value}" style="width:100%; max-width:500px;">
  <el-tab value="tab-1">Performance</el-tab>
  <el-tab value="tab-2">Security</el-tab>
  <el-tab value="tab-3">Billing</el-tab>
</el-tabs>`,
    examples: [{ title: 'Tab Navigation', code: '<el-tabs value="overview">\n  <el-tab value="overview">Overview</el-tab>\n  <el-tab value="logs">Live Logs</el-tab>\n</el-tabs>' }]
  },
  'el-sidebar': {
    tag: 'el-sidebar',
    name: 'Sidebar',
    category: 'navigation',
    description: 'Collapsible navigation sidebar with 56px collapsed icon rail, centered trigger, and tooltips.',
    props: [
      { name: 'collapsed', type: 'boolean', default: false, description: 'Collapses sidebar to compact icon rail.' }
    ],
    slots: [
      { name: 'header', description: 'Sidebar top branding.' },
      { name: 'default', description: 'Navigation items.' },
      { name: 'footer', description: 'User profile or status indicator.' }
    ],
    events: [{ name: 'toggle', description: 'Fired when collapsed state flips: detail: { collapsed }' }],
    render: (p) => `<el-sidebar ${p.collapsed ? 'collapsed' : ''} style="height:260px; border:1px solid var(--el-surface-border); border-radius:8px;">
  <el-sidebar-header>
    <span style="font-weight:700;">⚡ Studio</span>
    <el-sidebar-trigger></el-sidebar-trigger>
  </el-sidebar-header>
  <el-sidebar-content>
    <div style="padding:8px 12px; font-size:14px;">Dashboard</div>
    <div style="padding:8px 12px; font-size:14px;">Analytics</div>
  </el-sidebar-content>
</el-sidebar>`,
    examples: [{ title: 'Collapsible Sidebar', code: '<el-sidebar>\n  <el-sidebar-header>\n    <span>App</span>\n    <el-sidebar-trigger></el-sidebar-trigger>\n  </el-sidebar-header>\n</el-sidebar>' }]
  },

  // 7. Layout & Primitives
  'el-card': {
    tag: 'el-card',
    name: 'Card',
    category: 'layout',
    description: 'Structured container with modular sub-components for header, title, description, content, and footer.',
    props: [
      { name: 'title', type: 'text', default: 'Cluster Latency Health', description: 'Card title.' },
      { name: 'description', type: 'text', default: 'Real-time p99 round-trip latency across all active regions.', description: 'Card description.' }
    ],
    slots: [{ name: 'default', description: 'Card body.' }],
    events: [],
    render: (p) => `<el-card style="width:100%; max-width:440px;">
  <el-card-header>
    <el-card-title>${p.title}</el-card-title>
    <el-card-description>${p.description}</el-card-description>
  </el-card-header>
  <el-card-content>
    <div style="font-size:2rem; font-weight:800; color:var(--el-color-primary, #2563eb);">14.2 ms</div>
    <el-progress value="82" variant="primary" style="margin-top:8px;"></el-progress>
  </el-card-content>
  <el-card-footer style="display:flex; justify-content:space-between; align-items:center;">
    <span style="font-size:12px; color:var(--el-text-muted);">Updated 2s ago</span>
    <el-button size="sm" variant="secondary">Details</el-button>
  </el-card-footer>
</el-card>`,
    examples: [{ title: 'Stat Card', code: '<el-card>\n  <el-card-header>\n    <el-card-title>Revenue</el-card-title>\n  </el-card-header>\n</el-card>' }]
  },
  'el-accordion': {
    tag: 'el-accordion',
    name: 'Accordion',
    category: 'layout',
    description: 'Collapsible disclosure stack with smooth CSS height transition and single or multi-expansion modes.',
    props: [
      { name: 'multiple', type: 'boolean', default: false, description: 'Allows multiple accordion panels open simultaneously.' }
    ],
    slots: [{ name: 'default', description: '<el-accordion-item> children.' }],
    events: [{ name: 'change', description: 'Fired on panel toggle: detail: { value, open }' }],
    render: (p) => `<el-accordion ${p.multiple ? 'multiple' : ''} style="width:100%; max-width:540px;">
  <el-accordion-item title="What is @wc/elementum?" open>
    An ultra-lightweight, signal-driven Web Components design system with zero runtime dependencies.
  </el-accordion-item>
  <el-accordion-item title="Is it compatible with React or Vue?">
    Yes! Because these are standard HTML Custom Elements, they work seamlessly in React, Vue, Svelte, or vanilla HTML.
  </el-accordion-item>
</el-accordion>`,
    examples: [{ title: 'FAQ Accordion', code: '<el-accordion>\n  <el-accordion-item title="Question 1">Answer 1</el-accordion-item>\n</el-accordion>' }]
  },

  // 8. AI & Specialist
  'el-prompt-input': {
    tag: 'el-prompt-input',
    name: 'Prompt Input',
    category: 'ai',
    description: 'AI chat prompt bar with auto-expanding textarea, submit button, stop button, and character limiter.',
    props: [
      { name: 'placeholder', type: 'text', default: 'Ask Elementum Copilot or generate UI components...', description: 'Placeholder message.' },
      { name: 'disabled', type: 'boolean', default: false, description: 'Disables prompt input.' }
    ],
    slots: [],
    events: [{ name: 'submit', description: 'Fired when user presses Enter or clicks Send: detail: { prompt }' }],
    render: (p) => `<el-prompt-input placeholder="${p.placeholder}" ${p.disabled ? 'disabled' : ''} style="width:100%; max-width:600px;"></el-prompt-input>`,
    examples: [{ title: 'AI Assistant Input', code: '<el-prompt-input placeholder="Ask AI..."></el-prompt-input>' }]
  },
  'el-streaming-text': {
    tag: 'el-streaming-text',
    name: 'Streaming Text',
    category: 'ai',
    description: 'Typewriter-style token streamer simulating LLM response generation with blinking cursor affordance.',
    props: [
      { name: 'text', type: 'text', default: 'Deploying edge worker to 5 regions... 100% verified. Zero downtime observed.', description: 'Text to stream.' },
      { name: 'speed', type: 'number', default: 25, description: 'Delay per character in milliseconds.' }
    ],
    slots: [],
    events: [{ name: 'finish', description: 'Fired when token streaming completes.' }],
    render: (p) => `<el-streaming-text text="${p.text}" speed="${p.speed}"></el-streaming-text>`,
    examples: [{ title: 'Streaming LLM Output', code: '<el-streaming-text text="Analyzing request..." speed="30"></el-streaming-text>' }]
  },
  'el-reasoning-card': {
    tag: 'el-reasoning-card',
    name: 'Reasoning Card',
    category: 'ai',
    description: 'Chain-of-thought AI reasoning disclosure container with timer badge and pulsing thinking state.',
    props: [
      { name: 'thinking', type: 'boolean', default: false, description: 'Shows animated pulsing thinking state.' },
      { name: 'duration', type: 'text', default: '0.8s', description: 'Elapsed reasoning duration label.' },
      { name: 'title', type: 'text', default: 'Reasoning Trace', description: 'Headline title.' }
    ],
    slots: [{ name: 'default', description: 'Markdown or reasoning bullet points.' }],
    events: [],
    render: (p) => `<el-reasoning-card ${p.thinking ? 'thinking' : ''} duration="${p.duration}" title="${p.title}" style="width:100%; max-width:540px;">
  <p style="margin:0; font-size:13px; color:var(--el-text-secondary);">1. Inspected custom-elements.json manifest for 64 registered primitives.<br>2. Verified all signals and boolean attribute mappings.<br>3. Formulated interactive options matrix.</p>
</el-reasoning-card>`,
    examples: [{ title: 'AI Reasoning Block', code: '<el-reasoning-card duration="1.2s">\n  Thinking process here...\n</el-reasoning-card>' }]
  }
};

// Merge all components from custom-elements.json so 100% of components are present
const cm = JSON.parse(fs.readFileSync('custom-elements.json', 'utf8'));

const categoryMap = {
  'el-button': 'actions', 'el-toggle': 'actions', 'el-kbd': 'actions', 'el-toolbar': 'actions',
  'el-input': 'forms', 'el-textarea': 'forms', 'el-select': 'forms', 'el-autocomplete': 'forms',
  'el-slider': 'forms', 'el-switch': 'forms', 'el-checkbox': 'forms', 'el-checkbox-card': 'forms',
  'el-radio': 'forms', 'el-radio-card': 'forms', 'el-segmented-control': 'forms', 'el-number-field': 'forms',
  'el-otp-input': 'forms', 'el-datepicker': 'forms', 'el-calendar': 'forms', 'el-dropzone': 'forms',
  'el-rating': 'forms', 'el-field': 'forms', 'el-form': 'forms', 'el-fieldset': 'forms',
  'el-table': 'data', 'el-chart': 'data', 'el-tree-view': 'data', 'el-tree-item': 'data',
  'el-data-list': 'data', 'el-badge': 'data', 'el-chip': 'data', 'el-avatar': 'data',
  'el-avatar-group': 'data', 'el-timeline': 'data', 'el-timeline-item': 'data', 'el-meter': 'data',
  'el-progress': 'data', 'el-number-flow': 'data',
  'el-toast': 'feedback', 'el-toaster': 'feedback', 'el-alert': 'feedback', 'el-alert-dialog': 'feedback',
  'el-callout': 'feedback', 'el-spinner': 'feedback', 'el-skeleton': 'feedback', 'el-empty-state': 'feedback',
  'el-dialog': 'overlays', 'el-drawer': 'overlays', 'el-popover': 'overlays', 'el-tooltip': 'overlays',
  'el-preview-card': 'overlays', 'el-dropdown': 'overlays', 'el-context-menu': 'overlays', 'el-command': 'overlays',
  'el-tabs': 'navigation', 'el-tab': 'navigation', 'el-navigation-menu': 'navigation', 'el-menubar': 'navigation',
  'el-breadcrumb': 'navigation', 'el-breadcrumb-item': 'navigation', 'el-pagination': 'navigation',
  'el-sidebar': 'navigation', 'el-sidebar-header': 'navigation', 'el-sidebar-content': 'navigation',
  'el-sidebar-footer': 'navigation', 'el-sidebar-trigger': 'navigation', 'el-router': 'navigation',
  'el-card': 'layout', 'el-card-header': 'layout', 'el-card-title': 'layout', 'el-card-description': 'layout',
  'el-card-content': 'layout', 'el-card-footer': 'layout', 'el-scroll-area': 'layout', 'el-resizable': 'layout',
  'el-inset': 'layout', 'el-separator': 'layout', 'el-aspect-ratio': 'layout', 'el-collapsible': 'layout',
  'el-accordion': 'layout', 'el-accordion-item': 'layout', 'el-carousel': 'layout', 'el-carousel-slide': 'layout',
  'el-visually-hidden': 'layout',
  'el-prompt-input': 'ai', 'el-streaming-text': 'ai', 'el-reasoning-card': 'ai', 'el-border-beam': 'ai'
};

cm.modules.forEach(m => {
  m.declarations?.forEach(d => {
    if (!d.tagName) return;
    const tag = d.tagName;
    const cat = categoryMap[tag] || 'layout';

    if (!catalog[tag]) {
      const title = d.name.replace(/^El/, '').replace(/([A-Z])/g, ' $1').trim();
      const rawProps = (d.attributes || []).map(a => {
        let type = 'text';
        let options = undefined;
        const typeStr = a.type?.text || '';
        if (typeStr.includes('|')) {
          type = 'select';
          options = typeStr.split('|').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        } else if (typeStr === 'boolean') {
          type = 'boolean';
        } else if (typeStr === 'number') {
          type = 'number';
        }
        return {
          name: a.name,
          type,
          options,
          default: a.default ? a.default.replace(/^['"]|['"]$/g, '') : '',
          description: a.description || `Configures ${a.name} attribute.`
        };
      });

      catalog[tag] = {
        tag,
        name: title,
        category: cat,
        description: d.description || `Modern Web Component primitive <${tag}>.`,
        formAssociated: false,
        props: rawProps,
        slots: [{ name: 'default', description: 'Primary slotted content.' }],
        events: d.events || [],
        examples: [{ title: 'Basic Usage', code: `<${tag}></${tag}>` }]
      };
    } else {
      // Merge any manifest attributes and events that were missing
      const existingPropNames = new Set(catalog[tag].props.map(p => p.name));
      (d.attributes || []).forEach(a => {
        if (!existingPropNames.has(a.name)) {
          let type = 'text';
          let options = undefined;
          const typeStr = a.type?.text || '';
          if (typeStr.includes('|')) {
            type = 'select';
            options = typeStr.split('|').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          } else if (typeStr === 'boolean') {
            type = 'boolean';
          } else if (typeStr === 'number') {
            type = 'number';
          }
          catalog[tag].props.push({
            name: a.name,
            type,
            options,
            default: a.default ? a.default.replace(/^['"]|['"]$/g, '') : '',
            description: a.description || `Configures ${a.name} attribute.`
          });
        }
      });
      if (d.events?.length && (!catalog[tag].events || catalog[tag].events.length === 0)) {
        catalog[tag].events = d.events;
      }
    }
  });
});

const output = `// Auto-generated Component Catalog Schema & Metadata
export const categories = ${JSON.stringify(categories, null, 2)};

export const components = ${JSON.stringify(catalog, null, 2)};
`;

fs.writeFileSync('examples/catalog-data.js', output, 'utf8');
console.log('Successfully generated examples/catalog-data.js with ' + Object.keys(catalog).length + ' components across 8 categories.');
