/* ThemeProvider — owns {accent, theme} and exposes them to the tree.
 *
 * The selected institution's accent and the light/dark switch flow through
 * here. We inject the computed CSS variables with NativeWind's `vars()` on a
 * single wrapper View, so every `bg-accent` / `text-accent-ink` className
 * downstream re-themes from one place — the native analogue of the prototype's
 * `--accent` custom property. The literal hex map is provided for gradients,
 * SVG strokes, and other spots className theming can't reach. */
import React, { createContext, useContext, useMemo, useState } from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import { buildTokens, ThemeName, Tokens } from "./tokens";

const DEFAULT_ACCENT = "#5b54d6";

type ThemeContextValue = {
  accent: string;
  theme: ThemeName;
  setAccent: (hex: string) => void;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  tokens: Tokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [theme, setTheme] = useState<ThemeName>("light");

  const tokens = useMemo(() => buildTokens(accent, theme), [accent, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      accent,
      theme,
      setAccent,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      tokens,
    }),
    [accent, theme, tokens]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[vars(tokens.vars), { flex: 1 }]} className="bg-canvas">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
