/* InstitutionScreen — live search over the registered-institution registry.
 * Only registered institutions surface; an unmatched query is a "not registered"
 * empty state. Selecting one scopes branding + staff + roster for the app. */
import React, { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
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
  onSelect: (inst: Institution) => void;
}) {
  const { tokens } = useTheme();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
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
        Search the institutions registered with ExamPass. Pick where you're invigilating today.
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
          <Pressable key={inst.id} onPress={() => onSelect(inst)} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
            <Card className="p-[18px] flex-row items-center justify-between" style={{ gap: 12 }}>
              <View className="flex-row items-center gap-3.5 min-w-0 flex-1">
                <InstitutionLogo short={inst.short} logo={inst.logo} size={52} radius={18} bg={inst.accent} textSize={18} />

                <View className="min-w-0 flex-1" style={{ gap: 3 }}>
                  <AppText className="font-jakarta-bold text-[15.5px] leading-[18px] text-text">{inst.name}</AppText>
                  <Body className="text-[12.5px]">{inst.location}</Body>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <I.user size={13} color={tokens.hex.muted} />
                    <AppText className="text-[11.5px] font-jakarta-semibold text-muted">
                      {inst.recordCount.toLocaleString()} students
                    </AppText>
                  </View>
                </View>
              </View>
              <I.chevron size={20} color={tokens.hex.muted} />
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
              “{q}” isn't registered with ExamPass yet. Check the spelling or contact your administrator.
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
