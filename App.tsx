import "./global.css";
import React, { useMemo } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SpaceMono_400Regular, SpaceMono_700Bold } from "@expo-google-fonts/space-mono";

import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { AppStateProvider, useAppState } from "./src/state/AppState";
import { navigationRef } from "./src/navigation/navigationRef";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { SessionForm } from "./src/screens/SessionForm";

/* Global session-edit sheet, overlaid above the navigator. */
function GlobalSessionForm() {
  const { editingSession, exam, saveExam, closeSessionForm } = useAppState();
  return <SessionForm visible={editingSession} exam={exam} onSave={saveExam} onClose={closeSessionForm} />;
}

function NavRoot() {
  const { theme, tokens } = useTheme();
  const base = theme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = useMemo<Theme>(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        background: tokens.hex.bg,
        card: tokens.hex.surface,
        text: tokens.hex.text,
        primary: tokens.hex.accent,
        border: tokens.hex.line,
        notification: tokens.hex.accent,
      },
    }),
    [base, tokens]
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <AppStateProvider>
        <RootNavigator />
        <GlobalSessionForm />
      </AppStateProvider>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#eef0f2" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
