/* color.ts — color math that reproduces the web prototype's palette.
 *
 * The prototype defines its base palette in `oklch(...)` and derives every soft
 * tint with `color-mix(in oklch, A P%, B)`. React Native has neither, so we do
 * the same maths in JS: convert oklch / hex into OKLab, mix in OKLab, then emit
 * an "R G B" triple that Tailwind reads via `rgb(var(--token) / <alpha>)`.
 */

export type Lab = { L: number; a: number; b: number };
export type Rgb = [number, number, number]; // 0-255

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/* ---- sRGB gamma <-> linear ---- */
const linearToSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
const srgbToLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

/* ---- OKLab <-> linear sRGB (Björn Ottosson) ---- */
function oklabToLinearSrgb({ L, a, b }: Lab): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearSrgbToOklab(r: number, g: number, b: number): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/* ---- public conversions ---- */
export function oklch(L: number, C: number, H: number): Lab {
  const h = (H * Math.PI) / 180;
  return { L, a: C * Math.cos(h), b: C * Math.sin(h) };
}

export function hexToLab(hex: string): Lab {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = srgbToLinear(parseInt(full.slice(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(full.slice(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(full.slice(4, 6), 16) / 255);
  return linearSrgbToOklab(r, g, b);
}

export const BLACK: Lab = { L: 0, a: 0, b: 0 };
export const WHITE: Lab = { L: 1, a: 0, b: 0 };

/* color-mix(in oklch, a P%, b) — `pct` is the weight of `a` (0-100). */
export function mix(a: Lab, b: Lab, pct: number): Lab {
  const t = pct / 100;
  return {
    L: a.L * t + b.L * (1 - t),
    a: a.a * t + b.a * (1 - t),
    b: a.b * t + b.b * (1 - t),
  };
}

export function labToRgb(lab: Lab): Rgb {
  const [lr, lg, lb] = oklabToLinearSrgb(lab);
  return [
    Math.round(clamp01(linearToSrgb(lr)) * 255),
    Math.round(clamp01(linearToSrgb(lg)) * 255),
    Math.round(clamp01(linearToSrgb(lb)) * 255),
  ];
}

/* "R G B" string for `rgb(var(--token) / <alpha-value>)`. */
export function rgbTriple(lab: Lab): string {
  const [r, g, b] = labToRgb(lab);
  return `${r} ${g} ${b}`;
}

/* Plain "#rrggbb" — for the few props (gradients, SVG) that need a literal. */
export function hex(lab: Lab): string {
  const [r, g, b] = labToRgb(lab);
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
