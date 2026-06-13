/* BottomTabBar — custom tab bar for @react-navigation/bottom-tabs, reusing the
 * prototype's visual style (Home · History · Lookup · Profile). */
import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { AppText } from "../components/Typography";
import { I, IconName } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";

const META: Record<string, { label: string; icon: IconName }> = {
  Home: { label: "Home", icon: "scan" },
  History: { label: "History", icon: "history" },
  Profile: { label: "Configurations", icon: "gear" },
};

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-stretch border-t border-line bg-surface px-3.5 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {state.routes.map((route, index) => {
        const meta = META[route.name];
        if (!meta) return null;
        const Glyph = I[meta.icon];
        const isActive = state.index === index;
        const color = isActive ? tokens.hex.accent : tokens.hex.muted;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} className="flex-1 items-center py-1.5" style={{ gap: 4 }}>
            <Glyph size={24} color={color} />
            <AppText numberOfLines={1} className={`text-[10.5px] font-jakarta-bold ${isActive ? "text-accent" : "text-muted"}`}>
              {meta.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
