/* SessionForm — bottom-sheet to set the exam session: exam code, exam type,
 * semester, venue, and real date + time pickers (parseable values, not free
 * text). These drive the scan (exam_category / semester fallback) + logs. */
import React, { useState } from "react";
import { View, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H2, Body, AppText } from "../components/Typography";
import { Button, Chip } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { Session } from "../data/exam";
import { EXAM_TYPES } from "../api/osim";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <AppText className="text-[12px] font-jakarta-bold text-text-2 mb-1.5 tracking-[0.2px]">{children}</AppText>;
}

const inputCls =
  "w-full h-14 bg-surface rounded-md border-[1.5px] border-line px-4 text-text font-jakarta text-[16px] mb-3";

function toDate(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso || "Select date"
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function toTime(t: string): Date {
  const m = (t || "").match(/(\d{1,2}):(\d{2})/);
  const d = new Date();
  if (m) d.setHours(+m[1], +m[2], 0, 0);
  return d;
}
function fmtTime(t: string): string {
  const m = (t || "").match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : t || "Select time";
}

export function SessionForm({
  visible,
  exam,
  onSave,
  onClose,
}: {
  visible: boolean;
  exam: Session;
  onSave: (s: Session) => void;
  onClose: () => void;
}) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<Session>(exam);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  React.useEffect(() => {
    if (visible) setF(exam);
  }, [visible, exam]);

  const set = (k: keyof Session, v: string) => setF((p) => ({ ...p, [k]: v }));
  const valid = !!f.code.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(20,16,30,0.5)" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-bg"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" }}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 24 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="w-[38px] h-[5px] rounded-xs bg-line-strong self-center mb-4" />
              <View className="flex-row items-center justify-between mb-1">
                <H2>Exam session</H2>
                <Pressable onPress={onClose} className="w-9 h-9 rounded-sm bg-surface-2 items-center justify-center">
                  <I.x size={20} color={tokens.hex.text} />
                </Pressable>
              </View>
              <Body className="text-[13px] mb-[18px]">
                Set the exam being scanned. The card’s QR overrides these per student.
              </Body>

              <FieldLabel>Exam code</FieldLabel>
              <TextInput
                className={`${inputCls} font-mono text-[15px]`}
                value={f.code}
                onChangeText={(v) => set("code", v)}
                placeholder="e.g. CS 304"
                placeholderTextColor={tokens.hex.muted}
                autoCapitalize="characters"
              />

              <FieldLabel>Exam type</FieldLabel>
              <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
                {EXAM_TYPES.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    active={(f.examCategory || "fe") === c.value}
                    onPress={() => set("examCategory", c.value)}
                  />
                ))}
              </View>

              <FieldLabel>Semester</FieldLabel>
              <View className="flex-row mb-3" style={{ gap: 8 }}>
                {["1", "2"].map((s) => (
                  <Chip key={s} label={`Semester ${s}`} active={(f.semester || "1") === s} onPress={() => set("semester", s)} />
                ))}
              </View>

              <View className="flex-row" style={{ gap: 12 }}>
                <View className="flex-1">
                  <FieldLabel>Date</FieldLabel>
                  <Pressable onPress={() => setShowDate(true)} className={`${inputCls} justify-center`}>
                    <AppText className="text-[16px] text-text">{fmtDate(f.date)}</AppText>
                  </Pressable>
                </View>
                <View className="flex-1">
                  <FieldLabel>Time</FieldLabel>
                  <Pressable onPress={() => setShowTime(true)} className={`${inputCls} justify-center`}>
                    <AppText className="text-[16px] text-text">{fmtTime(f.time)}</AppText>
                  </Pressable>
                </View>
              </View>

              {showDate ? (
                <DateTimePicker
                  value={toDate(f.date)}
                  mode="date"
                  onChange={(_e, selected) => {
                    setShowDate(Platform.OS === "ios");
                    if (selected) set("date", selected.toISOString().slice(0, 10));
                  }}
                />
              ) : null}
              {showTime ? (
                <DateTimePicker
                  value={toTime(f.time)}
                  mode="time"
                  is24Hour
                  onChange={(_e, selected) => {
                    setShowTime(Platform.OS === "ios");
                    if (selected)
                      set(
                        "time",
                        `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}`
                      );
                  }}
                />
              ) : null}

              <FieldLabel>Venue</FieldLabel>
              <TextInput
                className={`${inputCls} mb-5`}
                value={f.venue}
                onChangeText={(v) => set("venue", v)}
                placeholder="e.g. Main Hall"
                placeholderTextColor={tokens.hex.muted}
              />

              <Button title="Save session" iconName="check" disabled={!valid} onPress={() => valid && onSave(f)} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
