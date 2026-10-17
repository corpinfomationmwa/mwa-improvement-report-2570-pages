/**
 * Utility to convert modern CSS color functions (oklch, oklab, color-mix)
 * to standard, backwards-compatible RGB/RGBA/HEX color formats.
 *
 * Specifically designed to resolve html2canvas color parsing limitations
 * when used with Tailwind CSS v4 without modifying the live website styling.
 */

/**
 * Converts OKLab coordinates to standard sRGB gamma-corrected components [0..255].
 */
export function oklabComponentsToRgb(
  l: number,
  a: number,
  b: number,
  alpha: number = 1
): string {
  // 1. Convert OKLab to LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  // 2. Cube LMS values
  const lLin = l_ * l_ * l_;
  const mLin = m_ * m_ * m_;
  const sLin = s_ * s_ * s_;

  // 3. Convert LMS to linear sRGB
  const rLin = 4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  const gLin = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  const bLin = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.7076147010 * sLin;

  // 4. Gamma correction
  const toGamma = (x: number): number =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;

  const r = Math.round(Math.max(0, Math.min(1, toGamma(rLin))) * 255);
  const g = Math.round(Math.max(0, Math.min(1, toGamma(gLin))) * 255);
  const b2 = Math.round(Math.max(0, Math.min(1, toGamma(bLin))) * 255);

  const cleanAlpha = Math.max(0, Math.min(1, alpha));
  if (cleanAlpha < 1) {
    const formattedAlpha = Number(cleanAlpha.toFixed(3));
    return `rgba(${r}, ${g}, ${b2}, ${formattedAlpha})`;
  }
  return `rgb(${r}, ${g}, ${b2})`;
}

/**
 * Converts OKLCH coordinates to standard sRGB RGB/RGBA string.
 */
export function oklchComponentsToRgb(
  l: number,
  c: number,
  h: number,
  alpha: number = 1
): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return oklabComponentsToRgb(l, a, b, alpha);
}

/**
 * Parses a single oklch parameter string (handles %, deg, rad, turn, none, etc.)
 */
