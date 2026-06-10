# ExamPass (React Native) — agent guide

React Native (Expo SDK 54) + NativeWind build of the exam-card scanner. See
[`README.md`](./README.md) for run instructions and architecture, and
[`files/AGENTS.md`](./files/AGENTS.md) for the original design prototype this was
ported from (kept as the visual spec).

Expo moves fast — read the exact versioned docs at
https://docs.expo.dev/versions/v54.0.0/ before changing native config or deps.

Quick map:

- `src/AppRoot.tsx` — navigation state machine + cache-first scan logic.
- `src/theme/` — the dynamic-accent + dark-mode token system (replaces the
  prototype's CSS `--accent` / `color-mix` / `oklch`).
- `src/data/exam.ts` — typed mock data; the seams to wire to the real API.
- `src/screens/`, `src/components/` — UI.

Before committing: `npm run typecheck` and (CI-grade) `npx expo export -p android`.
