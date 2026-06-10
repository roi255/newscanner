/* app.jsx — state, navigation, multi-tenant scope, local cache, theming */
const { useState: useS, useRef: useR, useEffect: useE } = React;

const ACCENTS = ["#5b54d6", "#7a2e3a", "#1f6f4a", "#2456b8", "#0e7c86", "#b06a16"];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#5b54d6",
  "theme": "light",
  "roundness": 1
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const data = window.EXAM_DATA;

  // Optional capture/boot override: localStorage.__demo = {screen, result, sheet, lookup}
  // Lets the app render directly into any screen for documentation screenshots.
  const boot = (() => { try { return JSON.parse(localStorage.getItem("__demo") || "null"); } catch (e) { return null; } })();

  const [screen, setScreen] = useS(boot && boot.screen ? boot.screen : "institution");
  const [tab, setTab] = useS(boot && ["history", "lookup", "profile"].includes(boot.screen) ? boot.screen : "scan");
  const [inst, setInst] = useS(data.INSTITUTIONS[0]);     // selected tenant
  const [staff, setStaff] = useS(data.INSTITUTIONS[0].staff[0]);
  const [result, setResult] = useS(() => {
    if (boot && boot.result) {
      const s = data.INSTITUTIONS[0].students.find((x) => boot.result === "deny" ? x.balance > 0 : x.balance <= 0);
      return { student: s, authorized: boot.result !== "deny", source: "cache" };
    }
    return null;
  });
  const [scanState, setScanState] = useS({ fetchingOnline: false });
  const [exam, setExam] = useS(() => ({ ...data.INSTITUTIONS[0].session }));   // editable exam-session details
  const [editingSession, setEditingSession] = useS(boot ? !!boot.sheet : false);
  const [log, setLog] = useS(() => data.makeSeedLog(data.INSTITUTIONS[0]));

  const queueRef = useR(0);
  const scanTimerRef = useR(null);
  // Local cache of records synced to the device — drives cache-first lookups.
  const cacheRef = useR(new Set(data.INSTITUTIONS[0].students.filter((s) => s.cached).map((s) => s.code)));

  /* theming */
  useE(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--radius-scale", String(t.roundness));
    document.documentElement.setAttribute("data-theme", t.theme === "dark" ? "dark" : "light");
  }, [t.accent, t.roundness, t.theme]);

  /* capture mode: hide reviewer rail + scale device to fit for clean screenshots */
  useE(() => {
    if (!boot || !boot.shot) return;
    const s = document.createElement("style");
    s.textContent = "*,*::before,*::after{animation:none!important;transition:none!important} .screen-anim,.pop,.sheet,.sheet-scrim{opacity:1!important;transform:none!important} .rail{display:none!important} .stage{gap:0!important;justify-content:center!important;}";
    document.head.appendChild(s);
    document.documentElement.style.zoom = "0.62";
  }, []);

  const session = {
    code: exam.code, name: exam.name, venue: exam.venue, date: exam.date, time: exam.time,
    course: exam.code + " — " + exam.name,
    institution: inst.name,
    invigilator: staff.name,
    invigilatorRole: staff.role,
    currency: "$",
  };

  /* ---- tenant selection (scopes branding + staff) ---- */
  function selectInstitution(next) {
    setInst(next);
    setStaff(next.staff[0]);
    setExam({ ...next.session });
    setTweak("accent", next.accent);          // branding comes from the institution
    setScreen("login");
  }

  /* ---- sync complete: hydrate local cache + history ---- */
  function syncDone() {
    queueRef.current = 0;
    cacheRef.current = new Set(inst.students.filter((s) => s.cached).map((s) => s.code));
    setLog(data.makeSeedLog(inst));
    setTab("scan");
    setScreen("scan");
  }

  /* ---- cache-first scan flow ---- */
  function startScan() {
    const list = inst.students;
    const student = list[queueRef.current % list.length];
    queueRef.current += 1;
    const inCache = cacheRef.current.has(student.code);
    setScanState({ fetchingOnline: !inCache });
    setScreen("scanning");
    const delay = inCache ? 1500 : 2600;   // online fetch takes a touch longer
    clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      if (!inCache) cacheRef.current.add(student.code);   // newly fetched record is now cached
      const authorized = data.isAuthorized(student);
      const source = inCache ? "cache" : "online";
      setResult({ student, authorized, source });
      setLog((prev) => [{
        regId: student.regId, name: student.name, gender: student.gender,
        balance: student.balance, authorized, seat: student.seat, method: "scan", source,
        at: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev]);
      setScreen("result");
    }, delay);
  }

  function openResultFor(arg) {
    const student = arg.student || data.fetchStudent(inst, arg.regId);
    if (!student) return;
    const source = cacheRef.current.has(student.code) ? "cache" : "online";
    setResult({ student, authorized: data.isAuthorized(student), source });
    setScreen("result");
  }

  function cancelScan() {
    clearTimeout(scanTimerRef.current);
    setScreen("scan");
  }

  function navTab(id) { setTab(id); setScreen(id); }

  const stats = {
    total: log.length,
    authorized: log.filter((e) => e.authorized).length,
    denied: log.filter((e) => !e.authorized).length,
  };

  const showTabs = ["scan", "history", "lookup", "profile"].includes(screen);

  function renderScreen() {
    switch (screen) {
      case "institution":
        return <InstitutionScreen institutions={data.INSTITUTIONS} onSelect={selectInstitution} initialQuery={boot && boot.search ? boot.search : ""} />;
      case "login":
        return <LoginScreen institution={inst} staff={staff} onPickStaff={setStaff}
          onLogin={() => setScreen("sync")} onChangeInstitution={() => setScreen("institution")} />;
      case "sync":
        return <SyncScreen institution={inst} onDone={syncDone} freeze={boot && boot.shot} />;
      case "scan":
        return <ScanHomeScreen session={session} institution={inst} stats={stats} recent={log}
          cacheCount={inst.recordCount} onScan={startScan} onNav={navTab} onOpenResult={openResultFor}
          onChangeSession={() => setEditingSession(true)} />;
      case "scanning":
        return <ScanningScreen institution={inst} fetchingOnline={scanState.fetchingOnline} onCancel={cancelScan} />;
      case "result":
        return <ResultScreen student={result.student} authorized={result.authorized} source={result.source}
          session={session} onScanNext={startScan} onDone={() => { setScreen("scan"); setTab("scan"); }} />;
      case "lookup":
        return <LookupScreen institution={inst} recent={log} initialQuery={boot && boot.lookup ? boot.lookup : ""} onVerify={(s) => openResultFor({ student: s })} />;
      case "history":
        return <HistoryScreen session={session} log={log} onOpenResult={openResultFor} />;
      case "profile":
        return <ProfileScreen session={session} institution={inst}
          onLogout={() => setScreen("institution")} onSwitchInstitution={() => setScreen("institution")} />;
      default:
        return null;
    }
  }

  /* reviewer rail */
  const RAIL = [
    ["institution", "Institution", "01"],
    ["login", "Login", "02"],
    ["sync", "Syncing", "03"],
    ["scan", "Scan home", "04"],
    ["scanning", "Scanning", "05"],
    ["__auth", "Authorized", "06"],
    ["__deny", "Denied", "07"],
    ["lookup", "Manual lookup", "08"],
    ["history", "Scan history", "09"],
    ["profile", "Profile", "10"],
  ];
  function railGo(key) {
    if (key === "__auth") { const s = inst.students.find((x) => x.balance <= 0); setResult({ student: s, authorized: true, source: "cache" }); setScreen("result"); return; }
    if (key === "__deny") { const s = inst.students.find((x) => x.balance > 0); setResult({ student: s, authorized: false, source: "cache" }); setScreen("result"); return; }
    setScreen(key);
    if (["scan", "history", "lookup", "profile"].includes(key)) setTab(key);
  }
  const railActive = (key) => {
    if (key === "__auth") return screen === "result" && result && result.authorized;
    if (key === "__deny") return screen === "result" && result && !result.authorized;
    return screen === key;
  };

  return (
    <div className="stage">
      <nav className="rail" aria-label="Screens">
        <h4>Screens</h4>
        {RAIL.map(([key, label, num]) => (
          <button key={key} className={railActive(key) ? "active" : ""} onClick={() => railGo(key)}>
            {label}<span className="rk">{num}</span>
          </button>
        ))}
      </nav>

      <div className="device" data-screen-label={"Screen: " + screen}>
        <div className="screen">
          {renderScreen()}
          {showTabs && <TabBar active={tab} onNav={navTab} />}
          {editingSession && (
            <SessionForm exam={exam}
              onSave={(e) => { setExam(e); setEditingSession(false); }}
              onClose={() => setEditingSession(false)} />
          )}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Branding" />
        <TweakColor label="Institution accent" value={t.accent} options={ACCENTS} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakSlider label="Corner roundness" value={t.roundness} min={0.4} max={1.5} step={0.1} onChange={(v) => setTweak("roundness", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