function parseCoordinate(raw: string, isPercentageScale = 1): number {
  if (!raw) return 0;
  const clean = raw.trim().toLowerCase();
  if (clean === 'none') return 0;
  if (clean.endsWith('%')) {
    return (parseFloat(clean) / 100) * isPercentageScale;
  }
  if (clean.endsWith('deg')) return parseFloat(clean);
  if (clean.endsWith('rad')) return (parseFloat(clean) * 180) / Math.PI;
  if (clean.endsWith('grad')) return parseFloat(clean) * 0.9;
  if (clean.endsWith('turn')) return parseFloat(clean) * 360;
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

/**
 * Converts a raw oklch(...) function string into standard rgb(...) or rgba(...).
 */
export function convertSingleOklch(oklchMatch: string): string {
  // Try native canvas conversion in browser first for maximum precision
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = '#00000000';
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = oklchMatch;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        if (a === 255) return `rgb(${r}, ${g}, ${b})`;
        if (a > 0 || oklchMatch.includes('/ 0')) {
          return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(3))})`;
        }
      }
    } catch {
      // Fallback to pure math formula below
    }
  }

  // Regex parse: oklch(L C H) or oklch(L C H / A)
  const match = oklchMatch.match(
    /oklch\(\s*([^\s\/]+)\s+([^\s\/]+)\s+([^\s\/\)]+)(?:\s*\/\s*([^\s\)]+))?\s*\)/i
  );
  if (!match) return 'rgb(0, 0, 0)';

  const [, lRaw, cRaw, hRaw, aRaw] = match;
  const l = parseCoordinate(lRaw, 1);
  const c = parseCoordinate(cRaw, 0.4);
  const h = parseCoordinate(hRaw, 360);
  const alpha = aRaw ? parseCoordinate(aRaw, 1) : 1;

  return oklchComponentsToRgb(l, c, h, alpha);
}

/**
 * Replaces all instances of oklch(...), oklab(...), and color-mix(...)
 * within a CSS string (such as inline style or stylesheet text) with equivalent RGB/RGBA colors.
 */
export function sanitizeCssColors(cssText: string): string {
  if (!cssText) return '';
  if (
    !cssText.includes('oklch') &&
    !cssText.includes('oklab') &&
    !cssText.includes('color-mix')
  ) {
    return cssText;
  }

  let result = cssText;

  // 1. Replace oklch(...)
  result = result.replace(
    /oklch\(\s*[^\)]+\)/gi,
    (match) => {
      try {
        return convertSingleOklch(match);
      } catch {
        return 'rgb(0, 0, 0)';
      }
    }
  );

  // 2. Replace oklab(...)
  result = result.replace(
    /oklab\(\s*([^\s\/]+)\s+([^\s\/]+)\s+([^\s\/\)]+)(?:\s*\/\s*([^\s\)]+))?\s*\)/gi,
    (_, lRaw, aRaw, bRaw, alphaRaw) => {
      try {
        const l = parseCoordinate(lRaw, 1);
        const a = parseCoordinate(aRaw, 0.4);
        const b = parseCoordinate(bRaw, 0.4);
        const alpha = alphaRaw ? parseCoordinate(alphaRaw, 1) : 1;
        return oklabComponentsToRgb(l, a, b, alpha);
      } catch {
        return 'rgb(0, 0, 0)';
      }
    }
  );

  // 3. Fallback for any remaining unparsed oklab
  result = result.replace(/oklab\(\s*[^\)]+\)/gi, 'rgb(0, 0, 0)');

  // 4. Fallback for color-mix(...)
  result = result.replace(/color-mix\([^)]+(?:\([^)]*\)[^)]*)*\)/gi, 'rgb(0, 0, 0)');

  return result;
}

const COLOR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'boxShadow',
  'fill',
  'stroke'
] as const;

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Sanitizes all elements in a DOM subtree by converting any computed or inline
 * oklch/oklab/color-mix colors into inline RGB/RGBA styles.
 * Guarantees that html2canvas will never encounter an unsupported color function
 * during computed style evaluation.
 */
export function sanitizeElementColors(
  rootEl: HTMLElement,
  win: Window = typeof window !== 'undefined' ? window : ({} as Window)
): void {
  if (!rootEl || !win || !win.getComputedStyle) return;

  const elements: HTMLElement[] = [
    rootEl,
    ...(Array.from(rootEl.querySelectorAll('*')) as HTMLElement[])
  ];

  for (const el of elements) {
    if (!el || !el.style) continue;

    // Check inline style attribute
    if (el.hasAttribute('style')) {
      const inlineStyle = el.getAttribute('style') || '';
      if (
        inlineStyle.includes('oklch') ||
        inlineStyle.includes('oklab') ||
        inlineStyle.includes('color-mix')
      ) {
        el.setAttribute('style', sanitizeCssColors(inlineStyle));
      }
    }

    try {
      const cs = win.getComputedStyle(el);
      if (!cs) continue;

      for (const prop of COLOR_PROPERTIES) {
        const val = cs[prop as keyof CSSStyleDeclaration];
        if (
          typeof val === 'string' &&
          (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix'))
        ) {
          const sanitized = sanitizeCssColors(val);
          el.style.setProperty(toKebabCase(prop), sanitized, 'important');
        }
      }
    } catch {
      // Continue if computed style fails for a specific element
    }
  }
}

/**
 * Prepares the cloned document inside html2canvas's temporary iframe:
 * 1. Sanitizes all `<style>` elements by converting oklch to RGB
 * 2. Removes external `<link rel="stylesheet">` elements to prevent html2canvas
 *    from fetching and parsing un-sanitized external stylesheets
 * 3. Patches `getComputedStyle` on the iframe window as an impenetrable safeguard
 * 4. Explicitly sanitizes root document background and text colors
 * 5. Recursively sanitizes all elements within the target capture root
 */
export function sanitizeClonedDocument(
  clonedDoc: Document,
  clonedEl?: HTMLElement | null
): void {
  if (!clonedDoc) return;

  const win = clonedDoc.defaultView || (typeof window !== 'undefined' ? window : null);

  // 1. Monkey-patch getComputedStyle in the cloned iframe window as an impenetrable safety net
  if (win && win.getComputedStyle) {
    try {
      const originalGetComputedStyle = win.getComputedStyle.bind(win);
      win.getComputedStyle = function (elt: Element, pseudo?: string | null) {
        const res = originalGetComputedStyle(elt, pseudo);
        return new Proxy(res, {
          get(target, prop, receiver) {
            const rawVal = Reflect.get(target, prop, receiver);
            if (typeof rawVal === 'function') {
              if (prop === 'getPropertyValue') {
                return (property: string) => {
                  const propertyVal = target.getPropertyValue(property);
                  if (
                    typeof propertyVal === 'string' &&
                    (propertyVal.includes('oklch') ||
                      propertyVal.includes('oklab') ||
                      propertyVal.includes('color-mix'))
                  ) {
                    return sanitizeCssColors(propertyVal);
                  }
                  return propertyVal;
                };
              }
              return rawVal.bind(target);
            }
            if (
              typeof rawVal === 'string' &&
              (rawVal.includes('oklch') ||
                rawVal.includes('oklab') ||
                rawVal.includes('color-mix'))
            ) {
              return sanitizeCssColors(rawVal);
            }
            return rawVal;
          }
        });
      };
    } catch {
      // Ignore proxy attachment error if iframe is restricted
    }
  }

  // 2. Sanitize all <style> elements in clonedDoc
  clonedDoc.querySelectorAll('style').forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = sanitizeCssColors(styleTag.textContent);
    }
  });

  // 3. Remove external app stylesheets that can reintroduce unsupported Tailwind v4 colors,
  // but preserve Google Fonts. PrintDocument uses Sarabun; removing fonts.googleapis.com
  // made html2canvas use a fallback font, changing Thai text widths and causing overlap.
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = (link as HTMLLinkElement).href || '';
    const isGoogleFonts =
      href.includes('fonts.googleapis.com') ||
      href.includes('fonts.gstatic.com');
    if (isGoogleFonts) return;
    try {
      link.remove();
    } catch {
      // Ignore link removal error
    }
  });

  // 4. Force root document & body to clean white/black
  if (clonedDoc.documentElement) {
    clonedDoc.documentElement.style.cssText =
      'background-color: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important;';
  }
  if (clonedDoc.body) {
    clonedDoc.body.style.cssText =
      'background-color: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; font-family: "Sarabun", "TH Sarabun New", sans-serif !important;';
  }

  // 5. Sanitize target element and all its children
  if (clonedEl && win) {
    clonedEl.style.position = 'static';
    clonedEl.style.left = '0';
    clonedEl.style.top = '0';
    clonedEl.style.margin = '0';
    clonedEl.style.backgroundColor = '#ffffff';
    clonedEl.style.color = '#000000';

    sanitizeElementColors(clonedEl, win);

    // Keep only the target capture sheet inside clonedDoc.body for fast, clean rendering
    Array.from(clonedDoc.body.children).forEach((child) => {
      if (child !== clonedEl && !child.contains(clonedEl)) {
        try {
          clonedDoc.body.removeChild(child);
        } catch {
          // Ignore removal error
        }
      }
    });
  }
}
