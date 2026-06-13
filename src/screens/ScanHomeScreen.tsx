/* ScanHomeScreen — greeting, active-session card (with Change), cache-status
 * line, the big scan affordance, today's stats, and recent scans. */
import React from "react";
import { View, Pressable } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H1, H2, Body, AppText, Mono } from "../components/Typography";
import { Card, Pill, Dot, StatTile, ViewfinderFrame, Avatar } from "../components/ui";
import { LogRow } from "./LogRow";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";
import { Institution, LogEntry } from "../data/exam";
import { examCategoryLabel } from "../api/osim";
import { SessionVM } from "../types";

export function ScanHomeScreen({
  session,
  stats,
  recent,
  cacheCount,
  connected,
  onScan,
  onNav,
  onOpenResult,
  onChangeSession,
}: {
  session: SessionVM;
  institution: Institution;
  stats: { total: number; authorized: number; denied: number };
  recent: LogEntry[];
  cacheCount: number;
  connected?: boolean | null;
  onScan: () => void;
  onNav: (id: "history" | "profile") => void;
  onOpenResult: (e: LogEntry) => void;
  onChangeSession: () => void;
}) {
  const { tokens } = useTheme();

  return (
    <ScreenScroll contentClassName="px-[22px] pt-1 pb-6">
      {connected === false ? (
        <View
          className="rounded-md p-3.5 mb-3 flex-row items-center gap-2.5"
          style={{ backgroundColor: tokens.hex["danger-soft"] }}
        >
          <I.alert size={18} color={tokens.hex.danger} />
          <View className="flex-1">
            <AppText className="font-jakarta-bold text-[13px] text-danger">Not connected to {session.institution}</AppText>
            <Body className="text-[12px] text-danger" style={{ opacity: 0.9 }}>
              No access token loaded for this institution. Check the connection and restart.
            </Body>
          </View>
        </View>
      ) : null}
      {/* greeting */}
      <View className="flex-row items-center justify-between py-1.5 pb-4">
        <View style={{ gap: 3 }}>
          <Body className="text-[13.5px]">Good morning,</Body>
          <H1 className="text-[24px]">{session.invigilator.split(" ")[0]} 👋</H1>
        </View>
        <Pressable onPress={() => onNav("profile")}>
          <Avatar name={session.invigilator} size={46} />
        </Pressable>
      </View>

      {/* session card */}
      <View className="rounded-lg p-[18px] mb-3 bg-accent" style={glow(tokens.hex.accent, 0.36, 14, 30)}>
        <View className="flex-row items-center justify-between mb-3">
          <Pill style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
            <Dot style={{ backgroundColor: "#fff" }} />
            <AppText className="text-white font-jakarta-bold text-[12.5px] ml-1.5">Active session</AppText>
          </Pill>
          <Pressable onPress={onChangeSession}>
            <Pill style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <I.edit size={14} color="#fff" />
              <AppText className="text-white font-jakarta-bold text-[12.5px] ml-1.5">Change</AppText>
            </Pill>
          </Pressable>
        </View>
        <Mono className="text-[12px] text-white tracking-[0.5px] mb-0.5" style={{ opacity: 0.85 }}>
          {examCategoryLabel(session.examCategory)} · Sem {session.semester || "1"}
        </Mono>
        <AppText className="text-[19px] font-jakarta-extrabold text-white tracking-[-0.3px] leading-[25px]">
          {session.code || session.name}
        </AppText>
        <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 14 }}>
          <View className="flex-row items-center gap-1.5">
            <I.pin size={15} color="#fff" />
            <AppText className="text-white font-jakarta-semibold text-[12.5px]" style={{ opacity: 0.92 }}>{session.venue}</AppText>
          </View>
          <View className="flex-row items-center gap-1.5">
            <I.calendar size={15} color="#fff" />
            <AppText className="text-white font-jakarta-semibold text-[12.5px]" style={{ opacity: 0.92 }}>{session.date}</AppText>
          </View>
          <View className="flex-row items-center gap-1.5">
            <I.clock size={15} color="#fff" />
            <AppText className="text-white font-jakarta-semibold text-[12.5px]" style={{ opacity: 0.92 }}>{(session.time || "").split(/[–-]/)[0].trim()}</AppText>
          </View>
        </View>
      </View>

      {/* cache status */}
      <View className="flex-row items-center gap-2 px-0.5 pb-4">
        <I.check size={16} sw={2.4} color={tokens.hex.success} />
        <AppText className="text-text-2 font-jakarta-bold text-[12.5px]">
          {cacheCount.toLocaleString()} records cached · offline-ready
        </AppText>
      </View>

      {/* big scan affordance */}
      <Pressable onPress={onScan} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
        <Card className="overflow-hidden rounded-xl">
          <View className="h-[188px] items-center justify-center" style={{ backgroundColor: "#1b1b24" }}>
            <ViewfinderFrame size={116} />
          </View>
          <View className="flex-row items-center justify-between p-[18px]">
            <View style={{ gap: 2 }}>
              <AppText className="font-jakarta-extrabold text-[16.5px] text-text">Scan examination card</AppText>
              <Body className="text-[13px]">Point at the QR code to verify</Body>
            </View>
            <View className="w-12 h-12 rounded-sm bg-accent items-center justify-center">
              <I.scan size={24} sw={2.1} color="#fff" />
            </View>
          </View>
        </Card>
      </Pressable>

      {/* stats */}
      <View className="flex-row my-4" style={{ gap: 11 }}>
        <StatTile value={stats.total} label="Scanned" tone="neutral" />
        <StatTile value={stats.authorized} label="Authorized" tone="success" />
        <StatTile value={stats.denied} label="Denied" tone="danger" />
      </View>

      {/* recent */}
      <View className="flex-row items-center justify-between mb-2.5">
        <H2 className="text-[17px]">Recent scans</H2>
        <Pressable onPress={() => onNav("history")}>
          <AppText className="text-[13.5px] font-jakarta-bold text-accent-ink">See all</AppText>
        </Pressable>
      </View>
      <Card className="overflow-hidden">
        {recent.slice(0, 3).map((e, i) => (
          <View key={i}>
            {i > 0 ? <View className="h-px bg-line ml-16" /> : null}
            <LogRow entry={e} onPress={() => onOpenResult(e)} />
          </View>
        ))}
      </Card>
    </ScreenScroll>
  );
}
