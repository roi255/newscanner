/* OtpScreen — email second factor. Shown after the OSIM membership check passes
 * (see verifyMembership). The operator enters the 6-digit code emailed to them
 * (caught by Mailpit in dev; echoed to the Metro/npx console for convenience). */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H1, Body, AppText } from "../components/Typography";
import { Field, Button } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";

export function OtpScreen({
  email,
  onSubmit,
  onResend,
}: {
  email: string;
  onSubmit: (code: string) => Promise<{ ok: boolean; message?: string }>;
  onResend: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const { tokens } = useTheme();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(submitCode: string = code) {
    if (submitting) return;
    if (submitCode.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await onSubmit(submitCode);
    if (!res.ok) {
      setError(res.message || "Incorrect code");
      setCode(""); // clear for a fresh retry; the keyboard stays up
      setSubmitting(false);
    }
    // on success the screen navigates away (Operator) and unmounts
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    const r = await onResend();
    setInfo(r.ok ? "A new code has been sent." : r.message || "Couldn't resend the code");
  }

  return (
    <ScreenScroll contentClassName="px-[22px] pt-4 pb-8 grow">
      <View className="items-center mt-[22px]">
        <View
          className="w-[72px] h-[72px] rounded-lg bg-accent items-center justify-center"
          style={glow(tokens.hex.accent, 0.4, 14, 30)}
        >
          <I.shield size={30} color="#fff" />
        </View>
        <H1 className="mt-[18px] text-[26px] leading-[34px]">Enter your code</H1>
        <Body className="mt-3 text-center" style={{ maxWidth: 280 }}>
          A code was sent to {email}
        </Body>
      </View>

      <View className="flex-1 items-center justify-center" style={{ gap: 16, paddingBottom: 150 }}>
        <Field
          value={code}
          onChangeText={(v) => {
            const next = v.replace(/[^0-9]/g, "").slice(0, 6);
            setCode(next);
            if (error) setError(null);
            if (next.length === 6) handleSubmit(next); // auto-verify on the 6th digit
          }}
          placeholder="000000"
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          editable={!submitting}
          className="w-[260px]"
          inputClassName="text-center font-jakarta-bold"
          style={{
            height: 80,
            paddingVertical: 18,
            fontSize: 30,
            lineHeight: 40,
            letterSpacing: 12,
            textAlign: "center",
            textAlignVertical: "center",
          }}
          onSubmitEditing={() => handleSubmit()}
        />
        {error ? (
          <View className="flex-row items-center justify-center gap-2 px-1">
            <I.alert size={15} color={tokens.hex.danger} />
            <AppText className="text-[12.5px] font-jakarta-semibold text-danger">{error}</AppText>
          </View>
        ) : info ? (
          <AppText className="text-[12.5px] font-jakarta-semibold text-muted text-center px-1">{info}</AppText>
        ) : null}
      </View>

      <View className="pt-2">
        <Button
          title={submitting ? "Verifying…" : "Verify"}
          onPress={() => handleSubmit()}
          disabled={submitting}
          iconRightName={submitting ? undefined : "chevron"}
        />
        <Pressable onPress={handleResend} className="mt-4 items-center" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <AppText className="text-[12.5px] font-jakarta-bold text-accent-ink">Resend code</AppText>
        </Pressable>
      </View>
    </ScreenScroll>
  );
}
