# ExamPass — Agent & Developer Guide

A mobile examination-card scanner for higher-learning institutions. Invigilators
scan a student's QR exam card and instantly see the student's photo, identity, and
finance balance, with a clear **Authorized / Not Authorized** decision. The app is
multi-tenant (per institution), caches student metadata locally for fast/offline
scanning, and is built to hook into a SaaS backend API.

This document is the single source of truth for anyone (human or AI agent) picking
up the project.

---

## 1. What this is

- **Platform:** platform-neutral mobile UI, presented inside a phone frame.
- **Tech:** a single-page HTML prototype using React 18 + Babel (in-browser, via
  `<script type="text/babel">`). No build step, no bundler — open `index.html`.
- **Audience of the app:** exam invigilators / proctors.
- **Authorization rule:** a student is authorized to sit the exam **only if their
  finance balance is `0`** (`balance <= 0`).

It is currently a **front-end prototype with mock data**. All data lives in
`data.js` behind functions shaped like the real API so the wiring is a drop-in.

---

## 2. Run it

Open `index.html` in any modern browser. Nothing to install.

- The left **Screens rail** (visible on wide viewports) lets you jump to any screen
  for review. It is a reviewer aid only — not part of the product. Remove the
  `<nav class="rail">` block in `app.jsx` before shipping.
- **Tweaks** (toolbar, if running inside the design host) exposes accent color,
  light/dark, and corner roundness.

### Reference screenshots

`docs/screens/` contains a PNG of every screen and form (login, scan home, the
exam-session form sheet, scanning, authorized & denied results, manual lookup,
history, profile, institution search). The sync/loader screen is included as an
openable HTML snapshot (`docs/screens/12-syncing-loader.html`). Use these as the
visual spec when rebuilding.

---

## 3. File structure

```
index.html        Entry point. Loads fonts, all CSS (design tokens + components),
                  React/Babel, then the app scripts in order.
data.js           Mock data + API-shaped data layer (plain JS, no JSX).
icons.jsx         Minimal line-icon set (functional SVG glyphs).
components.jsx    Shared UI: StatusBar, Avatar, StudentPhoto, DetailRow, TabBar, AppBar.
screens.jsx       All screens + the SessionForm bottom sheet.
tweaks-panel.jsx  Tweaks shell (host protocol + form controls). Vendored helper.
app.jsx           Root component: state, navigation, cache logic, theming, tweaks.
```

**Load order matters** (see bottom of `index.html`): `data.js` →
`tweaks-panel.jsx` → `icons.jsx` → `components.jsx` → `screens.jsx` → `app.jsx`.

Because each `<script type="text/babel">` is transpiled in its own scope, shared
symbols are published to `window` via `Object.assign(window, {...})` at the end of
each file. If you add a component meant to be used elsewhere, export it the same way.

---

## 4. Screen flow

```
Institution search ─▶ Login ─▶ Sync (loader) ─▶ Scan home ─┬─▶ Scanning ─▶ Result
                                                            ├─▶ History
                                                            ├─▶ Lookup ──────▶ Result
                                                            └─▶ Profile ─▶ (switch institution)
```

1. **Institution search** (`InstitutionScreen`) — real-time search over the
   registry of registered institutions. Only registered institutions appear; an
   unmatched query shows a "not registered" empty state. Selecting one scopes the
   whole app (branding + staff + roster).
2. **Login** (`LoginScreen`) — scoped staff credential + PIN. Shows the selected
   institution with a **Change** link back to search.
3. **Sync** (`SyncScreen`) — animated loader that "downloads & caches" the
   institution's student metadata into the local cache, then auto-advances.
4. **Scan home** (`ScanHomeScreen`) — greeting, the **session card** (with a
   **Change** button → `SessionForm`), a cache-status line, the camera
   **placeholder card that starts a scan**, today's stats, and recent scans.
5. **Scanning** (`ScanningScreen`) — viewfinder with animated scan line. Message
   differs for a cache hit ("Matched instantly from local cache") vs a cache miss
   ("Not in cache — fetching online…").
6. **Result** (`ResultScreen`) — compact sticky status toast (Authorized / Not
   Authorized) + a source chip (`Cache` / `Online`), student photo & identity,
   the deciding finance balance, detail grid, and contextual actions.
7. **Lookup** (`LookupScreen`) — manual verification by registration ID when a
   card won't scan.
8. **History** (`HistoryScreen`) — session scan log with filters + counts.
9. **Profile** (`ProfileScreen`) — invigilator, connected institution, switch
   institution, sign out.

Navigation is a single `screen` string in `app.jsx` (`renderScreen()` switch). The
bottom **TabBar** has four items: Home, History, Lookup, Profile.

---

## 5. Data model

Defined in `data.js`. Shapes you must preserve when wiring the API:

### Institution (tenant)
```js
{
  id: "ngu",                       // tenant key
  name: "Northgate University",
  short: "NGU",                    // badge / monogram
  location: "Accra Campus",
  accent: "#5b54d6",               // branding color (drives the whole theme)
  recordCount: 1240,               // total roster size (shown in sync + cache line)
  session: { code, name, venue, date, time },   // default exam session
  staff: [ { id, name, role } ],   // who may authenticate for this tenant
  students: [ Student, ... ]
}
```

