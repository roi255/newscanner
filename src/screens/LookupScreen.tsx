/* LookupScreen — manual verification by registration ID when a card won't scan. */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H2, Body, AppText, LabelSm, Mono } from "../components/Typography";
import { Card, Field, Button, Chip, Divider, Pill, StudentPhoto } from "../components/ui";
import { AppBar } from "../components/ui";
import { LogRow } from "./LogRow";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { Institution, LogEntry, Student, money } from "../data/exam";

export function LookupScreen({
  institution,
  recent,
  onVerify,
  onLookup,
}: {
  institution: Institution;
  recent: LogEntry[];
  onVerify: (s: Student) => void;
  onLookup: (q: string) => Student | null;
}) {
  const { tokens } = useTheme();
  const [q, setQ] = useState("");
  // undefined = no search yet, null = not found, Student = found
  const [result, setResult] = useState<Student | null | undefined>(undefined);

  function run(val?: string) {
    const v = (val !== undefined ? val : q).trim();
    if (!v) {
      setResult(undefined);
      return;
    }
    setResult(onLookup(v));
  }

  return (
    <ScreenScroll contentClassName="px-[22px] pt-1 pb-6">
      <AppBar title="Manual lookup" sub="When a card won't scan" />
      <Body className="mb-3.5">Enter the student's registration ID to verify them manually.</Body>

      <Field
        iconName="id"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => run()}
        placeholder={institution.students[0]?.regId ?? "Registration ID"}
        className="mb-3"
        inputClassName="font-mono text-[14.5px]"
        autoCapitalize="characters"
      />
      <Button title="Verify student" onPress={() => run()} iconName="search" className="mb-[18px]" />

      {result === undefined ? (
        <>
          <LabelSm className="mb-2.5">Suggestions</LabelSm>
          <View className="flex-row flex-wrap mb-[22px]" style={{ gap: 8 }}>
            {institution.students.slice(0, 4).map((s) => (
              <Chip
                key={s.regId}
                iconName="id"
                label={s.regId.split("/").slice(-1)[0]}
                onPress={() => {
                  setQ(s.regId);
                  run(s.regId);
                }}
              />
            ))}
          </View>
          <LabelSm className="mb-2.5">Recent lookups</LabelSm>
          <Card className="overflow-hidden">
            {recent.slice(0, 3).map((e, i) => (
              <View key={i}>
                {i > 0 ? <View className="h-px bg-line ml-16" /> : null}
                <LogRow
                  entry={e}
                  onPress={() => {
                    setQ(e.regId);
                    run(e.regId);
                  }}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {result === null ? (
        <Card className="p-[18px] items-center" style={{ gap: 8, paddingVertical: 30, paddingHorizontal: 22 }}>
          <View className="w-[52px] h-[52px] rounded-md bg-surface-2 items-center justify-center">
            <I.search size={26} color={tokens.hex.muted} />
          </View>
          <AppText className="font-jakarta-bold text-[16px] text-text">No student found</AppText>
          <Body className="text-[13.5px]">Check the registration ID and try again.</Body>
        </Card>
      ) : null}

      {result ? (
        <Card className="p-[18px] mt-0.5">
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <StudentPhoto student={result} size={70} />
            <View className="min-w-0 flex-1" style={{ gap: 3 }}>
              <H2 className="text-[17px]">{result.name}</H2>
              <Mono className="text-[12.5px] text-text-2">{result.regId}</Mono>
              <Body className="text-[12.5px]">
                {result.program} · {result.year}
              </Body>
            </View>
          </View>
          <Divider className="my-3.5" />
          <View className="flex-row items-center justify-between">
            <View style={{ gap: 1 }}>
              <LabelSm>Balance</LabelSm>
              <AppText
                className="font-jakarta-extrabold text-[18px]"
                style={{ color: result.balance <= 0 ? tokens.hex.success : tokens.hex.danger }}
              >
                {money(result.currency, result.balance)}
              </AppText>
            </View>
            {result.balance <= 0 ? (
              <Pill className="bg-success-soft">
                <I.check size={14} color={tokens.hex.success} />
                <AppText className="text-success font-jakarta-bold text-[12.5px] ml-1.5">Eligible</AppText>
              </Pill>
            ) : (
              <Pill className="bg-danger-soft">
                <I.alert size={14} color={tokens.hex.danger} />
                <AppText className="text-danger font-jakarta-bold text-[12.5px] ml-1.5">Owing</AppText>
              </Pill>
            )}
          </View>
          <Button
            title="Open verification"
            onPress={() => onVerify(result)}
            size="sm"
            iconRightName="chevron"
            className="mt-4"
          />
        </Card>
      ) : null}
    </ScreenScroll>
  );
}
