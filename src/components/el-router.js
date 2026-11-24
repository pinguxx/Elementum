import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

// Global router state
export const currentRoute = signal(
  typeof window !== 'undefined' ? (window.location.hash.slice(1) || '/') : '/'
);

function normalizePath(path) {
  if (!path) return '/';
  try {
    path = decodeURIComponent(path);
  } catch {}
  path = path.trim();
  while (path.startsWith('#') || path.startsWith(' ')) {
    path = path.slice(1);
  }
  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

export function navigate(path) {
  const normalized = normalizePath(path);
  currentRoute.value = normalized;
  if (window.location.hash.slice(1) !== normalized) {
    window.location.hash = normalized;
  }
}

// Listen to hash changes globally
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const raw = window.location.hash.slice(1) || '/';
    currentRoute.value = normalizePath(raw);
  });
}

/**
 * <el-router>
 * Client-side declarative SPA router powered by micro-signals.
 * Controls which <el-route> child is active based on the URL hash.
 */
export class ElRouter extends Elementum {
  static observedAttributes = ['default'];

  defaultPath = signal('/');

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  connected() {
    const def = this.getAttribute('default') || '/';
    this.defaultPath.value = normalizePath(def);

    const rawHash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const normalizedHash = rawHash ? normalizePath(rawHash) : '';
    const routes = Array.from(this.querySelectorAll('el-route'));
    const hashMatchesChild =
      normalizedHash &&
      routes.some((r) => {
        const rp = normalizePath(r.getAttribute('path'));
        if (rp === '/*' || rp === '*') return false;
        return normalizedHash === rp || normalizedHash.startsWith(rp + '/');
      });

    if (hashMatchesChild) {
      currentRoute.value = normalizedHash;
    } else {
      currentRoute.value = this.defaultPath.value;
      if ((!window.location.hash || window.location.hash === '#') && typeof window !== 'undefined') {
        window.location.hash = this.defaultPath.value;
      }
    }

    this.#updateActiveRoutes();
    this.disposeRouteSubscription = currentRoute.subscribe(() => {
      this.#updateActiveRoutes();
    });
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'default') {
      this.defaultPath.value = normalizePath(newValue || '/');
      currentRoute.value = this.defaultPath.value;
      this.#updateActiveRoutes();
    }
  }

  disconnected() {
    if (this.disposeRouteSubscription) {
      this.disposeRouteSubscription();
    }
  }

  #updateActiveRoutes() {
    const activePath = currentRoute.value;
    const routes = this.querySelectorAll('el-route');
    let hasMatch = false;

    routes.forEach((route) => {
      const routePath = normalizePath(route.getAttribute('path'));
      const isExact = route.hasAttribute('exact');
      const isWildcard = routePath === '/*' || routePath === '*';

      let isMatch = false;
      if (isWildcard) {
        isMatch = true;
      } else if (isExact) {
        isMatch = activePath === routePath;
      } else {
        isMatch = activePath === routePath || activePath.startsWith(routePath + '/');
      }

      if (isMatch && !hasMatch) {
        route.setAttribute('active', '');
        route.removeAttribute('hidden');
        hasMatch = true;
      } else {
        route.removeAttribute('active');
        route.setAttribute('hidden', '');
      }
    });

    if (!hasMatch && routes.length > 0) {
      const defTarget = this.defaultPath.value;
      const fallbackRoute =
        Array.from(routes).find((r) => normalizePath(r.getAttribute('path')) === defTarget) ||
        routes[0];
      if (fallbackRoute) {
        fallbackRoute.setAttribute('active', '');
        fallbackRoute.removeAttribute('hidden');
      }
    }

    // Update route links if upgraded
    document.querySelectorAll('el-route-link').forEach((link) => {
      if (typeof link.checkActive === 'function') {
        link.checkActive(activePath);
      }
    });
  }

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * <el-route>
 * Represents an individual view/subpage within <el-router>.
 */
export class ElRoute extends Elementum {
  static observedAttributes = ['path', 'exact'];

  path = signal('/');
  exact = signal(false);

  static styles = css`
    :host {
      display: block;
      width: 100%;
      animation: el-route-fade-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([hidden]) {
      display: none !important;
    }

    @keyframes el-route-fade-in {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  connected() {
    this.path.value = normalizePath(this.getAttribute('path') || '/');
    this.exact.value = this.hasAttribute('exact');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'path') this.path.value = normalizePath(newValue || '/');
    if (name === 'exact') this.exact.value = newValue !== null;
  }

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * <el-route-link>
 * SPA navigation link that prevents full page reloads and toggles active state.
 */
export class ElRouteLink extends Elementum {
  static observedAttributes = ['to', 'exact'];

  to = signal('/');
  exact = signal(false);
  active = signal(false);

  static styles = css`
    :host {
      display: inline-flex;
      cursor: pointer;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: inherit;
      width: 100%;
      height: 100%;
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-weight: inherit;
      border-radius: inherit;
      box-sizing: border-box;
      outline: none;
    }

    :host([active]) a {
      color: var(--el-route-link-active-color, var(--el-color-primary-text, #1d4ed8));
    }
  `;

  connected() {
    this.to.value = normalizePath(this.getAttribute('to') || '/');
    this.exact.value = this.hasAttribute('exact');

    this.addEventListener('click', this.#onHostClick);

    this.checkActive(currentRoute.value);
    this.disposeRouteSub = currentRoute.subscribe((path) => {
      this.checkActive(path);
    });
  }

  disconnected() {
    this.removeEventListener('click', this.#onHostClick);
    if (this.disposeRouteSub) {
      this.disposeRouteSub();
    }
  }

  #onHostClick = (e) => {
    e.preventDefault();
    navigate(this.to.value);
  };

  attributeChanged(name, oldValue, newValue) {
    if (name === 'to') {
      this.to.value = normalizePath(newValue || '/');
      this.checkActive(currentRoute.value);
    }
    if (name === 'exact') {
      this.exact.value = newValue !== null;
      this.checkActive(currentRoute.value);
    }
  }

  checkActive(currentPath) {
    const target = this.to.value;
    const isMatch = this.exact.value
      ? currentPath === target
      : currentPath === target || (target !== '/' && currentPath.startsWith(target + '/'));

    if (isMatch) {
      this.setAttribute('active', '');
      this.active.value = true;
    } else {
      this.removeAttribute('active');
      this.active.value = false;
    }
  }

  render() {
    return html`<a href="${() => '#' + this.to.value}"><slot></slot></a>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-route')) customElements.define('el-route', ElRoute);
  if (!customElements.get('el-route-link')) customElements.define('el-route-link', ElRouteLink);
  if (!customElements.get('el-router')) customElements.define('el-router', ElRouter);
}
