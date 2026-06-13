/* LoginScreen — institution-scoped access gate. The operator enters the email
 * they use on OSIM; we verify it belongs to a registered staff member of the
 * selected institution (api/staff/all) before letting them in. No password —
 * this confirms membership, not identity (see verifyMembership in AppState). */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H1, Body, AppText, LabelSm } from "../components/Typography";
import { Card, Field, Button, InstitutionLogo } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";
import { Institution } from "../data/exam";

export function LoginScreen({
  institution,
  onVerify,
  onChangeInstitution,
}: {
  institution: Institution;
  onVerify: (email: string) => Promise<{ ok: boolean; message?: string }>;
  onChangeInstitution: () => void;
}) {
  const { tokens } = useTheme();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    if (!email.trim()) {
      setError("Enter the email address you use on OSIM");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await onVerify(email.trim());
    if (!res.ok) {
      setError(res.message || "Verification failed");
      setSubmitting(false);
    }
    // on success the screen navigates away (Operator) and unmounts
  }

  return (
    <ScreenScroll contentClassName="px-[22px] pt-4 pb-8 grow">
      <View className="items-center mt-[22px] mb-[26px]">
        <View style={glow(tokens.hex.accent, 0.4, 14, 30)}>
          <InstitutionLogo short={institution.short} logo={institution.logo} size={72} radius={24} textSize={24} />
        </View>
        <H1 className="mt-[18px] text-[26px]">Verify access</H1>
        <Body className="mt-1.5 text-center" style={{ maxWidth: 260 }}>
          Enter the email you use on OSIM to continue
        </Body>
      </View>

      <Pressable onPress={onChangeInstitution} className="mb-5" style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <Card className="p-[18px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-sm bg-accent-soft items-center justify-center">
              <I.cap size={20} color={tokens.hex["accent-ink"]} />
            </View>
            <View style={{ gap: 1 }} className="flex-1">
              <LabelSm>Institution</LabelSm>
              <AppText className="font-jakarta-bold text-[14.5px] text-text">{institution.name}</AppText>
            </View>
          </View>
          <AppText className="text-[12.5px] font-jakarta-bold text-accent-ink underline ml-3 shrink-0">Change</AppText>
        </Card>
      </Pressable>

      <View style={{ gap: 13 }}>
        <Field
          iconName="user"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (error) setError(null);
          }}
          placeholder="name@institution.ac.tz"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
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
          title={submitting ? "Verifying…" : "Continue"}
          onPress={handleSubmit}
          disabled={submitting}
          iconRightName={submitting ? undefined : "chevron"}
        />
        <View className="flex-row items-center justify-center gap-2 mt-4">
          <I.shield size={15} color={tokens.hex.muted} />
          <AppText className="text-[12.5px] font-jakarta-semibold text-muted">
            Checking the {institution.short} staff directory
          </AppText>
        </View>
      </View>
    </ScreenScroll>
  );
}
