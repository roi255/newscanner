/* LogRow — a single scan/lookup entry, shared by ScanHome, Lookup, History. */
import React from "react";
import { View, Pressable } from "react-native";
import { AppText, Mono } from "../components/Typography";
import { Avatar } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { money, LogEntry } from "../data/exam";

// Memoized: list rows only re-render when their own entry/flags change, not on
// every parent state update (e.g. a scan appending elsewhere in the list).
export const LogRow = React.memo(function LogRow({
  entry,
  showTime,
  onPress,
}: {
  entry: LogEntry;
  showTime?: boolean;
  onPress?: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between w-full gap-3 px-4 py-[13px]"
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View className="flex-row items-center gap-3 min-w-0 flex-1">
        <View>
          <Avatar name={entry.name} size={40} />
          <View
            className="absolute -right-1 -bottom-1 w-[18px] h-[18px] rounded-full items-center justify-center border-2 border-surface"
            style={{ backgroundColor: entry.authorized ? tokens.hex.success : tokens.hex.danger }}
          >
            {entry.authorized ? (
              <I.check size={10} sw={4} color="#fff" />
            ) : (
              <I.x size={10} sw={4} color="#fff" />
            )}
          </View>
        </View>
        <View className="min-w-0 flex-1" style={{ gap: 2 }}>
          <AppText numberOfLines={1} className="font-jakarta-bold text-[14.5px] text-text">
            {entry.name}
          </AppText>
          <Mono className="text-[11px] text-muted">{entry.regId}</Mono>
        </View>
      </View>
      <View className="items-end" style={{ gap: 3 }}>
        <AppText
          className="font-jakarta-bold text-[13px]"
          style={{ color: entry.authorized ? tokens.hex.success : tokens.hex.danger }}
        >
          {entry.authorized ? "Cleared" : money(entry.currency ?? "TZS ", entry.balance)}
        </AppText>
        <Mono className="text-[10.5px] text-muted">
          {showTime ? entry.at : entry.method === "lookup" ? "Lookup" : "Scan"}
        </Mono>
      </View>
    </Pressable>
  );
});
