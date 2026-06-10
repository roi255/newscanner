/* Screen — common scroll scaffold (safe-area top + padded ScrollView).
 * The OS provides the real status bar and home indicator, so the prototype's
 * faux chrome is dropped here. */
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ScreenScroll({
  children,
  contentClassName = "px-[22px] pt-1 pb-6",
}: {
  children?: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={contentClassName}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