### Student (exam-card record)
```js
{
  code: "QR-7731-AX",              // value encoded in the QR
  name, firstName,
  gender, regId, program,
  year, level, seat,
  classCode: "BSC23-SEP",          // class / cohort code (derived from program + level)
  semester: "Semester 2",          // current academic semester
  photo: null,                     // image URL when available
  balance: 0.0, currency: "$",     // balance === 0 ⇒ authorized
  cached: true                     // true = part of the synced offline cache
}
```

> On the result screen the **gender** is shown as an abbreviation after the name
> (e.g. *Amara Okonkwo (F)*) rather than its own cell; the detail grid shows
> **Class · Year/Level · Semester · Venue**.

### Helpers (the seams to replace with real network calls)
```js
EXAM_DATA.INSTITUTIONS                 // GET /institutions  (registry/config table)
EXAM_DATA.getInstitution(id)
EXAM_DATA.fetchStudent(inst, codeOrReg)// GET /students/{code}  (single record)
EXAM_DATA.isAuthorized(student)        // balance <= 0
EXAM_DATA.makeSeedLog(inst)            // demo history seed
EXAM_DATA.money(symbol, n)             // currency formatting
```

---

## 6. Cache-first scanning

The local cache is a `Set` of student `code`s, held in `cacheRef` in `app.jsx`.

- On **sync complete** (`syncDone`): `cacheRef` is filled with every student whose
  `cached !== false`. (In production: the response of
  `GET /institutions/{id}/students`.)
- On **scan** (`startScan`): the next record is checked against `cacheRef`.
  - **Hit** → resolves immediately ("Cache" source).
  - **Miss** → simulates an online fetch (longer delay), then **adds the record to
    the cache** ("Online" source). The demo student `Linda Chukwu`
    (`cached: false`) exists specifically to exercise this path.
- The pending scan uses `scanTimerRef` so cancelling a scan clears the timer (no
  stale result).

> The demo advances through `inst.students` in order via `queueRef`. Replace this
> with a real QR-decode callback that yields a `code`, then call the same lookup.

---

## 7. Theming & branding

All visuals are driven by CSS custom properties in `index.html`:

- `--accent` — the single brand color. **Set automatically from the selected
  institution's `accent`** (see `selectInstitution` in `app.jsx`, which calls
  `setTweak('accent', …)`). All soft tints (`--accent-soft`, `--accent-ink`, …)
  derive from it via `color-mix`, so one value reskins the app.
- Semantic colors: `--success` (authorized), `--danger` (denied).
- `--radius-scale` — global corner roundness multiplier.
- `[data-theme="dark"]` — full dark palette.

Institutions without an explicit brand color simply keep the **default accent**
(`#5b54d6`, a friendly indigo).

**Type:** Plus Jakarta Sans (UI) + Space Mono (IDs / codes / numerals).

---

## 8. Wiring the real SaaS API

Replace the mock helpers in `data.js` with network calls; keep the return shapes.

| App moment | Suggested endpoint | Replaces |
|---|---|---|
| Institution search | `GET /institutions?q=` | `INSTITUTIONS` filter in `InstitutionScreen` |
| Staff login | `POST /auth {institutionId, staffId, pin}` | `onLogin` in `app.jsx` (gate before `sync`) |
| Sync metadata | `GET /institutions/{id}/students` | `cacheRef` fill in `syncDone` |
| Scan / lookup | `GET /students/{code}` | `fetchStudent` (used by `startScan`, `LookupScreen`) |

Notes:
- Each institution carries its own **access key/scope** server-side; the client
  only ever holds the scoped token after login.
- Persist the cache (e.g. IndexedDB) so it survives reloads and works offline;
  `cacheRef` is currently in-memory only.
- `photo` is rendered by `StudentPhoto` / `Avatar` — once the API supplies a URL,
  it shows automatically (placeholder silhouette until then).
- Keep the authorization decision (`isAuthorized`) on the **server** too; the
  client check is a convenience, not a security boundary.

---

## 9. Extending

- **Add an institution:** push an object to `INSTITUTIONS` in `data.js`.
- **Add a screen:** write the component in `screens.jsx`, export it on `window`,
  add a `case` in `renderScreen()`, and (if it's a tab) add it to `TABS` in
  `components.jsx`.
- **Change the authorization rule:** edit `isAuthorized` in `data.js` (e.g. allow a
  threshold, or a manual supervisor override).
- **Add a tweak:** add a key to `TWEAK_DEFAULTS` and a control inside `<TweaksPanel>`
  in `app.jsx`.

---

## 10. Pre-ship checklist

- [ ] Replace mock helpers in `data.js` with real API calls (Section 8).
- [ ] Add real staff authentication + token handling.
- [ ] Persist the local cache (IndexedDB) for true offline use.
- [ ] Wire a real camera + QR decoder into `ScanningScreen`.
- [ ] Remove the reviewer **Screens rail** (`<nav class="rail">`) from `app.jsx`.
- [ ] Precompile JSX (drop in-browser Babel) for production performance.
- [ ] Confirm currency/locale formatting for your region.

---

_Prototype built as an HTML/React design artifact. Single-file-per-concern, no
build step — edit and refresh._
