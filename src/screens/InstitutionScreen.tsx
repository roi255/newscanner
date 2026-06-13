/* InstitutionScreen — live search over the registered-institution registry.
 * Only registered institutions surface; an unmatched query is a "not registered"
 * empty state. Selecting one scopes branding + staff + roster for the app. */
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
  const query = q.trim().toLowerCase();

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
  const matches = useMemo(
    () =>
      query
        ? institutions.filter((i) =>
            (i.name + " " + i.short + " " + i.location).toLowerCase().includes(query)
          )
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
      <H1>Find your institution</H1>
      <Body className="mt-2 mb-[18px]">
        Search the institutions registered with ExamPass.
      </Body>

      <Field
        iconName="search"
        value={q}
        onChangeText={setQ}
        autoFocus
        placeholder="Search by name or code…"
        className="mb-[18px]"
      />

      {query ? (
        <LabelSm className="mb-2.5">
          {matches.length + " result" + (matches.length === 1 ? "" : "s")}
        </LabelSm>
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

        {query && matches.length === 0 ? (
          <Card className="p-[18px] items-center" style={{ gap: 8, paddingVertical: 34, paddingHorizontal: 24 }}>
            <View className="w-[52px] h-[52px] rounded-md bg-surface-2 items-center justify-center">
              <I.search size={26} color={tokens.hex.muted} />
            </View>
            <AppText className="font-jakarta-bold text-[16px] text-text">No institution found</AppText>
            <Body className="text-[13.5px] text-center" style={{ maxWidth: 230 }}>
              “{q}” isn’t registered with ExamPass yet. Check the spelling or contact your administrator.
            </Body>
          </Card>
        ) : null}

        {!query ? (
          <View className="items-center" style={{ gap: 10, paddingVertical: 30, paddingHorizontal: 24 }}>
            <View className="w-[52px] h-[52px] rounded-md bg-surface-2 items-center justify-center">
              <I.cap size={26} color={tokens.hex.muted} />
            </View>
            <Body className="text-[13.5px] text-center" style={{ maxWidth: 230 }}>
              Start typing to find your institution in the ExamPass registry.
            </Body>
          </View>
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
