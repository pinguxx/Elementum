import fs from 'fs';
import path from 'path';

// 1. Load current catalog
const catalogPath = path.resolve('examples/catalog-data.js');
const { categories, components } = await import('../examples/catalog-data.js');

const categoryMap = {
  'el-button': 'actions', 'el-toggle': 'actions', 'el-toggle-group': 'actions', 'el-kbd': 'actions', 'el-toolbar': 'actions',
  'el-input': 'forms', 'el-textarea': 'forms', 'el-select': 'forms', 'el-autocomplete': 'forms',
  'el-slider': 'forms', 'el-switch': 'forms', 'el-checkbox': 'forms', 'el-checkbox-card': 'forms',
  'el-radio': 'forms', 'el-radio-group': 'forms', 'el-radio-card': 'forms', 'el-radio-card-group': 'forms',
  'el-segmented-control': 'forms', 'el-number-field': 'forms',
  'el-otp-input': 'forms', 'el-datepicker': 'forms', 'el-calendar': 'forms', 'el-dropzone': 'forms',
  'el-rating': 'forms', 'el-field': 'forms', 'el-form': 'forms', 'el-fieldset': 'forms',
  'el-table': 'data', 'el-chart': 'data', 'el-tree-view': 'data', 'el-tree-item': 'data',
  'el-data-list': 'data', 'el-data-list-item': 'data', 'el-badge': 'data', 'el-chip': 'data', 'el-avatar': 'data',
  'el-avatar-group': 'data', 'el-timeline': 'data', 'el-timeline-item': 'data', 'el-meter': 'data',
  'el-progress': 'data', 'el-number-flow': 'data',
  'el-toast': 'feedback', 'el-toaster': 'feedback', 'el-alert': 'feedback', 'el-alert-dialog': 'feedback',
  'el-callout': 'feedback', 'el-spinner': 'feedback', 'el-skeleton': 'feedback', 'el-empty-state': 'feedback',
  'el-dialog': 'overlays', 'el-drawer': 'overlays', 'el-popover': 'overlays', 'el-tooltip': 'overlays',
  'el-preview-card': 'overlays', 'el-dropdown': 'overlays', 'el-context-menu': 'overlays', 'el-command': 'overlays',
  'el-command-item': 'overlays', 'el-command-group': 'overlays',
  'el-tabs': 'navigation', 'el-tab': 'navigation', 'el-navigation-menu': 'navigation', 'el-menubar': 'navigation',
  'el-breadcrumb': 'navigation', 'el-breadcrumb-item': 'navigation', 'el-pagination': 'navigation',
  'el-sidebar': 'navigation', 'el-sidebar-header': 'navigation', 'el-sidebar-content': 'navigation',
  'el-sidebar-footer': 'navigation', 'el-sidebar-trigger': 'navigation', 'el-router': 'navigation',
  'el-route': 'navigation', 'el-route-link': 'navigation',
  'el-card': 'layout', 'el-card-header': 'layout', 'el-card-title': 'layout', 'el-card-description': 'layout',
  'el-card-content': 'layout', 'el-card-footer': 'layout', 'el-scroll-area': 'layout', 'el-resizable': 'layout',
  'el-resizable-handle': 'layout', 'el-resizable-panel': 'layout',
  'el-inset': 'layout', 'el-separator': 'layout', 'el-aspect-ratio': 'layout', 'el-collapsible': 'layout',
  'el-accordion': 'layout', 'el-accordion-item': 'layout', 'el-carousel': 'layout', 'el-carousel-slide': 'layout',
  'el-visually-hidden': 'layout',
  'el-prompt-input': 'ai', 'el-streaming-text': 'ai', 'el-reasoning-card': 'ai', 'el-border-beam': 'ai'
};

// 2. Discover observedAttributes for every class and tag in src/components/
const files = fs.readdirSync('src/components').filter(f => f.endsWith('.js'));
const codeAttributes = {};
const classNames = {};

for (const f of files) {
  const content = fs.readFileSync(path.join('src/components', f), 'utf8');
  const defines = [...content.matchAll(/customElements\.define\(['"]([^'"]+)['"],\s*(\w+)\)/g)];
  for (const def of defines) {
    const tag = def[1];
    const cls = def[2];
    classNames[tag] = cls;
    
    // Find class body
    const classRegex = new RegExp(`class\\s+${cls}[^{]*\\{([\\s\\S]*?)(?:\\n\\}\\s*\\n|$\\))`);
    const classMatch = content.match(classRegex);
    const body = classMatch ? classMatch[1] : content;
    
    const obsMatch = body.match(/static\s+observedAttributes\s*=\s*\[([^\]]*)\]/);
    const attrs = obsMatch
      ? obsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
      : [];
      
    codeAttributes[tag] = attrs;
  }
}

