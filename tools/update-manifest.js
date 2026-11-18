import fs from 'fs';

const newModules = [
  {
    kind: 'javascript-module',
    path: 'src/components/el-alert.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElAlert',
        tagName: 'el-alert',
        description: 'Inline notification banner with contextual variants, dismissibility and icon slots.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'variant', type: { text: "'default' | 'info' | 'success' | 'warning' | 'destructive'" }, default: "'default'" },
          { name: 'title', type: { text: 'string' }, default: "''" },
          { name: 'dismissible', type: { text: 'boolean' }, default: 'false' }
        ],
        events: [{ name: 'dismiss', description: 'Emitted when user dismisses the alert.' }]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-aspect-ratio.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElAspectRatio',
        tagName: 'el-aspect-ratio',
        description: 'CLS-free container enforcing fixed aspect ratios for responsive media.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'ratio', type: { text: 'string' }, default: "'16/9'" }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-breadcrumb.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElBreadcrumb',
        tagName: 'el-breadcrumb',
        description: 'Semantic navigation trail container with configurable separators.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'separator', type: { text: 'string' }, default: "'/'" }
        ]
      },
      {
        kind: 'class',
        name: 'ElBreadcrumbItem',
        tagName: 'el-breadcrumb-item',
        description: 'Individual breadcrumb link or terminal item.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'href', type: { text: 'string' } },
          { name: 'current', type: { text: 'boolean' }, default: 'false' }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-card.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElCard',
        tagName: 'el-card',
        description: 'Structured card container with header, title, description, content and footer subcomponents.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'hoverable', type: { text: 'boolean' }, default: 'false' }
        ]
      },
      { kind: 'class', name: 'ElCardHeader', tagName: 'el-card-header', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElCardTitle', tagName: 'el-card-title', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElCardDescription', tagName: 'el-card-description', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElCardContent', tagName: 'el-card-content', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElCardFooter', tagName: 'el-card-footer', superclass: { name: 'Elementum', module: 'src/index.js' } }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-carousel.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElCarousel',
        tagName: 'el-carousel',
        description: 'Accessible touch-swipeable and keyboard navigable carousel with autoplay and indicators.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'auto-play', type: { text: 'boolean' }, default: 'false' },
          { name: 'interval', type: { text: 'number' }, default: '4000' },
          { name: 'loop', type: { text: 'boolean' }, default: 'true' }
        ],
        events: [{ name: 'slide-change', description: 'Emitted when current slide changes.' }]
      },
      { kind: 'class', name: 'ElCarouselSlide', tagName: 'el-carousel-slide', superclass: { name: 'Elementum', module: 'src/index.js' } }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-dropzone.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElDropzone',
        tagName: 'el-dropzone',
        description: 'Drag and drop file upload target with type filtering and size constraint validation.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'accept', type: { text: 'string' }, default: "''" },
          { name: 'max-size', type: { text: 'number' } },
          { name: 'multiple', type: { text: 'boolean' }, default: 'false' },
          { name: 'disabled', type: { text: 'boolean' }, default: 'false' }
        ],
        events: [{ name: 'files-selected', description: 'Emitted when valid files are dropped or selected.' }]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-empty-state.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElEmptyState',
        tagName: 'el-empty-state',
        description: 'Zero-data placeholder graphic with title, description, and action CTA slots.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'title', type: { text: 'string' } },
          { name: 'description', type: { text: 'string' } }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-form.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElForm',
        tagName: 'el-form',
        description: 'Form container orchestrating validation, serialization and data collection across Elementum inputs.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        events: [{ name: 'submit', description: 'Emitted on valid form submission.' }]
      },
      {
        kind: 'class',
        name: 'ElFieldset',
        tagName: 'el-fieldset',
        description: 'Accessible field grouping container with legend and cascade disable support.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'legend', type: { text: 'string' } },
          { name: 'disabled', type: { text: 'boolean' }, default: 'false' }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-kbd.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElKbd',
        tagName: 'el-kbd',
        description: 'Keycap keyboard shortcut parser and badge renderer.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'keys', type: { text: 'string' } },
          { name: 'size', type: { text: "'sm' | 'md' | 'lg'" }, default: "'md'" }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-rating.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElRating',
        tagName: 'el-rating',
        description: 'Form-associated star rating component with keyboard arrows and hover preview.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'value', type: { text: 'number' }, default: '0' },
          { name: 'max', type: { text: 'number' }, default: '5' },
          { name: 'readonly', type: { text: 'boolean' }, default: 'false' },
          { name: 'disabled', type: { text: 'boolean' }, default: 'false' }
        ],
        events: [{ name: 'change', description: 'Emitted when rating value is confirmed.' }]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-resizable.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElResizable',
        tagName: 'el-resizable',
        description: 'Split-pane divider handle with pointer dragging and keyboard arrow resize.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'direction', type: { text: "'horizontal' | 'vertical'" }, default: "'horizontal'" },
          { name: 'size', type: { text: 'number' }, default: '50' },
          { name: 'min', type: { text: 'number' }, default: '10' },
          { name: 'max', type: { text: 'number' }, default: '90' }
        ],
        events: [{ name: 'resize', description: 'Emitted during pane resizing with percentage size.' }]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-sidebar.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElSidebar',
        tagName: 'el-sidebar',
        description: 'Collapsible application sidebar with off-canvas drawer mode and responsive collapse.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'collapsed', type: { text: 'boolean' }, default: 'false' },
          { name: 'collapsible', type: { text: "'offcanvas' | 'icon' | 'none'" }, default: "'offcanvas'" },
          { name: 'side', type: { text: "'left' | 'right'" }, default: "'left'" }
        ],
        events: [
          { name: 'collapse', description: 'Emitted when sidebar collapses.' },
          { name: 'expand', description: 'Emitted when sidebar expands.' }
        ]
      },
      { kind: 'class', name: 'ElSidebarHeader', tagName: 'el-sidebar-header', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElSidebarContent', tagName: 'el-sidebar-content', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElSidebarFooter', tagName: 'el-sidebar-footer', superclass: { name: 'Elementum', module: 'src/index.js' } },
      { kind: 'class', name: 'ElSidebarTrigger', tagName: 'el-sidebar-trigger', superclass: { name: 'Elementum', module: 'src/index.js' } }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-skeleton.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElSkeleton',
        tagName: 'el-skeleton',
        description: 'Shimmer wave/pulse placeholder box preventing layout shifts.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'variant', type: { text: "'text' | 'circular' | 'rectangular'" }, default: "'text'" },
          { name: 'animation', type: { text: "'pulse' | 'wave' | 'none'" }, default: "'pulse'" },
          { name: 'width', type: { text: 'string' } },
          { name: 'height', type: { text: 'string' } }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-textarea.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElTextarea',
        tagName: 'el-textarea',
        description: 'Form-associated auto-resizing multi-line text input with character counting.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'placeholder', type: { text: 'string' }, default: "''" },
          { name: 'rows', type: { text: 'number' }, default: '3' },
          { name: 'auto-resize', type: { text: 'boolean' }, default: 'false' },
          { name: 'disabled', type: { text: 'boolean' }, default: 'false' },
          { name: 'required', type: { text: 'boolean' }, default: 'false' },
          { name: 'maxlength', type: { text: 'number' } }
        ],
        events: [
          { name: 'input', description: 'Emitted on character input.' },
          { name: 'change', description: 'Emitted on commit.' }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-timeline.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElTimeline',
        tagName: 'el-timeline',
        description: 'Activity progression trail container.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'orientation', type: { text: "'vertical' | 'horizontal'" }, default: "'vertical'" }
        ]
      },
      {
        kind: 'class',
        name: 'ElTimelineItem',
        tagName: 'el-timeline-item',
        description: 'Individual chronological milestone node with status badges.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'status', type: { text: "'default' | 'active' | 'success' | 'warning' | 'destructive'" }, default: "'default'" },
          { name: 'date', type: { text: 'string' } }
        ]
      }
    ]
  },
  {
    kind: 'javascript-module',
    path: 'src/components/el-tree-view.js',
    declarations: [
      {
        kind: 'class',
        name: 'ElTreeView',
        tagName: 'el-tree-view',
        description: 'Hierarchical tree list container with keyboard navigation.',
        superclass: { name: 'Elementum', module: 'src/index.js' }
      },
      {
        kind: 'class',
        name: 'ElTreeItem',
        tagName: 'el-tree-item',
        description: 'Expandable/collapsible tree node.',
        superclass: { name: 'Elementum', module: 'src/index.js' },
        attributes: [
          { name: 'label', type: { text: 'string' } },
          { name: 'expanded', type: { text: 'boolean' }, default: 'false' },
          { name: 'selected', type: { text: 'boolean' }, default: 'false' },
          { name: 'disabled', type: { text: 'boolean' }, default: 'false' }
        ],
        events: [
          { name: 'expand', description: 'Emitted when branch expands.' },
          { name: 'collapse', description: 'Emitted when branch collapses.' },
          { name: 'select', description: 'Emitted when item is selected.' }
        ]
      }
    ]
  }
];

const manifest = JSON.parse(fs.readFileSync('custom-elements.json', 'utf8'));
const existingPaths = new Set(manifest.modules.map(m => m.path.replace(/\\/g, '/')));

for (const mod of newModules) {
  if (!existingPaths.has(mod.path)) {
    manifest.modules.push(mod);
  }
}

manifest.modules.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync('custom-elements.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Manifest successfully updated! Total modules:', manifest.modules.length);
