/* InstitutionScreen — connect by pre-shared institution ID.
 * The registry is never browsable: the search resolves only on an exact match
 * of the 6-character institution ID shared with the institution by ExamPass.
 * Anything else is a "not found" empty state. Selecting one scopes branding +
 * staff + roster for the app. */
import React, { useMemo, useState } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H1, Body, AppText, LabelSm } from "../components/Typography";
import { Card, Field, InstitutionLogo } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";
import { Institution } from "../data/exam";

export function InstitutionScreen({
  institutions,
  onSelect,
}: {
  institutions: Institution[];
  onSelect: (inst: Institution) => Promise<{ ok: boolean; message?: string }> | void;
}) {
  const { tokens } = useTheme();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errId, setErrId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState("");
  // The institution ID is the only key: 6-char, case-insensitive, ignore spaces.
  const query = q.replace(/\s+/g, "").toUpperCase();

  async function handleSelect(inst: Institution) {
    if (busyId) return; // ignore taps while a registration check is in flight
    setBusyId(inst.id);
    setErrId(null);
    const res = await onSelect(inst);
    setBusyId(null);
    if (res && !res.ok) {
      setErrId(inst.id);
      setErrMsg(res.message || "This institution is unavailable.");
    }
  }
  // Exact match only — a partial ID resolves to nothing, so the list is never
  // browsable by name. The full ID (6 chars) yields the one institution or none.
  const matches = useMemo(
    () =>
      query.length >= 6
        ? institutions.filter((i) => (i.connectId || "").toUpperCase() === query)
        : [],
    [query, institutions]
  );

  return (
    <ScreenScroll contentClassName="px-[22px] pt-7 pb-8">
      <View
        className="w-[60px] h-[60px] rounded-[19px] bg-accent items-center justify-center mb-[18px]"
        style={glow(tokens.hex.accent, 0.38, 12, 26)}
      >
        <I.scan size={32} sw={2.1} color="#fff" />
      </View>
      <H1>Connect your institution</H1>
      <Body className="mt-2 mb-[18px]">
        Enter your institution ID code.
      </Body>

      <Field
        iconName="search"
        value={q}
        onChangeText={setQ}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        placeholder="Institution ID"
        className="mb-[18px]"
        inputClassName="tracking-[2px] uppercase"
      />

      {query.length >= 6 && matches.length ? (
        <LabelSm className="mb-2.5">Institution found</LabelSm>
      ) : null}

      <View style={{ gap: 12 }}>
        {matches.map((inst) => (
          <Pressable
            key={inst.id}
            onPress={() => handleSelect(inst)}
            disabled={!!busyId}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
          >
            <Card className="p-[18px]" style={{ gap: errId === inst.id ? 12 : 0 }}>
              <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
                <View className="flex-row items-center gap-3.5 min-w-0 flex-1">
                  <InstitutionLogo short={inst.short} logo={inst.logo} size={52} radius={18} bg={inst.accent} textSize={18} />

                  <View className="min-w-0 flex-1" style={{ gap: 5 }}>
                    <AppText className="font-jakarta-bold text-[15.5px] leading-[21px] text-text">{inst.name}</AppText>
                    <Body className="text-[12.5px]">{inst.location}</Body>
                  </View>
                </View>
                {busyId === inst.id ? (
                  <ActivityIndicator size="small" color={tokens.hex.accent} />
                ) : (
                  <I.chevron size={20} color={tokens.hex.muted} />
                )}
              </View>
              {errId === inst.id ? (
                <View className="flex-row items-start gap-2">
                  <I.shield size={14} color={tokens.hex.danger} />
                  <Body className="text-[12.5px] flex-1" style={{ color: tokens.hex.danger }}>
                    {errMsg}
                  </Body>
                </View>
              ) : null}
            </Card>
          </Pressable>
        ))}

        {query.length >= 6 && matches.length === 0 ? (
          <Card className="p-[18px] items-center" style={{ gap: 8, paddingVertical: 34, paddingHorizontal: 24 }}>
            <View className="w-[52px] h-[52px] rounded-md bg-surface-2 items-center justify-center">
              <I.search size={26} color={tokens.hex.muted} />
            </View>
            <AppText className="font-jakarta-bold text-[16px] text-text">No institution found</AppText>
            <Body className="text-[13.5px] text-center" style={{ maxWidth: 230 }}>
              No institution matches the ID “{query}”. Check it with your administrator.
            </Body>
          </Card>
        ) : null}
      </View>

      <View className="flex-row items-center justify-center gap-2 mt-6">
        <I.shield size={15} color={tokens.hex.muted} />
        <AppText className="text-[12px] font-jakarta-semibold text-muted">
          Access scoped per institution by the SaaS
        </AppText>
      </View>
    </ScreenScroll>
  );
}
