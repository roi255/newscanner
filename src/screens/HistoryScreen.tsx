/* HistoryScreen — session scan log with filters + counts. */
import React, { useState } from "react";
import { View } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { AppText, LabelSm } from "../components/Typography";
import { Card, Chip, AppBar } from "../components/ui";
import { LogRow } from "./LogRow";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { LogEntry } from "../data/exam";
import { SessionVM } from "../types";

type Filter = "all" | "auth" | "deny";

export function HistoryScreen({
  session,
  log,
  onOpenResult,
}: {
  session: SessionVM;
  log: LogEntry[];
  onOpenResult: (e: LogEntry) => void;
}) {
  const { tokens } = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = log.filter((e) => filter === "all" || (filter === "auth" ? e.authorized : !e.authorized));
  const authCount = log.filter((e) => e.authorized).length;
  const denyCount = log.length - authCount;

  return (
    <ScreenScroll contentClassName="px-[22px] pt-1 pb-6">
      <AppBar title="Scan history" sub={session.course} />

      <Card className="p-[18px] mb-4">
        <View className="flex-row items-center justify-between">
          <View style={{ gap: 2 }}>
            <LabelSm>This session</LabelSm>
            <AppText className="font-jakarta-extrabold text-[28px] tracking-[-0.6px] text-text">
              {log.length} <AppText className="text-[15px] font-jakarta-bold text-muted">scans</AppText>
            </AppText>
          </View>
          <View className="flex-row" style={{ gap: 18 }}>
            <View className="items-center">
              <AppText className="text-[20px] font-jakarta-extrabold text-success">{String(authCount)}</AppText>
              <LabelSm>Cleared</LabelSm>
            </View>
            <View className="items-center">
              <AppText className="text-[20px] font-jakarta-extrabold text-danger">{String(denyCount)}</AppText>
              <LabelSm>Denied</LabelSm>
            </View>
          </View>
        </View>
      </Card>

      <View className="flex-row mb-3.5" style={{ gap: 8 }}>
        <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
        <Chip label="Authorized" active={filter === "auth"} onPress={() => setFilter("auth")} />
        <Chip label="Denied" active={filter === "deny"} onPress={() => setFilter("deny")} />
      </View>

      <Card className="overflow-hidden">
        {filtered.map((e, i) => (
          <View key={i}>
            {i > 0 ? <View className="h-px bg-line ml-16" /> : null}
            <LogRow entry={e} showTime onPress={() => onOpenResult(e)} />
          </View>
        ))}
        {filtered.length === 0 ? (
          <View className="items-center p-8" style={{ gap: 6 }}>
            <I.history size={28} color={tokens.hex.muted} />
            <AppText className="font-jakarta-semibold text-[14px] text-muted">Nothing here yet</AppText>
          </View>
        ) : null}
      </Card>
    </ScreenScroll>
  );
}
