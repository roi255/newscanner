/* OperatorScreen — confirm who is operating this session. Reached after the
 * email-membership gate, so the name/phone arrive prefilled from the verified
 * staff record; the operator just confirms (and can fix the phone) before the
 * details get stamped on every scan log. */
import React, { useState } from "react";
import { View } from "react-native";
import { ScreenScroll } from "../components/Screen";
import { H1, Body, AppText, LabelSm } from "../components/Typography";
import { Field, Button, InstitutionLogo } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { glow } from "../theme/util";
import { Institution } from "../data/exam";

export function OperatorScreen({
  institution,
  initialName = "",
  initialPhone = "",
  onStart,
}: {
  institution: Institution;
  initialName?: string;
  initialPhone?: string;
  onStart: (name: string, phone: string) => void;
}) {
  const { tokens } = useTheme();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const valid = name.trim().length > 1;

  return (
    <ScreenScroll contentClassName="px-[22px] pt-4 pb-8 grow">
      <View className="items-center mt-[22px] mb-[26px]">
        <View style={glow(tokens.hex.accent, 0.4, 14, 30)}>
          <InstitutionLogo short={institution.short} logo={institution.logo} size={72} radius={24} textSize={24} />
        </View>
        <H1 className="mt-[18px] text-[26px]">Start scanning</H1>
        <Body className="mt-1.5 text-center" style={{ maxWidth: 280 }}>
          {institution.name}
        </Body>
      </View>

      <LabelSm className="mb-2.5">Confirm who is operating this session</LabelSm>
      <View style={{ gap: 13 }}>
        <Field iconName="user" value={name} onChangeText={setName} placeholder="Operator name" autoCapitalize="words" />
        <Field
          iconName="bell"
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View className="flex-row items-center gap-2 mt-3 px-1">
        <I.shield size={15} color={tokens.hex.muted} />
        <Body className="text-[12.5px] flex-1">
          Your name &amp; phone are stamped on every scan log.
        </Body>
      </View>

      <View className="mt-auto pt-6">
        <Button
          title="Start scanning"
          onPress={() => valid && onStart(name.trim(), phone.trim())}
          disabled={!valid}
          iconRightName="scan"
        />
      </View>
    </ScreenScroll>
  );
}
