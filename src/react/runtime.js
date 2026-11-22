/**
 * Elementum React Wrapper Runtime (React 18 & React 19 compatible, zero dependencies)
 * Translates React props, refs, boolean attributes, complex property assignments,
 * and CustomEvent listeners onto native Elementum Custom Elements.
 */

const DEFAULT_CUSTOM_EVENTS = {
  onChange: 'change',
  onInput: 'input',
  onSelect: 'select',
  onClose: 'close',
};

const NATIVE_REACT_EVENTS = new Set([
  'onClick',
  'onDoubleClick',
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
  'onKeyPress',
  'onMouseDown',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'onPointerDown',
  'onPointerUp',
  'onSubmit',
  'onReset',
]);

function assignRef(ref, value) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
  } else if (typeof ref === 'object' && 'current' in ref) {
    ref.current = value;
  }
}

function isSignalLike(val) {
  return Boolean(val && typeof val === 'object' && 'value' in val && typeof val.peek === 'function');
}

function inferCustomEventName(propName) {
  return propName
    .slice(2)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Creates a typed, forwardRef React component wrapping an Elementum Web Component.
 * @param {object} React - The consumer's React namespace (`React.forwardRef`, `useRef`, `useEffect`, `createElement`)
 * @param {string} tagName - Registered Custom Element tag name (e.g. 'el-button')
 * @param {Record<string, string>} [eventMap={}] - Mapping of React handler props (e.g. `onTabChange`) to DOM event names (`'tabchange'`)
 */
export function createElementumReactComponent(React, tagName, eventMap = {}) {
  const resolvedEventMap = { ...DEFAULT_CUSTOM_EVENTS, ...eventMap };

  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' && typeof React.useLayoutEffect === 'function'
      ? React.useLayoutEffect
      : React.useEffect;

  const Component = React.forwardRef(function ElementumWrapper(props, forwardedRef) {
    const innerRef = React.useRef(null);
    const appliedObjectKeysRef = React.useRef(null);
    const initialDefaultsRef = React.useRef(null);
    if (!appliedObjectKeysRef.current) appliedObjectKeysRef.current = new Set();
    if (!initialDefaultsRef.current) initialDefaultsRef.current = new Map();

    const { children, className, style, ...rest } = props || {};

    const elementProps = {};
    if (className !== undefined) {
      elementProps.class = className;
    }
    if (style !== undefined) {
      elementProps.style = style;
    }

    const customListeners = [];
    const objectProps = [];

    for (const [key, val] of Object.entries(rest)) {
      if (val === undefined || val === null) continue;

      if (typeof val === 'function' && key.startsWith('on') && key.length > 2) {
        if (key in resolvedEventMap) {
          customListeners.push([resolvedEventMap[key], val]);
          continue;
        }
        if (!NATIVE_REACT_EVENTS.has(key) && /^on[A-Z]/.test(key)) {
          customListeners.push([inferCustomEventName(key), val]);
          continue;
        }
        elementProps[key] = val;
        continue;
      }

      if (typeof val === 'boolean') {
        if (val) elementProps[key] = '';
        continue;
      }

      if (typeof val === 'object' || typeof val === 'function') {
        objectProps.push([key, val]);
        continue;
      }

      elementProps[key] = String(val);
    }

    elementProps.ref = (node) => {
      innerRef.current = node;
      assignRef(forwardedRef, node);
    };

    // Apply object/array/function properties synchronously before paint (useLayoutEffect in browser,
    // useEffect in SSR) and cleanly reset any previously applied keys that were removed from props.
    useIsomorphicLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const appliedKeys = appliedObjectKeysRef.current;
      const initialDefaults = initialDefaultsRef.current;
      const nextKeys = new Set();

      for (const [key, val] of objectProps) {
        if (!initialDefaults.has(key)) {
          const initialVal = isSignalLike(el[key]) ? el[key].peek() : el[key];
          initialDefaults.set(key, initialVal);
        }
        if (isSignalLike(el[key])) {
          el[key].value = val;
        } else {
          el[key] = val;
        }
        nextKeys.add(key);
      }

      for (const prevKey of appliedKeys) {
        if (!nextKeys.has(prevKey)) {
          const fallback = initialDefaults.get(prevKey);
          if (isSignalLike(el[prevKey])) {
            el[prevKey].value = fallback;
          } else {
            el[prevKey] = fallback;
          }
        }
      }

      appliedObjectKeysRef.current = nextKeys;
    });

    // Attach CustomEvent / non-synthetic DOM listeners (React 18 & 19 parity).
    // Intentionally omit a variable-length deps array so toggling handler props never trips
    // React's hook dependency-size invariant, and capture `el` before unmount nulls the ref.
    React.useEffect(() => {
      const el = innerRef.current;
      if (!el || customListeners.length === 0) return undefined;
      const attached = customListeners.slice();
      for (const [eventName, handler] of attached) {
        el.addEventListener(eventName, handler);
      }
      return () => {
        for (const [eventName, handler] of attached) {
          el.removeEventListener(eventName, handler);
        }
      };
    });

    return React.createElement(tagName, elementProps, children);
  });

  Component.displayName = `Elementum(${tagName})`;
  return Component;
}
