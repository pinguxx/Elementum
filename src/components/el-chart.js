import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-chart>
 * Zero-dependency native SVG chart primitive.
 * Supports area, line, and bar modes with reactive tooltips, keyboard navigation,
 * and semantic CSS token theming (--el-chart-1 to --el-chart-5).
 *
 * @element el-chart
 * @attr {'area' | 'line' | 'bar'} type - Chart type (default: 'area')
 * @attr {string} x-key - Key for x-axis category/date (default: 'label')
 * @attr {string} y-key - Key for primary y-axis metric (default: 'value')
 * @attr {string} secondary-key - Optional key for secondary comparison series
 * @attr {number} height - Height in pixels (default: 200)
 * @attr {boolean} show-grid - Show subtle background gridlines
 * @attr {boolean} show-dots - Show data point circles
 */
export class ElChart extends Elementum {
  static get observedAttributes() {
    return ['type', 'x-key', 'y-key', 'secondary-key', 'height', 'show-grid', 'show-dots', 'data', 'curve'];
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
      box-sizing: border-box;
      user-select: none;
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }

    .grid-line {
      stroke: var(--el-surface-border, #e2e8f0);
      stroke-width: 1;
      stroke-dasharray: 3 3;
      opacity: 0.7;
    }

    .axis-label {
      font-size: 10px;
      fill: var(--el-text-muted, #64748b);
      text-anchor: middle;
      font-variant-numeric: tabular-nums;
    }

    .axis-label.y-axis {
      text-anchor: end;
      dominant-baseline: central;
    }

    .series-primary-area {
      fill: url(#area-grad-1);
      opacity: 0.25;
      transition: opacity 150ms ease;
    }

    .series-primary-stroke {
      fill: none;
      stroke: var(--el-chart-1, var(--el-color-primary, #2563eb));
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .series-secondary-stroke {
      fill: none;
      stroke: var(--el-chart-2, #10b981);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 4 4;
      opacity: 0.85;
    }

    .bar-rect {
      fill: var(--el-chart-1, var(--el-color-primary, #2563eb));
      transition: opacity 150ms ease, fill 150ms ease;
      rx: 3px;
    }

    .bar-rect.secondary {
      fill: var(--el-chart-2, #10b981);
    }

    .bar-rect:hover, .bar-rect.active {
      opacity: 0.85;
      filter: brightness(1.1);
    }

    .point-dot {
      fill: var(--el-surface-base, #ffffff);
      stroke: var(--el-chart-1, var(--el-color-primary, #2563eb));
      stroke-width: 2;
      r: 3.5;
      transition: r 150ms ease;
    }

    .point-dot.active {
      r: 5.5;
      stroke-width: 2.5;
    }

    .hit-column {
      fill: transparent;
      cursor: crosshair;
    }

    .cursor-line {
      stroke: var(--el-surface-border, #94a3b8);
      stroke-width: 1;
      stroke-dasharray: 2 2;
      pointer-events: none;
    }

    /* Floating Tooltip */
    .chart-tooltip {
      position: absolute;
      pointer-events: none;
      background: var(--el-tooltip-bg, #0f172a);
      color: var(--el-tooltip-text, #f8fafc);
      padding: 8px 12px;
      border-radius: var(--el-radius-md, 8px);
      font-size: 11px;
      line-height: 1.4;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--el-tooltip-border, #334155);
      transform: translate(-50%, -100%);
      margin-top: -10px;
      white-space: nowrap;
      z-index: 20;
      transition: left 80ms ease, top 80ms ease, opacity 100ms ease;
    }

    .tooltip-header {
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 4px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tooltip-row {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #cbd5e1;
    }

    .tooltip-label {
      color: #94a3b8;
      font-size: 11px;
    }

    .tooltip-swatch {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--el-chart-1, #2563eb);
      flex-shrink: 0;
    }

    .tooltip-swatch.secondary {
      background: var(--el-chart-2, #10b981);
    }

    .tooltip-value {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #ffffff;
      margin-left: auto;
    }
  `;

  #activeIdx = signal(-1);
  #dataItems = signal([]);
  #resizeObserver = null;

  constructor() {
    super();
    this._type = signal('area');
    this._xKey = signal('label');
    this._yKey = signal('value');
    this._secondaryKey = signal('');
    this._height = signal(200);
    this._showGrid = signal(true);
    this._showDots = signal(true);
    this._curve = signal('smooth');
    this._containerWidth = signal(800);
  }

  static DEFAULT_DATA = [
    { label: 'Q1', value: 45, secondary: 25 },
    { label: 'Q2', value: 85, secondary: 55 },
    { label: 'Q3', value: 65, secondary: 40 },
    { label: 'Q4', value: 110, secondary: 75 }
  ];

  connected() {
    for (const attr of ElChart.observedAttributes) {
      if (this.hasAttribute(attr)) {
        this.attributeChangedCallback(attr, null, this.getAttribute(attr));
      }
    }
    if (!this.hasAttribute('data') && this.#dataItems.value.length === 0) {
      this.#dataItems.value = ElChart.DEFAULT_DATA;
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.#resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect?.width) {
          const w = Math.round(entries[0].contentRect.width);
          if (w > 50 && w !== this._containerWidth.value) {
            this._containerWidth.value = w;
          }
        }
      });
      this.#resizeObserver.observe(this);
    }
  }

  disconnected() {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
  }

  get data() {
    return this.#dataItems.value;
  }

  set data(val) {
    if (Array.isArray(val)) {
      this.#dataItems.value = val;
    } else if (typeof val === 'string') {
      try {
        this.#dataItems.value = JSON.parse(val);
      } catch {
        this.#dataItems.value = [];
      }
    }
  }

  get type() { return this._type.value; }
  set type(v) { this._type.value = v; }

  get xKey() { return this._xKey.value; }
  set xKey(v) { this._xKey.value = v; }

  get yKey() { return this._yKey.value; }
  set yKey(v) { this._yKey.value = v; }

  get secondaryKey() { return this._secondaryKey.value; }
  set secondaryKey(v) { this._secondaryKey.value = v; }

  get height() { return this._height.value; }
  set height(v) { this._height.value = Number(v) || 200; }

  get curve() { return this._curve.value; }
  set curve(v) { this._curve.value = v || 'smooth'; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'type') this._type.value = newVal || 'area';
    if (name === 'x-key') this._xKey.value = newVal || 'label';
    if (name === 'y-key') this._yKey.value = newVal || 'value';
    if (name === 'secondary-key') this._secondaryKey.value = newVal || '';
    if (name === 'height') this._height.value = parseInt(newVal, 10) || 200;
    if (name === 'show-grid') this._showGrid.value = newVal !== 'false';
    if (name === 'show-dots') this._showDots.value = newVal !== 'false';
    if (name === 'curve') this._curve.value = newVal || 'smooth';
    if (name === 'data' && typeof newVal === 'string') {
      try {
        this.#dataItems.value = JSON.parse(newVal);
      } catch {
        this.#dataItems.value = [];
      }
    }
  }

  #onKeyDown = (e) => {
    const items = this.#dataItems.value;
    if (!items.length) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = this.#activeIdx.value < items.length - 1 ? this.#activeIdx.value + 1 : 0;
      this.#activeIdx.value = next;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = this.#activeIdx.value > 0 ? this.#activeIdx.value - 1 : items.length - 1;
      this.#activeIdx.value = prev;
    } else if (e.key === 'Escape') {
      this.#activeIdx.value = -1;
    }
  };

  #onMouseLeave = () => {
    this.#activeIdx.value = -1;
  };

  #onColumnHover = (idx) => {
    this.#activeIdx.value = idx;
  };

  #getItemVal(item, key) {
    if (!item) return 0;
    if (key && item[key] !== undefined) return Number(item[key]);
    if (item.value !== undefined) return Number(item.value);
    if (item.y !== undefined) return Number(item.y);
    return 0;
  }

  #getItemLabel(item, key) {
    if (!item) return '';
    if (key && item[key] !== undefined) return String(item[key]);
    if (item.label !== undefined) return String(item.label);
    if (item.x !== undefined) return String(item.x);
    return '';
  }

  #buildSvgPath(points, isSmooth, bottomY) {
    if (!points || points.length === 0) return { path: '', area: '' };
    if (points.length === 1) {
      const p = points[0];
      const path = `M ${p.x} ${p.y} L ${p.x + 1} ${p.y}`;
      const area = `${path} L ${p.x + 1} ${bottomY} L ${p.x} ${bottomY} Z`;
      return { path, area };
    }

    if (!isSmooth || points.length === 2) {
      const path = `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      const area = `${path} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
      return { path, area };
    }

    const tension = 0.2;
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i > 0 ? i - 1 : i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${bottomY} L ${points[0].x.toFixed(1)} ${bottomY} Z`;
    return { path, area };
  }

  render() {
    const padding = { top: 16, right: 16, bottom: 26, left: 36 };

    return html`
      <div
        class="chart-container"
        style=${() => `height: ${this._height.value}px;`}
        tabindex="0"
        role="graphics-document"
        aria-label="Data chart visualization"
        @keydown=${this.#onKeyDown}
        @mouseleave=${this.#onMouseLeave}
      >
        ${() => {
          const width = Math.max(300, this._containerWidth.value || 800);
          const items = this.#dataItems.value;
          const chartH = this._height.value;
          const innerW = width - padding.left - padding.right;
          const innerH = chartH - padding.top - padding.bottom;

          if (!items || items.length === 0) {
            return html`
              <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--el-text-muted);font-size:12px;">
                No chart data available
              </div>
            `;
          }

          const yKey = this._yKey.value;
          const secKey = this._secondaryKey.value;
          const xKey = this._xKey.value;
          const chartType = this._type.value;
          const isSmooth = this._curve.value !== 'linear';

          // Compute max values
          let maxVal = 0;
          for (const item of items) {
            const v1 = this.#getItemVal(item, yKey);
            const v2 = secKey ? this.#getItemVal(item, secKey) : 0;
            if (v1 > maxVal) maxVal = v1;
            if (v2 > maxVal) maxVal = v2;
          }
          if (maxVal === 0) maxVal = 100;
          // Add 10% head room
          maxVal = Math.ceil(maxVal * 1.1);

          // Point coordinates calculation
          const stepX = items.length > 1 ? innerW / (items.length - 1) : innerW / 2;
          const ptsPrimary = items.map((item, i) => {
            const x = padding.left + (items.length > 1 ? i * stepX : innerW / 2);
            const val = this.#getItemVal(item, yKey);
            const y = padding.top + innerH - (val / maxVal) * innerH;
            return { x, y, val, item, idx: i };
          });

          const ptsSec = secKey
            ? items.map((item, i) => {
                const x = padding.left + (items.length > 1 ? i * stepX : innerW / 2);
                const val = this.#getItemVal(item, secKey);
                const y = padding.top + innerH - (val / maxVal) * innerH;
                return { x, y, val, item, idx: i };
              })
            : null;

          const bottomY = padding.top + innerH;
          const primaryResult = this.#buildSvgPath(ptsPrimary, isSmooth, bottomY);
          const pathPrimary = primaryResult.path;
          const areaPrimary = primaryResult.area;

          const secResult = ptsSec ? this.#buildSvgPath(ptsSec, isSmooth, bottomY) : null;
          const pathSec = secResult ? secResult.path : '';

          // Gridlines
          const gridSteps = 3;
          const gridLines = [];
          for (let g = 0; g <= gridSteps; g++) {
            const y = padding.top + (innerH / gridSteps) * g;
            const labelVal = Math.round(maxVal - (maxVal / gridSteps) * g);
            gridLines.push({ y, label: labelVal });
          }

          // Bar chart calculations
          const barSlotW = innerW / items.length;
          const barW = Math.max(4, Math.min(28, barSlotW * 0.65));

          const activeIndex = this.#activeIdx.value;
          const activePt = activeIndex >= 0 && activeIndex < items.length ? ptsPrimary[activeIndex] : null;

          return html`
            <svg viewBox=${`0 0 ${width} ${chartH}`} style="width: 100%; height: 100%;">
              <defs>
                <linearGradient id="area-grad-1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--el-chart-1, #2563eb)" stop-opacity="0.45" />
                  <stop offset="100%" stop-color="var(--el-chart-1, #2563eb)" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Gridlines & Y-Axis Labels -->
              ${this._showGrid.value ? gridLines.map(g => html`
                <line x1=${padding.left} y1=${g.y} x2=${width - padding.right} y2=${g.y} class="grid-line" />
                <text x=${padding.left - 6} y=${g.y} class="axis-label y-axis">${g.label}</text>
              `) : null}

              <!-- Chart Shapes -->
              ${chartType === 'area' ? html`
                <path d=${areaPrimary} class="series-primary-area" />
                <path d=${pathPrimary} class="series-primary-stroke" />
                ${pathSec ? html`<path d=${pathSec} class="series-secondary-stroke" />` : null}
              ` : null}

              ${chartType === 'line' ? html`
                <path d=${pathPrimary} class="series-primary-stroke" />
                ${pathSec ? html`<path d=${pathSec} class="series-secondary-stroke" />` : null}
              ` : null}

              ${chartType === 'bar' ? items.map((item, i) => {
                const xCenter = padding.left + i * barSlotW + barSlotW / 2;
                const v1 = this.#getItemVal(item, yKey);
                const bH1 = Math.max(2, (v1 / maxVal) * innerH);
                const y1 = padding.top + innerH - bH1;

                if (secKey) {
                  const halfW = barW / 2;
                  const v2 = this.#getItemVal(item, secKey);
                  const bH2 = Math.max(2, (v2 / maxVal) * innerH);
                  const y2 = padding.top + innerH - bH2;
                  return html`
                    <g class="bar-group">
                      <rect
                        x=${xCenter - halfW}
                        y=${y1}
                        width=${halfW - 1}
                        height=${bH1}
                        class=${`bar-rect ${activeIndex === i ? 'active' : ''}`}
                      />
                      <rect
                        x=${xCenter + 1}
                        y=${y2}
                        width=${halfW - 1}
                        height=${bH2}
                        class=${`bar-rect secondary ${activeIndex === i ? 'active' : ''}`}
                      />
                    </g>
                  `;
                }

                return html`
                  <rect
                    x=${xCenter - barW / 2}
                    y=${y1}
                    width=${barW}
                    height=${bH1}
                    class=${`bar-rect ${activeIndex === i ? 'active' : ''}`}
                  />
                `;
              }) : null}

              <!-- Data Dots for Line/Area -->
              ${(chartType === 'line' || chartType === 'area') && this._showDots.value ? ptsPrimary.map(p => html`
                <circle
                  cx=${p.x}
                  cy=${p.y}
                  class=${`point-dot ${activeIndex === p.idx ? 'active' : ''}`}
                />
              `) : null}

              <!-- Active Cursor Vertical Line -->
              ${activePt && (chartType === 'line' || chartType === 'area') ? html`
                <line
                  x1=${activePt.x}
                  y1=${padding.top}
                  x2=${activePt.x}
                  y2=${padding.top + innerH}
                  class="cursor-line"
                />
              ` : null}

              <!-- X-Axis Labels -->
              ${items.map((item, i) => {
                const x = chartType === 'bar'
                  ? padding.left + i * barSlotW + barSlotW / 2
                  : ptsPrimary[i].x;
                return html`
                  <text x=${x} y=${chartH - 8} class="axis-label">
                    ${this.#getItemLabel(item, xKey)}
                  </text>
                `;
              })}

              <!-- Interactive Hit Columns -->
              ${items.map((item, i) => {
                const hitX = padding.left + i * (innerW / items.length);
                const hitW = innerW / items.length;
                return html`
                  <rect
                    x=${hitX}
                    y=${padding.top}
                    width=${hitW}
                    height=${innerH}
                    class="hit-column"
                    @mouseenter=${() => this.#onColumnHover(i)}
                    @touchstart=${() => this.#onColumnHover(i)}
                  />
                `;
              })}
            </svg>
          `;
        }}

        <!-- Floating Tooltip -->
        ${() => {
          const idx = this.#activeIdx.value;
          const items = this.#dataItems.value;
          if (idx < 0 || idx >= items.length) return null;

          const item = items[idx];
          const xKey = this._xKey.value;
          const yKey = this._yKey.value;
          const secKey = this._secondaryKey.value;

          const width = Math.max(300, this._containerWidth.value || 800);
          const padding = { top: 16, right: 16, bottom: 26, left: 36 };
          const innerW = width - padding.left - padding.right;
          const stepX = items.length > 1 ? innerW / (items.length - 1) : innerW / 2;
          const pctX = ((padding.left + (this._type.value === 'bar'
            ? idx * (innerW / items.length) + (innerW / items.length) / 2
            : idx * stepX)) / width) * 100;

          return html`
            <div
              class="chart-tooltip"
              style=${`left: ${pctX}%; top: 30%;`}
            >
              <div class="tooltip-header">${this.#getItemLabel(item, xKey)}</div>
              <div class="tooltip-row">
                <span class="tooltip-swatch"></span>
                <span class="tooltip-label">${yKey || 'value'}:</span>
                <span class="tooltip-value">${this.#getItemVal(item, yKey).toLocaleString()}</span>
              </div>
              ${secKey && (item[secKey] !== undefined || item.secondary !== undefined) ? html`
                <div class="tooltip-row" style="margin-top: 3px;">
                  <span class="tooltip-swatch secondary"></span>
                  <span class="tooltip-label">${secKey}:</span>
                  <span class="tooltip-value">${this.#getItemVal(item, secKey).toLocaleString()}</span>
                </div>
              ` : null}
            </div>
          `;
        }}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-chart')) {
  customElements.define('el-chart', ElChart);
}
