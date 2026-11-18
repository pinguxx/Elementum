import fs from 'fs';
import path from 'path';

const catalogPath = path.resolve('examples/catalog-data.js');
const { categories, components } = await import('../examples/catalog-data.js');

const richExamplesMap = {
  'el-fieldset': {
    propsDefaults: { legend: 'Security & Access Control', disabled: false },
    examples: [
      {
        title: 'Credentials & Multi-Factor',
        code: `<el-fieldset legend="Security & Access Control">
  <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
    <el-field label="Master API Key">
      <el-input value="ak_live_839210492" type="password"></el-input>
    </el-field>
    <el-checkbox label="Enforce Hardware FIDO2 2FA" checked></el-checkbox>
    <el-checkbox label="Require VPN for admin actions"></el-checkbox>
  </div>
</el-fieldset>`
      }
    ]
  },
  'el-radio': {
    propsDefaults: { value: 'pro', label: 'Pro Plan ($29/mo)', checked: true, disabled: false },
    examples: [
      {
        title: 'Standalone Radio Options',
        code: `<div style="display: flex; flex-direction: column; gap: 10px;">
  <el-radio value="monthly" checked>Billed Monthly ($29/mo)</el-radio>
  <el-radio value="yearly">Billed Annually ($290/yr - 2 Months Free!)</el-radio>
  <el-radio value="enterprise" disabled>Enterprise Contract (Custom)</el-radio>
</div>`
      }
    ]
  },
  'el-radio-group': {
    propsDefaults: { value: 'us-east', name: 'region', orientation: 'vertical', disabled: false, required: false },
    examples: [
      {
        title: 'Deployment Region Selector',
        code: `<el-radio-group value="us-east" name="deployment-region" orientation="vertical">
  <el-radio value="us-east">US East (N. Virginia)</el-radio>
  <el-radio value="eu-west">EU West (Frankfurt)</el-radio>
  <el-radio value="ap-east">AP East (Tokyo)</el-radio>
</el-radio-group>`
      }
    ]
  },
  'el-radio-card-group': {
    propsDefaults: { value: 'standard', name: 'tier', columns: 2 },
    examples: [
      {
        title: 'Plan Selection Cards Grid',
        code: `<el-radio-card-group value="standard" columns="2" style="max-width: 580px; width: 100%;">
  <el-radio-card value="basic">
    <div style="font-weight: 600;">Starter Plan</div>
    <div style="font-size: 0.85rem; color: var(--el-text-muted);">$9 / month per user</div>
  </el-radio-card>
  <el-radio-card value="standard">
    <div style="font-weight: 600;">Pro Team</div>
    <div style="font-size: 0.85rem; color: var(--el-text-muted);">$29 / month per user</div>
  </el-radio-card>
</el-radio-card-group>`
      }
    ]
  },
  'el-radio-card': {
    propsDefaults: { value: 'standard', checked: true, disabled: false },
    examples: [
      {
        title: 'Selectable Plan Card',
        code: `<el-radio-card value="compute" checked style="max-width: 340px; width: 100%;">
  <div style="font-weight: 600;">Compute Optimized</div>
  <div style="font-size: 0.85rem; color: var(--el-text-muted);">8 vCPU, 32GB RAM, 10Gbps Network</div>
</el-radio-card>`
      }
    ]
  },
  'el-table': {
    propsDefaults: { selectable: true },
    examples: [
      {
        title: 'Interactive Multi-Column Table',
        code: `<el-table selectable data='[{"region":"us-east-1","status":"Active","latency":"24ms","qps":"14.2k req/s"},{"region":"eu-west-1","status":"Active","latency":"18ms","qps":"11.8k req/s"},{"region":"ap-northeast-1","status":"Active","latency":"32ms","qps":"8.4k req/s"},{"region":"sa-east-1","status":"Standby","latency":"110ms","qps":"1.2k req/s"}]' columns='[{"key":"region","label":"Region","sortable":true},{"key":"status","label":"Cluster Status","sortable":true},{"key":"latency","label":"Latency (p99)","sortable":true},{"key":"qps","label":"Throughput","sortable":true}]'></el-table>`
      }
    ]
  },
  'el-chart': {
    propsDefaults: { type: 'line', curve: 'smooth', 'show-grid': true, 'show-dots': true, height: 220 },
    examples: [
      {
        title: 'Throughput & Error Metrics',
        code: `<el-chart type="line" curve="smooth" height="220" show-grid show-dots data='[{"label":"00:00","value":1200,"secondary":450},{"label":"04:00","value":950,"secondary":320},{"label":"08:00","value":3400,"secondary":1100},{"label":"12:00","value":5200,"secondary":1850},{"label":"16:00","value":4800,"secondary":1600},{"label":"20:00","value":2900,"secondary":900}]'></el-chart>`
      }
    ]
  },
  'el-badge': {
    propsDefaults: { variant: 'primary', size: 'md', count: '12', label: 'Active' },
    examples: [
      {
        title: 'Status & Counter Badges',
        code: `<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
  <el-badge variant="primary" count="12"></el-badge>
  <el-badge variant="success" count="LIVE"></el-badge>
  <el-badge variant="danger" count="3 Alerts"></el-badge>
  <el-badge variant="warning" count="Degraded"></el-badge>
  <el-badge variant="outline" count="v2.4.1"></el-badge>
</div>`
      }
    ]
  },
  'el-card-header': {
    examples: [
      {
        title: 'Card Header with Title & Action',
        code: `<el-card style="max-width: 380px;">
  <el-card-header style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <el-card-title>Deployment Status</el-card-title>
      <el-card-description>Production Cluster v2.4</el-card-description>
    </div>
    <el-badge variant="success" count="Healthy"></el-badge>
  </el-card-header>
  <el-card-content>
    <p style="margin: 0; font-size: 0.875rem;">All 18 pods reporting 0 restart loops and 99.99% uptime.</p>
  </el-card-content>
</el-card>`
      }
    ]
  },
  'el-card-title': {
    examples: [
      {
        title: 'Card Title Component',
        code: `<el-card-title>Edge Node Latency</el-card-title>`
      }
    ]
  },
  'el-card-description': {
    examples: [
      {
        title: 'Card Subheading Description',
        code: `<el-card-description>P99 latency recorded across 4 continents over past 24 hours.</el-card-description>`
      }
    ]
  },
  'el-card-content': {
    examples: [
      {
        title: 'Card Body Content Container',
        code: `<el-card-content>
  <p style="margin: 0; color: var(--el-text-muted);">Reactive content block with standard padding and typography.</p>
</el-card-content>`
      }
    ]
  },
  'el-card-footer': {
    examples: [
      {
        title: 'Card Footer with Action Buttons',
        code: `<el-card-footer style="display: flex; justify-content: flex-end; gap: 8px;">
  <el-button variant="ghost" size="sm">Dismiss</el-button>
  <el-button variant="primary" size="sm">Deploy Update</el-button>
</el-card-footer>`
      }
    ]
  },
  'el-carousel-slide': {
    examples: [
      {
        title: 'Carousel Slide Item',
        code: `<el-carousel-slide>
  <div style="height: 180px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; font-weight: 600;">
    Slide Preview
  </div>
</el-carousel-slide>`
      }
    ]
  },
  'el-sidebar-header': {
    examples: [
      {
        title: 'Sidebar Brand Header',
        code: `<el-sidebar-header style="padding: 16px; border-bottom: 1px solid var(--el-surface-border); display: flex; align-items: center; gap: 8px;">
  <span style="font-weight: 700; font-size: 1.1rem;">⚡ Elementum Console</span>
</el-sidebar-header>`
      }
    ]
  },
  'el-sidebar-content': {
    examples: [
      {
        title: 'Sidebar Scrollable Navigation Menu',
        code: `<el-sidebar-content style="padding: 12px; display: flex; flex-direction: column; gap: 6px;">
  <a href="#overview" style="padding: 8px 12px; border-radius: 6px; text-decoration: none; color: inherit; background: var(--el-surface-muted);">Overview</a>
  <a href="#analytics" style="padding: 8px 12px; border-radius: 6px; text-decoration: none; color: inherit;">Analytics</a>
  <a href="#settings" style="padding: 8px 12px; border-radius: 6px; text-decoration: none; color: inherit;">Settings</a>
</el-sidebar-content>`
      }
    ]
  },
  'el-sidebar-footer': {
    examples: [
      {
        title: 'Sidebar User Account Footer',
        code: `<el-sidebar-footer style="padding: 12px; border-top: 1px solid var(--el-surface-border); display: flex; align-items: center; gap: 10px;">
  <el-avatar name="Alex Morgan" size="sm"></el-avatar>
  <div style="font-size: 0.85rem; line-height: 1.2;">
    <div style="font-weight: 600;">Alex Morgan</div>
    <div style="color: var(--el-text-muted); font-size: 0.75rem;">admin@elementum.dev</div>
  </div>
</el-sidebar-footer>`
      }
    ]
  },
  'el-sidebar-trigger': {
    examples: [
      {
        title: 'Sidebar Toggle Trigger Button',
        code: `<el-sidebar-trigger>
  <el-button variant="outline" size="sm">☰ Menu</el-button>
</el-sidebar-trigger>`
      }
    ]
  },
  'el-theme-switch': {
    propsDefaults: { theme: 'system' },
    examples: [
      {
        title: 'Light, Dark, and System Theme Switcher',
        code: `<el-theme-switch theme="system"></el-theme-switch>`
      }
    ]
  },
  'el-command-item': {
    examples: [
      {
        title: 'Keyboard Search Command Item',
        code: `<el-command-item value="deploy-prod">🚀 Deploy to Production Cluster</el-command-item>`
      }
    ]
  },
  'el-command-group': {
    examples: [
      {
        title: 'Grouped Command Items',
        code: `<el-command-group heading="Quick Actions">
  <el-command-item value="new-project">➕ Create New Project</el-command-item>
  <el-command-item value="view-logs">📋 View Cluster Event Logs</el-command-item>
</el-command-group>`
      }
    ]
  },
  'el-data-list-item': {
    examples: [
      {
        title: 'Data List Key-Value Row',
        code: `<el-data-list-item label="Public IP" value="198.51.100.42" copyable></el-data-list-item>`
      }
    ]
  },
  'el-inset': {
    examples: [
      {
        title: 'Card Full-Bleed Inset Media',
        code: `<el-card style="max-width: 360px;">
  <el-inset style="height: 140px; background: linear-gradient(135deg, #2563eb, #7c3aed); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600;">
    Full-Bleed Media Header
  </el-inset>
  <el-card-content>
    <h3>Inset Demonstration</h3>
    <p style="color: var(--el-text-muted); font-size: 0.85rem;">Insets ignore parent padding to touch outer borders.</p>
  </el-card-content>
</el-card>`
      }
    ]
  },
  'el-navigation-menu': {
    examples: [
      {
        title: 'Horizontal Header Navigation Menu',
        code: `<el-navigation-menu>
  <el-navigation-menu-item>
    <el-navigation-menu-trigger>Products ▾</el-navigation-menu-trigger>
    <el-navigation-menu-content style="padding: 12px; display: flex; flex-direction: column; gap: 6px; min-width: 200px;">
      <a href="#cloud" style="text-decoration: none; color: inherit; font-weight: 600;">Elementum Cloud</a>
      <span style="font-size: 0.75rem; color: var(--el-text-muted);">Managed serverless web components platform</span>
    </el-navigation-menu-content>
  </el-navigation-menu-item>
  <el-navigation-menu-item>
    <a href="#pricing" style="padding: 8px 12px; text-decoration: none; color: inherit; font-weight: 500;">Pricing</a>
  </el-navigation-menu-item>
</el-navigation-menu>`
      }
    ]
  },
  'el-navigation-menu-item': {
    examples: [
      {
        title: 'Navigation Menu Item',
        code: `<el-navigation-menu-item>
  <el-navigation-menu-trigger>Documentation</el-navigation-menu-trigger>
</el-navigation-menu-item>`
      }
    ]
  },
  'el-navigation-menu-trigger': {
    examples: [
      {
        title: 'Navigation Flyout Trigger',
        code: `<el-navigation-menu-trigger>Solutions ▾</el-navigation-menu-trigger>`
      }
    ]
  },
  'el-navigation-menu-content': {
    examples: [
      {
        title: 'Navigation Menu Dropdown Content',
        code: `<el-navigation-menu-content style="padding: 16px; min-width: 240px;">
  <div style="font-weight: 600; margin-bottom: 4px;">Developer APIs</div>
  <p style="font-size: 0.8rem; color: var(--el-text-muted); margin: 0;">Signals, reactivity, and constructable stylesheets documentation.</p>
</el-navigation-menu-content>`
      }
    ]
  },
  'el-resizable-handle': {
    examples: [
      {
        title: 'Splitter Resizable Divider Handle',
        code: `<el-resizable-handle style="width: 4px; background: var(--el-surface-border); cursor: col-resize;"></el-resizable-handle>`
      }
    ]
  },
  'el-resizable-panel': {
    examples: [
      {
        title: 'Resizable Partition Panel',
        code: `<el-resizable-panel default-size="50" min-size="20">
  <div style="padding: 16px; background: var(--el-surface-muted);">Panel Content (50% Default Width)</div>
</el-resizable-panel>`
      }
    ]
  },
  'el-route': {
    examples: [
      {
        title: 'Client-Side Route Matcher',
        code: `<el-route path="/dashboard" component="dashboard-view"></el-route>`
      }
    ]
  },
  'el-route-link': {
    examples: [
      {
        title: 'Client-Side Routing Anchor',
        code: `<el-route-link to="/analytics" active-class="active-nav">View Analytics</el-route-link>`
      }
    ]
  },
  'el-router': {
    examples: [
      {
        title: 'Zero-Dependency SPA Router Outlet',
        code: `<el-router mode="hash">
  <el-route path="/" component="home-page"></el-route>
  <el-route path="/components" component="components-page"></el-route>
</el-router>`
      }
    ]
  },
  'el-visually-hidden': {
    examples: [
      {
        title: 'Accessible Screen-Reader Text',
        code: `<button style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--el-surface-border); background: var(--el-surface-base); cursor: pointer;">
  <span>🔍</span>
  <el-visually-hidden>Search through component documentation</el-visually-hidden>
</button>`
      }
    ]
  }
};

// Apply updates
for (const [tag, data] of Object.entries(richExamplesMap)) {
  if (components[tag]) {
    if (data.propsDefaults) {
      for (const [propName, propVal] of Object.entries(data.propsDefaults)) {
        const pObj = components[tag].props.find(p => p.name === propName);
        if (pObj) {
          pObj.default = propVal;
        }
      }
    }
    if (data.examples) {
      components[tag].examples = data.examples;
    }
  }
}

// Write back
const output = `// Auto-generated Component Catalog Schema & Metadata
export const categories = ${JSON.stringify(categories, null, 2)};

export const components = ${JSON.stringify(components, null, 2)};
`;

fs.writeFileSync(catalogPath, output, 'utf8');
console.log('Successfully enriched catalog-data.js!');
