/* AccessLogScreen — inspectable audit trail of OSIM access requests/responses
 * (mirrors cis_sys_api_request_log). Useful while testing against a real
 * institution; empty until an OSIM connection is configured. */
import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { Body, AppText, LabelSm, Mono } from "../components/Typography";
import { Card, AppBar, Pill, Button } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { AccessLogEntry, subscribeAccessLog, clearAccessLog } from "../api/osim";

export function AccessLogScreen({ onBack }: { onBack: () => void }) {
  const { tokens } = useTheme();
  const [entries, setEntries] = useState<AccessLogEntry[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => subscribeAccessLog(setEntries), []);

  const ok = (s: number) => s === 200;

  return (
    <ScreenScroll contentClassName="px-[22px] pt-1 pb-6">
      <AppBar title="Access log" sub="OSIM request / response trail" onBack={onBack} />

      <View className="flex-row items-center justify-between mb-3">
        <LabelSm>{entries.length} access events</LabelSm>
        {entries.length > 0 ? (
          <Pressable onPress={clearAccessLog}>
            <AppText className="text-[12.5px] font-jakarta-bold text-accent-ink">Clear</AppText>
          </Pressable>
        ) : null}
      </View>

      {entries.length === 0 ? (
        <Card className="p-[18px] items-center" style={{ gap: 8, paddingVertical: 34 }}>
          <View className="w-[52px] h-[52px] rounded-md bg-surface-2 items-center justify-center">
            <I.shield size={26} color={tokens.hex.muted} />
          </View>
          <AppText className="font-jakarta-bold text-[16px] text-text">No access yet</AppText>
          <Body className="text-[13.5px] text-center" style={{ maxWidth: 250 }}>
            Requests to an institution's OSIM API are logged here. Configure a connection in the OSIM config to start.
          </Body>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {entries.map((e) => {
            const expanded = open === e.id;
            return (
              <Card key={e.id} className="overflow-hidden">
                <Pressable
                  onPress={() => setOpen(expanded ? null : e.id)}
                  className="flex-row items-center justify-between p-[14px]"
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                >
                  <View className="min-w-0 flex-1" style={{ gap: 3 }}>
                    <Mono className="text-[13px] text-text" numberOfLines={1}>{e.title}</Mono>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <Mono className="text-[10.5px] text-muted">{e.at.replace("T", " ").slice(0, 19)}</Mono>
                      <Mono className="text-[10.5px] text-muted">{e.ms}ms</Mono>
                      <Mono className="text-[10.5px] text-muted">{e.mode}</Mono>
                    </View>
                  </View>
                  <Pill style={{ backgroundColor: ok(e.status) ? tokens.hex["success-soft"] : tokens.hex["danger-soft"] }}>
                    <AppText
                      className="font-jakarta-bold text-[11.5px]"
                      style={{ color: ok(e.status) ? tokens.hex.success : tokens.hex.danger }}
                    >
                      {e.status || "ERR"}
                    </AppText>
                  </Pill>
                </Pressable>
                {expanded ? (
                  <View className="px-[14px] pb-[14px]" style={{ gap: 10 }}>
                    <View className="h-px bg-line" />
                    <LabelSm>Key</LabelSm>
                    <Mono className="text-[11.5px] text-text-2">{e.apiKey}</Mono>
                    <LabelSm>Request</LabelSm>
                    <Mono className="text-[11px] text-text-2">{JSON.stringify(e.request, null, 2)}</Mono>
                    <LabelSm>Response</LabelSm>
                    <Mono className="text-[11px] text-text-2">{JSON.stringify(e.response, null, 2)}</Mono>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      <Button title="Done" variant="ghost" onPress={onBack} className="mt-4" />
    </ScreenScroll>
  );
}
