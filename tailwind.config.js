/** @type {import('tailwindcss').Config} */

// Semantic colours resolve to CSS variables that hold an "R G B" triple.
// The ThemeProvider injects the live values via NativeWind's `vars()` so a
// single institution accent (and the light/dark switch) reskins everything —
// exactly like the `--accent` + color-mix system in the web prototype.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: withVar("--bg"),
        canvas: withVar("--canvas"),
        surface: withVar("--surface"),
        "surface-2": withVar("--surface-2"),
        text: withVar("--text"),
        "text-2": withVar("--text-2"),
        muted: withVar("--muted"),
        line: withVar("--line"),
        "line-strong": withVar("--line-strong"),
        success: withVar("--success"),
        "success-soft": withVar("--success-soft"),
        danger: withVar("--danger"),
        "danger-soft": withVar("--danger-soft"),
        warn: withVar("--warn"),
        accent: withVar("--accent"),
        "accent-soft": withVar("--accent-soft"),
        "accent-softer": withVar("--accent-softer"),
        "accent-ink": withVar("--accent-ink"),
      },
      fontFamily: {
        jakarta: ["PlusJakartaSans_400Regular"],
        "jakarta-medium": ["PlusJakartaSans_500Medium"],
        "jakarta-semibold": ["PlusJakartaSans_600SemiBold"],
        "jakarta-bold": ["PlusJakartaSans_700Bold"],
        "jakarta-extrabold": ["PlusJakartaSans_800ExtraBold"],
        mono: ["SpaceMono_400Regular"],
        "mono-bold": ["SpaceMono_700Bold"],
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "30px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
