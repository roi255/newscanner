# ExamPass — Examination Card Scanner (React Native)

A multi-tenant mobile exam-card scanner for invigilators. Scan a student's QR
exam card and instantly get an **Authorized / Not Authorized** verdict. A student
is authorized **only if their finance balance is `0`** (`balance <= 0`).

This is the **React Native (Expo) + NativeWind** build, ported from the HTML/React
design prototype in [`files/`](./files) (kept as the visual spec).

---

## Run it

```bash
npm install
npx expo start          # then press a / i, or scan the QR with Expo Go / a dev client
```

Camera QR scanning (`expo-camera`) needs a **device or a dev build**. On the
Scanning screen, if camera permission isn't granted you get a permission prompt
plus a **"Simulate a scan"** fallback that cycles the demo roster — so the full
flow is reviewable without a printed card or camera.

Useful scripts:

```bash
npm run typecheck       # tsc --noEmit
npx expo export -p android   # full Metro/NativeWind bundle (CI-style verification)
npx expo-doctor
```

---

## Screen flow

```
Institution search ─▶ Login ─▶ Sync ─▶ Scan home ─┬─▶ Scanning ─▶ Result
                                                   ├─▶ History
                                                   ├─▶ Lookup ──────▶ Result
                                                   └─▶ Profile ─▶ (switch institution)
```

Navigation uses **React Navigation** — a native stack (Institution → Login →
Sync → Main → Scanning → Result) with a bottom-tab `Main`
(Home · History · Lookup · Profile). This gives the native iOS edge swipe-back
and correct Android back for free. Shared state + the cache-first scan flow live
in an `AppState` context; navigation is driven via a `navigationRef`, and thin
route wrappers in `RootNavigator` bind context + navigation to the
presentational screens.

---

## Architecture

```
App.tsx                  Fonts + providers + themed NavigationContainer.
src/state/AppState.tsx   Multi-tenant scope, local cache, cache-first scan flow.
src/navigation/          RootNavigator (stack+tabs), route wrappers, navigationRef,
                         BottomTabBar (custom-styled tab bar).
src/data/exam.ts         Typed mock data + API-shaped helpers (the seams to wire).
src/types.ts             SessionVM view-model.
src/theme/
  color.ts               oklch↔rgb + OKLab mixing (replaces CSS color-mix/oklch).
  tokens.ts              Builds the full token set for {accent, theme}.
  ThemeProvider.tsx      Injects tokens via NativeWind vars(); accent + dark mode.
  util.ts                boxShadow helpers (sm/md/lg + colored glow).
src/components/
  icons.tsx              Line-icon set on react-native-svg.
  Typography.tsx         H1/H2/Body/LabelSm/Mono wrappers (RN Text needs fonts).
  ui.tsx                 Card, Button, Pill, Chip, Field, Avatar, StudentPhoto,
                         DetailRow, StatTile, ViewfinderFrame, AppBar.
  Screen.tsx             Safe-area + padded ScrollView scaffold.
src/screens/             One file per screen + SessionForm sheet + shared LogRow.
```

### Theming (one accent reskins everything)

The prototype drives its whole palette from a single `--accent` CSS variable and
derives every tint with `color-mix(in oklch, …)`. There's no CSS in React Native,
so the same maths runs in JS:

- `tailwind.config.js` defines semantic colors as `rgb(var(--token) / <alpha>)`.
- `ThemeProvider` computes the token values for the selected institution's accent
  and the light/dark theme (`buildTokens` → OKLab mixing → "R G B" triples) and
  injects them with NativeWind's `vars()` on one wrapper View.
- Picking an institution calls `setAccent(inst.accent)`; the whole app re-themes.
- Dark mode is a real toggle in Profile (`useTheme().toggleTheme`).

### Cache-first scanning

`cacheRef` (a `Set` of student `code`s) is hydrated on sync from every `cached`
student. On a scan: **hit** → resolves instantly (`Cache` source); **miss** →
simulates an online fetch (longer delay) then adds the record to the cache
(`Online` source). The demo student `Linda Chukwu` (`cached: false`) exercises the
miss path.

