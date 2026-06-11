/* Typography — RN <Text> doesn't inherit fonts, so every text style is an
 * explicit wrapper. Mirrors the type scale in index.html. */
import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

type Props = TextProps & { className?: string };

const cx = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

/* Custom fonts on Android add asymmetric ascent/descent padding to the line
 * box, which pushes glyphs off-center inside fixed-height rows (pills, chips,
 * badges). Disabling it lets `items-center` center the text properly; iOS
 * ignores the flag. Applied to every text primitive so it's uniform. */
const base = StyleSheet.create({ t: { includeFontPadding: false } }).t;

export function AppText({ className, style, ...rest }: Props) {
  return <Text className={cx("font-jakarta text-text", className)} style={[base, style]} {...rest} />;
}

/* h1: 27 / 800 / -0.5 */
export function H1({ className, style, ...rest }: Props) {
  return <Text className={cx("font-jakarta-extrabold text-text text-[27px] leading-[30px]", className)} style={[base, style]} {...rest} />;
}

/* h2: 20 / 700 / -0.3 */
export function H2({ className, style, ...rest }: Props) {
  return <Text className={cx("font-jakarta-bold text-text text-[20px]", className)} style={[base, style]} {...rest} />;
}

/* eyebrow: 11.5 / 700 / 1.4 uppercase muted */
export function Eyebrow({ className, style, ...rest }: Props) {
  return <Text className={cx("font-jakarta-bold text-muted text-[11.5px] uppercase tracking-[1.4px]", className)} style={[base, style]} {...rest} />;
}

/* body: 14.5 / 1.5 / text-2 */
export function Body({ className, style, ...rest }: Props) {
  return <Text className={cx("font-jakarta text-text-2 text-[14.5px] leading-[22px]", className)} style={[base, style]} {...rest} />;
}

/* label-sm: 11 / 700 / 0.9 uppercase muted */
export function LabelSm({ className, style, ...rest }: Props) {
  return <Text className={cx("font-jakarta-bold text-muted text-[11px] uppercase tracking-[0.9px]", className)} style={[base, style]} {...rest} />;
}

/* monospace (Space Mono) — IDs / codes / numerals */
export function Mono({ className, style, ...rest }: Props) {
  return <Text className={cx("font-mono text-text", className)} style={[base, style]} {...rest} />;
}
