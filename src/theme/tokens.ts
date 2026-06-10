/* tokens.ts — builds the full token set (as OKLab) for a theme + accent, then
 * emits the `vars()` map (rgb triples) and a few literal hex colors used where
 * className theming can't reach (gradients, SVG strokes, native pickers). */
import { Lab, oklch, hexToLab, mix, BLACK, WHITE, rgbTriple, hex } from "./color";

export type ThemeName = "light" | "dark";

type Base = {
  bg: Lab;
  canvas: Lab;
  surface: Lab;
  surface2: Lab;
  text: Lab;
  text2: Lab;
  muted: Lab;
  line: Lab;
  lineStrong: Lab;
  success: Lab;
  danger: Lab;
  warn: Lab;
};

const LIGHT: Base = {
  bg: oklch(0.972, 0.006, 75),
  canvas: oklch(0.945, 0.008, 75),
  surface: oklch(0.995, 0.003, 80),
  surface2: oklch(0.978, 0.006, 75),
  text: oklch(0.255, 0.018, 285),
  text2: oklch(0.46, 0.02, 285),
  muted: oklch(0.62, 0.018, 285),
  line: oklch(0.915, 0.008, 285),
  lineStrong: oklch(0.86, 0.01, 285),
  success: oklch(0.605, 0.13, 152),
  danger: oklch(0.585, 0.185, 24),
  warn: oklch(0.74, 0.13, 75),
};

const DARK: Base = {
  bg: oklch(0.225, 0.014, 285),
  canvas: oklch(0.17, 0.012, 285),
  surface: oklch(0.272, 0.015, 285),
  surface2: oklch(0.305, 0.016, 285),
  text: oklch(0.965, 0.004, 285),
  text2: oklch(0.78, 0.012, 285),
  muted: oklch(0.64, 0.014, 285),
  line: oklch(0.34, 0.014, 285),
  lineStrong: oklch(0.4, 0.016, 285),
  success: oklch(0.7, 0.14, 152),
  danger: oklch(0.68, 0.18, 24),
  warn: oklch(0.74, 0.13, 75),
};

/* Per-theme mix percentages, mirroring index.html. */
const MIXES = {
  light: { successSoft: 14, dangerSoft: 13, accentSoft: 13, accentSofter: 7, accentInk: 72 },
  dark: { successSoft: 20, dangerSoft: 22, accentSoft: 26, accentSofter: 15, accentInk: 30 },
};

export type Tokens = {
  /** vars() map: "--token" -> "R G B" */
  vars: Record<string, string>;
  /** literal hex values for gradient / svg / native props */
  hex: Record<string, string>;
  /** the active OKLab values, for the rare computed style */
  lab: Record<string, Lab>;
};

export function buildTokens(accentHex: string, theme: ThemeName): Tokens {
  const base = theme === "dark" ? DARK : LIGHT;
  const m = MIXES[theme];
  const accent = hexToLab(accentHex);

  const lab: Record<string, Lab> = {
    bg: base.bg,
    canvas: base.canvas,
    surface: base.surface,
    "surface-2": base.surface2,
    text: base.text,
    "text-2": base.text2,
    muted: base.muted,
    line: base.line,
    "line-strong": base.lineStrong,
    success: base.success,
    "success-soft": mix(base.success, base.surface, m.successSoft),
    danger: base.danger,
    "danger-soft": mix(base.danger, base.surface, m.dangerSoft),
    warn: base.warn,
    accent,
    "accent-soft": mix(accent, base.surface, m.accentSoft),
    "accent-softer": mix(accent, base.surface, m.accentSofter),
    "accent-ink": theme === "dark" ? mix(accent, WHITE, m.accentInk) : mix(accent, BLACK, m.accentInk),
  };

  const vars: Record<string, string> = {};
  const hexMap: Record<string, string> = {};
  for (const key of Object.keys(lab)) {
    vars[`--${key}`] = rgbTriple(lab[key]);
    hexMap[key] = hex(lab[key]);
  }

  return { vars, hex: hexMap, lab };
}
