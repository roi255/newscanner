/* ResultScreen — verdict toast (Authorized / Not Authorized) + source chip,
 * student identity, the deciding finance balance, detail grid, and actions. */
import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H2, AppText, LabelSm, Mono } from "../components/Typography";
import { Card, Pill, Button, StudentPhoto, DetailRow } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";
import { Student, ScanSource, money } from "../data/exam";
import { SessionVM } from "../types";

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function ResultScreen({
  student,
  authorized,
  source,
  session,
  onScanNext,
  onDone,
}: {
  student: Student;
  authorized: boolean;
  source: ScanSource;
  session: SessionVM;
  onScanNext: () => void;
  onDone: () => void;
}) {
  const { tokens } = useTheme();
  const cleared = authorized;
  const accentColor = cleared ? tokens.hex.success : tokens.hex.danger;
  const [modulesOpen, setModulesOpen] = useState(false);
  const modules = student.registeredModules ?? [];
  // The exam category from the scan verdict (e.g. "fe"); fall back to the
  // session's selected type if the verdict carried the clearance placeholder.
  const rawCat = student.examCategory && student.examCategory.toLowerCase() !== "clearance_card"
    ? student.examCategory
    : session.examCategory;
  const examCat = (rawCat || "").toUpperCase();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      {/* top bar */}
      <View className="flex-row items-center justify-between px-[22px] pt-2 pb-0.5">
        <Pressable onPress={onScanNext} className="flex-row items-center gap-1.5">
          <I.back size={20} color={tokens.hex["text-2"]} />
          <AppText className="text-[14px] font-jakarta-bold text-text-2">Scan</AppText>
        </Pressable>
        <Mono className="text-[12px] text-muted">{nowTime()}</Mono>
      </View>

      {/* verdict toast (pinned above the scroll) */}
      <View className="px-4 pt-1.5 pb-0.5">
        <View
          className="flex-row items-center justify-between rounded-md px-3 py-[11px]"
          style={[{ backgroundColor: accentColor, gap: 10 }, glow(accentColor, 0.38, 10, 26)]}
        >
          <View className="flex-row items-center gap-3 min-w-0 flex-1">
            <View
              className="w-9 h-9 rounded-sm items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
            >
              {cleared ? <I.check size={21} sw={2.8} color="#fff" /> : <I.x size={21} sw={2.8} color="#fff" />}
            </View>
            <View className="min-w-0 flex-1" style={{ gap: 1 }}>
              <AppText className="text-white font-jakarta-extrabold text-[15.5px] tracking-[-0.2px]">
                {cleared ? "Authorized" : "Not Authorized"}
              </AppText>
              <AppText className="text-white font-jakarta-semibold text-[12px]" style={{ opacity: 0.92 }}>
                {cleared ? "Permitted to sit the examination" : "Entry blocked · outstanding balance"}
              </AppText>
            </View>
          </View>
          <View
            className="flex-row items-center gap-1.5 px-2 py-1 rounded-pill"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {source === "online" ? <I.refresh size={12} color="#fff" /> : <I.flash size={12} color="#fff" />}
            <AppText className="text-white font-jakarta-bold text-[10.5px]">
              {source === "online" ? "Online" : "Cache"}
            </AppText>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="px-[22px] pt-3 pb-8">
        {/* identity */}
        <Card className="p-[18px] mb-3.5">
          <View className="flex-row items-center" style={{ gap: 15 }}>
            <StudentPhoto student={student} size={88} />
            <View className="flex-1 min-w-0 pt-0.5" style={{ gap: 4 }}>
              <H2 className="text-[19px] leading-[25px]">
                {student.name} <AppText className="text-muted font-jakarta-bold">({student.gender.charAt(0)})</AppText>
              </H2>
              <Mono className="text-[13px] text-text-2">{student.regId}</Mono>
              {student.admissionStatus ? (
                <Pill className="bg-accent-soft self-start mt-1.5">
                  <AppText className="text-accent-ink font-jakarta-bold text-[12px]">
                    {student.admissionStatus}
                  </AppText>
                </Pill>
              ) : null}
              <View className="bg-surface-2 self-start rounded-pill px-3 py-1.5 max-w-full">
                <AppText className="text-text-2 font-jakarta-bold text-[12.5px] leading-[16px]" numberOfLines={2}>
                  {student.program}
                </AppText>
              </View>
            </View>
          </View>
        </Card>

        {/* finance balance — the deciding figure */}
        <Card
          className="p-[18px] mb-3.5 flex-row items-center justify-between"
          style={{ backgroundColor: cleared ? tokens.hex["success-soft"] : tokens.hex["danger-soft"] }}
        >
          <View className="flex-row items-center" style={{ gap: 13 }}>
            <View
              className="w-11 h-11 rounded-sm items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <I.wallet size={22} color="#fff" />
            </View>
            <View style={{ gap: 1 }}>
              <LabelSm>Finance balance</LabelSm>
              <AppText
                className="font-jakarta-extrabold text-[22px] tracking-[-0.5px]"
                style={{ color: accentColor }}
              >
                {money(student.currency, student.balance)}
              </AppText>
            </View>
          </View>
          <Pill style={{ backgroundColor: accentColor }}>
            <AppText className="text-white font-jakarta-bold text-[12.5px]">{cleared ? "Cleared" : "Owing"}</AppText>
          </Pill>
        </Card>

        {/* detail grid */}
        <Card className="p-[18px] mb-4">
          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2">
              <DetailRow iconName="id" label="Class" value={student.classCode} mono />
            </View>
            <View className="w-1/2 pr-2">
              <DetailRow iconName="cap" label="Year / Level" value={student.year} />
            </View>
            <View className="w-1/2 pr-2">
              <DetailRow iconName="calendar" label="Semester" value={student.semester} />
            </View>
            <View className="w-1/2 pr-2">
              <DetailRow iconName="pin" label="Venue" value={session.venue.split(" · ")[0]} />
            </View>
          </View>
        </Card>

        {/* exam category + collapsible registered-modules table */}
        {examCat ? (
          <View className="mb-4">
            <Pressable onPress={() => setModulesOpen((o) => !o)}>
              <Card className="p-[16px] flex-row items-center justify-between">
                <AppText className="font-jakarta-bold text-[15px] text-text">Exam: {examCat}</AppText>
                <I.chevron
                  size={20}
                  color={tokens.hex.muted}
                  style={{ transform: [{ rotate: modulesOpen ? "90deg" : "0deg" }] }}
                />
              </Card>
            </Pressable>
            {modulesOpen ? (
              <Card className="mt-2 overflow-hidden">
                {modules.length > 0 ? (
                  modules.map((m, i) => (
                    <View key={i}>
                      {i > 0 ? <View className="h-px bg-line" /> : null}
                      <View className="flex-row items-center px-4 py-2.5" style={{ gap: 12 }}>
                        <Mono className="text-[12px] text-text-2" style={{ width: 78 }}>
                          {m.module_code}
                        </Mono>
                        <AppText className="text-[13px] text-text flex-1">{m.module_title}</AppText>
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="px-4 py-3.5">
                    <AppText className="text-[13px] text-muted">No registered modules</AppText>
                  </View>
                )}
              </Card>
            ) : null}
          </View>
        ) : null}

        {/* actions */}
        {cleared ? (
          <View style={{ gap: 11 }}>
            <Button title="Scan next student" onPress={onScanNext} iconName="scan" />
            <Button title="Done" onPress={onDone} variant="ghost" />
          </View>
        ) : (
          <View style={{ gap: 11 }}>
            <Button title="Notify finance office" variant="danger-soft" iconName="bell" />
            <Button title="Supervisor override" variant="ghost" iconName="shield" />
            <Button title="Scan next student" onPress={onScanNext} iconName="scan" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
