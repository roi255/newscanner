/* SyncScreen — animated loader that "downloads & caches" the institution's
 * student metadata, then auto-advances to the scan home. */
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { H1, Body, AppText, LabelSm, Mono } from "../components/Typography";
import { InstitutionLogo } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { Institution } from "../data/exam";

const SYNC_STEPS = [
  "Connecting to institution",
  "Authorizing scanner access",
  "Downloading student records",
  "Caching records for offline use",
  "Ready",
];

const R = 52;
const CIRC = 2 * Math.PI * R;

export function SyncScreen({
  institution,
  onDone,
  auto = true,
  cachedCount,
}: {
  institution: Institution;
  onDone: () => void;
  /** auto=true (mock): fake progress that auto-advances. auto=false (OSIM):
   * the real sync runs in the parent; we hold near-complete until it calls onDone. */
  auto?: boolean;
  cachedCount?: number;
}) {
  const { tokens } = useTheme();
  const [pct, setPct] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 9 + 4;
      if (p >= 100) {
        if (auto) {
          p = 100;
          clearInterval(iv);
          if (!doneRef.current) {
            doneRef.current = true;
            setTimeout(onDone, 650);
          }
        } else {
          p = 92; // OSIM: hold near-complete; parent advances on real completion
        }
      }
      setPct(p);
    }, 130);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const complete = auto && pct >= 100;
  const step = Math.min(SYNC_STEPS.length - 1, Math.floor((pct / 100) * SYNC_STEPS.length));
  const cached = cachedCount != null ? cachedCount : Math.round((pct / 100) * institution.recordCount);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-[22px]">
        {/* progress ring with institution mark */}
        <View className="mb-[30px]" style={{ width: 116, height: 116 }}>
          <Svg width={116} height={116} viewBox="0 0 116 116" style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
            <Circle cx={58} cy={58} r={R} fill="none" stroke={tokens.hex["accent-softer"]} strokeWidth={7} />
            <Circle
              cx={58}
              cy={58}
              r={R}
              fill="none"
              stroke={tokens.hex.accent}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct / 100)}
            />
          </Svg>
          <View className="absolute items-center justify-center" style={{ top: 18, left: 18, right: 18, bottom: 18 }}>
            <InstitutionLogo short={institution.short} logo={institution.logo} size={80} radius={22} textSize={22} />
          </View>
        </View>

        <LabelSm>{institution.name}</LabelSm>
        <H1 className="text-[26px] mt-2">{complete ? "All set" : "Syncing records"}</H1>
        <Body className="mt-2 text-center" style={{ maxWidth: 260 }}>
          {complete
            ? "Student data is cached on this device for instant, offline scanning."
            : "Caching student metadata so scans resolve instantly — even offline."}
        </Body>

        {/* progress */}
        <View className="w-full mt-[26px]" style={{ maxWidth: 300 }}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              {complete ? (
                <I.check size={17} color={tokens.hex.success} />
              ) : (
                <View className="w-2 h-2 rounded-full bg-accent" />
              )}
              <AppText className="text-[13.5px] font-jakarta-bold text-text">{SYNC_STEPS[step]}</AppText>
            </View>
            <Mono className="text-[12.5px] text-muted">{Math.round(pct)}%</Mono>
          </View>
          <View className="h-[9px] rounded-xs bg-surface-2 overflow-hidden">
            <View className="h-full bg-accent rounded-xs" style={{ width: `${pct}%` }} />
          </View>
          <View className="flex-row items-center justify-between mt-2.5">
            <Mono className="text-[11.5px] text-muted">
              {cachedCount != null
                ? cached.toLocaleString()
                : `${cached.toLocaleString()} / ${institution.recordCount.toLocaleString()}`}
            </Mono>
            <AppText className="text-[11.5px] font-jakarta-semibold text-muted">records cached</AppText>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-center gap-2 pb-6">
        <I.shield size={15} color={tokens.hex.muted} />
        <AppText className="text-[12px] font-jakarta-semibold text-muted">
          Encrypted · clears when you sign out
        </AppText>
      </View>
    </SafeAreaView>
  );
}
