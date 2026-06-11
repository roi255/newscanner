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

export function ProfileScreen({
  session,
  institution,
  cacheCount,
  onLogout,
  onSwitchInstitution,
  onOpenAccessLog,
}: {
  session: SessionVM;
  institution: Institution;
  cacheCount?: number;
  onLogout: () => void;
  onSwitchInstitution: () => void;
  onOpenAccessLog?: () => void;
}) {
  const { tokens, theme, toggleTheme } = useTheme();

  const settings: { icon: IconName; label: string; sub?: string; onPress?: () => void }[] = [
    { icon: "cap", label: "Switch exam session", sub: session.course },
    // The OSIM request/response trail is a developer diagnostic — hidden from
    // live users so invigilators can't inspect the raw access log in production.
    ...(__DEV__
      ? [{ icon: "history" as IconName, label: "Access log", sub: "OSIM request / response trail", onPress: onOpenAccessLog }]
      : []),
    { icon: "bell", label: "Notifications", sub: "Finance alerts on" },
    { icon: "shield", label: "Override permissions", sub: "Supervisor PIN required" },
    { icon: "gear", label: "App settings" },
  ];

  return (
    <ScreenScroll contentClassName="px-[22px] pt-1 pb-6">
      <AppBar title="Profile" />

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

      {/* settings list */}
      <Card className="overflow-hidden mb-4">
        {/* dark mode toggle */}
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-sm bg-accent-soft items-center justify-center">
              <I.flash size={19} color={tokens.hex["accent-ink"]} />
            </View>
            <View style={{ gap: 1 }}>
              <AppText className="font-jakarta-bold text-[14.5px] text-text">Dark mode</AppText>
              <Body className="text-[12px]">{theme === "dark" ? "On" : "Off"}</Body>
            </View>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ true: tokens.hex.accent, false: tokens.hex["line-strong"] }}
            thumbColor="#fff"
          />
        </View>
        {settings.map((it, i) => {
          const Glyph = I[it.icon];
          return (
            <View key={i}>
              <Divider className="ml-[60px]" />
              <Pressable onPress={it.onPress} className="flex-row items-center justify-between px-4 py-3.5" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-sm bg-accent-soft items-center justify-center">
                    <Glyph size={19} color={tokens.hex["accent-ink"]} />
                  </View>
                  <View style={{ gap: 1 }}>
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
