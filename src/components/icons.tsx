/* icons.tsx — minimal line-icon set ported to react-native-svg.
 * The root <Svg> receives a `color` prop, so children using `currentColor`
 * resolve to it — letting the original path data port over unchanged. */
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";

export type IconProps = {
  size?: number;
  sw?: number;
  color?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
};

type BaseProps = IconProps & { children?: React.ReactNode };

const Icon = ({ size = 24, sw = 1.9, color = "currentColor", fill = "none", style, children }: BaseProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    color={color}
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </Svg>
);

export const I = {
  scan: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <Path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <Path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <Path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <Path d="M4 12h16" />
    </Icon>
  ),
  history: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <Path d="M3 4v4h4" />
      <Path d="M12 8v4l3 2" />
    </Icon>
  ),
  search: (p: IconProps) => (
    <Icon {...p}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m20 20-3.2-3.2" />
    </Icon>
  ),
  user: (p: IconProps) => (
    <Icon {...p}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
    </Icon>
  ),
  check: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M20 6 9 17l-5-5" />
    </Icon>
  ),
  x: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  ),
  chevron: (p: IconProps) => (
    <Icon {...p}>
      <Path d="m9 6 6 6-6 6" />
    </Icon>
  ),
  back: (p: IconProps) => (
    <Icon {...p}>
      <Path d="m15 6-6 6 6 6" />
    </Icon>
  ),
  lock: (p: IconProps) => (
    <Icon {...p}>
      <Rect x="5" y="11" width="14" height="9" rx="2.4" />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  ),
  mail: (p: IconProps) => (
    <Icon {...p}>
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Path d="m4 7 8 6 8-6" />
    </Icon>
  ),
  id: (p: IconProps) => (
    <Icon {...p}>
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Circle cx="8.5" cy="11" r="2.2" />
      <Path d="M5.5 16.5c.4-1.6 1.6-2.4 3-2.4s2.6.8 3 2.4" />
      <Path d="M14 9.5h4M14 12.5h4M14 15.5h2.5" />
    </Icon>
  ),
  pin: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
      <Circle cx="12" cy="10.5" r="2.4" />
    </Icon>
  ),
  wallet: (p: IconProps) => (
    <Icon {...p}>
      <Rect x="3" y="6" width="18" height="13" rx="3" />
      <Path d="M3 10h18" />
      <Circle cx="16.5" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
    </Icon>
  ),
  seat: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M6 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2l1 8H5l1-8Z" />
      <Path d="M4 13h13a2 2 0 0 1 2 2v3" />
      <Path d="M5 18v2M17 18v2" />
    </Icon>
  ),
  cap: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M2 8.5 12 4l10 4.5-10 4.5L2 8.5Z" />
      <Path d="M6 10.6V15c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4.4" />
      <Path d="M22 8.5V14" />
    </Icon>
  ),
  calendar: (p: IconProps) => (
    <Icon {...p}>
      <Rect x="3" y="5" width="18" height="16" rx="3" />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  ),
  clock: (p: IconProps) => (
    <Icon {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </Icon>
  ),
  bell: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <Path d="M10 20a2 2 0 0 0 4 0" />
    </Icon>
  ),
  shield: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M12 3 5 6v5c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6l-7-3Z" />
    </Icon>
  ),
  flash: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </Icon>
  ),
  keypad: (p: IconProps) => (
    <Icon {...p}>
      {[6, 12, 18].map((cy) =>
        [6, 12, 18].map((cx) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="currentColor" stroke="none" />
        ))
      )}
    </Icon>
  ),
  gear: (p: IconProps) => (
    <Icon {...p}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
  ),
  logout: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <Path d="M16 17l5-5-5-5M21 12H9" />
    </Icon>
  ),
  signal: (p: IconProps) => (
    <Icon {...p} sw={0} fill="currentColor">
      <Rect x="2" y="9" width="3" height="5" rx="1" />
      <Rect x="7" y="6" width="3" height="8" rx="1" />
      <Rect x="12" y="3" width="3" height="11" rx="1" />
      <Rect x="17" y="3" width="3" height="11" rx="1" opacity="0.35" />
    </Icon>
  ),
  wifi: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M2 8.5a15 15 0 0 1 20 0" />
      <Path d="M5 12a10 10 0 0 1 14 0" />
      <Path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <Circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  battery: (p: IconProps) => (
    <Icon {...p} sw={1.4}>
      <Rect x="2" y="7" width="18" height="10" rx="3" />
      <Rect x="4" y="9" width="13" height="6" rx="1.5" fill="currentColor" stroke="none" />
      <Path d="M22 10v4" />
    </Icon>
  ),
  plus: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  refresh: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <Path d="M21 4v5h-5" />
    </Icon>
  ),
  alert: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M12 3 2 20h20L12 3Z" />
      <Path d="M12 10v4" />
      <Circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  ),
  edit: (p: IconProps) => (
    <Icon {...p}>
      <Path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <Path d="m13.5 6.5 3 3" />
    </Icon>
  ),
};

export type IconName = keyof typeof I;
