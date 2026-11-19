export const categories = [
  {
    "id": "actions",
    "title": "Actions & Buttons",
    "icon": "⚡",
    "description": "Trigger actions, keyboard commands, and toolbars"
  },
  {
    "id": "forms",
    "title": "Forms & Inputs",
    "icon": "📝",
    "description": "Form-associated controls, validation, and rich data entry"
  },
  {
    "id": "data",
    "title": "Data Display",
    "icon": "📊",
    "description": "Tabular data, charts, metrics, trees, and avatars"
  },
  {
    "id": "feedback",
    "title": "Feedback & Status",
    "icon": "🔔",
    "description": "Toasts, alerts, spinners, and loading states"
  },
  {
    "id": "overlays",
    "title": "Overlays & Dialogs",
    "icon": "🪟",
    "description": "Modals, Vaul-style bottom sheets, popovers, and tooltips"
  },
  {
    "id": "navigation",
    "title": "Navigation",
    "icon": "🧭",
    "description": "Tabs, menus, breadcrumbs, pagination, and sidebars"
  },
  {
    "id": "layout",
    "title": "Layout & Primitives",
    "icon": "📐",
    "description": "Cards, scroll areas, split resizers, and accordions"
  },
  {
    "id": "ai",
    "title": "AI & Specialist",
    "icon": "✨",
    "description": "Generative prompt inputs, token streaming, and reasoning cards"
  }
];

