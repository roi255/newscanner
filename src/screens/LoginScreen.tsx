/* LoginScreen — scoped staff credential + PIN. Shows the selected institution
 * with a Change link back to the registry search. */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H1, Body, AppText, LabelSm } from "../components/Typography";
import { Card, Field, Button } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";
import { Institution, Staff } from "../data/exam";

export function LoginScreen({
  institution,
  staff,
  onLogin,
  onChangeInstitution,
}: {
  institution: Institution;
  staff: Staff;
  onLogin: (pin: string) => Promise<{ ok: boolean; message?: string }>;
  onChangeInstitution: () => void;
}) {
  const { tokens } = useTheme();
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await onLogin(pin);
    if (!res.ok) {
      setError(res.message || "Sign-in failed");
      setSubmitting(false);
    }
    // on success the screen navigates away (Sync) and unmounts
  }

  return (
    <ScreenScroll contentClassName="px-[22px] pt-4 pb-8 grow">
      <View className="items-center mt-[22px] mb-[26px]">
        <View
          className="w-[72px] h-[72px] rounded-lg bg-accent items-center justify-center"
          style={glow(tokens.hex.accent, 0.4, 14, 30)}
        >
          <AppText className="text-white font-jakarta-extrabold text-[24px] tracking-[-0.5px]">
            {institution.short}
          </AppText>
        </View>
        <H1 className="mt-[18px] text-[26px]">Sign in</H1>
        <Body className="mt-1.5 text-center" style={{ maxWidth: 250 }}>
          Verify your scanner credentials to continue
        </Body>
      </View>

      <Pressable onPress={onChangeInstitution} className="mb-5" style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <Card className="p-[18px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-sm bg-accent-soft items-center justify-center">
              <I.cap size={20} color={tokens.hex["accent-ink"]} />
            </View>
            <View style={{ gap: 1 }}>
              <LabelSm>Institution</LabelSm>
              <AppText className="font-jakarta-bold text-[14.5px] text-text">{institution.name}</AppText>
            </View>
          </View>
          <AppText className="text-[12.5px] font-jakarta-bold text-accent-ink">Change</AppText>
        </Card>
      </Pressable>

      <View style={{ gap: 13 }}>
        <Field iconName="user" value={staff.id} editable={false} />
        <Field
          iconName="lock"
          value={pin}
          onChangeText={(v) => {
            setPin(v);
            if (error) setError(null);
          }}
          secureTextEntry
          placeholder="PIN"
          onSubmitEditing={handleSubmit}
        />
        {error ? (
          <View className="flex-row items-center gap-2 px-1">
            <I.alert size={15} color={tokens.hex.danger} />
            <AppText className="text-[12.5px] font-jakarta-semibold text-danger flex-1">{error}</AppText>
          </View>
        ) : null}
      </View>

      <View className="mt-auto pt-6">
        <Button
          title={submitting ? "Signing in…" : "Sign in"}
          onPress={handleSubmit}
          disabled={submitting}
          iconRightName={submitting ? undefined : "chevron"}
        />
        <View className="flex-row items-center justify-center gap-2 mt-4">
          <I.shield size={15} color={tokens.hex.muted} />
          <AppText className="text-[12.5px] font-jakarta-semibold text-muted">
            Authenticating against {institution.short}
          </AppText>
        </View>
      </View>
    </ScreenScroll>
  );
}