---

## OSIM integration (`src/api/osim/`)

Scaffolded layer that talks to the real OSIM exam-permit API (modelled on
`osim/application/controllers/apiapp.php`). Dormant until a connection is set —
the app stays on mock data otherwise.

- **Institution verification** — one OSIM deployment = one institution. A
  connection is `{ baseUrl, apiKey, abbr }`. On connect, `verifyInstitution()`
  checks the server's `org_abbr` matches the selected tenant and **blocks the
  session on mismatch** (so you can't scan against the wrong institution).
- **Request envelope + checksum** — `{ token, checksum, requestData }` with
  `checksum = sha1(md5(token + json_encode(requestData)))`, PHP-compatible
  (slash-escaped) so server-side recomputation agrees.
- **Authorization rule** — a student is authorized iff they can print the exam
  permit. `eligibility.ts` ports that rule (registration confirmed + fee/payment-
  plan thresholds) from `data_examination_cards_semester.php`. Best path: OSIM
  exposes an endpoint returning the verdict (`client.getExamPermit`).
- **Access log** — every request+response is recorded (mirrors
  `cis_sys_api_request_log`); viewable in **Profile → Access log**.

### Key management (multi-institution)

The app ships **no institution secrets** and never holds a long-lived key.

1. **Directory** (`directory.ts`) — central table of `institution → { name, abbr,
   baseUrl }` (all **non-secret**). Powers search and tells the app how to reach
   the chosen tenant. Point it via `configureDirectory({ baseUrl, appToken })`;
   resolved connections are cached in the device secure store (`secureStore.ts`).
2. **Staff login mints the token** (`session.ts`) — the invigilator signs in
   (staff id + PIN); the server returns a **short-lived `accessToken` + a
   `refreshToken`**. The access token is the envelope token for data calls; it's
   **auto-rotated** when near expiry or on a `401`, using the refresh token
   (which itself rotates). The login response's `org_abbr` must match the
   selected institution — that's the cryptographic "correct client" gate.
3. **Secure, scoped, revocable** — tokens live only in the Keychain/Keystore,
   scoped per institution. Sign-out best-effort revokes server-side and wipes the
   device (`clearScopedConnections`).
4. **Dev static config** (`config.ts`) — local-testing fallback that may carry a
   raw `apiKey` (no rotation); **must stay empty in shipped builds**.

**Server endpoints expected** (per OSIM deployment):

| Endpoint | Body | Returns |
|---|---|---|
| `POST /osimapp/staff/login` | `{ staffId, pin, deviceId }` | `{ accessToken, refreshToken, expiresIn, instid, instabbr, instname }` |
| `POST /osimapp/staff/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken, expiresIn }` |
| `POST /osimapp/staff/logout` | `{ refreshToken }` | revoke (optional) |
| `GET  /institutions/{id}/connection` | — (directory) | `{ baseUrl, abbr }` |

Data calls (`student/basicInformation`, `examination/permit`, `identity`) take
the access token in the envelope `token` + a `Bearer` header.

## Wiring the real SaaS API

Replace the helpers in `src/data/exam.ts`, keeping the return shapes:

| App moment        | Endpoint                          | Replaces                         |
| ----------------- | --------------------------------- | -------------------------------- |
| Institution search| `GET /institutions?q=`            | `INSTITUTIONS` filter            |
| Staff login       | `POST /auth {institutionId,…}`    | `login` in `AppState`            |
| Sync metadata     | `GET /institutions/{id}/students` | `cacheRef` fill in `syncDone`    |
| Scan / lookup     | `GET /students/{code}`            | `fetchStudent`                   |

Notes: persist the cache (e.g. AsyncStorage) for true offline use, keep the
authorization decision (`isAuthorized`) on the server too, and supply `photo`
URLs to light up `StudentPhoto`/`Avatar`.
