/* ProfileScreen — invigilator, connected institution (+ switch), settings,
 * a real dark-mode toggle, and sign out. */
import React from "react";
import { View, Pressable, Switch } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H2, Body, AppText, LabelSm } from "../components/Typography";
import { Card, Pill, Dot, Button, Avatar, AppBar, Divider, InstitutionLogo } from "../components/ui";
import { I, IconName } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { Institution } from "../data/exam";
import { SessionVM } from "../types";
import type { AppSettings } from "../state/AppState";

export function ProfileScreen({
  session,
  institution,
  cacheCount,
  settings,
  onSetSetting,
  onLogout,
  onSwitchInstitution,
  onSwitchSession,
  onOpenAccessLog,
}: {
  session: SessionVM;
  institution: Institution;
  cacheCount?: number;
  settings: AppSettings;
  onSetSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onLogout: () => void;
  onSwitchInstitution: () => void;
  onSwitchSession: () => void;
  onOpenAccessLog?: () => void;
}) {
  const { tokens, theme, toggleTheme } = useTheme();

  // Toggle settings (render as switch rows). Dark mode is theme state; the rest
  // are persisted app settings that drive real scan behaviour.
  const toggles: { icon: IconName; label: string; sub: string; value: boolean; onToggle: (v: boolean) => void }[] = [
    { icon: "flash", label: "Dark mode", sub: theme === "dark" ? "On" : "Off", value: theme === "dark", onToggle: toggleTheme },
    { icon: "signal", label: "Haptic feedback", sub: "Vibrate on every scan (stronger when blocked)", value: settings.haptics, onToggle: (v) => onSetSetting("haptics", v) },
  ];

  // Action rows (render with a chevron). Access log is a dev-only diagnostic,
  // hidden in production so invigilators can't inspect the raw OSIM trail.
  const actions: { icon: IconName; label: string; sub?: string; onPress?: () => void }[] = [
    { icon: "cap", label: "Switch exam session", sub: session.course, onPress: onSwitchSession },
    ...(__DEV__
      ? [{ icon: "history" as IconName, label: "Access log", sub: "OSIM request / response trail", onPress: onOpenAccessLog }]
      : []),
  ];

  return (
    <ScreenScroll contentClassName="px-[22px] pt-1 pb-6">
      <AppBar title="Configurations" />

      {/* identity */}
      <Card className="p-[18px] mb-4 flex-row items-center" style={{ gap: 15 }}>
        <Avatar name={session.invigilator} size={62} />
        <View style={{ gap: 3 }}>
          <H2 className="text-[19px]">{session.invigilator}</H2>
          <View className="self-start">
            <Pill className="bg-surface-2">
              <AppText className="text-text-2 font-jakarta-bold text-[12.5px]">{session.invigilatorRole}</AppText>
            </Pill>
          </View>
          <Body className="text-[12.5px] mt-0.5">{institution.name}</Body>
        </View>
      </Card>

      {/* connected institution / scope */}
      <Card className="p-[18px] mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <LabelSm>Connected institution</LabelSm>
          <Pill className="bg-success-soft" style={{ height: 24 }}>
            <Dot style={{ backgroundColor: tokens.hex.success }} />
            <AppText className="text-success font-jakarta-bold text-[12.5px] ml-1.5">Synced</AppText>
          </Pill>
        </View>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <InstitutionLogo short={institution.short} logo={institution.logo} size={44} radius={12} textSize={15} />

          <View style={{ gap: 1 }}>
            <AppText className="font-jakarta-bold text-[15px] text-text">{institution.name}</AppText>
            <Body className="text-[12px]">
              {(cacheCount ?? institution.recordCount).toLocaleString()} records cached locally
            </Body>
          </View>
        </View>
        <Button
          title="Switch institution"
          onPress={onSwitchInstitution}
          variant="soft"
          size="sm"
          iconName="refresh"
          className="mt-3.5"
        />
      </Card>

      {/* settings list — toggles first, then action rows */}
      <Card className="overflow-hidden mb-4">
        {toggles.map((t, i) => {
          const Glyph = I[t.icon];
          return (
            <View key={t.label}>
              {i > 0 ? <Divider className="ml-[60px]" /> : null}
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-sm bg-accent-soft items-center justify-center">
                    <Glyph size={19} color={tokens.hex["accent-ink"]} />
                  </View>
                  <View style={{ gap: 1 }} className="flex-1">
                    <AppText className="font-jakarta-bold text-[14.5px] text-text">{t.label}</AppText>
                    <Body className="text-[12px]">{t.sub}</Body>
                  </View>
                </View>
                <Switch
                  value={t.value}
                  onValueChange={t.onToggle}
                  trackColor={{ true: tokens.hex.accent, false: tokens.hex["line-strong"] }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          );
        })}
        {actions.map((it) => {
          const Glyph = I[it.icon];
          return (
            <View key={it.label}>
              <Divider className="ml-[60px]" />
              <Pressable onPress={it.onPress} className="flex-row items-center justify-between px-4 py-3.5" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-sm bg-accent-soft items-center justify-center">
                    <Glyph size={19} color={tokens.hex["accent-ink"]} />
                  </View>
                  <View style={{ gap: 1 }} className="flex-1">
                    <AppText className="font-jakarta-bold text-[14.5px] text-text">{it.label}</AppText>
                    {it.sub ? <Body className="text-[12px]">{it.sub}</Body> : null}
                  </View>
                </View>
                <I.chevron size={19} color={tokens.hex.muted} />
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Button title="Sign out" onPress={onLogout} variant="ghost" iconName="logout" tint={tokens.hex.danger} textClassName="text-danger" />
      <AppText className="text-center mt-4 text-muted font-jakarta-semibold text-[12px]">ExamPass · v1.0</AppText>
    </ScreenScroll>
  );
}
