/* util.ts — small style helpers. RN's New Architecture (0.76+) supports the
 * `boxShadow` style string, so we reproduce the prototype's layered/colored
 * shadows directly instead of approximating with elevation. */

/** "#rrggbb" + alpha(0-1) -> "rgba(r,g,b,a)" */
export function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* Neutral elevation shadows (match --shadow-sm / --shadow-md / --shadow-lg). */
export const shadowSm = {
  boxShadow: "0px 1px 2px rgba(64,64,90,0.05), 0px 2px 6px rgba(64,64,90,0.05)",
} as const;
export const shadowMd = {
  boxShadow: "0px 4px 14px rgba(64,64,90,0.10), 0px 2px 5px rgba(64,64,90,0.08)",
} as const;
export const shadowLg = {
  boxShadow: "0px 18px 48px rgba(56,56,80,0.18), 0px 6px 16px rgba(56,56,80,0.10)",
} as const;

/** Colored glow, e.g. the accent/success/danger button & card shadows. */
export function glow(hex: string, alpha = 0.36, y = 10, blur = 26): object {
  return { boxShadow: `0px ${y}px ${blur}px ${rgba(hex, alpha)}` };
}