// 3. Known type inference rules
function inferPropType(name) {
  const booleanAttrs = [
    'checked', 'indeterminate', 'disabled', 'required', 'open', 'multiple', 
    'collapsed', 'readonly', 'selectable', 'removable', 'selected', 'dismissible',
    'clearable', 'auto-resize', 'striped', 'hover', 'animated', 'autoplay',
    'loop', 'handle', 'scale-background', 'novalidate', 'copyable', 'exact', 'decorative'
  ];
  if (booleanAttrs.includes(name)) {
    return { type: 'boolean', default: false };
  }
  
  if (name === 'size') {
    return { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' };
  }
  if (name === 'variant') {
    return { type: 'select', options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'], default: 'primary' };
  }
  if (name === 'placement') {
    return { type: 'select', options: ['top', 'bottom', 'left', 'right'], default: 'bottom' };
  }
  if (name === 'orientation') {
    return { type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' };
  }
  if (name === 'status') {
    return { type: 'select', options: ['completed', 'active', 'pending', 'error'], default: 'completed' };
  }
  if (name === 'theme') {
    return { type: 'select', options: ['light', 'dark', 'system'], default: 'system' };
  }
  
  const numberAttrs = ['min', 'max', 'step', 'low', 'high', 'optimum', 'delay', 'duration', 'length', 'page', 'total', 'rows', 'precision', 'speed', 'columns'];
  if (numberAttrs.includes(name)) {
    return { type: 'number', default: 0 };
  }
  
  return { type: 'text', default: '' };
}

// 4. Ensure all tags exist in components
for (const [tag, attrs] of Object.entries(codeAttributes)) {
  if (!components[tag]) {
    const cls = classNames[tag] || tag;
    const readable = cls.replace(/^El/, '').replace(/([A-Z])/g, ' $1').trim();
    components[tag] = {
      tag,
      name: readable,
      category: categoryMap[tag] || 'layout',
      description: `Elementum <${tag}> UI component primitive.`,
      formAssociated: false,
      props: [],
      slots: [{ name: 'default', description: 'Primary slotted content.' }],
      events: [],
      examples: []
    };
  }
}

// 5. Curated rich examples for components
const curatedExamples = {
  'el-checkbox': [
    { title: 'Interactive Checkboxes', code: '<el-checkbox checked>Remember this device</el-checkbox>\n<el-checkbox indeterminate>Select all sub-tasks</el-checkbox>\n<el-checkbox disabled>Locked preference</el-checkbox>' }
  ],
  'el-checkbox-card': [
    { title: 'Feature Card Checkbox', code: '<el-checkbox-card value="backup" checked>\n  <div style="font-weight: 600;">Daily Automated Backups</div>\n  <div style="font-size: 0.85rem; color: var(--el-text-muted);">Point-in-time recovery for 30 days.</div>\n</el-checkbox-card>' }
  ],
  'el-radio': [
    { title: 'Radio Items', code: '<el-radio value="opt1" checked>Standard Tier ($19/mo)</el-radio>\n<el-radio value="opt2">Enterprise Tier ($99/mo)</el-radio>' }
  ],
  'el-radio-group': [
    { title: 'Radio Plan Group', code: '<el-radio-group value="pro" name="tier">\n  <el-radio value="starter">Starter Plan ($9/mo)</el-radio>\n  <el-radio value="pro">Pro Plan ($29/mo)</el-radio>\n  <el-radio value="enterprise">Enterprise Tier ($99/mo)</el-radio>\n</el-radio-group>' }
  ],
  'el-radio-card': [
    { title: 'Selectable Plan Card', code: '<el-radio-card value="compute" checked>\n  <div style="font-weight: 600;">Compute Optimized</div>\n  <div style="font-size: 0.85rem; color: var(--el-text-muted);">8 vCPU, 32GB RAM, 10Gbps</div>\n</el-radio-card>' }
  ],
  'el-field': [
    { title: 'Input Field with Description', code: '<el-field label="Work Email" description="Used for two-factor authentication.">\n  <el-input placeholder="alex@company.com"></el-input>\n</el-field>' },
    { title: 'Field with Error State', code: '<el-field label="Master Password" error="Password must contain at least 8 characters." required>\n  <el-input type="password" value="secret"></el-input>\n</el-field>' }
  ],
  'el-meter': [
    { title: 'System Capacity Gauge', code: '<el-meter value="72" min="0" max="100" low="33" high="66" optimum="80"></el-meter>' }
  ],
  'el-popover': [
    { title: 'Popover Info Card', code: '<el-popover placement="bottom">\n  <el-button variant="secondary">View Cluster Health</el-button>\n  <div slot="content" style="padding: 12px; max-width: 240px;">\n    <h4 style="margin: 0 0 6px 0; font-size: 0.95rem;">System Health</h4>\n    <p style="margin: 0; font-size: 0.85rem; color: var(--el-text-muted);">All regional clusters are reporting nominal latency.</p>\n  </div>\n</el-popover>' }
  ],
  'el-collapsible': [
    { title: 'Collapsible JSON', code: '<el-collapsible open>\n  <el-button slot="trigger" variant="secondary">Toggle Metadata Panel ▾</el-button>\n  <div style="padding: 12px; background: var(--el-surface-muted); border-radius: 6px; margin-top: 8px; font-family: monospace; font-size: 0.85rem;">\n    {"status": 200, "region": "us-east-1", "activeNodes": 14}\n  </div>\n</el-collapsible>' }
  ],
  'el-callout': [
    { title: 'Semantic Callout Notice', code: '<el-callout variant="info">\n  <strong>Pro Tip:</strong> Press Cmd+K anytime to open global search.\n</el-callout>' }
  ],
  'el-data-list': [
    { title: 'Key-Value Metrics', code: '<el-data-list>\n  <el-data-list-item label="Cluster ID" value="cls-99482" copyable></el-data-list-item>\n  <el-data-list-item label="Primary Region" value="us-east-1"></el-data-list-item>\n  <el-data-list-item label="SLA Uptime" value="99.99%"></el-data-list-item>\n</el-data-list>' }
  ],
  'el-toolbar': [
    { title: 'Action Toolbar', code: '<el-toolbar>\n  <el-button size="sm" variant="ghost">Bold</el-button>\n  <el-button size="sm" variant="ghost">Italic</el-button>\n  <el-separator orientation="vertical"></el-separator>\n  <el-button size="sm" variant="ghost">Link</el-button>\n  <el-button size="sm" variant="ghost">Code</el-button>\n</el-toolbar>' }
  ],
  'el-tree-view': [
    { title: 'Project Tree View', code: '<el-tree-view style="max-width: 300px;">\n  <el-tree-item label="src" expanded>\n    <el-tree-item label="components" expanded>\n      <el-tree-item label="el-button.js" selected></el-tree-item>\n      <el-tree-item label="el-checkbox.js"></el-tree-item>\n      <el-tree-item label="el-select.js"></el-tree-item>\n    </el-tree-item>\n    <el-tree-item label="index.js"></el-tree-item>\n  </el-tree-item>\n  <el-tree-item label="package.json"></el-tree-item>\n</el-tree-view>' }
  ],
  'el-separator': [
    { title: 'Layout Divider', code: '<p style="margin: 0 0 8px 0;">Top Content</p>\n<el-separator></el-separator>\n<p style="margin: 8px 0 0 0;">Bottom Content</p>' }
  ],
  'el-scroll-area': [
    { title: 'Log Stream', code: '<el-scroll-area max-height="160px" type="hover" style="border: 1px solid var(--el-surface-border); border-radius: 8px; padding: 12px;">\n  <div style="font-family: monospace; font-size: 0.85rem; line-height: 1.8;">\n    [10:45:01] Ingested 14,290 records.<br>\n    [10:45:02] Pipeline synced to BigQuery.<br>\n    [10:45:04] Verification checks passed.<br>\n    [10:45:08] Edge replication active.<br>\n    [10:45:12] Cache warm-up completed.<br>\n    [10:45:15] Ready for production traffic.\n  </div>\n</el-scroll-area>' }
  ],
  'el-theme-switch': [
    { title: 'Theme Switcher', code: '<el-theme-switch></el-theme-switch>' }
  ],
  'el-dropdown': [
    { title: 'Action Dropdown', code: '<el-dropdown>\n  <el-button slot="trigger" variant="secondary">Actions Menu ▾</el-button>\n  <div slot="menu" style="padding: 6px; display: flex; flex-direction: column; gap: 4px; min-width: 160px;">\n    <button style="padding: 8px 12px; text-align: left; background: none; border: none; font-size: 0.875rem; border-radius: 4px; cursor: pointer; color: var(--el-text-base);">Edit</button>\n    <button style="padding: 8px 12px; text-align: left; background: none; border: none; font-size: 0.875rem; border-radius: 4px; cursor: pointer; color: var(--el-text-base);">Duplicate</button>\n    <button style="padding: 8px 12px; text-align: left; background: none; border: none; font-size: 0.875rem; border-radius: 4px; cursor: pointer; color: var(--el-color-danger, #ef4444);">Delete</button>\n  </div>\n</el-dropdown>' }
  ],
  'el-context-menu': [
    { title: 'Right-Click Area', code: '<el-context-menu>\n  <div slot="trigger" style="padding: 32px; border: 2px dashed var(--el-surface-border); border-radius: 8px; text-align: center; color: var(--el-text-muted);">\n    Right click anywhere in this container\n  </div>\n  <div slot="menu" style="padding: 6px; display: flex; flex-direction: column; gap: 4px; min-width: 140px;">\n    <button style="padding: 8px; text-align: left; background: none; border: none; cursor: pointer; border-radius: 4px;">Inspect</button>\n    <button style="padding: 8px; text-align: left; background: none; border: none; cursor: pointer; border-radius: 4px;">Reload</button>\n  </div>\n</el-context-menu>' }
  ],
  'el-menubar': [
    { title: 'Application Menubar', code: '<el-menubar>\n  <el-menu label="File">\n    <el-menu-item>New File</el-menu-item>\n    <el-menu-item>Open...</el-menu-item>\n  </el-menu>\n  <el-menu label="Edit">\n    <el-menu-item>Undo</el-menu-item>\n    <el-menu-item>Redo</el-menu-item>\n  </el-menu>\n</el-menubar>' }
  ],
  'el-timeline': [
    { title: 'Deployment Pipeline', code: '<el-timeline style="max-width: 380px;">\n  <el-timeline-item status="completed" title="Code Pushed" date="10:00 AM">Commit verified.</el-timeline-item>\n  <el-timeline-item status="completed" title="Tests Passed" date="10:05 AM">108 unit tests green.</el-timeline-item>\n  <el-timeline-item status="active" title="Deploying to Edge" date="10:12 AM">Routing CDN edge traffic.</el-timeline-item>\n  <el-timeline-item status="pending" title="Release Live" date="Pending">Awaiting health check.</el-timeline-item>\n</el-timeline>' }
  ],
  'el-toggle-group': [
    { title: 'Text Alignment Group', code: '<el-toggle-group type="single" value="center">\n  <el-toggle value="left">Left</el-toggle>\n  <el-toggle value="center">Center</el-toggle>\n  <el-toggle value="right">Right</el-toggle>\n</el-toggle-group>' }
  ],
  'el-navigation-menu': [
    { title: 'Top Navigation Menu', code: '<el-navigation-menu orientation="horizontal">\n  <a href="#home">Home</a>\n  <a href="#products">Products</a>\n  <a href="#pricing">Pricing</a>\n</el-navigation-menu>' }
  ]
};

// 6. Audit & merge props and examples for every component
for (const [tag, comp] of Object.entries(components)) {
  const codeAttrs = codeAttributes[tag] || [];
  if (!comp.props) comp.props = [];
  
  const propNames = new Set(comp.props.map(p => p.name));
  
  for (const attr of codeAttrs) {
    if (!propNames.has(attr)) {
      const inferred = inferPropType(attr);
      comp.props.push({
        name: attr,
        type: inferred.type,
        options: inferred.options,
        default: inferred.default,
        description: `Configures ${attr} attribute.`
      });
      propNames.add(attr);
    }
  }
  
  // Add label attribute if component supports label fallback
  const labelFallbackComponents = ['el-button', 'el-toggle', 'el-switch', 'el-chip', 'el-badge', 'el-alert', 'el-checkbox'];
  if (labelFallbackComponents.includes(tag) && !propNames.has('label')) {
    comp.props.push({
      name: 'label',
      type: 'text',
      default: comp.name || 'Label Text',
      description: 'Slotted or attribute text label.'
    });
  }
  
  // Apply curated examples
  if (curatedExamples[tag]) {
    comp.examples = curatedExamples[tag];
  } else if (!comp.examples || comp.examples.length === 0 || comp.examples[0].code === `<${tag}></${tag}>`) {
    comp.examples = [
      {
        title: `${comp.name} Usage`,
        code: `<${tag}></${tag}>`
      }
    ];
  }
}

// 7. Write enriched catalog
const output = `// Auto-generated Component Catalog Schema & Metadata
export const categories = ${JSON.stringify(categories, null, 2)};

export const components = ${JSON.stringify(components, null, 2)};
`;

fs.writeFileSync(catalogPath, output, 'utf8');
console.log('Successfully completed exhaustive catalog enrichment across ' + Object.keys(components).length + ' components.');
