/* ui.tsx — shared building blocks (Card, Button, Pill, Field, Avatar, …).
 * Ported from components.jsx + the CSS component classes in index.html. */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Pressable,
  PressableProps,
  TextInput,
  TextInputProps,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from "react-native";
import { AppText, Body, H1, H2, LabelSm, Mono } from "./Typography";
import { I, IconName } from "./icons";
import { useTheme } from "../theme/ThemeProvider";
import { shadowSm, glow } from "../theme/util";

/* ---------- Card ---------- */
export function Card({
  children,
  className = "",
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View className={`bg-surface rounded-lg ${className}`} style={[shadowSm, style]}>
      {children}
    </View>
  );
}

/* ---------- Pill / Dot / Chip ---------- */
export function Pill({
  children,
  className = "",
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View className={`flex-row items-center h-7 px-3 rounded-pill ${className}`} style={style}>
      {children}
    </View>
  );
}

export function Dot({ className = "", style }: { className?: string; style?: StyleProp<ViewStyle> }) {
  return <View className={`w-[7px] h-[7px] rounded-full ${className}`} style={style} />;
}

export function Chip({
  label,
  active,
  onPress,
  iconName,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  iconName?: IconName;
}) {
  const { tokens } = useTheme();
  const Glyph = iconName ? I[iconName] : null;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 h-9 px-3.5 rounded-pill ${active ? "bg-accent" : "bg-surface"}`}
      style={active ? glow(tokens.hex.accent, 0.32, 6, 14) : shadowSm}
    >
      {Glyph ? <Glyph size={15} color={active ? "#fff" : tokens.hex["text-2"]} /> : null}
      <AppText
        className={`text-[13px] ${active ? "text-white font-jakarta-semibold" : "text-text-2 font-jakarta-medium"}`}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/* ---------- Divider ---------- */
export function Divider({ className = "", style }: { className?: string; style?: StyleProp<ViewStyle> }) {
  return <View className={`h-px bg-line ${className}`} style={style} />;
}

/* ---------- Button ---------- */
type Variant = "primary" | "ghost" | "soft" | "danger-soft";

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  iconName,
  iconRightName,
  disabled,
  tint,
  className = "",
  textClassName = "",
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: "md" | "sm";
  iconName?: IconName;
  iconRightName?: IconName;
  disabled?: boolean;
  tint?: string;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { tokens } = useTheme();
  const bg = {
    primary: "bg-accent",
    ghost: "bg-surface",
    soft: "bg-accent-soft",
    "danger-soft": "bg-danger-soft",
  }[variant];
  const txt = {
    primary: "text-white",
    ghost: "text-text",
    soft: "text-accent-ink",
    "danger-soft": "text-danger",
  }[variant];
  const iconColor =
    tint ??
    {
      primary: "#ffffff",
      ghost: tokens.hex.text,
      soft: tokens.hex["accent-ink"],
      "danger-soft": tokens.hex.danger,
    }[variant];

  const h = size === "sm" ? "h-11" : "h-[54px]";
  const radius = size === "sm" ? "rounded-sm" : "rounded-md";
  const fontSize = size === "sm" ? "text-[14.5px]" : "text-[16px]";

  const shadow =
    variant === "primary" ? glow(tokens.hex.accent, 0.36, 8, 20) : variant === "ghost" ? shadowSm : undefined;

  const Left = iconName ? I[iconName] : null;
  const Right = iconRightName ? I[iconRightName] : null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`w-full flex-row items-center justify-center gap-2.5 px-[22px] ${h} ${radius} ${bg} ${className}`}
      style={({ pressed }) => [shadow, { opacity: disabled ? 0.5 : pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}
    >
      {Left ? <Left size={20} color={iconColor} /> : null}
      <AppText className={`font-jakarta-bold ${fontSize} ${txt} ${textClassName}`}>{title}</AppText>
      {Right ? <Right size={20} sw={2.4} color={iconColor} /> : null}
    </Pressable>
  );
}

/* ---------- Field ---------- */
export function Field({
  iconName,
  className = "",
  inputClassName = "",
  ...rest
}: TextInputProps & { iconName?: IconName; className?: string; inputClassName?: string }) {
  const { tokens } = useTheme();
  const Glyph = iconName ? I[iconName] : null;
  return (
    <View className={`relative ${className}`}>
      {Glyph ? (
        <View className="absolute left-4 top-0 bottom-0 justify-center z-10" pointerEvents="none">
          <Glyph size={20} color={tokens.hex.muted} />
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={tokens.hex.muted}
        className={`w-full h-14 bg-surface rounded-md border-[1.5px] border-line text-text font-jakarta text-[16px] ${
          Glyph ? "pl-12 pr-4" : "px-4"
        } ${inputClassName}`}
        {...rest}
      />
    </View>
  );
}

/* ---------- Avatar / StudentPhoto ---------- */
export function Avatar({
  size = 48,
  photo,
  square,
}: {
  name?: string;
  size?: number;
  photo?: string | null;
  square?: boolean;
}) {
  const { tokens } = useTheme();
  const [failed, setFailed] = useState(false);
  const radius = square ? 18 : size / 2;
  return (
    <View
      className="bg-accent-soft items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {photo && !failed ? (
        <Image source={{ uri: photo }} onError={() => setFailed(true)} style={{ width: size, height: size }} />
      ) : (
        <I.user size={Math.round(size * 0.5)} sw={1.7} color={tokens.hex["accent-ink"]} style={{ opacity: 0.85 }} />
      )}
    </View>
  );
}

export function StudentPhoto({ student, size = 96 }: { student?: { photo?: string | null }; size?: number }) {
  const { tokens } = useTheme();
  const [failed, setFailed] = useState(false);
  const photo = student?.photo;
  return (
    <View
      className="bg-accent-soft items-center justify-center overflow-hidden rounded-lg"
      style={{ width: size, height: size }}
    >
      {photo && !failed ? (
        <Image source={{ uri: photo }} onError={() => setFailed(true)} style={{ width: size, height: size }} />
      ) : (
        <View className="items-center" style={{ gap: 6 }}>
          <I.user size={Math.round(size * 0.42)} sw={1.5} color={tokens.hex["accent-ink"]} style={{ opacity: 0.8 }} />
          <Mono className="text-accent-ink" style={{ fontSize: 8.5, letterSpacing: 0.5, opacity: 0.7 }}>
            PHOTO
          </Mono>
        </View>
      )}
    </View>
  );
}

/* ---------- InstitutionLogo ---------- */
export function InstitutionLogo({
  short,
  logo,
  size = 52,
  radius = 16,
  bg,
  textSize = 18,
}: {
  short: string;
  logo?: string | null;
  size?: number;
  radius?: number;
  bg?: string;
  textSize?: number;
}) {
  const { tokens } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = !!logo && !failed;
  // The initials are the ALWAYS-present base layer; the logo is overlaid and only
  // revealed once it truly loads (onLoad). A slow/unreachable/404 logo therefore
  // leaves clean initials instead of a blank white box — onError isn't guaranteed
  // to fire on a hanging host, so we never commit to an empty image container.
  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: loaded ? "#fff" : bg ?? tokens.hex.accent,
      }}
    >
      {!loaded && (
        <AppText className="text-white font-jakarta-extrabold tracking-[-0.5px]" style={{ fontSize: textSize }}>
          {short}
        </AppText>
      )}
      {showImage && (
        <Image
          source={{ uri: logo }}
          resizeMode="contain"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ position: "absolute", top: size * 0.08, left: size * 0.08, width: size * 0.84, height: size * 0.84 }}
        />
      )}
    </View>
  );
}

/* ---------- ScreenHeader ---------- */
/* The centered "media + title + subtitle" block shared by the Login (Verify
 * access), Operator (Start scanning) and OTP screens. `media` is the glowing
 * logo/icon node; the className props keep each screen's small variations. */
export function ScreenHeader({
  media,
  title,
  subtitle,
  titleClassName = "",
  subtitleClassName = "mt-1.5",
  subtitleMaxWidth = 280,
  className = "mt-[22px] mb-[26px]",
}: {
  media: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
  subtitleMaxWidth?: number;
  className?: string;
}) {
  return (
    <View className={`items-center ${className}`}>
      {media}
      <H1 className={`mt-[18px] text-[26px] ${titleClassName}`}>{title}</H1>
      {subtitle != null ? (
        <Body className={`text-center ${subtitleClassName}`} style={{ maxWidth: subtitleMaxWidth }}>
          {subtitle}
        </Body>
      ) : null}
    </View>
  );
}

/* ---------- DetailRow ---------- */
export function DetailRow({
  iconName,
  label,
  value,
  mono,
}: {
  iconName: IconName;
  label: string;
  value: string;
  mono?: boolean;
}) {
  const { tokens } = useTheme();
  const Glyph = I[iconName];
  return (
    <View className="flex-row items-center gap-3 py-[11px]">
      <View className="w-[34px] h-[34px] rounded-sm bg-surface-2 items-center justify-center">
        <Glyph size={18} color={tokens.hex["text-2"]} />
      </View>
      <View className="flex-1 min-w-0" style={{ gap: 1 }}>
        <LabelSm>{label}</LabelSm>
        {mono ? (
          <Mono className="text-text font-jakarta-bold text-[14px] tracking-[-0.3px]">{value}</Mono>
        ) : (
          <AppText className="text-text font-jakarta-bold text-[15.5px]">{value}</AppText>
        )}
      </View>
    </View>
  );
}

/* ---------- StatTile ---------- */
export function StatTile({ value, label, tone }: { value: number; label: string; tone: "neutral" | "success" | "danger" }) {
  const color = { neutral: "text-text", success: "text-success", danger: "text-danger" }[tone];
  return (
    <Card className="flex-1" style={{ paddingTop: 14, paddingHorizontal: 14, paddingBottom: 13 }}>
      <AppText className={`font-jakarta-extrabold text-[26px] tracking-[-0.5px] ${color}`}>{String(value)}</AppText>
      <LabelSm className="mt-0.5">{label}</LabelSm>
    </Card>
  );
}

/* ---------- ViewfinderFrame (animated scan line) ---------- */
export function ViewfinderFrame({ size = 120, scanning }: { size?: number; scanning?: boolean }) {
  const { tokens } = useTheme();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!scanning) return;
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, t]);

  const corner = (s: ViewStyle, key: string) => (
    <View key={key} style={[{ position: "absolute", width: 26, height: 26, borderColor: "#fff" }, s]} />
  );
  const translateY = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [size * 0.08, size * 0.9, size * 0.08] });

  return (
    <View style={{ width: size, height: size }}>
      {corner({ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 }, "tl")}
      {corner({ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 }, "tr")}
      {corner({ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 }, "bl")}
      {corner({ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 }, "br")}
      {scanning ? (
        <Animated.View
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            height: 2.5,
            borderRadius: 3,
            backgroundColor: tokens.hex.accent,
            boxShadow: `0px 0px 14px 2px ${tokens.hex.accent}`,
            transform: [{ translateY }],
          }}
        />
      ) : null}
    </View>
  );
}

/* ---------- AppBar (in-scroll header) ---------- */
export function AppBar({
  title,
  sub,
  onBack,
  right,
}: {
  title: string;
  sub?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { tokens } = useTheme();
  return (
    <View className="flex-row items-center justify-between gap-3" style={{ paddingTop: 6, paddingBottom: 14 }}>
      <View className="flex-row items-center gap-2.5 min-w-0">
        {onBack ? (
          <Pressable onPress={onBack} className="w-10 h-10 rounded-sm bg-surface items-center justify-center" style={shadowSm}>
            <I.back size={22} color={tokens.hex.text} />
          </Pressable>
        ) : null}
        <View className="min-w-0">
          <H2 className="leading-[26px]">{title}</H2>
          {sub ? <Body className="text-[13px] mt-0.5">{sub}</Body> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

/* ---------- Pressable card wrapper with press feedback ---------- */
export function Touchable({ children, style, ...rest }: PressableProps & { children?: React.ReactNode }) {
  return (
    <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, style as ViewStyle]} {...rest}>
      {children}
    </Pressable>
  );
}