export const components = {
  "el-button": {
    "tag": "el-button",
    "name": "Button",
    "category": "actions",
    "description": "Frameworkless, signal-driven button with Figma variant parity, form submission, and accessible states.",
    "formAssociated": true,
    "props": [
      {
        "name": "variant",
        "type": "select",
        "options": [
          "primary",
          "secondary",
          "danger",
          "ghost"
        ],
        "default": "primary",
        "description": "Visual style variant matching design tokens."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Button size scaling padding and typography."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables interaction and washes out tone."
      },
      {
        "name": "type",
        "type": "select",
        "options": [
          "button",
          "submit",
          "reset"
        ],
        "default": "button",
        "description": "Native HTML button behavior in forms."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Interactive Button",
        "description": "Button text rendered via slot or label attribute fallback."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Main button label content."
      },
      {
        "name": "prefix",
        "description": "Icon or badge prepended before the label."
      },
      {
        "name": "suffix",
        "description": "Icon or badge appended after the label."
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "Standard native click event (blocked when disabled)."
      }
    ],
    "cssParts": [
      {
        "name": "button",
        "description": "The internal native button element."
      }
    ],
    "cssVars": [
      {
        "name": "--el-color-primary",
        "default": "#2563eb",
        "description": "Primary button background."
      },
      {
        "name": "--el-color-primary-hover",
        "default": "#1d4ed8",
        "description": "Hover background."
      }
    ],
    "examples": [
      {
        "title": "Primary & Variants",
        "code": "<el-button variant=\"primary\">Primary</el-button>\n<el-button variant=\"secondary\">Secondary</el-button>\n<el-button variant=\"danger\">Delete</el-button>\n<el-button variant=\"ghost\">Ghost</el-button>"
      },
      {
        "title": "Sizes & Icons",
        "code": "<el-button size=\"sm\">Small</el-button>\n<el-button size=\"md\">\n  <span slot=\"prefix\">⚡</span> Medium\n</el-button>\n<el-button size=\"lg\">\n  Large <span slot=\"suffix\">→</span>\n</el-button>"
      },
      {
        "title": "Disabled State",
        "code": "<el-button variant=\"primary\" disabled>Disabled Primary</el-button>\n<el-button variant=\"secondary\" disabled>Disabled Secondary</el-button>"
      }
    ]
  },
  "el-toggle": {
    "tag": "el-toggle",
    "name": "Toggle",
    "category": "actions",
    "description": "Two-state button that can be either on (pressed) or off (unpressed) with full ARIA press state.",
    "props": [
      {
        "name": "pressed",
        "type": "boolean",
        "default": true,
        "description": "Whether the toggle button is pressed."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables user interaction."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Component sizing."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Toggle Item",
        "description": "Text label."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "variant",
        "type": "select",
        "options": [
          "default",
          "primary",
          "secondary",
          "danger",
          "success",
          "warning",
          "info",
          "outline"
        ],
        "default": "primary",
        "description": "Configures variant attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Toggle label or icon."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired when pressed state changes: detail: { pressed }"
      }
    ],
    "examples": [
      {
        "title": "Basic Toggle",
        "code": "<el-toggle pressed>Mute Microphone</el-toggle>"
      },
      {
        "title": "Toggle Sizes",
        "code": "<el-toggle size=\"sm\">Small</el-toggle>\n<el-toggle size=\"md\" pressed>Medium</el-toggle>\n<el-toggle size=\"lg\">Large</el-toggle>"
      }
    ]
  },
  "el-kbd": {
    "tag": "el-kbd",
    "name": "Kbd",
    "category": "actions",
    "description": "Accessible keyboard shortcut pill rendering symbols and keys with clean typographic alignment.",
    "props": [
      {
        "name": "keys",
        "type": "text",
        "default": "Cmd+K",
        "description": "Keyboard shortcut string."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Display scale."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Raw keys or text."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Shortcut Badges",
        "code": "<el-kbd keys=\"Cmd+K\"></el-kbd>\n<el-kbd keys=\"Ctrl+Shift+P\"></el-kbd>"
      }
    ]
  },
  "el-input": {
    "tag": "el-input",
    "name": "Input",
    "category": "forms",
    "description": "Form-associated text input with constraint validation, clear button, and prefix/suffix slots.",
    "formAssociated": true,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Current text value."
      },
      {
        "name": "placeholder",
        "type": "text",
        "default": "Type something...",
        "description": "Placeholder when empty."
      },
      {
        "name": "type",
        "type": "select",
        "options": [
          "text",
          "password",
          "email",
          "search",
          "url",
          "tel"
        ],
        "default": "text",
        "description": "Native input type."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables typing."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Form validation required."
      },
      {
        "name": "readonly",
        "type": "boolean",
        "default": false,
        "description": "Configures readonly attribute."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Configures size attribute."
      },
      {
        "name": "pattern",
        "type": "text",
        "default": "",
        "description": "Configures pattern attribute."
      },
      {
        "name": "minlength",
        "type": "text",
        "default": "",
        "description": "Configures minlength attribute."
      }
    ],
    "slots": [
      {
        "name": "prefix",
        "description": "Icon or text inside the left edge."
      },
      {
        "name": "suffix",
        "description": "Icon or action button inside the right edge."
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "Fired immediately on value change: detail: { value }"
      },
      {
        "name": "change",
        "description": "Fired on commit/blur: detail: { value }"
      }
    ],
    "examples": [
      {
        "title": "Text Inputs",
        "code": "<el-input placeholder=\"Enter username...\" clearable></el-input>\n<el-input type=\"password\" placeholder=\"Password\"></el-input>"
      }
    ]
  },
  "el-slider": {
    "tag": "el-slider",
    "name": "Slider",
    "category": "forms",
    "description": "Precision range slider with keyboard step navigation, accessible ARIA slider role, and custom fills.",
    "formAssociated": true,
    "props": [
      {
        "name": "value",
        "type": "number",
        "default": 50,
        "description": "Current numeric value."
      },
      {
        "name": "min",
        "type": "number",
        "default": 0,
        "description": "Minimum allowed value."
      },
      {
        "name": "max",
        "type": "number",
        "default": 100,
        "description": "Maximum allowed value."
      },
      {
        "name": "step",
        "type": "number",
        "default": 1,
        "description": "Granularity step."
      },
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Track orientation."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables slider."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form field name."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "input",
        "description": "Fired during slider drag: detail: { value }"
      },
      {
        "name": "change",
        "description": "Fired upon releasing thumb: detail: { value }"
      }
    ],
    "examples": [
      {
        "title": "Volume Slider",
        "code": "<el-slider value=\"75\" min=\"0\" max=\"100\" step=\"5\"></el-slider>"
      }
    ]
  },
  "el-switch": {
    "tag": "el-switch",
    "name": "Switch",
    "category": "forms",
    "description": "Toggle control that switches between on and off states with smooth GPU sliding thumb.",
    "formAssociated": true,
    "props": [
      {
        "name": "checked",
        "type": "boolean",
        "default": true,
        "description": "Switch toggle state."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables switch interaction."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Switch sizing."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Notification Alerts",
        "description": "Slotted or attribute text label."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Form required constraint."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form submission name."
      },
      {
        "name": "value",
        "type": "text",
        "default": "on",
        "description": "Form value when checked."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Label text adjacent to switch."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired on toggle: detail: { checked }"
      }
    ],
    "examples": [
      {
        "title": "Settings Toggles",
        "code": "<el-switch checked>Dark Mode</el-switch>\n<el-switch>Auto-deploy Updates</el-switch>"
      }
    ]
  },
  "el-select": {
    "tag": "el-select",
    "name": "Select",
    "category": "forms",
    "description": "Custom accessible select dropdown with keyboard roving focus, option slotting, and search filter.",
    "formAssociated": true,
    "props": [
      {
        "name": "value",
        "type": "select",
        "options": [
          "us-east",
          "us-west",
          "eu-west",
          "ap-northeast"
        ],
        "default": "us-east",
        "description": "Currently selected option value."
      },
      {
        "name": "placeholder",
        "type": "text",
        "default": "Select Region...",
        "description": "Empty state placeholder."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables dropdown interaction."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Marks select as required."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form submission name."
      },
      {
        "name": "options",
        "type": "text",
        "default": "",
        "description": "JSON or comma-separated options list."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "<option> items."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired on selection: detail: { value, label }"
      }
    ],
    "examples": [
      {
        "title": "Region Picker",
        "code": "<el-select value=\"us-east\">\n  <option value=\"us-east\">US East (N. Virginia)</option>\n  <option value=\"us-west\">US West (Oregon)</option>\n  <option value=\"eu-west\">EU West (Ireland)</option>\n  <option value=\"ap-northeast\">Asia Pacific (Tokyo)</option>\n</el-select>"
      }
    ]
  },
  "el-segmented-control": {
    "tag": "el-segmented-control",
    "name": "Segmented Control",
    "category": "forms",
    "description": "Horizontal pill selector with animated sliding pill indicator and keyboard arrow navigation.",
    "formAssociated": true,
    "props": [
      {
        "name": "value",
        "type": "select",
        "options": [
          "analytics",
          "reports",
          "monitoring",
          "settings"
        ],
        "default": "analytics",
        "description": "Selected segment option."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Control scale."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables segment selection."
      },
      {
        "name": "options",
        "type": "text",
        "default": "",
        "description": "JSON or comma-separated options list."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form submission name."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "<option> items representing segments."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired on option select: detail: { value }"
      }
    ],
    "examples": [
      {
        "title": "View Switcher",
        "code": "<el-segmented-control value=\"monthly\">\n  <option value=\"monthly\">Monthly</option>\n  <option value=\"annual\">Annual (-20%)</option>\n</el-segmented-control>"
      }
    ]
  },
  "el-number-field": {
    "tag": "el-number-field",
    "name": "Number Field",
    "category": "forms",
    "description": "Numeric input with increment/decrement steppers, arrow key acceleration, and min/max clamping.",
    "formAssociated": true,
    "props": [
      {
        "name": "value",
        "type": "number",
        "default": 10,
        "description": "Current numeric value."
      },
      {
        "name": "min",
        "type": "number",
        "default": 0,
        "description": "Minimum allowed value."
      },
      {
        "name": "max",
        "type": "number",
        "default": 100,
        "description": "Maximum allowed value."
      },
      {
        "name": "step",
        "type": "number",
        "default": 1,
        "description": "Increment/decrement step size."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables field."
      },
      {
        "name": "precision",
        "type": "number",
        "default": 0,
        "description": "Configures precision attribute."
      },
      {
        "name": "prefix",
        "type": "text",
        "default": "",
        "description": "Configures prefix attribute."
      },
      {
        "name": "suffix",
        "type": "text",
        "default": "",
        "description": "Configures suffix attribute."
      },
      {
        "name": "scrub",
        "type": "boolean",
        "default": false,
        "description": "Enables pointer drag scrubbing on label/input."
      },
      {
        "name": "readonly",
        "type": "boolean",
        "default": false,
        "description": "Configures readonly attribute."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Configures required attribute."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Configures name attribute."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "change",
        "description": "Fired on number change: detail: { value }"
      }
    ],
    "examples": [
      {
        "title": "Quantity Stepper",
        "code": "<el-number-field value=\"10\" min=\"0\" max=\"100\" step=\"1\"></el-number-field>"
      }
    ]
  },
  "el-otp-input": {
    "tag": "el-otp-input",
    "name": "OTP Input",
    "category": "forms",
    "description": "Multi-cell one-time passcode verification input with auto-advance, backspace handling, and paste support.",
    "formAssociated": true,
    "props": [
      {
        "name": "length",
        "type": "number",
        "default": 4,
        "description": "Number of digit input slots."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables all slots."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Full OTP code string."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Configures name attribute."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Configures required attribute."
      },
      {
        "name": "type",
        "type": "select",
        "options": [
          "text",
          "password"
        ],
        "default": "text",
        "description": "Display mode: visible digits ('text') or masked PIN bullets ('password')."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "complete",
        "description": "Fired when all cells are filled: detail: { value }"
      }
    ],
    "examples": [
      {
        "title": "2FA Verification Code",
        "code": "<el-otp-input length=\"4\"></el-otp-input>"
      }
    ]
  },
  "el-table": {
    "tag": "el-table",
    "name": "Table",
    "category": "data",
    "description": "High-performance reactive data table with column sorting, checkbox row multi-selection, and pagination.",
    "props": [
      {
        "name": "hover",
        "type": "boolean",
        "default": true,
        "description": "Highlights row on hover."
      },
      {
        "name": "striped",
        "type": "boolean",
        "default": true,
        "description": "Alternates row background colors."
      },
      {
        "name": "selectable",
        "type": "boolean",
        "default": true,
        "description": "Renders checkbox column for row selection."
      },
      {
        "name": "data",
        "type": "text",
        "default": "",
        "description": "Configures data attribute."
      },
      {
        "name": "columns",
        "type": "number",
        "default": 0,
        "description": "Configures columns attribute."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "selection-change",
        "description": "Fired when row selection changes: detail: { selectedRows }"
      },
      {
        "name": "sort-change",
        "description": "Fired on column sort: detail: { column, direction }"
      }
    ],
    "examples": [
      {
        "title": "Interactive Multi-Column Table",
        "code": "<el-table selectable data='[{\"region\":\"us-east-1\",\"status\":\"Active\",\"latency\":\"24ms\",\"qps\":\"14.2k req/s\"},{\"region\":\"eu-west-1\",\"status\":\"Active\",\"latency\":\"18ms\",\"qps\":\"11.8k req/s\"},{\"region\":\"ap-northeast-1\",\"status\":\"Active\",\"latency\":\"32ms\",\"qps\":\"8.4k req/s\"},{\"region\":\"sa-east-1\",\"status\":\"Standby\",\"latency\":\"110ms\",\"qps\":\"1.2k req/s\"}]' columns='[{\"key\":\"region\",\"label\":\"Region\",\"sortable\":true},{\"key\":\"status\",\"label\":\"Cluster Status\",\"sortable\":true},{\"key\":\"latency\",\"label\":\"Latency (p99)\",\"sortable\":true},{\"key\":\"qps\",\"label\":\"Throughput\",\"sortable\":true}]'></el-table>"
      }
    ]
  },
  "el-chart": {
    "tag": "el-chart",
    "name": "Chart",
    "category": "data",
    "description": "GPU-accelerated SVG time-series chart with smooth Bezier curves, secondary baseline, and high-contrast tooltip.",
    "props": [
      {
        "name": "type",
        "type": "select",
        "options": [
          "line",
          "bar",
          "area"
        ],
        "default": "line",
        "description": "Chart visualization type."
      },
      {
        "name": "curve",
        "type": "select",
        "options": [
          "smooth",
          "linear"
        ],
        "default": "smooth",
        "description": "Line/area interpolation curve style."
      },
      {
        "name": "height",
        "type": "number",
        "default": 220,
        "description": "Chart height in pixels."
      },
      {
        "name": "show-grid",
        "type": "boolean",
        "default": true,
        "description": "Displays horizontal grid lines."
      },
      {
        "name": "show-dots",
        "type": "boolean",
        "default": true,
        "description": "Renders data point markers."
      },
      {
        "name": "data",
        "type": "text",
        "default": "[{\"x\":\"00:00\",\"y\":1200},{\"x\":\"04:00\",\"y\":900},{\"x\":\"08:00\",\"y\":3400},{\"x\":\"12:00\",\"y\":5200},{\"x\":\"16:00\",\"y\":4800},{\"x\":\"20:00\",\"y\":2900}]",
        "description": "JSON dataset array with x and y coordinates."
      },
      {
        "name": "x-key",
        "type": "text",
        "default": "label",
        "description": "Data object key for the X-axis category."
      },
      {
        "name": "y-key",
        "type": "text",
        "default": "value",
        "description": "Data object key for the primary Y-axis metric."
      },
      {
        "name": "secondary-key",
        "type": "text",
        "default": "",
        "description": "Optional data object key for a comparison series."
      }
    ],
    "slots": [],
    "events": [],
    "examples": [
      {
        "title": "Throughput & Error Metrics",
        "code": "<el-chart type=\"line\" curve=\"smooth\" height=\"220\" show-grid show-dots data='[{\"label\":\"00:00\",\"value\":1200,\"secondary\":450},{\"label\":\"04:00\",\"value\":950,\"secondary\":320},{\"label\":\"08:00\",\"value\":3400,\"secondary\":1100},{\"label\":\"12:00\",\"value\":5200,\"secondary\":1850},{\"label\":\"16:00\",\"value\":4800,\"secondary\":1600},{\"label\":\"20:00\",\"value\":2900,\"secondary\":900}]'></el-chart>"
      }
    ]
  },
  "el-badge": {
    "tag": "el-badge",
    "name": "Badge",
    "category": "data",
    "description": "Small numeric or text pill highlighting status, unread counts, and metadata tags.",
    "props": [
      {
        "name": "variant",
        "type": "select",
        "options": [
          "primary",
          "secondary",
          "success",
          "danger",
          "warning",
          "info"
        ],
        "default": "primary",
        "description": "Badge color theme."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Badge scale."
      },
      {
        "name": "count",
        "type": "text",
        "default": "12",
        "description": "Numeric count or badge indicator."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Active",
        "description": "Optional text label."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Optional slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Status & Counter Badges",
        "code": "<div style=\"display: flex; gap: 8px; align-items: center; flex-wrap: wrap;\">\n  <el-badge variant=\"primary\" count=\"12\"></el-badge>\n  <el-badge variant=\"success\" count=\"LIVE\"></el-badge>\n  <el-badge variant=\"danger\" count=\"3 Alerts\"></el-badge>\n  <el-badge variant=\"warning\" count=\"Degraded\"></el-badge>\n  <el-badge variant=\"outline\" count=\"v2.4.1\"></el-badge>\n</div>"
      }
    ]
  },
  "el-avatar": {
    "tag": "el-avatar",
    "name": "Avatar",
    "category": "data",
    "description": "User avatar supporting image photos, automatic initials derivation, and presence status indicators.",
    "props": [
      {
        "name": "src",
        "type": "text",
        "default": "",
        "description": "Avatar image URL."
      },
      {
        "name": "name",
        "type": "text",
        "default": "Alex Morgan",
        "description": "User full name used for automatic initial computation."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg",
          "xl"
        ],
        "default": "md",
        "description": "Avatar circle diameter."
      },
      {
        "name": "status",
        "type": "select",
        "options": [
          "online",
          "offline",
          "busy",
          "away"
        ],
        "default": "online",
        "description": "Status dot indicator."
      },
      {
        "name": "alt",
        "type": "text",
        "default": "",
        "description": "Configures alt attribute."
      },
      {
        "name": "shape",
        "type": "text",
        "default": "",
        "description": "Configures shape attribute."
      }
    ],
    "slots": [],
    "events": [],
    "examples": [
      {
        "title": "User Avatars",
        "code": "<el-avatar name=\"Sarah Chen\" status=\"online\"></el-avatar>\n<el-avatar name=\"David Kim\" size=\"lg\" status=\"busy\"></el-avatar>\n<el-avatar name=\"Elena Rostova\" size=\"sm\"></el-avatar>"
      }
    ]
  },
  "el-toast": {
    "tag": "el-toast",
    "name": "Toast / Toaster",
    "category": "feedback",
    "description": "Sonner-grade notification cards with 3D stacking, hover expansion, swipe dismissal, and in-place reactive promises.",
    "props": [
      {
        "name": "message",
        "type": "text",
        "default": "Operation completed successfully!",
        "description": "Toast notification message."
      },
      {
        "name": "type",
        "type": "select",
        "options": [
          "success",
          "error",
          "info",
          "warning"
        ],
        "default": "success",
        "description": "Visual status indicator."
      },
      {
        "name": "duration",
        "type": "number",
        "default": 4000,
        "description": "Auto-dismiss timer in ms."
      }
    ],
    "slots": [],
    "events": [],
    "examples": [
      {
        "title": "Action Toasts",
        "code": "<el-button variant=\"primary\" onclick=\"toast.success('Changes saved to cluster!')\">Success Toast</el-button>\n<el-button variant=\"danger\" onclick=\"toast.error('Connection timed out.')\">Error Toast</el-button>"
      }
    ]
  },
  "el-alert": {
    "tag": "el-alert",
    "name": "Alert",
    "category": "feedback",
    "description": "Prominent contextual alert banner with icon slots and optional dismiss button.",
    "props": [
      {
        "name": "variant",
        "type": "select",
        "options": [
          "info",
          "success",
          "warning",
          "danger"
        ],
        "default": "info",
        "description": "Alert styling."
      },
      {
        "name": "title",
        "type": "text",
        "default": "System Maintenance",
        "description": "Alert header title."
      },
      {
        "name": "message",
        "type": "text",
        "default": "Scheduled maintenance will occur tonight at 02:00 UTC.",
        "description": "Alert body text."
      },
      {
        "name": "label",
        "type": "text",
        "default": "",
        "description": "Alternative label text."
      },
      {
        "name": "dismissible",
        "type": "boolean",
        "default": true,
        "description": "Shows close button."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Alert description."
      }
    ],
    "events": [
      {
        "name": "dismiss",
        "description": "Emitted when user dismisses the alert."
      }
    ],
    "examples": [
      {
        "title": "System Alert",
        "code": "<el-alert variant=\"warning\" title=\"API Deprecation\" dismissible>v1 endpoints will be sunset on Dec 31.</el-alert>\n<el-alert variant=\"success\" title=\"Backup Complete\">All 48 database shards verified.</el-alert>"
      }
    ]
  },
  "el-drawer": {
    "tag": "el-drawer",
    "name": "Drawer (Vaul Bottom Sheet)",
    "category": "overlays",
    "description": "Vaul-inspired bottom sheet with background scaling, multi-stop snap points, drag physics, and pull-to-dismiss.",
    "props": [
      {
        "name": "placement",
        "type": "select",
        "options": [
          "bottom",
          "top",
          "left",
          "right"
        ],
        "default": "bottom",
        "description": "Slide-in anchor edge."
      },
      {
        "name": "scale-background",
        "type": "boolean",
        "default": true,
        "description": "iOS-inspired background scale damping."
      },
      {
        "name": "snap-points",
        "type": "text",
        "default": "0.45, 0.8",
        "description": "Fractional drag snap points."
      },
      {
        "name": "handle",
        "type": "boolean",
        "default": true,
        "description": "Renders rounded top grab handle pill."
      },
      {
        "name": "title",
        "type": "text",
        "default": "Vaul-Inspired Mobile Sheet",
        "description": "Drawer title header."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Drawer visibility state."
      },
      {
        "name": "heading",
        "type": "text",
        "default": "",
        "description": "Configures heading attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Body content of drawer."
      },
      {
        "name": "footer",
        "description": "Action buttons container."
      }
    ],
    "events": [
      {
        "name": "open",
        "description": "Emitted when drawer opens."
      },
      {
        "name": "close",
        "description": "Emitted when drawer closes."
      }
    ],
    "examples": [
      {
        "title": "Bottom Sheet",
        "code": "<el-button variant=\"primary\" onclick=\"document.getElementById('demo-sheet').show()\">Open Bottom Sheet</el-button>\n<el-drawer id=\"demo-sheet\" placement=\"bottom\" snap-points=\"0.45, 0.8\" handle title=\"Quick Actions\">\n  <p style=\"margin: 0; color: var(--el-text-muted);\">Fluid bottom sheet with iOS rubberband gestures.</p>\n  <div slot=\"footer\">\n    <el-button variant=\"primary\" onclick=\"document.getElementById('demo-sheet').close()\">Confirm</el-button>\n  </div>\n</el-drawer>"
      }
    ]
  },
  "el-dialog": {
    "tag": "el-dialog",
    "name": "Dialog",
    "category": "overlays",
    "description": "Accessible modal dialog with native focus trapping, backdrop click dismissal, and escape key handling.",
    "props": [
      {
        "name": "title",
        "type": "text",
        "default": "Confirm Action",
        "description": "Modal title text."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Whether the dialog is open."
      },
      {
        "name": "heading",
        "type": "text",
        "default": "",
        "description": "Alternative header title."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Dialog body."
      },
      {
        "name": "footer",
        "description": "Action button row."
      }
    ],
    "events": [
      {
        "name": "open",
        "description": "Emitted on showModal."
      },
      {
        "name": "close",
        "description": "Emitted on dialog dismiss."
      }
    ],
    "examples": [
      {
        "title": "Standard Dialog",
        "code": "<el-button variant=\"primary\" onclick=\"document.getElementById('demo-dlg').showModal()\">Open Publish Dialog</el-button>\n<el-dialog id=\"demo-dlg\" title=\"Publish Version 2.0\">\n  <p style=\"margin: 0; color: var(--el-text-muted);\">Ready to deploy release build to all production targets.</p>\n  <div slot=\"footer\" style=\"display: flex; justify-content: flex-end; gap: 8px;\">\n    <el-button variant=\"secondary\" onclick=\"document.getElementById('demo-dlg').close()\">Cancel</el-button>\n    <el-button variant=\"primary\" onclick=\"document.getElementById('demo-dlg').close()\">Confirm</el-button>\n  </div>\n</el-dialog>"
      }
    ]
  },
  "el-tooltip": {
    "tag": "el-tooltip",
    "name": "Tooltip",
    "category": "overlays",
    "description": "Accessible floating tooltip bubble with high-contrast theme tokens and smart screen positioning.",
    "props": [
      {
        "name": "content",
        "type": "text",
        "default": "Keyboard shortcut: Cmd+Shift+P",
        "description": "Tooltip message text."
      },
      {
        "name": "placement",
        "type": "select",
        "options": [
          "top",
          "bottom",
          "left",
          "right"
        ],
        "default": "top",
        "description": "Bubble placement."
      },
      {
        "name": "delay",
        "type": "number",
        "default": 200,
        "description": "Hover show delay in ms."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables tooltip."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Anchor element."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Tooltip Hover",
        "code": "<el-tooltip content=\"Cmd+K to search\">\n  <el-button variant=\"secondary\">Hover or Focus Me</el-button>\n</el-tooltip>"
      }
    ]
  },
  "el-tabs": {
    "tag": "el-tabs",
    "name": "Tabs",
    "category": "navigation",
    "description": "Accessible tab strip supporting horizontal arrow roving navigation and declarative panel switching.",
    "props": [
      {
        "name": "value",
        "type": "select",
        "options": [
          "overview",
          "metrics",
          "settings"
        ],
        "default": "overview",
        "description": "Active tab value."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "<el-tab> and content panels."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired when active tab switches: detail: { value }"
      }
    ],
    "examples": [
      {
        "title": "Navigation Tabs",
        "code": "<el-tabs value=\"overview\">\n  <el-tab value=\"overview\" label=\"Overview\"><div style=\"padding: 12px;\">Overview cluster summary.</div></el-tab>\n  <el-tab value=\"metrics\" label=\"Metrics\"><div style=\"padding: 12px;\">Real-time p99 latency metrics.</div></el-tab>\n  <el-tab value=\"settings\" label=\"Settings\"><div style=\"padding: 12px;\">Auto-scaling settings.</div></el-tab>\n</el-tabs>"
      }
    ]
  },
  "el-sidebar": {
    "tag": "el-sidebar",
    "name": "Sidebar",
    "category": "navigation",
    "description": "Collapsible navigation sidebar with 56px collapsed icon rail, centered trigger, and tooltips.",
    "props": [
      {
        "name": "collapsed",
        "type": "boolean",
        "default": false,
        "description": "Whether sidebar is in slim collapsed mode."
      },
      {
        "name": "variant",
        "type": "select",
        "options": [
          "default",
          "floating",
          "inset"
        ],
        "default": "default",
        "description": "Sidebar visual layout variant."
      }
    ],
    "slots": [
      {
        "name": "header",
        "description": "Sidebar top branding."
      },
      {
        "name": "default",
        "description": "Navigation items."
      },
      {
        "name": "footer",
        "description": "User profile or status indicator."
      }
    ],
    "events": [
      {
        "name": "toggle",
        "description": "Fired when collapsed state flips: detail: { collapsed }"
      }
    ],
    "examples": [
      {
        "title": "Side Navigation",
        "code": "<el-sidebar id=\"ex-sidebar\">\n  <el-sidebar-header>\n    <span class=\"collapsible-text\" style=\"font-weight: 700;\">⚡ Console</span>\n    <el-sidebar-trigger for=\"ex-sidebar\"></el-sidebar-trigger>\n  </el-sidebar-header>\n  <el-sidebar-content>\n    <a href=\"#dash\" onclick=\"event.preventDefault()\" style=\"display: flex; align-items: center; gap: 8px; padding: 8px 10px; color: var(--el-text-base); text-decoration: none;\"><span>📊</span><span class=\"collapsible-text\">Dashboard</span></a>\n    <a href=\"#settings\" onclick=\"event.preventDefault()\" style=\"display: flex; align-items: center; gap: 8px; padding: 8px 10px; color: var(--el-text-base); text-decoration: none;\"><span>⚙️</span><span class=\"collapsible-text\">Settings</span></a>\n  </el-sidebar-content>\n</el-sidebar>"
      }
    ]
  },
  "el-card": {
    "tag": "el-card",
    "name": "Card",
    "category": "layout",
    "description": "Structured container with modular sub-components for header, title, description, content, and footer.",
    "props": [
      {
        "name": "title",
        "type": "text",
        "default": "Server Instance",
        "description": "Card title."
      },
      {
        "name": "bordered",
        "type": "boolean",
        "default": true,
        "description": "Displays subtle border outline."
      },
      {
        "name": "glass",
        "type": "boolean",
        "default": false,
        "description": "Frosted glass backdrop effect."
      },
      {
        "name": "hoverable",
        "type": "boolean",
        "default": true,
        "description": "Adds subtle hover lift and shadow."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Card body."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Surface Card",
        "code": "<el-card title=\"Cluster Status\" bordered hoverable>\n  <p style=\"margin: 0; color: var(--el-text-muted);\">99.99% uptime observed across 4 active availability zones.</p>\n</el-card>"
      }
    ]
  },
  "el-accordion": {
    "tag": "el-accordion",
    "name": "Accordion",
    "category": "layout",
    "description": "Collapsible disclosure stack with smooth CSS height transition and single or multi-expansion modes.",
    "props": [
      {
        "name": "multiple",
        "type": "boolean",
        "default": false,
        "description": "Allows multiple items to be opened simultaneously."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "<el-accordion-item> children."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired on panel toggle: detail: { value, open }"
      }
    ],
    "examples": [
      {
        "title": "FAQ Accordion",
        "code": "<el-accordion multiple>\n  <el-accordion-item title=\"What is Elementum?\" open>\n    <p style=\"margin: 0; color: var(--el-text-muted);\">A zero-dependency, signal-reactive Web Component design system.</p>\n  </el-accordion-item>\n  <el-accordion-item title=\"Can I use it with React or Vue?\">\n    <p style=\"margin: 0; color: var(--el-text-muted);\">Yes, it works natively with any web framework or vanilla HTML.</p>\n  </el-accordion-item>\n</el-accordion>"
      }
    ]
  },
  "el-prompt-input": {
    "tag": "el-prompt-input",
    "name": "Prompt Input",
    "category": "ai",
    "description": "AI chat prompt bar with auto-expanding textarea, submit button, stop button, and character limiter.",
    "props": [
      {
        "name": "placeholder",
        "type": "text",
        "default": "Ask Elementum Copilot anything...",
        "description": "Input placeholder."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables prompt input."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "loading",
        "type": "boolean",
        "default": false,
        "description": "Shows streaming/generating indicator."
      },
      {
        "name": "max-rows",
        "type": "number",
        "default": 6,
        "description": "Maximum auto-expanded rows."
      },
      {
        "name": "min-rows",
        "type": "number",
        "default": 1,
        "description": "Minimum visible rows."
      },
      {
        "name": "clear-on-submit",
        "type": "boolean",
        "default": true,
        "description": "Clears prompt after submit."
      },
      {
        "name": "autofocus",
        "type": "boolean",
        "default": false,
        "description": "Focuses prompt input on mount."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "submit",
        "description": "Fired when user presses Enter or clicks Send: detail: { prompt }"
      }
    ],
    "examples": [
      {
        "title": "AI Prompt Input",
        "code": "<el-prompt-input placeholder=\"Ask Elementum Copilot anything...\"></el-prompt-input>"
      }
    ]
  },
  "el-streaming-text": {
    "tag": "el-streaming-text",
    "name": "Streaming Text",
    "category": "ai",
    "description": "Typewriter-style token streamer simulating LLM response generation with blinking cursor affordance.",
    "props": [
      {
        "name": "text",
        "type": "text",
        "default": "Elementum provides signal-driven Web Components with zero runtime dependencies.",
        "description": "Text streamed character-by-character."
      },
      {
        "name": "speed",
        "type": "number",
        "default": 25,
        "description": "Typing delay in ms."
      },
      {
        "name": "cursor",
        "type": "text",
        "default": "▋",
        "description": "Cursor character displayed while streaming."
      },
      {
        "name": "auto-start",
        "type": "boolean",
        "default": true,
        "description": "Automatically starts token streaming on mount."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "finish",
        "description": "Fired when token streaming completes."
      }
    ],
    "examples": [
      {
        "title": "Streaming Output",
        "code": "<el-streaming-text text=\"Building ultra-fast UI components with signals.\" speed=\"30\"></el-streaming-text>"
      }
    ]
  },
  "el-reasoning-card": {
    "tag": "el-reasoning-card",
    "name": "Reasoning Card",
    "category": "ai",
    "description": "Chain-of-thought AI reasoning disclosure container with timer badge and pulsing thinking state.",
    "props": [
      {
        "name": "open",
        "type": "boolean",
        "default": true,
        "description": "Whether the reasoning disclosure is expanded."
      },
      {
        "name": "thinking",
        "type": "boolean",
        "default": true,
        "description": "Shows active thinking pulse indicator."
      },
      {
        "name": "duration",
        "type": "text",
        "default": "1.2s",
        "description": "Execution duration badge text."
      },
      {
        "name": "summary",
        "type": "text",
        "default": "Chain of Thought",
        "description": "Header summary label."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Markdown or reasoning bullet points."
      }
    ],
    "events": [
      {
        "name": "toggle",
        "description": "Fired when disclosure toggles: detail: { open }"
      }
    ],
    "examples": [
      {
        "title": "Chain of Thought",
        "code": "<el-reasoning-card title=\"Chain of Thought\" time=\"1.2s\" tokens=\"384\">\n  <p style=\"margin: 0; color: var(--el-text-muted); font-size: 0.875rem;\">Step 1: Ingested telemetry signals.<br>Step 2: Optimized route weights.<br>Step 3: Dispatched latency report.</p>\n</el-reasoning-card>"
      }
    ]
  },
  "el-accordion-item": {
    "tag": "el-accordion-item",
    "name": "Accordion Item",
    "category": "layout",
    "description": "Accessible disclosure item for accordion panel.",
    "formAssociated": false,
    "props": [
      {
        "name": "title",
        "type": "text",
        "default": "Accordion Title",
        "description": "Header accordion text."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Item expansion state."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables item."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "heading",
        "type": "text",
        "default": "Section",
        "description": "Alias for title setting the disclosure trigger heading."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Accordion Item",
        "code": "<el-accordion-item title=\"Section 1\" open>Content details</el-accordion-item>"
      }
    ]
  },
  "el-alert-dialog": {
    "tag": "el-alert-dialog",
    "name": "Alert Dialog",
    "category": "feedback",
    "description": "Modal confirmation dialog for destructive or high-impact actions.",
    "formAssociated": false,
    "props": [
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Whether modal dialog is open."
      },
      {
        "name": "title",
        "type": "text",
        "default": "Delete Database Cluster?",
        "description": "Dialog header title."
      },
      {
        "name": "heading",
        "type": "text",
        "default": "Confirm Action",
        "description": "Alias for title setting the alert dialog heading."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Destructive Action Dialog",
        "code": "<el-alert-dialog id=\"demo-alert-dlg\" title=\"Delete Production Instance?\">\n  <p style=\"margin: 0 0 16px 0; color: var(--el-text-muted);\">This action is irreversible and will purge all 14 active nodes.</p>\n  <div style=\"display: flex; justify-content: flex-end; gap: 8px;\">\n    <el-button variant=\"secondary\" onclick=\"document.getElementById('demo-alert-dlg').close()\">Cancel</el-button>\n    <el-button variant=\"danger\" onclick=\"document.getElementById('demo-alert-dlg').close()\">Delete Permanently</el-button>\n  </div>\n</el-alert-dialog>"
      }
    ]
  },
  "el-aspect-ratio": {
    "tag": "el-aspect-ratio",
    "name": "Aspect Ratio",
    "category": "layout",
    "description": "CLS-free container enforcing fixed aspect ratios for responsive media.",
    "formAssociated": false,
    "props": [
      {
        "name": "ratio",
        "type": "text",
        "default": "16/9",
        "description": "Aspect ratio (e.g. 16/9, 4/3, 1/1)."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "16:9 Frame",
        "code": "<el-aspect-ratio ratio=\"16/9\" style=\"background: var(--el-surface-muted); border-radius: 8px; display: flex; align-items: center; justify-content: center;\">\n  <span style=\"color: var(--el-text-muted);\">16:9 Video Canvas</span>\n</el-aspect-ratio>"
      }
    ]
  },
  "el-autocomplete": {
    "tag": "el-autocomplete",
    "name": "Autocomplete",
    "category": "forms",
    "description": "Form-associated combobox component supporting static data arrays, remote URL queries with debouncing, flexible key mapping, and ARIA 1.2 accessibility.",
    "formAssociated": false,
    "props": [
      {
        "name": "placeholder",
        "type": "text",
        "default": "Search technologies...",
        "description": "Input placeholder."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables combobox."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Form required constraint."
      },
      {
        "name": "multiple",
        "type": "boolean",
        "default": false,
        "description": "Enables multi-selection with inline chips."
      },
      {
        "name": "min-chars",
        "type": "number",
        "default": 1,
        "description": "Minimum characters before triggering dropdown."
      },
      {
        "name": "debounce",
        "type": "number",
        "default": 250,
        "description": "Debounce delay in ms."
      },
      {
        "name": "options",
        "type": "text",
        "default": "",
        "description": "JSON array of options or objects."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Configures name attribute."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "url",
        "type": "text",
        "default": "",
        "description": "Configures url attribute."
      },
      {
        "name": "query-param",
        "type": "text",
        "default": "",
        "description": "Configures query-param attribute."
      },
      {
        "name": "label-key",
        "type": "text",
        "default": "",
        "description": "Configures label-key attribute."
      },
      {
        "name": "value-key",
        "type": "text",
        "default": "",
        "description": "Configures value-key attribute."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Configures size attribute."
      },
      {
        "name": "data",
        "type": "text",
        "default": "",
        "description": "Configures data attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "select",
        "description": "Fired when an option is selected: detail: { item, value, label }"
      },
      {
        "name": "remove",
        "description": "Fired in multi-mode when a chip is removed: detail: { item, items, value }"
      },
      {
        "name": "change",
        "description": "Fired when value changes: detail: { value, label }"
      },
      {
        "name": "clear",
        "description": "Fired when input is cleared"
      }
    ],
    "examples": [
      {
        "title": "Language Selector",
        "code": "<el-autocomplete placeholder=\"Type language...\" options='[{\"label\":\"TypeScript\",\"value\":\"ts\"},{\"label\":\"JavaScript\",\"value\":\"js\"},{\"label\":\"Python\",\"value\":\"py\"},{\"label\":\"Rust\",\"value\":\"rs\"}]'></el-autocomplete>"
      }
    ]
  },
  "el-avatar-group": {
    "tag": "el-avatar-group",
    "name": "Avatar Group",
    "category": "data",
    "description": "Clustered avatar stack with overlapping borders.",
    "formAssociated": false,
    "props": [
      {
        "name": "max",
        "type": "number",
        "default": 3,
        "description": "Maximum visible avatars before overflow indicator."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Avatar Stack",
        "code": "<el-avatar-group max=\"3\">\n  <el-avatar name=\"Alice Walker\"></el-avatar>\n  <el-avatar name=\"Bob Vance\"></el-avatar>\n  <el-avatar name=\"Charlie Day\"></el-avatar>\n  <el-avatar name=\"Diana Prince\"></el-avatar>\n</el-avatar-group>"
      }
    ]
  },
  "el-border-beam": {
    "tag": "el-border-beam",
    "name": "Border Beam",
    "category": "ai",
    "description": "Luminous animated border ray highlight that circles any container perimeter.",
    "formAssociated": false,
    "props": [
      {
        "name": "size",
        "type": "number",
        "default": 150,
        "description": "Beam width in pixels."
      },
      {
        "name": "duration",
        "type": "number",
        "default": 8,
        "description": "Animation rotation duration in seconds."
      },
      {
        "name": "color-from",
        "type": "text",
        "default": "",
        "description": "Configures color-from attribute."
      },
      {
        "name": "color-to",
        "type": "text",
        "default": "",
        "description": "Configures color-to attribute."
      },
      {
        "name": "border-width",
        "type": "text",
        "default": "",
        "description": "Configures border-width attribute."
      },
      {
        "name": "reverse",
        "type": "text",
        "default": "",
        "description": "Configures reverse attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Border Beam Card",
        "code": "<div style=\"position: relative; padding: 24px; border-radius: 12px; background: var(--el-surface-card); border: 1px solid var(--el-surface-border); overflow: hidden;\">\n  <el-border-beam size=\"120\" duration=\"6\"></el-border-beam>\n  <h4 style=\"margin: 0 0 6px 0;\">Specialist Feature Card</h4>\n  <p style=\"margin: 0; color: var(--el-text-muted);\">Card framed with animated gradient border beam.</p>\n</div>"
      }
    ]
  },
  "el-breadcrumb": {
    "tag": "el-breadcrumb",
    "name": "Breadcrumb",
    "category": "navigation",
    "description": "Semantic navigation trail container with configurable separators.",
    "formAssociated": false,
    "props": [
      {
        "name": "separator",
        "type": "text",
        "default": "/",
        "description": "Separator character or icon."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Breadcrumbs",
        "code": "<el-breadcrumb separator=\"/\">\n  <el-breadcrumb-item href=\"#home\">Home</el-breadcrumb-item>\n  <el-breadcrumb-item href=\"#components\">Components</el-breadcrumb-item>\n  <el-breadcrumb-item href=\"#forms\">Forms</el-breadcrumb-item>\n  <el-breadcrumb-item current>Checkbox</el-breadcrumb-item>\n</el-breadcrumb>"
      }
    ]
  },
  "el-breadcrumb-item": {
    "tag": "el-breadcrumb-item",
    "name": "Breadcrumb Item",
    "category": "navigation",
    "description": "Individual breadcrumb link or terminal item.",
    "formAssociated": false,
    "props": [
      {
        "name": "href",
        "type": "text",
        "default": "#",
        "description": "Link URL destination."
      },
      {
        "name": "current",
        "type": "boolean",
        "default": false,
        "description": "Whether this item is the current page."
      },
      {
        "name": "separator",
        "type": "text",
        "default": "/",
        "description": "Trailing separator symbol."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Breadcrumb Item",
        "code": "<el-breadcrumb-item href=\"#dash\">Dashboard</el-breadcrumb-item>"
      }
    ]
  },
  "el-calendar": {
    "tag": "el-calendar",
    "name": "Calendar",
    "category": "forms",
    "description": "Standalone accessible calendar month-grid component.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "2026-11-15",
        "description": "Selected ISO date."
      },
      {
        "name": "min-year",
        "type": "number",
        "default": 1900,
        "description": "Minimum selectable year."
      },
      {
        "name": "max-year",
        "type": "number",
        "default": 2100,
        "description": "Maximum selectable year."
      },
      {
        "name": "locale",
        "type": "text",
        "default": "en-US",
        "description": "BCP 47 locale (e.g. en-US, es-ES, fr-FR, ja-JP) for localized month and weekday names via Intl.DateTimeFormat."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "select",
        "description": "Fired when date is selected."
      }
    ],
    "examples": [
      {
        "title": "Calendar Grid",
        "code": "<el-calendar value=\"2026-11-15\"></el-calendar>"
      }
    ]
  },
  "el-card-header": {
    "tag": "el-card-header",
    "name": "Card Header",
    "category": "layout",
    "description": "Header container inside a Card for titles, subtitles, and top-level actions.",
    "formAssociated": false,
    "props": [
      {
        "name": "bordered",
        "type": "boolean",
        "default": false,
        "description": "Adds a bottom divider line separating the header from content."
      },
      {
        "name": "compact",
        "type": "boolean",
        "default": false,
        "description": "Reduces header padding for dense card layouts."
      },
      {
        "name": "align",
        "type": "select",
        "options": [
          "left",
          "center",
          "right"
        ],
        "default": "left",
        "description": "Horizontal alignment of header title and description."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Card Header with Title & Action",
        "code": "<el-card style=\"max-width: 380px;\">\n  <el-card-header style=\"display: flex; justify-content: space-between; align-items: center;\">\n    <div>\n      <el-card-title>Deployment Status</el-card-title>\n      <el-card-description>Production Cluster v2.4</el-card-description>\n    </div>\n    <el-badge variant=\"success\" count=\"Healthy\"></el-badge>\n  </el-card-header>\n  <el-card-content>\n    <p style=\"margin: 0; font-size: 0.875rem;\">All 18 pods reporting 0 restart loops and 99.99% uptime.</p>\n  </el-card-content>\n</el-card>"
      }
    ]
  },
  "el-card-title": {
    "tag": "el-card-title",
    "name": "Card Title",
    "category": "layout",
    "description": "Primary heading element rendered inside a Card Header.",
    "formAssociated": false,
    "props": [
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Typography scale for the card heading."
      },
      {
        "name": "align",
        "type": "select",
        "options": [
          "left",
          "center",
          "right"
        ],
        "default": "left",
        "description": "Text alignment of the card title."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Card Title Component",
        "code": "<el-card-title>Edge Node Latency</el-card-title>"
      }
    ]
  },
  "el-card-description": {
    "tag": "el-card-description",
    "name": "Card Description",
    "category": "layout",
    "description": "Secondary supporting description text rendered inside a Card Header.",
    "formAssociated": false,
    "props": [
      {
        "name": "align",
        "type": "select",
        "options": [
          "left",
          "center",
          "right"
        ],
        "default": "left",
        "description": "Text alignment of the supporting description."
      },
      {
        "name": "truncate",
        "type": "boolean",
        "default": false,
        "description": "Clamps long descriptions to a single line with ellipsis."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Card Subheading Description",
        "code": "<el-card-description>P99 latency recorded across 4 continents over past 24 hours.</el-card-description>"
      }
    ]
  },
  "el-card-content": {
    "tag": "el-card-content",
    "name": "Card Content",
    "category": "layout",
    "description": "Main body content area inside a Card.",
    "formAssociated": false,
    "props": [
      {
        "name": "compact",
        "type": "boolean",
        "default": false,
        "description": "Reduces inner body padding for dense layouts."
      },
      {
        "name": "flush",
        "type": "boolean",
        "default": false,
        "description": "Removes padding completely for full-bleed tables, charts, or media."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Card Body Content Container",
        "code": "<el-card-content>\n  <p style=\"margin: 0; color: var(--el-text-muted);\">Reactive content block with standard padding and typography.</p>\n</el-card-content>"
      }
    ]
  },
  "el-card-footer": {
    "tag": "el-card-footer",
    "name": "Card Footer",
    "category": "layout",
    "description": "Footer action bar inside a Card for buttons and metadata.",
    "formAssociated": false,
    "props": [
      {
        "name": "align",
        "type": "select",
        "options": [
          "start",
          "center",
          "end",
          "between"
        ],
        "default": "end",
        "description": "Flex justification for footer buttons and metadata."
      },
      {
        "name": "bordered",
        "type": "boolean",
        "default": false,
        "description": "Adds a top divider line separating the footer from content."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Card Footer with Action Buttons",
        "code": "<el-card-footer style=\"display: flex; justify-content: flex-end; gap: 8px;\">\n  <el-button variant=\"ghost\" size=\"sm\">Dismiss</el-button>\n  <el-button variant=\"primary\" size=\"sm\">Deploy Update</el-button>\n</el-card-footer>"
      }
    ]
  },
  "el-carousel": {
    "tag": "el-carousel",
    "name": "Carousel",
    "category": "layout",
    "description": "Accessible touch-swipeable and keyboard navigable carousel with autoplay and indicators.",
    "formAssociated": false,
    "props": [
      {
        "name": "auto-play",
        "type": "boolean",
        "default": false,
        "description": "Auto-advances slides on a timer."
      },
      {
        "name": "interval",
        "type": "number",
        "default": 4000,
        "description": "Autoplay interval in milliseconds."
      },
      {
        "name": "loop",
        "type": "boolean",
        "default": true,
        "description": "Infinite looping between first and last slides."
      },
      {
        "name": "autoplay",
        "type": "boolean",
        "default": false,
        "description": "Alias for auto-play enabling automatic slide rotation."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "slide-change",
        "description": "Emitted when current slide changes."
      }
    ],
    "examples": [
      {
        "title": "Hero Carousel",
        "code": "<el-carousel autoplay interval=\"4000\" loop>\n  <el-carousel-slide style=\"background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 48px; border-radius: 12px; text-align: center;\">\n    <h3 style=\"margin: 0 0 8px 0; font-size: 1.5rem;\">Next-Gen Design System</h3>\n    <p style=\"margin: 0; opacity: 0.9;\">Signal-driven and frameworkless.</p>\n  </el-carousel-slide>\n  <el-carousel-slide style=\"background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 48px; border-radius: 12px; text-align: center;\">\n    <h3 style=\"margin: 0 0 8px 0; font-size: 1.5rem;\">Zero Runtime Dependencies</h3>\n    <p style=\"margin: 0; opacity: 0.9;\">Built directly on standard Web Components.</p>\n  </el-carousel-slide>\n</el-carousel>"
      }
    ]
  },
  "el-carousel-slide": {
    "tag": "el-carousel-slide",
    "name": "Carousel Slide",
    "category": "layout",
    "description": "Full-width slide item rendered inside a Carousel viewport.",
    "formAssociated": false,
    "props": [],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Carousel Slide Item",
        "code": "<el-carousel-slide>\n  <div style=\"height: 180px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; font-weight: 600;\">\n    Slide Preview\n  </div>\n</el-carousel-slide>"
      }
    ]
  },
  "el-checkbox": {
    "tag": "el-checkbox",
    "name": "Checkbox",
    "category": "forms",
    "description": "Form-associated accessible checkbox with indeterminate tri-state support.",
    "formAssociated": false,
    "props": [
      {
        "name": "checked",
        "type": "boolean",
        "default": false,
        "description": "Checked state of the checkbox."
      },
      {
        "name": "indeterminate",
        "type": "boolean",
        "default": false,
        "description": "Indeterminate tri-state indicator (horizontal dash)."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables user interaction."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Requires checkbox to be checked for form validity."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form field name."
      },
      {
        "name": "value",
        "type": "text",
        "default": "on",
        "description": "Form submission value when checked."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Accept Terms & Conditions",
        "description": "Slotted or attribute text label."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Interactive Checkboxes",
        "code": "<el-checkbox checked>Remember this device</el-checkbox>\n<el-checkbox indeterminate>Select all sub-tasks</el-checkbox>\n<el-checkbox disabled>Locked preference</el-checkbox>"
      }
    ]
  },
  "el-chip": {
    "tag": "el-chip",
    "name": "Chip",
    "category": "data",
    "description": "Interactive pill / tag chip supporting selection, dismiss buttons, and slot icons.",
    "formAssociated": false,
    "props": [
      {
        "name": "variant",
        "type": "select",
        "options": [
          "primary",
          "secondary",
          "success",
          "danger",
          "warning",
          "info"
        ],
        "default": "primary",
        "description": "Visual style variant."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Pill size scale."
      },
      {
        "name": "selectable",
        "type": "boolean",
        "default": true,
        "description": "Enables click selection toggle."
      },
      {
        "name": "selected",
        "type": "boolean",
        "default": false,
        "description": "Selected pill state."
      },
      {
        "name": "removable",
        "type": "boolean",
        "default": false,
        "description": "Shows trailing dismiss (x) icon."
      },
      {
        "name": "auto-remove",
        "type": "boolean",
        "default": false,
        "description": "Automatically removes chip element on dismiss."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables pill interaction."
      },
      {
        "name": "label",
        "type": "text",
        "default": "TypeScript",
        "description": "Chip label."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "remove",
        "description": "Fired when remove button is clicked: detail: { value }"
      },
      {
        "name": "change",
        "description": "Fired when selection toggles: detail: { selected, value }"
      }
    ],
    "examples": [
      {
        "title": "Tag Pills",
        "code": "<el-chip variant=\"primary\" selectable selected>TypeScript</el-chip>\n<el-chip variant=\"success\" selectable>Production</el-chip>\n<el-chip variant=\"danger\" removable>Deprecated</el-chip>"
      }
    ]
  },
  "el-collapsible": {
    "tag": "el-collapsible",
    "name": "Collapsible",
    "category": "layout",
    "description": "Accessible disclosure panel with smooth animated height expansion.",
    "formAssociated": false,
    "props": [
      {
        "name": "open",
        "type": "boolean",
        "default": true,
        "description": "Whether collapsible is expanded."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables toggle interaction."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Collapsible JSON",
        "code": "<el-collapsible open>\n  <el-button slot=\"trigger\" variant=\"secondary\">Toggle Metadata Panel ▾</el-button>\n  <div style=\"padding: 12px; background: var(--el-surface-muted); border-radius: 6px; margin-top: 8px; font-family: monospace; font-size: 0.85rem;\">\n    {\"status\": 200, \"region\": \"us-east-1\", \"activeNodes\": 14}\n  </div>\n</el-collapsible>"
      }
    ]
  },
  "el-command": {
    "tag": "el-command",
    "name": "Command",
    "category": "overlays",
    "description": "Accessible keyboard-first command menu and search palette (⌘K / cmdk style).",
    "formAssociated": false,
    "props": [
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Displays command palette modal."
      },
      {
        "name": "inline",
        "type": "boolean",
        "default": true,
        "description": "Renders command palette inline instead of modal backdrop."
      },
      {
        "name": "placeholder",
        "type": "text",
        "default": "Type a command or search...",
        "description": "Palette search input placeholder."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "select",
        "description": "Fired when an item is selected: detail: { value, item }"
      }
    ],
    "examples": [
      {
        "title": "Command Palette",
        "code": "<div style=\"display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 480px;\">\n  <el-button size=\"sm\" variant=\"secondary\" onclick=\"const c = document.getElementById('ex-cmd'); c.removeAttribute('inline'); c.show();\">Open Modal Palette (⌘K)</el-button>\n  <el-command id=\"ex-cmd\" inline placeholder=\"Search actions, files, or settings...\">\n    <el-command-group heading=\"Suggestions\">\n      <el-command-item shortcut=\"Cmd+N\">Create New Document</el-command-item>\n      <el-command-item shortcut=\"Cmd+P\">Switch Workspace</el-command-item>\n    </el-command-group>\n    <el-command-group heading=\"Settings\">\n      <el-command-item shortcut=\"Cmd+,\">Preferences</el-command-item>\n      <el-command-item shortcut=\"Cmd+Shift+T\">Toggle Theme</el-command-item>\n    </el-command-group>\n  </el-command>\n</div>"
      }
    ]
  },
  "el-context-menu": {
    "tag": "el-context-menu",
    "name": "Context Menu",
    "category": "overlays",
    "description": "Floating context menu opening at cursor coordinates on right-click.",
    "formAssociated": false,
    "props": [
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables context menu."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Right-Click Area",
        "code": "<el-context-menu>\n  <div slot=\"trigger\" style=\"padding: 32px; border: 2px dashed var(--el-surface-border); border-radius: 8px; text-align: center; color: var(--el-text-muted);\">\n    Right click anywhere in this container\n  </div>\n  <div slot=\"menu\" style=\"padding: 6px; display: flex; flex-direction: column; gap: 4px; min-width: 140px;\">\n    <button style=\"padding: 8px; text-align: left; background: none; border: none; cursor: pointer; border-radius: 4px;\">Inspect</button>\n    <button style=\"padding: 8px; text-align: left; background: none; border: none; cursor: pointer; border-radius: 4px;\">Reload</button>\n  </div>\n</el-context-menu>"
      }
    ]
  },
  "el-datepicker": {
    "tag": "el-datepicker",
    "name": "Datepicker",
    "category": "forms",
    "description": "Form-associated composite Datepicker combining dropdown, input, and calendar.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "2026-11-15",
        "description": "Selected ISO date string."
      },
      {
        "name": "placeholder",
        "type": "text",
        "default": "Select date...",
        "description": "Input placeholder."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables datepicker."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Configures required attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Fired when date changes: detail.value"
      }
    ],
    "examples": [
      {
        "title": "Datepicker Input",
        "code": "<el-datepicker value=\"2026-11-15\"></el-datepicker>"
      }
    ]
  },
  "el-dropdown": {
    "tag": "el-dropdown",
    "name": "Dropdown",
    "category": "overlays",
    "description": "Accessible overlay container with light-dismiss and trigger slot.",
    "formAssociated": false,
    "props": [
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Whether dropdown menu is open."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "open",
        "description": "Fired when opened."
      },
      {
        "name": "close",
        "description": "Fired when closed."
      }
    ],
    "examples": [
      {
        "title": "Action Dropdown",
        "code": "<el-dropdown>\n  <el-button slot=\"trigger\" variant=\"secondary\">Actions Menu ▾</el-button>\n  <div slot=\"menu\" style=\"padding: 6px; display: flex; flex-direction: column; gap: 4px; min-width: 160px;\">\n    <button style=\"padding: 8px 12px; text-align: left; background: none; border: none; font-size: 0.875rem; border-radius: 4px; cursor: pointer; color: var(--el-text-base);\">Edit</button>\n    <button style=\"padding: 8px 12px; text-align: left; background: none; border: none; font-size: 0.875rem; border-radius: 4px; cursor: pointer; color: var(--el-text-base);\">Duplicate</button>\n    <button style=\"padding: 8px 12px; text-align: left; background: none; border: none; font-size: 0.875rem; border-radius: 4px; cursor: pointer; color: var(--el-color-danger, #ef4444);\">Delete</button>\n  </div>\n</el-dropdown>"
      }
    ]
  },
  "el-dropzone": {
    "tag": "el-dropzone",
    "name": "Dropzone",
    "category": "forms",
    "description": "Drag and drop file upload target with type filtering and size constraint validation.",
    "formAssociated": false,
    "props": [
      {
        "name": "accept",
        "type": "text",
        "default": "image/*,.pdf",
        "description": "Accepted MIME types or extensions."
      },
      {
        "name": "max-size",
        "type": "number",
        "default": 10485760,
        "description": "Maximum file size in bytes."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables drag and drop."
      },
      {
        "name": "multiple",
        "type": "boolean",
        "default": false,
        "description": "Configures multiple attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "files-selected",
        "description": "Emitted when valid files are dropped or selected."
      }
    ],
    "examples": [
      {
        "title": "File Dropzone",
        "code": "<el-dropzone accept=\"image/*,.pdf\" max-files=\"5\"></el-dropzone>"
      }
    ]
  },
  "el-empty-state": {
    "tag": "el-empty-state",
    "name": "Empty State",
    "category": "feedback",
    "description": "Zero-data placeholder graphic with title, description, and action CTA slots.",
    "formAssociated": false,
    "props": [
      {
        "name": "icon",
        "type": "text",
        "default": "📦",
        "description": "Emoji or SVG illustration."
      },
      {
        "name": "title",
        "type": "text",
        "default": "No Projects Found",
        "description": "Empty state headline."
      },
      {
        "name": "description",
        "type": "text",
        "default": "Get started by creating your first project.",
        "description": "Supporting explanatory text."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Empty View",
        "code": "<el-empty-state icon=\"📦\" title=\"No Shipments\" description=\"You have not scheduled any outgoing shipments today.\">\n  <el-button variant=\"primary\">Create Shipment</el-button>\n</el-empty-state>"
      }
    ]
  },
  "el-field": {
    "tag": "el-field",
    "name": "Field",
    "category": "forms",
    "description": "Accessible form field wrapper providing label, description, and error messaging.",
    "formAssociated": false,
    "props": [
      {
        "name": "label",
        "type": "text",
        "default": "Work Email",
        "description": "Field label above input."
      },
      {
        "name": "description",
        "type": "text",
        "default": "We will send verification codes here.",
        "description": "Helpful caption below input."
      },
      {
        "name": "error",
        "type": "text",
        "default": "",
        "description": "Error message (switches field to error state)."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Marks field with required asterisk."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables field and contained inputs."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Input Field with Description",
        "code": "<el-field label=\"Work Email\" description=\"Used for two-factor authentication.\">\n  <el-input placeholder=\"alex@company.com\"></el-input>\n</el-field>"
      },
      {
        "title": "Field with Error State",
        "code": "<el-field label=\"Master Password\" error=\"Password must contain at least 8 characters.\" required>\n  <el-input type=\"password\" value=\"secret\"></el-input>\n</el-field>"
      }
    ]
  },
  "el-form": {
    "tag": "el-form",
    "name": "Form",
    "category": "forms",
    "description": "Form container orchestrating validation, serialization and data collection across Elementum inputs.",
    "formAssociated": false,
    "props": [
      {
        "name": "novalidate",
        "type": "boolean",
        "default": false,
        "description": "Bypasses browser native constraint validation tooltips."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "submit",
        "description": "Emitted on valid form submission."
      }
    ],
    "examples": [
      {
        "title": "Form Container",
        "code": "<el-form>\n  <el-field label=\"Full Name\" required>\n    <el-input placeholder=\"Ada Lovelace\"></el-input>\n  </el-field>\n  <div style=\"margin-top: 12px;\">\n    <el-button type=\"submit\" variant=\"primary\">Save Changes</el-button>\n  </div>\n</el-form>"
      }
    ]
  },
  "el-fieldset": {
    "tag": "el-fieldset",
    "name": "Fieldset",
    "category": "forms",
    "description": "Accessible field grouping container with legend and cascade disable support.",
    "formAssociated": false,
    "props": [
      {
        "name": "legend",
        "type": "text",
        "default": "Security & Access Control",
        "description": "Configures legend attribute."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Credentials & Multi-Factor",
        "code": "<el-fieldset legend=\"Security & Access Control\">\n  <div style=\"display: flex; flex-direction: column; gap: 12px; margin-top: 8px;\">\n    <el-field label=\"Master API Key\">\n      <el-input value=\"ak_live_839210492\" type=\"password\"></el-input>\n    </el-field>\n    <el-checkbox label=\"Enforce Hardware FIDO2 2FA\" checked></el-checkbox>\n    <el-checkbox label=\"Require VPN for admin actions\"></el-checkbox>\n  </div>\n</el-fieldset>"
      }
    ]
  },
  "el-menubar": {
    "tag": "el-menubar",
    "name": "Menubar",
    "category": "navigation",
    "description": "Desktop application menubar with arrow key roving focus and hover switching.",
    "formAssociated": false,
    "props": [
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables menubar interaction."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Application Menubar",
        "code": "<el-menubar>\n  <el-menu label=\"File\">\n    <el-menu-item>New File</el-menu-item>\n    <el-menu-item>Open...</el-menu-item>\n  </el-menu>\n  <el-menu label=\"Edit\">\n    <el-menu-item>Undo</el-menu-item>\n    <el-menu-item>Redo</el-menu-item>\n  </el-menu>\n</el-menubar>"
      }
    ]
  },
  "el-meter": {
    "tag": "el-meter",
    "name": "Meter",
    "category": "data",
    "description": "Scalar gauge primitive for displaying storage, CPU, and threshold metrics.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "number",
        "default": 72,
        "description": "Current gauge value."
      },
      {
        "name": "min",
        "type": "number",
        "default": 0,
        "description": "Lower bound value."
      },
      {
        "name": "max",
        "type": "number",
        "default": 100,
        "description": "Upper bound value."
      },
      {
        "name": "low",
        "type": "number",
        "default": 33,
        "description": "Low status threshold."
      },
      {
        "name": "high",
        "type": "number",
        "default": 66,
        "description": "High status threshold."
      },
      {
        "name": "optimum",
        "type": "number",
        "default": 80,
        "description": "Optimum target value determining color."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Meter bar thickness."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "System Capacity Gauge",
        "code": "<el-meter value=\"72\" min=\"0\" max=\"100\" low=\"33\" high=\"66\" optimum=\"80\"></el-meter>"
      }
    ]
  },
  "el-number-flow": {
    "tag": "el-number-flow",
    "name": "Number Flow",
    "category": "data",
    "description": "Smooth vertical rolling odometer number reel with prefix/suffix support and reduced-motion fallback.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "number",
        "default": 48290,
        "description": "Numeric value with rolling odometer animation."
      },
      {
        "name": "prefix",
        "type": "text",
        "default": "$",
        "description": "Prepended currency or symbol."
      },
      {
        "name": "suffix",
        "type": "text",
        "default": "",
        "description": "Appended unit or symbol."
      },
      {
        "name": "duration",
        "type": "number",
        "default": 500,
        "description": "Animation duration in milliseconds for rolling digit reels."
      },
      {
        "name": "animated",
        "type": "boolean",
        "default": true,
        "description": "Enables smooth odometer reel transitions when value updates."
      },
      {
        "name": "locale",
        "type": "text",
        "default": "",
        "description": "Optional BCP 47 locale (e.g. en-US, de-DE, fr-FR) for Intl.NumberFormat grouping and decimal separators."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Odometer Counter",
        "code": "<el-number-flow value=\"48290\" prefix=\"$\"></el-number-flow>"
      }
    ]
  },
  "el-pagination": {
    "tag": "el-pagination",
    "name": "Pagination",
    "category": "navigation",
    "description": "Accessible pagination component with dynamic page windowing, ellipsis, and W3C navigation semantics.",
    "formAssociated": false,
    "props": [
      {
        "name": "page",
        "type": "number",
        "default": 1,
        "description": "Current active page number."
      },
      {
        "name": "total",
        "type": "number",
        "default": 10,
        "description": "Total number of pages."
      },
      {
        "name": "sibling-count",
        "type": "number",
        "default": 1,
        "description": "Number of page buttons beside current page."
      },
      {
        "name": "page-size",
        "type": "number",
        "default": 10,
        "description": "Items displayed per page."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "pagechange",
        "description": "Fired when page changes: detail: { page, pageSize }"
      }
    ],
    "examples": [
      {
        "title": "Pagination Controls",
        "code": "<el-pagination page=\"1\" total=\"10\"></el-pagination>"
      }
    ]
  },
  "el-popover": {
    "tag": "el-popover",
    "name": "Popover",
    "category": "overlays",
    "description": "Non-modal floating overlay anchored to a trigger with light-dismiss.",
    "formAssociated": false,
    "props": [
      {
        "name": "placement",
        "type": "select",
        "options": [
          "top",
          "bottom",
          "left",
          "right"
        ],
        "default": "bottom",
        "description": "Anchor positioning placement."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": true,
        "description": "Popover visibility state."
      },
      {
        "name": "offset",
        "type": "number",
        "default": 8,
        "description": "Distance in px between trigger and popover."
      },
      {
        "name": "arrow",
        "type": "boolean",
        "default": true,
        "description": "Renders directional arrow pointing to trigger."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Popover Info Card",
        "code": "<el-popover placement=\"bottom\" arrow>\n  <el-button slot=\"trigger\" variant=\"secondary\">View Cluster Health ▾</el-button>\n  <div slot=\"content\" style=\"padding: 8px; max-width: 240px;\">\n    <h4 style=\"margin: 0 0 6px 0; font-size: 0.95rem;\">System Health</h4>\n    <p style=\"margin: 0; font-size: 0.85rem; color: var(--el-text-muted);\">All regional clusters are reporting nominal latency.</p>\n  </div>\n</el-popover>"
      }
    ]
  },
  "el-preview-card": {
    "tag": "el-preview-card",
    "name": "Preview Card",
    "category": "overlays",
    "description": "Hover card popup showing rich preview content with hover intent delays.",
    "formAssociated": false,
    "props": [
      {
        "name": "delay",
        "type": "number",
        "default": 300,
        "description": "Hover delay in ms."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": true,
        "description": "Force card display open."
      },
      {
        "name": "open-delay",
        "type": "number",
        "default": 200,
        "description": "Hover delay before opening in ms."
      },
      {
        "name": "close-delay",
        "type": "number",
        "default": 150,
        "description": "Hover leave delay before closing in ms."
      },
      {
        "name": "placement",
        "type": "select",
        "options": [
          "top",
          "bottom",
          "left",
          "right"
        ],
        "default": "bottom",
        "description": "Configures placement attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Profile Hover Card",
        "code": "<el-preview-card delay=\"200\">\n  <a slot=\"trigger\" href=\"#profile\" onclick=\"event.preventDefault()\" style=\"color: var(--el-color-primary); font-weight: 600;\">@elementum_ui</a>\n  <div slot=\"preview\" style=\"width: 240px;\">\n    <div style=\"font-weight: 700; margin-bottom: 4px;\">Elementum UI</div>\n    <div style=\"color: var(--el-text-muted); font-size: 0.85rem; line-height: 1.4;\">Zero-dependency, signal-driven Web Components with Figma parity.</div>\n  </div>\n</el-preview-card>"
      }
    ]
  },
  "el-progress": {
    "tag": "el-progress",
    "name": "Progress",
    "category": "data",
    "description": "Accessible progress bar with determinate and indeterminate states and WCAG role='progressbar'.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "number",
        "default": 68,
        "description": "Progress percentage (0-100)."
      },
      {
        "name": "max",
        "type": "number",
        "default": 100,
        "description": "Maximum scale value."
      },
      {
        "name": "indeterminate",
        "type": "boolean",
        "default": false,
        "description": "Animated looping progress bar without defined percentage."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Bar height thickness."
      },
      {
        "name": "variant",
        "type": "select",
        "options": [
          "primary",
          "secondary",
          "success",
          "danger",
          "warning",
          "info"
        ],
        "default": "primary",
        "description": "Configures variant attribute."
      },
      {
        "name": "striped",
        "type": "boolean",
        "default": false,
        "description": "Configures striped attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Progress Bars",
        "code": "<el-progress value=\"68\"></el-progress>\n<div style=\"margin-top: 12px;\"></div>\n<el-progress indeterminate size=\"sm\"></el-progress>"
      }
    ]
  },
  "el-radio": {
    "tag": "el-radio",
    "name": "Radio",
    "category": "forms",
    "description": "Accessible radio button primitive working inside ElRadioGroup.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "pro",
        "description": "Option value."
      },
      {
        "name": "checked",
        "type": "boolean",
        "default": true,
        "description": "Selected radio state."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables option."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Pro Plan ($29/mo)",
        "description": "Radio label."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Standalone Radio Options",
        "code": "<div style=\"display: flex; flex-direction: column; gap: 10px;\">\n  <el-radio value=\"monthly\" checked>Billed Monthly ($29/mo)</el-radio>\n  <el-radio value=\"yearly\">Billed Annually ($290/yr - 2 Months Free!)</el-radio>\n  <el-radio value=\"enterprise\" disabled>Enterprise Contract (Custom)</el-radio>\n</div>"
      }
    ]
  },
  "el-rating": {
    "tag": "el-rating",
    "name": "Rating",
    "category": "forms",
    "description": "Form-associated star rating component with keyboard arrows and hover preview.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "number",
        "default": 4,
        "description": "Rating star value."
      },
      {
        "name": "max",
        "type": "number",
        "default": 5,
        "description": "Total stars."
      },
      {
        "name": "readonly",
        "type": "boolean",
        "default": false,
        "description": "Displays rating without allowing click updates."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables rating interaction."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form submission name."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "Emitted when rating value is confirmed."
      }
    ],
    "examples": [
      {
        "title": "Star Rating",
        "code": "<el-rating value=\"4\" max=\"5\"></el-rating>"
      }
    ]
  },
  "el-resizable": {
    "tag": "el-resizable",
    "name": "Resizable",
    "category": "layout",
    "description": "Split-pane divider handle with pointer dragging and keyboard arrow resize.",
    "formAssociated": false,
    "props": [
      {
        "name": "direction",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Split orientation."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "resize",
        "description": "Emitted during pane resizing with percentage size."
      }
    ],
    "examples": [
      {
        "title": "Split Panels",
        "code": "<el-resizable style=\"height: 160px; border: 1px solid var(--el-surface-border); border-radius: 8px;\">\n  <el-resizable-panel default-size=\"40\" style=\"padding: 16px; background: var(--el-surface-muted);\">Sidebar</el-resizable-panel>\n  <el-resizable-handle></el-resizable-handle>\n  <el-resizable-panel default-size=\"60\" style=\"padding: 16px;\">Main Content Area</el-resizable-panel>\n</el-resizable>"
      }
    ]
  },
  "el-scroll-area": {
    "tag": "el-scroll-area",
    "name": "Scroll Area",
    "category": "layout",
    "description": "Custom cross-browser scrollbar container avoiding OS layout shifts.",
    "formAssociated": false,
    "props": [
      {
        "name": "type",
        "type": "select",
        "options": [
          "auto",
          "always",
          "scroll",
          "hover"
        ],
        "default": "hover",
        "description": "Scrollbar visibility mode."
      },
      {
        "name": "max-height",
        "type": "text",
        "default": "200px",
        "description": "Maximum viewport height."
      },
      {
        "name": "max-width",
        "type": "text",
        "default": "380px",
        "description": "Maximum viewport width."
      },
      {
        "name": "height",
        "type": "text",
        "default": "140px",
        "description": "Explicit viewport height."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Log Stream",
        "code": "<el-scroll-area max-height=\"160px\" type=\"hover\" style=\"border: 1px solid var(--el-surface-border); border-radius: 8px; padding: 12px;\">\n  <div style=\"font-family: monospace; font-size: 0.85rem; line-height: 1.8;\">\n    [10:45:01] Ingested 14,290 records.<br>\n    [10:45:02] Pipeline synced to BigQuery.<br>\n    [10:45:04] Verification checks passed.<br>\n    [10:45:08] Edge replication active.<br>\n    [10:45:12] Cache warm-up completed.<br>\n    [10:45:15] Ready for production traffic.\n  </div>\n</el-scroll-area>"
      }
    ]
  },
  "el-separator": {
    "tag": "el-separator",
    "name": "Separator",
    "category": "layout",
    "description": "Visual or semantic horizontal/vertical content divider.",
    "formAssociated": false,
    "props": [
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Separator direction."
      },
      {
        "name": "decorative",
        "type": "boolean",
        "default": true,
        "description": "Whether element is purely visual or semantic hr."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Layout Divider",
        "code": "<p style=\"margin: 0 0 8px 0;\">Top Content</p>\n<el-separator></el-separator>\n<p style=\"margin: 8px 0 0 0;\">Bottom Content</p>"
      }
    ]
  },
  "el-sidebar-header": {
    "tag": "el-sidebar-header",
    "name": "Sidebar Header",
    "category": "navigation",
    "description": "Top header region inside a Sidebar for brand identity and workspace switchers.",
    "formAssociated": false,
    "props": [
      {
        "name": "collapsed",
        "type": "boolean",
        "default": false,
        "description": "Configures collapsed attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Sidebar Brand Header",
        "code": "<el-sidebar id=\"ex-hdr-sidebar\">\n  <el-sidebar-header>\n    <span class=\"collapsible-text\" style=\"font-weight: 700; font-size: 1rem;\">⚡ Elementum Console</span>\n    <el-sidebar-trigger for=\"ex-hdr-sidebar\"></el-sidebar-trigger>\n  </el-sidebar-header>\n</el-sidebar>"
      }
    ]
  },
  "el-sidebar-content": {
    "tag": "el-sidebar-content",
    "name": "Sidebar Content",
    "category": "navigation",
    "description": "Scrollable primary navigation region inside a Sidebar.",
    "formAssociated": false,
    "props": [
      {
        "name": "collapsed",
        "type": "boolean",
        "default": false,
        "description": "Configures collapsed attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Sidebar Scrollable Navigation Menu",
        "code": "<el-sidebar-content style=\"padding: 12px; display: flex; flex-direction: column; gap: 6px;\">\n  <a href=\"#overview\" style=\"padding: 8px 12px; border-radius: 6px; text-decoration: none; color: inherit; background: var(--el-surface-muted);\">Overview</a>\n  <a href=\"#analytics\" style=\"padding: 8px 12px; border-radius: 6px; text-decoration: none; color: inherit;\">Analytics</a>\n  <a href=\"#settings\" style=\"padding: 8px 12px; border-radius: 6px; text-decoration: none; color: inherit;\">Settings</a>\n</el-sidebar-content>"
      }
    ]
  },
  "el-sidebar-footer": {
    "tag": "el-sidebar-footer",
    "name": "Sidebar Footer",
    "category": "navigation",
    "description": "Bottom footer region inside a Sidebar for user profile and settings.",
    "formAssociated": false,
    "props": [
      {
        "name": "collapsed",
        "type": "boolean",
        "default": false,
        "description": "Configures collapsed attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Sidebar User Account Footer",
        "code": "<el-sidebar-footer style=\"padding: 12px; border-top: 1px solid var(--el-surface-border); display: flex; align-items: center; gap: 10px;\">\n  <el-avatar name=\"Alex Morgan\" size=\"sm\"></el-avatar>\n  <div style=\"font-size: 0.85rem; line-height: 1.2;\">\n    <div style=\"font-weight: 600;\">Alex Morgan</div>\n    <div style=\"color: var(--el-text-muted); font-size: 0.75rem;\">admin@elementum.dev</div>\n  </div>\n</el-sidebar-footer>"
      }
    ]
  },
  "el-sidebar-trigger": {
    "tag": "el-sidebar-trigger",
    "name": "Sidebar Trigger",
    "category": "navigation",
    "description": "Toggle button that collapses or expands its associated Sidebar.",
    "formAssociated": false,
    "props": [],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Sidebar Toggle Trigger Button",
        "code": "<div style=\"display: flex; align-items: center; gap: 12px;\">\n  <el-sidebar id=\"ex-trig-sidebar\" style=\"height: 140px;\">\n    <el-sidebar-header>\n      <span class=\"collapsible-text\" style=\"font-weight: 700;\">⚡ Menu</span>\n      <el-sidebar-trigger for=\"ex-trig-sidebar\"></el-sidebar-trigger>\n    </el-sidebar-header>\n    <el-sidebar-content>\n      <a href=\"#dash\" onclick=\"event.preventDefault()\" style=\"display: flex; gap: 8px; padding: 6px; text-decoration: none; color: inherit;\"><span>📊</span><span class=\"collapsible-text\">Overview</span></a>\n    </el-sidebar-content>\n  </el-sidebar>\n</div>"
      }
    ]
  },
  "el-skeleton": {
    "tag": "el-skeleton",
    "name": "Skeleton",
    "category": "feedback",
    "description": "Shimmer wave/pulse placeholder box preventing layout shifts.",
    "formAssociated": false,
    "props": [
      {
        "name": "variant",
        "type": "select",
        "options": [
          "text",
          "circular",
          "rectangular"
        ],
        "default": "text",
        "description": "Placeholder geometry."
      },
      {
        "name": "width",
        "type": "text",
        "default": "100%",
        "description": "Explicit CSS width."
      },
      {
        "name": "height",
        "type": "text",
        "default": "20px",
        "description": "Explicit CSS height."
      },
      {
        "name": "animation",
        "type": "select",
        "options": [
          "wave",
          "pulse",
          "none"
        ],
        "default": "wave",
        "description": "Shimmer animation style."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Content Skeleton",
        "code": "<div style=\"display: flex; gap: 12px; align-items: center;\">\n  <el-skeleton variant=\"circular\" width=\"48px\" height=\"48px\"></el-skeleton>\n  <div style=\"flex: 1; display: flex; flex-direction: column; gap: 6px;\">\n    <el-skeleton variant=\"text\" width=\"60%\" height=\"16px\"></el-skeleton>\n    <el-skeleton variant=\"text\" width=\"90%\" height=\"12px\"></el-skeleton>\n  </div>\n</div>"
      }
    ]
  },
  "el-spinner": {
    "tag": "el-spinner",
    "name": "Spinner",
    "category": "feedback",
    "description": "Smooth SVG loading spinner with accessible status role.",
    "formAssociated": false,
    "props": [
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Spinner diameter."
      },
      {
        "name": "variant",
        "type": "select",
        "options": [
          "primary",
          "secondary",
          "success",
          "danger",
          "warning",
          "info",
          "muted",
          "white"
        ],
        "default": "primary",
        "description": "Configures variant attribute."
      },
      {
        "name": "label",
        "type": "text",
        "default": "",
        "description": "Configures label attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Spinner Sizes",
        "code": "<el-spinner size=\"sm\"></el-spinner>\n<el-spinner size=\"md\"></el-spinner>\n<el-spinner size=\"lg\"></el-spinner>"
      }
    ]
  },
  "el-tab": {
    "tag": "el-tab",
    "name": "Tab",
    "category": "navigation",
    "description": "Individual tab trigger and panel entry placed inside Tabs.",
    "formAssociated": false,
    "props": [
      {
        "name": "name",
        "type": "text",
        "default": "overview",
        "description": "Tab identifier matching el-tabs value."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables tab item."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Overview",
        "description": "Tab button label."
      },
      {
        "name": "value",
        "type": "text",
        "default": "overview",
        "description": "Tab value identifier."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Tab Item",
        "code": "<el-tabs value=\"settings\">\n  <el-tab value=\"settings\" label=\"Settings\"><div style=\"padding: 12px;\">Settings tab panel content.</div></el-tab>\n  <el-tab value=\"logs\" label=\"Audit Logs\"><div style=\"padding: 12px;\">Audit logs content.</div></el-tab>\n</el-tabs>"
      }
    ]
  },
  "el-textarea": {
    "tag": "el-textarea",
    "name": "Textarea",
    "category": "forms",
    "description": "Form-associated auto-resizing multi-line text input with character counting.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Textarea content."
      },
      {
        "name": "placeholder",
        "type": "text",
        "default": "Enter detailed description...",
        "description": "Placeholder text."
      },
      {
        "name": "rows",
        "type": "number",
        "default": 4,
        "description": "Visible text rows."
      },
      {
        "name": "auto-resize",
        "type": "boolean",
        "default": true,
        "description": "Automatically expands height as user types."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables textarea."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Requires content for form validity."
      },
      {
        "name": "maxlength",
        "type": "number",
        "default": 500,
        "description": "Maximum character limit."
      },
      {
        "name": "name",
        "type": "text",
        "default": "",
        "description": "Form submission name."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "Emitted on character input."
      },
      {
        "name": "change",
        "description": "Emitted on commit."
      }
    ],
    "examples": [
      {
        "title": "Auto-resizing Textarea",
        "code": "<el-textarea placeholder=\"Type Markdown notes here...\" auto-resize rows=\"4\"></el-textarea>"
      }
    ]
  },
  "el-theme-switch": {
    "tag": "el-theme-switch",
    "name": "Theme Switch",
    "category": "layout",
    "description": "Color theme toggle between Light and Dark mode with localStorage persistence.",
    "formAssociated": false,
    "props": [
      {
        "name": "theme",
        "type": "select",
        "options": [
          "light",
          "dark",
          "system"
        ],
        "default": "system",
        "description": "Active color scheme theme."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "themechange",
        "description": "Fired when theme toggles: detail.theme"
      }
    ],
    "examples": [
      {
        "title": "Light, Dark, and System Theme Switcher",
        "code": "<el-theme-switch theme=\"system\"></el-theme-switch>"
      }
    ]
  },
  "el-timeline": {
    "tag": "el-timeline",
    "name": "Timeline",
    "category": "data",
    "description": "Activity progression trail container.",
    "formAssociated": false,
    "props": [
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "vertical",
          "horizontal"
        ],
        "default": "vertical",
        "description": "Progression line axis."
      },
      {
        "name": "reverse",
        "type": "boolean",
        "default": false,
        "description": "Reverses chronological order of items."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Deployment Pipeline",
        "code": "<el-timeline style=\"max-width: 380px;\">\n  <el-timeline-item status=\"completed\" title=\"Code Pushed\" date=\"10:00 AM\">Commit verified.</el-timeline-item>\n  <el-timeline-item status=\"completed\" title=\"Tests Passed\" date=\"10:05 AM\">108 unit tests green.</el-timeline-item>\n  <el-timeline-item status=\"active\" title=\"Deploying to Edge\" date=\"10:12 AM\">Routing CDN edge traffic.</el-timeline-item>\n  <el-timeline-item status=\"pending\" title=\"Release Live\" date=\"Pending\">Awaiting health check.</el-timeline-item>\n</el-timeline>"
      }
    ]
  },
  "el-timeline-item": {
    "tag": "el-timeline-item",
    "name": "Timeline Item",
    "category": "data",
    "description": "Individual chronological milestone node with status badges.",
    "formAssociated": false,
    "props": [
      {
        "name": "status",
        "type": "select",
        "options": [
          "completed",
          "active",
          "pending",
          "error"
        ],
        "default": "completed",
        "description": "Status marker."
      },
      {
        "name": "title",
        "type": "text",
        "default": "Event Title",
        "description": "Item headline."
      },
      {
        "name": "date",
        "type": "text",
        "default": "10:30 AM",
        "description": "Timestamp label."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Synchronizing edge workers.",
        "description": "Fallback body description text."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Timeline Event",
        "code": "<el-timeline-item status=\"completed\" title=\"Order Created\" date=\"09:15 AM\">Stripe checkout completed.</el-timeline-item>"
      }
    ]
  },
  "el-toaster": {
    "tag": "el-toaster",
    "name": "Toaster",
    "category": "feedback",
    "description": "Viewport overlay container rendering programmatic toast notifications.",
    "formAssociated": false,
    "props": [
      {
        "name": "position",
        "type": "select",
        "options": [
          "bottom-right",
          "top-right",
          "bottom-left",
          "top-left",
          "top-center",
          "bottom-center"
        ],
        "default": "bottom-right",
        "description": "Screen docking quadrant."
      },
      {
        "name": "expand",
        "type": "boolean",
        "default": false,
        "description": "Always expand toast stack instead of collapsing cards."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Global Toast Container",
        "code": "<el-toaster position=\"bottom-right\"></el-toaster>"
      }
    ]
  },
  "el-toolbar": {
    "tag": "el-toolbar",
    "name": "Toolbar",
    "category": "actions",
    "description": "Accessible action bar container with roving tabindex keyboard navigation.",
    "formAssociated": false,
    "props": [
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Toolbar layout orientation."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables all toolbar controls."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Action Toolbar",
        "code": "<el-toolbar>\n  <el-button size=\"sm\" variant=\"ghost\">Bold</el-button>\n  <el-button size=\"sm\" variant=\"ghost\">Italic</el-button>\n  <el-separator orientation=\"vertical\"></el-separator>\n  <el-button size=\"sm\" variant=\"ghost\">Link</el-button>\n  <el-button size=\"sm\" variant=\"ghost\">Code</el-button>\n</el-toolbar>"
      }
    ]
  },
  "el-tree-view": {
    "tag": "el-tree-view",
    "name": "Tree View",
    "category": "data",
    "description": "Hierarchical tree list container with keyboard navigation.",
    "formAssociated": false,
    "props": [
      {
        "name": "max-width",
        "type": "text",
        "default": "320px",
        "description": "Maximum width constraint."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Project Tree View",
        "code": "<el-tree-view style=\"max-width: 300px;\">\n  <el-tree-item label=\"src\" expanded>\n    <el-tree-item label=\"components\" expanded>\n      <el-tree-item label=\"el-button.js\" selected></el-tree-item>\n      <el-tree-item label=\"el-checkbox.js\"></el-tree-item>\n      <el-tree-item label=\"el-select.js\"></el-tree-item>\n    </el-tree-item>\n    <el-tree-item label=\"index.js\"></el-tree-item>\n  </el-tree-item>\n  <el-tree-item label=\"package.json\"></el-tree-item>\n</el-tree-view>"
      }
    ]
  },
  "el-tree-item": {
    "tag": "el-tree-item",
    "name": "Tree Item",
    "category": "data",
    "description": "Expandable/collapsible tree node.",
    "formAssociated": false,
    "props": [
      {
        "name": "label",
        "type": "text",
        "default": "Folder",
        "description": "Tree node label."
      },
      {
        "name": "expanded",
        "type": "boolean",
        "default": false,
        "description": "Expanded children state."
      },
      {
        "name": "selected",
        "type": "boolean",
        "default": false,
        "description": "Selected node state."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Disables node interaction."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [
      {
        "name": "expand",
        "description": "Emitted when branch expands."
      },
      {
        "name": "collapse",
        "description": "Emitted when branch collapses."
      },
      {
        "name": "select",
        "description": "Emitted when item is selected."
      }
    ],
    "examples": [
      {
        "title": "Tree Item",
        "code": "<el-tree-item label=\"index.js\" selected></el-tree-item>"
      }
    ]
  },
  "el-callout": {
    "tag": "el-callout",
    "name": "Callout",
    "category": "feedback",
    "description": "Highlighted informational, success, warning, or danger callout box with optional title slot.",
    "formAssociated": false,
    "props": [
      {
        "name": "variant",
        "type": "select",
        "options": [
          "primary",
          "secondary",
          "info",
          "success",
          "warning",
          "danger"
        ],
        "default": "info",
        "description": "Configures variant attribute."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Configures size attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Semantic Callout Notice",
        "code": "<el-callout variant=\"info\">\n  <strong>Pro Tip:</strong> Press Cmd+K anytime to open global search.\n</el-callout>"
      }
    ]
  },
  "el-checkbox-card": {
    "tag": "el-checkbox-card",
    "name": "Checkbox Card",
    "category": "forms",
    "description": "Selectable card-styled checkbox control for multi-option feature grids.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "checked",
        "type": "boolean",
        "default": false,
        "description": "Configures checked attribute."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Feature Card Checkbox",
        "code": "<el-checkbox-card value=\"backup\" checked>\n  <div style=\"font-weight: 600;\">Daily Automated Backups</div>\n  <div style=\"font-size: 0.85rem; color: var(--el-text-muted);\">Point-in-time recovery for 30 days.</div>\n</el-checkbox-card>"
      }
    ]
  },
  "el-command-item": {
    "tag": "el-command-item",
    "name": "Command Item",
    "category": "overlays",
    "description": "Actionable item row inside a Command Palette with optional keyboard shortcut badge.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "shortcut",
        "type": "text",
        "default": "",
        "description": "Configures shortcut attribute."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Keyboard Search Command Item",
        "code": "<el-command-item value=\"deploy-prod\">🚀 Deploy to Production Cluster</el-command-item>"
      }
    ]
  },
  "el-command-group": {
    "tag": "el-command-group",
    "name": "Command Group",
    "category": "overlays",
    "description": "Labeled section grouping related Command Items inside a Command Palette.",
    "formAssociated": false,
    "props": [
      {
        "name": "heading",
        "type": "text",
        "default": "",
        "description": "Configures heading attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Grouped Command Items",
        "code": "<el-command-group heading=\"Quick Actions\">\n  <el-command-item value=\"new-project\">➕ Create New Project</el-command-item>\n  <el-command-item value=\"view-logs\">📋 View Cluster Event Logs</el-command-item>\n</el-command-group>"
      }
    ]
  },
  "el-data-list": {
    "tag": "el-data-list",
    "name": "Data List",
    "category": "data",
    "description": "Structured key-value metadata list for displaying record attributes cleanly.",
    "formAssociated": false,
    "props": [
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Configures orientation attribute."
      },
      {
        "name": "size",
        "type": "select",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "default": "md",
        "description": "Configures size attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Key-Value Metrics",
        "code": "<el-data-list>\n  <el-data-list-item label=\"Cluster ID\" value=\"cls-99482\" copyable></el-data-list-item>\n  <el-data-list-item label=\"Primary Region\" value=\"us-east-1\"></el-data-list-item>\n  <el-data-list-item label=\"SLA Uptime\" value=\"99.99%\"></el-data-list-item>\n</el-data-list>"
      }
    ]
  },
  "el-data-list-item": {
    "tag": "el-data-list-item",
    "name": "Data List Item",
    "category": "data",
    "description": "Individual label-and-value row rendered inside a Data List.",
    "formAssociated": false,
    "props": [
      {
        "name": "label",
        "type": "text",
        "default": "",
        "description": "Configures label attribute."
      },
      {
        "name": "value",
        "type": "text",
        "default": "",
        "description": "Configures value attribute."
      },
      {
        "name": "copyable",
        "type": "boolean",
        "default": false,
        "description": "Configures copyable attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Data List Key-Value Row",
        "code": "<el-data-list-item label=\"Public IP\" value=\"198.51.100.42\" copyable></el-data-list-item>"
      }
    ]
  },
  "el-inset": {
    "tag": "el-inset",
    "name": "Inset",
    "category": "layout",
    "description": "Edge-to-edge bleed container for media or tables inside padded cards.",
    "formAssociated": false,
    "props": [
      {
        "name": "side",
        "type": "text",
        "default": "",
        "description": "Configures side attribute."
      },
      {
        "name": "clip",
        "type": "boolean",
        "default": true,
        "description": "Clips overflowing media to parent border radius."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Card Full-Bleed Inset Media",
        "code": "<el-card style=\"max-width: 360px;\">\n  <el-inset style=\"height: 140px; background: linear-gradient(135deg, #2563eb, #7c3aed); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600;\">\n    Full-Bleed Media Header\n  </el-inset>\n  <el-card-content>\n    <h3>Inset Demonstration</h3>\n    <p style=\"color: var(--el-text-muted); font-size: 0.85rem;\">Insets ignore parent padding to touch outer borders.</p>\n  </el-card-content>\n</el-card>"
      }
    ]
  },
  "el-navigation-menu": {
    "tag": "el-navigation-menu",
    "name": "Navigation Menu",
    "category": "navigation",
    "description": "Accessible desktop navigation bar supporting horizontal or vertical orientation and dropdown mega-menu panels.",
    "formAssociated": false,
    "props": [
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Configures orientation attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "One or more el-navigation-menu-item children."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Horizontal Header Navigation Menu",
        "code": "<el-navigation-menu>\n  <el-navigation-menu-item>\n    <el-navigation-menu-trigger>Products ▾</el-navigation-menu-trigger>\n    <el-navigation-menu-content style=\"padding: 12px; display: flex; flex-direction: column; gap: 6px; min-width: 200px;\">\n      <a href=\"#cloud\" style=\"text-decoration: none; color: inherit; font-weight: 600;\">Elementum Cloud</a>\n      <span style=\"font-size: 0.75rem; color: var(--el-text-muted);\">Managed serverless web components platform</span>\n    </el-navigation-menu-content>\n  </el-navigation-menu-item>\n  <el-navigation-menu-item>\n    <a href=\"#pricing\" style=\"padding: 8px 12px; text-decoration: none; color: inherit; font-weight: 500;\">Pricing</a>\n  </el-navigation-menu-item>\n</el-navigation-menu>"
      }
    ]
  },
  "el-navigation-menu-item": {
    "tag": "el-navigation-menu-item",
    "name": "Navigation Menu Item",
    "category": "layout",
    "description": "Top-level entry inside a Navigation Menu containing either a direct link or a trigger paired with dropdown content.",
    "formAssociated": false,
    "props": [],
    "slots": [
      {
        "name": "default",
        "description": "A direct anchor link or an el-navigation-menu-trigger paired with el-navigation-menu-content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Navigation Menu Item",
        "code": "<el-navigation-menu-item>\n  <el-navigation-menu-trigger>Documentation</el-navigation-menu-trigger>\n</el-navigation-menu-item>"
      }
    ]
  },
  "el-navigation-menu-trigger": {
    "tag": "el-navigation-menu-trigger",
    "name": "Navigation Menu Trigger",
    "category": "layout",
    "description": "Interactive trigger button inside a Navigation Menu Item that opens and closes its associated menu content panel.",
    "formAssociated": false,
    "props": [],
    "slots": [
      {
        "name": "default",
        "description": "Visible button label text or icon for the dropdown trigger."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Navigation Flyout Trigger",
        "code": "<el-navigation-menu-trigger>Solutions ▾</el-navigation-menu-trigger>"
      }
    ]
  },
  "el-navigation-menu-content": {
    "tag": "el-navigation-menu-content",
    "name": "Navigation Menu Content",
    "category": "layout",
    "description": "Floating mega-menu popover panel inside a Navigation Menu Item displaying grouped navigation links and descriptions.",
    "formAssociated": false,
    "props": [],
    "slots": [
      {
        "name": "default",
        "description": "Dropdown links, feature cards, or grouped navigation columns."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Navigation Menu Dropdown Content",
        "code": "<el-navigation-menu-content style=\"padding: 16px; min-width: 240px;\">\n  <div style=\"font-weight: 600; margin-bottom: 4px;\">Developer APIs</div>\n  <p style=\"font-size: 0.8rem; color: var(--el-text-muted); margin: 0;\">Signals, reactivity, and constructable stylesheets documentation.</p>\n</el-navigation-menu-content>"
      }
    ]
  },
  "el-radio-card": {
    "tag": "el-radio-card",
    "name": "Radio Card",
    "category": "forms",
    "description": "Selectable card-styled radio option rendered inside a Radio Card Group.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "text",
        "default": "standard",
        "description": "Configures value attribute."
      },
      {
        "name": "checked",
        "type": "boolean",
        "default": true,
        "description": "Configures checked attribute."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Selectable Plan Card",
        "code": "<el-radio-card value=\"compute\" checked style=\"max-width: 340px; width: 100%;\">\n  <div style=\"font-weight: 600;\">Compute Optimized</div>\n  <div style=\"font-size: 0.85rem; color: var(--el-text-muted);\">8 vCPU, 32GB RAM, 10Gbps Network</div>\n</el-radio-card>"
      }
    ]
  },
  "el-radio-card-group": {
    "tag": "el-radio-card-group",
    "name": "Radio Card Group",
    "category": "forms",
    "description": "Form-associated radio group arranging Radio Cards in a responsive multi-column grid.",
    "formAssociated": false,
    "props": [
      {
        "name": "name",
        "type": "text",
        "default": "tier",
        "description": "Configures name attribute."
      },
      {
        "name": "value",
        "type": "select",
        "options": [
          "basic",
          "standard"
        ],
        "default": "standard",
        "description": "Selected radio card value."
      },
      {
        "name": "columns",
        "type": "number",
        "default": 2,
        "description": "Configures columns attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Plan Selection Cards Grid",
        "code": "<el-radio-card-group value=\"standard\" columns=\"2\" style=\"max-width: 580px; width: 100%;\">\n  <el-radio-card value=\"basic\">\n    <div style=\"font-weight: 600;\">Starter Plan</div>\n    <div style=\"font-size: 0.85rem; color: var(--el-text-muted);\">$9 / month per user</div>\n  </el-radio-card>\n  <el-radio-card value=\"standard\">\n    <div style=\"font-weight: 600;\">Pro Team</div>\n    <div style=\"font-size: 0.85rem; color: var(--el-text-muted);\">$29 / month per user</div>\n  </el-radio-card>\n</el-radio-card-group>"
      }
    ]
  },
  "el-radio-group": {
    "tag": "el-radio-group",
    "name": "Radio Group",
    "category": "forms",
    "description": "Accessible form-associated container coordinating roving keyboard focus across Radio items.",
    "formAssociated": false,
    "props": [
      {
        "name": "value",
        "type": "select",
        "options": [
          "starter",
          "pro",
          "enterprise"
        ],
        "default": "pro",
        "description": "Selected radio value."
      },
      {
        "name": "name",
        "type": "text",
        "default": "region",
        "description": "Configures name attribute."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      },
      {
        "name": "required",
        "type": "boolean",
        "default": false,
        "description": "Configures required attribute."
      },
      {
        "name": "orientation",
        "type": "select",
        "options": [
          "horizontal",
          "vertical"
        ],
        "default": "vertical",
        "description": "Configures orientation attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Deployment Region Selector",
        "code": "<el-radio-group value=\"us-east\" name=\"deployment-region\" orientation=\"vertical\">\n  <el-radio value=\"us-east\">US East (N. Virginia)</el-radio>\n  <el-radio value=\"eu-west\">EU West (Frankfurt)</el-radio>\n  <el-radio value=\"ap-east\">AP East (Tokyo)</el-radio>\n</el-radio-group>"
      }
    ]
  },
  "el-resizable-handle": {
    "tag": "el-resizable-handle",
    "name": "Resizable Handle",
    "category": "layout",
    "description": "Interactive drag divider placed between Resizable Panels to resize split layouts smoothly.",
    "formAssociated": false,
    "props": [
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Splitter Resizable Divider Handle",
        "code": "<el-resizable-handle style=\"width: 4px; background: var(--el-surface-border); cursor: col-resize;\"></el-resizable-handle>"
      }
    ]
  },
  "el-resizable-panel": {
    "tag": "el-resizable-panel",
    "name": "Resizable Panel",
    "category": "layout",
    "description": "Flexible split-pane panel placed inside a Resizable container with configurable default, min, and max sizes.",
    "formAssociated": false,
    "props": [
      {
        "name": "default-size",
        "type": "text",
        "default": "",
        "description": "Configures default-size attribute."
      },
      {
        "name": "min-size",
        "type": "text",
        "default": "",
        "description": "Configures min-size attribute."
      },
      {
        "name": "max-size",
        "type": "text",
        "default": "",
        "description": "Configures max-size attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Resizable Partition Panel",
        "code": "<el-resizable-panel default-size=\"50\" min-size=\"20\">\n  <div style=\"padding: 16px; background: var(--el-surface-muted);\">Panel Content (50% Default Width)</div>\n</el-resizable-panel>"
      }
    ]
  },
  "el-route": {
    "tag": "el-route",
    "name": "Route",
    "category": "navigation",
    "description": "Declarative client-side route view rendered inside a Router when its path matches the current URL.",
    "formAssociated": false,
    "props": [
      {
        "name": "path",
        "type": "text",
        "default": "/home",
        "description": "Route URL pattern to match."
      },
      {
        "name": "exact",
        "type": "boolean",
        "default": false,
        "description": "Requires exact path match instead of prefix matching."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Client-Side Route Matcher",
        "code": "<el-router default=\"/dashboard\">\n  <el-route path=\"/dashboard\"><div style=\"padding: 12px; background: var(--el-surface-muted); border-radius: 6px;\">📊 Dashboard View Content</div></el-route>\n</el-router>"
      }
    ]
  },
  "el-route-link": {
    "tag": "el-route-link",
    "name": "Route Link",
    "category": "navigation",
    "description": "Client-side navigation link that updates the active Router path without a full page reload.",
    "formAssociated": false,
    "props": [
      {
        "name": "to",
        "type": "text",
        "default": "/analytics",
        "description": "Configures to attribute."
      },
      {
        "name": "exact",
        "type": "boolean",
        "default": false,
        "description": "Configures exact attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Client-Side Routing Anchor",
        "code": "<div style=\"display: flex; flex-direction: column; gap: 10px;\">\n  <div style=\"display: flex; gap: 8px;\">\n    <el-route-link to=\"/home\" style=\"padding: 6px 12px; border: 1px solid var(--el-surface-border); border-radius: 6px;\">Home</el-route-link>\n    <el-route-link to=\"/analytics\" style=\"padding: 6px 12px; border: 1px solid var(--el-surface-border); border-radius: 6px;\">View Analytics</el-route-link>\n  </div>\n  <el-router default=\"/home\">\n    <el-route path=\"/home\"><div style=\"padding: 10px;\">🏠 Home Route</div></el-route>\n    <el-route path=\"/analytics\"><div style=\"padding: 10px;\">📈 Analytics Route</div></el-route>\n  </el-router>\n</div>"
      }
    ]
  },
  "el-router": {
    "tag": "el-router",
    "name": "Router",
    "category": "navigation",
    "description": "Zero-dependency micro-signal SPA router coordinating Route views and browser history.",
    "formAssociated": false,
    "props": [
      {
        "name": "default",
        "type": "text",
        "default": "/home",
        "description": "Default active route path."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Zero-Dependency SPA Router Outlet",
        "code": "<div style=\"display: flex; flex-direction: column; gap: 10px; width: 100%;\">\n  <div style=\"display: flex; gap: 8px;\">\n    <el-route-link to=\"/home\" style=\"padding: 6px 12px; background: var(--el-surface-muted); border-radius: 6px;\">Home</el-route-link>\n    <el-route-link to=\"/analytics\" style=\"padding: 6px 12px; background: var(--el-surface-muted); border-radius: 6px;\">Analytics</el-route-link>\n  </div>\n  <el-router default=\"/home\">\n    <el-route path=\"/home\"><div style=\"padding: 12px; border: 1px solid var(--el-surface-border); border-radius: 8px;\">🏠 Home View Active</div></el-route>\n    <el-route path=\"/analytics\"><div style=\"padding: 12px; border: 1px solid var(--el-surface-border); border-radius: 8px;\">📊 Analytics View Active</div></el-route>\n  </el-router>\n</div>"
      }
    ]
  },
  "el-toggle-group": {
    "tag": "el-toggle-group",
    "name": "Toggle Group",
    "category": "actions",
    "description": "Container coordinating single or multiple pressed states across child Toggle buttons.",
    "formAssociated": false,
    "props": [
      {
        "name": "type",
        "type": "select",
        "options": [
          "single",
          "multiple"
        ],
        "default": "single",
        "description": "Single or multiple selection mode."
      },
      {
        "name": "value",
        "type": "select",
        "options": [
          "bold",
          "italic",
          "underline"
        ],
        "default": "bold",
        "description": "Selected item value."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Configures disabled attribute."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Text Alignment Group",
        "code": "<el-toggle-group type=\"single\" value=\"center\">\n  <el-toggle value=\"left\">Left</el-toggle>\n  <el-toggle value=\"center\">Center</el-toggle>\n  <el-toggle value=\"right\">Right</el-toggle>\n</el-toggle-group>"
      }
    ]
  },
  "el-visually-hidden": {
    "tag": "el-visually-hidden",
    "name": "Visually Hidden",
    "category": "layout",
    "description": "Accessibility utility that hides content visually while keeping it readable by screen readers.",
    "formAssociated": false,
    "props": [],
    "slots": [
      {
        "name": "default",
        "description": "Primary slotted content."
      }
    ],
    "events": [],
    "examples": [
      {
        "title": "Accessible Screen-Reader Text",
        "code": "<button style=\"padding: 8px 12px; border-radius: 6px; border: 1px solid var(--el-surface-border); background: var(--el-surface-base); cursor: pointer;\">\n  <span>🔍</span>\n  <el-visually-hidden>Search through component documentation</el-visually-hidden>\n</button>"
      }
    ]
  },
  "el-navbar": {
    "tag": "el-navbar",
    "name": "Navbar",
    "category": "navigation",
    "description": "Responsive sticky navigation header with brand, status badge, start/actions slots, and mobile drawer collapse.",
    "formAssociated": false,
    "props": [
      {
        "name": "brand",
        "type": "text",
        "default": "⚡ Elementum",
        "description": "Brand title displayed in the header."
      },
      {
        "name": "href",
        "type": "text",
        "default": "#",
        "description": "Destination URL for the brand link."
      },
      {
        "name": "badge",
        "type": "text",
        "default": "v0.1.0",
        "description": "Optional status badge label beside the brand."
      },
      {
        "name": "badge-variant",
        "type": "select",
        "options": [
          "default",
          "primary",
          "secondary",
          "success",
          "warning",
          "danger",
          "info",
          "outline"
        ],
        "default": "primary",
        "description": "Visual badge variant for the brand badge."
      },
      {
        "name": "sticky",
        "type": "boolean",
        "default": false,
        "description": "Pins the navbar to the top of the viewport on scroll."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": false,
        "description": "Controls mobile dropdown drawer visibility."
      }
    ],
    "slots": [
      {
        "name": "start",
        "description": "Optional leading trigger rendered before the brand (e.g. sidebar toggle button)."
      },
      {
        "name": "brand",
        "description": "Custom brand logo/link markup overriding default brand attributes."
      },
      {
        "name": "default",
        "description": "Primary navigation links (<a> or <el-route-link>)."
      },
      {
        "name": "actions",
        "description": "Right-aligned utility controls kept visible on desktop and mobile."
      }
    ],
    "events": [
      {
        "name": "toggle",
        "description": "Emitted when mobile navigation drawer opens or closes: detail: { open }"
      }
    ],
    "examples": [
      {
        "title": "Responsive Application Navbar",
        "code": "<el-navbar brand=\"⚡ Elementum\" badge=\"Catalog\" badge-variant=\"primary\">\n  <a href=\"#home\" active>Home</a>\n  <a href=\"#components\">Components</a>\n  <a href=\"#docs\">Docs</a>\n  <el-theme-switch slot=\"actions\" size=\"sm\"></el-theme-switch>\n</el-navbar>"
      }
    ]
  },
  "el-code-block": {
    "tag": "el-code-block",
    "name": "Code Block",
    "category": "data",
    "description": "Syntax container with optional language header, compact inline mode, and one-click clipboard copy button.",
    "formAssociated": false,
    "props": [
      {
        "name": "code",
        "type": "text",
        "default": "<el-button variant=\"primary\">Launch</el-button>",
        "description": "Code snippet string rendered in the block."
      },
      {
        "name": "language",
        "type": "select",
        "options": [
          "html",
          "js",
          "css",
          "bash",
          "json"
        ],
        "default": "html",
        "description": "Optional language header badge label."
      },
      {
        "name": "copyable",
        "type": "boolean",
        "default": true,
        "description": "Shows a one-click Copy button with clipboard confirmation."
      },
      {
        "name": "compact",
        "type": "boolean",
        "default": false,
        "description": "Renders compact inline padding without a top language header."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Fallback code text when code attribute is omitted."
      }
    ],
    "events": [
      {
        "name": "copy",
        "description": "Emitted after copying code to clipboard: detail: { code }"
      }
    ],
    "examples": [
      {
        "title": "Copyable HTML Snippet",
        "code": "<el-code-block language=\"html\" copyable code=\"<el-button variant='primary'>Save</el-button>\"></el-code-block>"
      }
    ]
  },
  "el-tool-call": {
    "tag": "el-tool-call",
    "name": "Tool Call",
    "category": "ai",
    "description": "AG-UI compatible tool invocation card displaying streaming JSON arguments, results, execution status, and Human-in-the-Loop approval controls.",
    "formAssociated": false,
    "props": [
      {
        "name": "name",
        "type": "text",
        "default": "deploy_edge_worker",
        "description": "Invoked tool function name."
      },
      {
        "name": "call-id",
        "type": "text",
        "default": "call_9f2a",
        "description": "Unique AG-UI toolCallId identifier."
      },
      {
        "name": "status",
        "type": "select",
        "options": [
          "running",
          "awaiting-approval",
          "completed",
          "error",
          "rejected"
        ],
        "default": "awaiting-approval",
        "description": "Current execution lifecycle state."
      },
      {
        "name": "args",
        "type": "text",
        "default": "{\"region\":\"us-east-1\",\"replicas\":3}",
        "description": "JSON arguments payload streamed from TOOL_CALL_ARGS."
      },
      {
        "name": "result",
        "type": "text",
        "default": "",
        "description": "Optional serialized tool result from TOOL_CALL_RESULT."
      },
      {
        "name": "approval",
        "type": "boolean",
        "default": true,
        "description": "Shows Approve / Reject Human-in-the-Loop action buttons."
      },
      {
        "name": "open",
        "type": "boolean",
        "default": true,
        "description": "Controls collapsible JSON payload visibility."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Optional custom generative UI content rendered inside the tool card."
      },
      {
        "name": "actions",
        "description": "Extra action buttons inside the Human-in-the-Loop approval bar."
      }
    ],
    "events": [
      {
        "name": "approve",
        "description": "Fired when user clicks Approve Execution: detail: { callId, name, args }"
      },
      {
        "name": "reject",
        "description": "Fired when user clicks Reject: detail: { callId, name, args }"
      },
      {
        "name": "toggle",
        "description": "Fired when collapsible details toggle: detail: { open }"
      }
    ],
    "examples": [
      {
        "title": "Human-in-the-Loop Tool Call",
        "code": "<el-tool-call name=\"deploy_edge_worker\" call-id=\"call_9f2a\" status=\"awaiting-approval\" approval args='{\"region\":\"us-east-1\",\"replicas\":3}'></el-tool-call>"
      }
    ]
  },
  "el-diff-viewer": {
    "tag": "el-diff-viewer",
    "name": "Diff Viewer",
    "category": "ai",
    "description": "Zero-dependency code and config diff viewer with unified/split modes and HITL patch approval.",
    "formAssociated": false,
    "props": [
      {
        "name": "filename",
        "type": "text",
        "default": "src/config.js",
        "description": "File path or resource heading."
      },
      {
        "name": "before",
        "type": "text",
        "default": "const timeout = 1000;\nconst retries = 1;",
        "description": "Original text content."
      },
      {
        "name": "after",
        "type": "text",
        "default": "const timeout = 3000;\nconst retries = 3;",
        "description": "Proposed text content."
      },
      {
        "name": "mode",
        "type": "select",
        "options": [
          "unified",
          "split"
        ],
        "default": "unified",
        "description": "Unified or side-by-side split diff layout."
      },
      {
        "name": "approval",
        "type": "boolean",
        "default": true,
        "description": "Displays Accept Patch / Reject HITL buttons."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "accept",
        "description": "Fired when user clicks Accept Patch."
      },
      {
        "name": "reject",
        "description": "Fired when user clicks Reject."
      }
    ],
    "examples": [
      {
        "title": "HITL Patch Diff",
        "code": "<el-diff-viewer filename=\"src/config.js\" mode=\"unified\" approval before=\"const retries = 1;\" after=\"const retries = 3;\"></el-diff-viewer>"
      }
    ]
  },
  "el-sources": {
    "tag": "el-sources",
    "name": "Sources",
    "category": "ai",
    "description": "Numbered grounding citation pills and expandable source cards for RAG and web-search AI responses.",
    "formAssociated": false,
    "props": [
      {
        "name": "sources",
        "type": "text",
        "default": "[{\"title\":\"AG-UI Protocol\",\"url\":\"https://docs.ag-ui.com\",\"snippet\":\"Event-driven agent-user interaction protocol.\"},{\"title\":\"Penpot DTCG\",\"url\":\"https://penpot.app\",\"snippet\":\"Open-source design tokens and UI kits.\"}]",
        "description": "JSON array of source objects ({ title, url, domain?, snippet? })."
      },
      {
        "name": "label",
        "type": "text",
        "default": "Sources",
        "description": "Toggle button label."
      },
      {
        "name": "expanded",
        "type": "boolean",
        "default": true,
        "description": "Expands the full source preview cards."
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "source-select",
        "description": "Fired when a citation pill or source card is clicked."
      }
    ],
    "examples": [
      {
        "title": "Grounding Citations",
        "code": "<el-sources label=\"Sources\" expanded sources='[{\"title\":\"AG-UI Docs\",\"url\":\"https://docs.ag-ui.com\",\"snippet\":\"Standard event stream for agent UIs.\"}]'></el-sources>"
      }
    ]
  },
  "el-task-list": {
    "tag": "el-task-list",
    "name": "Task List",
    "category": "ai",
    "description": "Multi-step AI agent execution plan checklist with status indicators, durations, and surgical step updates.",
    "formAssociated": false,
    "props": [
      {
        "name": "heading",
        "type": "text",
        "default": "Agent Execution Plan",
        "description": "Header title for the task checklist."
      },
      {
        "name": "tasks",
        "type": "text",
        "default": "[{\"id\":\"1\",\"label\":\"Inspect Penpot boards\",\"status\":\"completed\",\"duration\":\"420ms\"},{\"id\":\"2\",\"label\":\"Generate Elementum HTML\",\"status\":\"running\",\"detail\":\"Validating 15 component tags\"},{\"id\":\"3\",\"label\":\"Run contract tests\",\"status\":\"pending\"}]",
        "description": "JSON array of task objects ({ id, label, status, detail?, duration? })."
      },
      {
        "name": "compact",
        "type": "boolean",
        "default": false,
        "description": "Compact dense row spacing."
      }
    ],
    "slots": [],
    "events": [],
    "examples": [
      {
        "title": "Agent Execution Plan",
        "code": "<el-task-list heading=\"Deploy Pipeline\" tasks='[{\"id\":\"1\",\"label\":\"Run unit tests\",\"status\":\"completed\",\"duration\":\"3.1s\"},{\"id\":\"2\",\"label\":\"Publish edge worker\",\"status\":\"running\"}]'></el-task-list>"
      }
    ]
  },
  "el-insight-card": {
    "tag": "el-insight-card",
    "name": "Insight Card",
    "category": "ai",
    "description": "Structured AI insight or artifact card with metric delta, action button, and thumbs up/down feedback.",
    "formAssociated": false,
    "props": [
      {
        "name": "title",
        "type": "text",
        "default": "Reduce Cold Start Latency",
        "description": "Insight heading."
      },
      {
        "name": "category",
        "type": "text",
        "default": "Optimization",
        "description": "Category pill text."
      },
      {
        "name": "metric",
        "type": "text",
        "default": "-42ms",
        "description": "Optional key metric figure."
      },
      {
        "name": "delta",
        "type": "text",
        "default": "p95 improvement",
        "description": "Optional metric comparison note."
      },
      {
        "name": "variant",
        "type": "select",
        "options": [
          "info",
          "success",
          "warning",
          "danger"
        ],
        "default": "success",
        "description": "Semantic badge accent."
      },
      {
        "name": "summary",
        "type": "text",
        "default": "Pre-rendering Declarative Shadow DOM removes initial client layout shift.",
        "description": "Summary description."
      },
      {
        "name": "action-label",
        "type": "text",
        "default": "Apply Recommendation",
        "description": "Primary CTA button text."
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Optional custom body content inside the insight card."
      }
    ],
    "events": [
      {
        "name": "action",
        "description": "Fired when primary CTA button is clicked."
      },
      {
        "name": "feedback",
        "description": "Fired when thumbs up/down feedback is toggled."
      }
    ],
    "examples": [
      {
        "title": "AI Optimization Insight",
        "code": "<el-insight-card category=\"Optimization\" variant=\"success\" title=\"Zero-CLS First Paint\" metric=\"-42ms\" delta=\"p95\" summary=\"Enable DSD SSR on edge routes.\" action-label=\"Apply Fix\"></el-insight-card>"
      }
    ]
  }
};
