/* screens.jsx — all app screens (multi-tenant + cache-first) */
const { useState, useEffect, useRef } = React;
const D = () => window.EXAM_DATA;

/* ─────────────────────── INSTITUTION SEARCH ─────────────────────── */
/* Institutions are looked up from the scanner config registry (the SaaS keeps a
   table of registered institutions + access keys). Only registered ones surface. */
function InstitutionScreen({ institutions, onSelect, initialQuery }) {
  const [q, setQ] = useState(initialQuery || "");
  const query = q.trim().toLowerCase();
  const matches = query
    ? institutions.filter((i) =>
        (i.name + " " + i.short + " " + i.location).toLowerCase().includes(query))
    : [];

  return (
    <>
      <StatusBar />
      <div className="view screen-anim">
        <div className="pad" style={{ paddingTop: 26 }}>
          <div className="row" style={{ width: 60, height: 60, borderRadius: 19, background: "var(--accent)", justifyContent: "center", color: "#fff", boxShadow: "0 12px 26px color-mix(in oklch, var(--accent) 38%, transparent)", marginBottom: 18 }}>
            <I.scan size={32} sw={2.1} />
          </div>
          <h1 className="h1">Find your institution</h1>
          <p className="body" style={{ marginTop: 8, marginBottom: 18 }}>
            Search the institutions registered with ExamPass. Pick where you're invigilating today.
          </p>

          {/* live search */}
          <div className="field-wrap" style={{ marginBottom: 18 }}>
            <I.search size={20} />
            <input className="field" value={q} autoFocus
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or code…" />
          </div>

          {query && (
            <div className="label-sm" style={{ marginBottom: 10 }}>
              {matches.length + " result" + (matches.length === 1 ? "" : "s")}
            </div>
          )}

          <div className="col" style={{ gap: 12 }}>
            {matches.map((inst) => (
              <button key={inst.id} onClick={() => onSelect(inst)} style={{ textAlign: "left", width: "100%" }}>
                <div className="card card-pad row between" style={{ gap: 12 }}>
                  <div className="row" style={{ gap: 14, minWidth: 0 }}>
                    <div className="row" style={{ width: 52, height: 52, borderRadius: 16, background: inst.accent, color: "#fff", justifyContent: "center", fontWeight: 800, fontSize: 18, flex: "0 0 auto", letterSpacing: "-0.5px" }}>
                      {inst.short}
                    </div>
                    <div className="col" style={{ gap: 3, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.15 }}>{inst.name}</span>
                      <span className="body" style={{ fontSize: 12.5 }}>{inst.location}</span>
                      <span className="row" style={{ gap: 5, fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 1 }}>
                        <I.user size={13} /> {inst.recordCount.toLocaleString()} students
                      </span>
                    </div>
                  </div>
                  <I.chevron size={20} style={{ color: "var(--muted)", flex: "0 0 auto" }} />
                </div>
              </button>
            ))}

            {query && matches.length === 0 && (
              <div className="card card-pad col" style={{ alignItems: "center", textAlign: "center", gap: 8, padding: "34px 24px" }}>
                <div className="row" style={{ width: 52, height: 52, borderRadius: 16, background: "var(--surface-2)", color: "var(--muted)", justifyContent: "center" }}>
                  <I.search size={26} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>No institution found</span>
                <span className="body" style={{ fontSize: 13.5, maxWidth: 230 }}>
                  “{q}” isn't registered with ExamPass yet. Check the spelling or contact your administrator.
                </span>
              </div>
            )}

            {!query && (
              <div className="col" style={{ alignItems: "center", textAlign: "center", gap: 10, padding: "30px 24px", color: "var(--muted)" }}>
                <div className="row" style={{ width: 52, height: 52, borderRadius: 16, background: "var(--surface-2)", justifyContent: "center" }}>
                  <I.cap size={26} />
                </div>
                <span className="body" style={{ fontSize: 13.5, maxWidth: 230 }}>
                  Start typing to find your institution in the ExamPass registry.
                </span>
              </div>
            )}
          </div>

          <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 24, color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>
            <I.shield size={15} /> Access scoped per institution by the SaaS
          </div>
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

/* ─────────────────────────── LOGIN ─────────────────────────── */
function LoginScreen({ institution, staff, onPickStaff, onLogin, onChangeInstitution }) {
  const [pin, setPin] = useState("••••••");
  return (
    <>
      <StatusBar />
      <div className="view screen-anim">
        <div className="pad" style={{ paddingTop: 16, minHeight: "100%", display: "flex", flexDirection: "column" }}>
          <div className="col" style={{ alignItems: "center", textAlign: "center", marginTop: 22, marginBottom: 26 }}>
            <div className="row" style={{ width: 72, height: 72, borderRadius: 22, background: "var(--accent)", justifyContent: "center", color: "#fff", boxShadow: "0 14px 30px color-mix(in oklch, var(--accent) 40%, transparent)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px" }}>
              {institution.short}
            </div>
            <h1 className="h1" style={{ marginTop: 18, fontSize: 26 }}>Sign in</h1>
            <p className="body" style={{ marginTop: 6, maxWidth: 250 }}>Verify your scanner credentials to continue</p>
          </div>

          {/* selected institution — changeable */}
          <button onClick={onChangeInstitution} style={{ width: "100%", textAlign: "left", marginBottom: 20 }}>
            <div className="card card-pad row between">
              <div className="row" style={{ gap: 12 }}>
                <div className="row" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent-ink)", justifyContent: "center" }}>
                  <I.cap size={20} />
                </div>
                <div className="col" style={{ gap: 1 }}>
                  <span className="label-sm">Institution</span>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{institution.name}</span>
                </div>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent-ink)" }}>Change</span>
            </div>
          </button>

          {/* staff credential (scoped to this institution) */}
          <div className="col" style={{ gap: 13 }}>
            <div className="field-wrap">
              <I.user size={20} />
              <input className="field" value={staff.id} readOnly />
            </div>
            <div className="field-wrap">
              <I.lock size={20} />
              <input className="field" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" />
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 24 }}>
            <button className="btn btn-primary" onClick={onLogin}>Sign in <I.chevron size={20} sw={2.4} /></button>
            <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 16, color: "var(--muted)", fontSize: 12.5, fontWeight: 600 }}>
              <I.shield size={15} /> Authenticating against {institution.short}
            </div>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

/* ─────────────────────────── SYNC / LOADER ─────────────────────────── */
const SYNC_STEPS = [
  "Connecting to institution",
  "Authorizing scanner access",
  "Downloading student records",
  "Caching records for offline use",
  "Ready",
];
function SyncScreen({ institution, onDone, freeze }) {
  const [pct, setPct] = useState(freeze ? 64 : 0);
  useEffect(() => {
    if (freeze) return;
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 9 + 4;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(onDone, 650); }
      setPct(p);
    }, 130);
    return () => clearInterval(iv);
  }, []);
  const step = Math.min(SYNC_STEPS.length - 1, Math.floor((pct / 100) * SYNC_STEPS.length));
  const cached = Math.round((pct / 100) * institution.recordCount);

  return (
    <>
      <StatusBar />
      <div className="view screen-anim" style={{ display: "flex", flexDirection: "column" }}>
        <div className="pad" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {/* spinner ring with institution mark */}
          <div style={{ position: "relative", width: 116, height: 116, marginBottom: 30 }}>
            <svg width="116" height="116" viewBox="0 0 116 116" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="58" cy="58" r="52" fill="none" stroke="var(--accent-softer)" strokeWidth="7" />
              <circle cx="58" cy="58" r="52" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset .13s linear" }} />
            </svg>
            <div style={{ position: "absolute", inset: 18, borderRadius: 22, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>
              {institution.short}
            </div>
          </div>

          <span className="label-sm">{institution.name}</span>
          <h1 className="h1" style={{ fontSize: 26, marginTop: 8 }}>
            {pct >= 100 ? "All set" : "Syncing records"}
          </h1>
          <p className="body" style={{ marginTop: 8, maxWidth: 260 }}>
            {pct >= 100
              ? "Student data is cached on this device for instant, offline scanning."
              : "Caching student metadata so scans resolve instantly — even offline."}
          </p>

          {/* progress */}
          <div style={{ width: "100%", maxWidth: 300, marginTop: 26 }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="row" style={{ gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                {pct >= 100 ? <I.check size={17} style={{ color: "var(--success)" }} /> : <span style={{ width: 8, height: 8, borderRadius: 5, background: "var(--accent)", animation: "pulse 1s infinite" }} />}
                {SYNC_STEPS[step]}
              </span>
              <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ height: 9, borderRadius: 6, background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: pct + "%", background: "var(--accent)", borderRadius: 6, transition: "width .13s linear" }} />
            </div>
            <div className="row between" style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>
              <span className="mono">{cached.toLocaleString()} / {institution.recordCount.toLocaleString()}</span>
              <span>records cached</span>
            </div>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "center", gap: 8, paddingBottom: 30, color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>
          <I.shield size={15} /> Encrypted · clears when you sign out
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

/* ─────────────────────────── SCAN HOME ─────────────────────────── */
function ScanHomeScreen({ session, institution, stats, recent, cacheCount, onScan, onNav, onOpenResult, onChangeSession }) {
  return (
    <>
      <StatusBar />
      <div className="view screen-anim">
        <div className="pad" style={{ paddingTop: 4 }}>
          <div className="row between" style={{ padding: "6px 0 16px" }}>
            <div className="col" style={{ gap: 3 }}>
              <span className="body" style={{ fontSize: 13.5 }}>Good morning,</span>
              <h1 className="h1" style={{ fontSize: 24 }}>{session.invigilator.split(" ")[0]} 👋</h1>
            </div>
            <button className="row" onClick={() => onNav("profile")}><Avatar name={session.invigilator} size={46} /></button>
          </div>

          {/* session card */}
          <div className="card card-pad" style={{ marginBottom: 12, background: "var(--accent)", color: "#fff", boxShadow: "0 14px 30px color-mix(in oklch, var(--accent) 36%, transparent)" }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="pill" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}><span className="dot" style={{ background: "#fff" }} /> Active session</span>
              <button onClick={onChangeSession} className="pill" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", gap: 6, cursor: "pointer" }}>
                <I.edit size={14} /> Change
              </button>
            </div>
            <div className="mono" style={{ fontSize: 12, opacity: 0.85, letterSpacing: "0.5px", marginBottom: 3 }}>{session.code}</div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.15 }}>{session.name}</div>
            <div className="row" style={{ gap: 14, marginTop: 12, opacity: 0.92, fontSize: 12.5, fontWeight: 600, flexWrap: "wrap" }}>
              <span className="row" style={{ gap: 6 }}><I.pin size={15} /> {session.venue}</span>
              <span className="row" style={{ gap: 6 }}><I.calendar size={15} /> {session.date}</span>
              <span className="row" style={{ gap: 6 }}><I.clock size={15} /> {session.time}</span>
            </div>
          </div>

          {/* cache status */}
          <div className="row" style={{ gap: 8, padding: "0 2px 16px", color: "var(--success)", fontSize: 12.5, fontWeight: 700 }}>
            <I.check size={16} sw={2.4} />
            <span style={{ color: "var(--text-2)" }}>{cacheCount.toLocaleString()} records cached · offline-ready</span>
          </div>

          {/* big scan affordance */}
          <button onClick={onScan} style={{ width: "100%", textAlign: "left", display: "block" }}>
            <div className="card" style={{ overflow: "hidden", borderRadius: "var(--r-xl)" }}>
              <div style={{ position: "relative", height: 188, background: "linear-gradient(160deg, #14141b, #25252f)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ViewfinderFrame size={116} />
                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 4px)" }} />
              </div>
              <div className="row between card-pad">
                <div className="col" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: 16.5 }}>Scan examination card</span>
                  <span className="body" style={{ fontSize: 13 }}>Point at the QR code to verify</span>
                </div>
                <div className="row" style={{ width: 48, height: 48, borderRadius: 15, background: "var(--accent)", color: "#fff", justifyContent: "center", flex: "0 0 auto" }}><I.scan size={24} sw={2.1} /></div>
              </div>
            </div>
          </button>

          <div className="row" style={{ gap: 11, margin: "16px 0" }}>
            <StatTile value={stats.total} label="Scanned" tone="neutral" />
            <StatTile value={stats.authorized} label="Authorized" tone="success" />
            <StatTile value={stats.denied} label="Denied" tone="danger" />
          </div>

          <div className="row between" style={{ marginBottom: 10 }}>
            <h2 className="h2" style={{ fontSize: 17 }}>Recent scans</h2>
            <button onClick={() => onNav("history")} style={{ fontSize: 13.5, fontWeight: 700, color: "var(--accent-ink)" }}>See all</button>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            {recent.slice(0, 3).map((e, i) => (
              <React.Fragment key={i}>
                {i > 0 && <hr className="divider" style={{ marginLeft: 64 }} />}
                <LogRow entry={e} onClick={() => onOpenResult(e)} />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

function StatTile({ value, label, tone }) {
  const colors = { neutral: "var(--text)", success: "var(--success)", danger: "var(--danger)" };
  return (
    <div className="card" style={{ flex: 1, padding: "14px 14px 13px" }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", color: colors[tone] }}>{value}</div>
      <div className="label-sm" style={{ marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ViewfinderFrame({ size = 120, scanning }) {
  const corner = (style) => <div style={{ position: "absolute", width: 26, height: 26, borderColor: "#fff", ...style }} />;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {corner({ top: 0, left: 0, borderTop: "3px solid", borderLeft: "3px solid", borderTopLeftRadius: 12 })}
      {corner({ top: 0, right: 0, borderTop: "3px solid", borderRight: "3px solid", borderTopRightRadius: 12 })}
      {corner({ bottom: 0, left: 0, borderBottom: "3px solid", borderLeft: "3px solid", borderBottomLeftRadius: 12 })}
      {corner({ bottom: 0, right: 0, borderBottom: "3px solid", borderRight: "3px solid", borderBottomRightRadius: 12 })}
      {scanning && <div style={{ position: "absolute", left: 6, right: 6, height: 2.5, borderRadius: 3, background: "var(--accent)", boxShadow: "0 0 14px 2px var(--accent)", animation: "scanline 1.5s ease-in-out infinite" }} />}
    </div>
  );
}

/* ─────────────────────────── SCANNING ─────────────────────────── */
function ScanningScreen({ institution, fetchingOnline, onCancel }) {
  return (
    <>
      <StatusBar onDark />
      <div className="view" style={{ background: "#0c0c11" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, #181820, #0c0c11 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 4px)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 30px 30px", color: "#fff" }}>
          <div className="row between" style={{ width: "100%", marginTop: 6 }}>
            <button onClick={onCancel} className="row" style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.12)", color: "#fff", justifyContent: "center" }}><I.x size={22} /></button>
            <button className="row" style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.12)", color: "#fff", justifyContent: "center" }}><I.flash size={20} /></button>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, width: "100%" }}>
            <div style={{ position: "relative" }}>
              <ViewfinderFrame size={228} scanning />
              <div style={{ position: "absolute", inset: 34, borderRadius: 10, opacity: 0.16, background: "conic-gradient(#fff 0 25%, transparent 0 50%, #fff 0 75%, transparent 0)", backgroundSize: "22px 22px" }} />
            </div>
            <div className="col" style={{ alignItems: "center", gap: 8 }}>
              <div className="row" style={{ gap: 9, fontWeight: 700, fontSize: 16 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: "var(--accent)", boxShadow: "0 0 10px var(--accent)", animation: "pulse 1s ease-in-out infinite" }} />
                {fetchingOnline ? "Not in cache — fetching online…" : "Reading QR code…"}
              </div>
              <span style={{ fontSize: 13.5, opacity: 0.6 }}>
                {fetchingOnline ? "Requesting record from the server" : "Matched instantly from local cache"}
              </span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, fontSize: 12.5, opacity: 0.55, fontWeight: 600 }}>
            <I.shield size={15} /> Verifying against {institution.name}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── RESULT ─────────────────────────── */
function ResultScreen({ student, authorized, source, session, onScanNext, onDone }) {
  const M = D().money;
  const cleared = authorized;
  return (
    <>
      <StatusBar onDark={false} />
      <div className="view screen-anim">
        <div className="row between" style={{ padding: "8px 22px 2px" }}>
          <button onClick={onScanNext} className="row" style={{ gap: 5, fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}><I.back size={20} /> Scan</button>
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {/* compact sticky status toast */}
        <div style={{ position: "sticky", top: 6, zIndex: 20, padding: "6px 16px 2px" }}>
          <div className="pop row between" style={{ gap: 10, padding: "11px 13px", borderRadius: "var(--r-md)", background: cleared ? "var(--success)" : "var(--danger)", color: "#fff", boxShadow: cleared ? "0 10px 26px color-mix(in oklch, var(--success) 38%, transparent)" : "0 10px 26px color-mix(in oklch, var(--danger) 38%, transparent)" }}>
            <div className="row" style={{ gap: 12, minWidth: 0 }}>
              <div className="row" style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,0.22)", justifyContent: "center", flex: "0 0 auto" }}>
                {cleared ? <I.check size={21} sw={2.8} /> : <I.x size={21} sw={2.8} />}
              </div>
              <div className="col" style={{ gap: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.2px" }}>{cleared ? "Authorized" : "Not Authorized"}</span>
                <span style={{ fontSize: 12, opacity: 0.92, fontWeight: 600 }}>{cleared ? "Permitted to sit the examination" : "Entry blocked · outstanding balance"}</span>
              </div>
            </div>
            <span className="row" style={{ gap: 5, flex: "0 0 auto", fontSize: 10.5, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: 999 }}>
              {source === "online" ? <I.refresh size={12} /> : <I.flash size={12} />}
              {source === "online" ? "Online" : "Cache"}
            </span>
          </div>
        </div>

        <div className="pad" style={{ paddingTop: 12 }}>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 15 }}>
              <StudentPhoto student={student} size={88} />
              <div className="col" style={{ gap: 4, minWidth: 0, paddingTop: 2 }}>
                <span className="h2" style={{ fontSize: 19, lineHeight: 1.1 }}>{student.name} <span style={{ color: "var(--muted)", fontWeight: 700 }}>({student.gender.charAt(0)})</span></span>
                <span className="mono" style={{ fontSize: 13, color: "var(--text-2)" }}>{student.regId}</span>
                <span className="pill pill-neutral" style={{ marginTop: 6, alignSelf: "flex-start" }}>{student.program}</span>
              </div>
            </div>
          </div>

          <div className="card card-pad row between" style={{ marginBottom: 14, background: cleared ? "var(--success-soft)" : "var(--danger-soft)" }}>
            <div className="row" style={{ gap: 13 }}>
              <div className="row" style={{ width: 44, height: 44, borderRadius: 14, background: cleared ? "var(--success)" : "var(--danger)", color: "#fff", justifyContent: "center" }}><I.wallet size={22} /></div>
              <div className="col" style={{ gap: 1 }}>
                <span className="label-sm">Finance balance</span>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: cleared ? "var(--success)" : "var(--danger)" }}>{M(student.currency, student.balance)}</span>
              </div>
            </div>
            <span className="pill" style={{ background: cleared ? "var(--success)" : "var(--danger)", color: "#fff" }}>{cleared ? "Cleared" : "Owing"}</span>
          </div>

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 14 }}>
              <DetailRow icon={I.id} label="Class" value={student.classCode} mono />
              <DetailRow icon={I.cap} label="Year / Level" value={student.year} />
              <DetailRow icon={I.calendar} label="Semester" value={student.semester} />
              <DetailRow icon={I.pin} label="Venue" value={session.venue.split(" · ")[0]} />
            </div>
          </div>

          {cleared ? (
            <div className="col" style={{ gap: 11 }}>
              <button className="btn btn-primary" onClick={onScanNext}><I.scan size={20} /> Scan next student</button>
              <button className="btn btn-ghost" onClick={onDone}>Done</button>
            </div>
          ) : (
            <div className="col" style={{ gap: 11 }}>
              <button className="btn btn-danger-soft"><I.bell size={20} /> Notify finance office</button>
              <button className="btn btn-ghost"><I.shield size={20} /> Supervisor override</button>
              <button className="btn btn-primary" onClick={onScanNext}><I.scan size={20} /> Scan next student</button>
            </div>
          )}
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

/* ─────────────────────────── LOOKUP ─────────────────────────── */
function LookupScreen({ institution, onVerify, recent, initialQuery }) {
  const [q, setQ] = useState(initialQuery || "");
  const [result, setResult] = useState(() => initialQuery ? D().fetchStudent(institution, initialQuery) : undefined);
  const M = D().money;

  function run(val) {
    const v = (val !== undefined ? val : q).trim();
    if (!v) { setResult(undefined); return; }
    setResult(D().fetchStudent(institution, v));
  }

  return (
    <>
      <StatusBar />
      <div className="view screen-anim">
        <div className="pad" style={{ paddingTop: 4 }}>
          <AppBar title="Manual lookup" sub="When a card won't scan" />
          <p className="body" style={{ marginBottom: 14 }}>Enter the student's registration ID to verify them manually.</p>
          <div className="field-wrap" style={{ marginBottom: 12 }}>
            <I.id size={20} />
            <input className="field" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder={institution.students[0].regId} style={{ fontFamily: "var(--mono)", fontSize: 14.5 }} />
          </div>
          <button className="btn btn-primary" onClick={() => run()} style={{ marginBottom: 18 }}><I.search size={20} /> Verify student</button>

          {result === undefined && (
            <>
              <div className="label-sm" style={{ marginBottom: 10 }}>Suggestions</div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                {institution.students.slice(0, 4).map((s) => (
                  <button key={s.regId} className="chip" onClick={() => { setQ(s.regId); run(s.regId); }}><I.id size={15} /> {s.regId.split("/").slice(-1)[0]}</button>
                ))}
              </div>
              <div className="label-sm" style={{ marginBottom: 10 }}>Recent lookups</div>
              <div className="card" style={{ overflow: "hidden" }}>
                {recent.slice(0, 3).map((e, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <hr className="divider" style={{ marginLeft: 64 }} />}
                    <LogRow entry={e} onClick={() => { setQ(e.regId); run(e.regId); }} />
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {result === null && (
            <div className="card card-pad col" style={{ alignItems: "center", textAlign: "center", gap: 8, padding: "30px 22px" }}>
              <div className="row" style={{ width: 52, height: 52, borderRadius: 16, background: "var(--surface-2)", color: "var(--muted)", justifyContent: "center" }}><I.search size={26} /></div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>No student found</span>
              <span className="body" style={{ fontSize: 13.5 }}>Check the registration ID and try again.</span>
            </div>
          )}

          {result && (
            <div className="card card-pad pop" style={{ marginTop: 2 }}>
              <div className="row" style={{ gap: 14 }}>
                <StudentPhoto student={result} size={70} />
                <div className="col" style={{ gap: 3, minWidth: 0 }}>
                  <span className="h2" style={{ fontSize: 17 }}>{result.name}</span>
                  <span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)" }}>{result.regId}</span>
                  <span className="body" style={{ fontSize: 12.5 }}>{result.program} · {result.year}</span>
                </div>
              </div>
              <hr className="divider" style={{ margin: "14px 0" }} />
              <div className="row between">
                <div className="col" style={{ gap: 1 }}>
                  <span className="label-sm">Balance</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: result.balance <= 0 ? "var(--success)" : "var(--danger)" }}>{M(result.currency, result.balance)}</span>
                </div>
                <span className={"pill " + (result.balance <= 0 ? "pill-success" : "pill-danger")}>{result.balance <= 0 ? <><I.check size={14} /> Eligible</> : <><I.alert size={14} /> Owing</>}</span>
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => onVerify(result)}>Open verification <I.chevron size={18} sw={2.4} /></button>
            </div>
          )}
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

/* ─────────────────────────── HISTORY ─────────────────────────── */
function HistoryScreen({ session, log, onOpenResult }) {
  const [filter, setFilter] = useState("all");
  const filtered = log.filter((e) => filter === "all" || (filter === "auth" ? e.authorized : !e.authorized));
  const authCount = log.filter((e) => e.authorized).length;
  const denyCount = log.length - authCount;
  return (
    <>
      <StatusBar />
      <div className="view screen-anim">
        <div className="pad" style={{ paddingTop: 4 }}>
          <AppBar title="Scan history" sub={session.course} />
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="row between">
              <div className="col" style={{ gap: 2 }}>
                <span className="label-sm">This session</span>
                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px" }}>{log.length} <span style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)" }}>scans</span></span>
              </div>
              <div className="row" style={{ gap: 18 }}>
                <div className="col" style={{ alignItems: "center" }}><span style={{ fontSize: 20, fontWeight: 800, color: "var(--success)" }}>{authCount}</span><span className="label-sm">Cleared</span></div>
                <div className="col" style={{ alignItems: "center" }}><span style={{ fontSize: 20, fontWeight: 800, color: "var(--danger)" }}>{denyCount}</span><span className="label-sm">Denied</span></div>
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            {[["all", "All"], ["auth", "Authorized"], ["deny", "Denied"]].map(([id, label]) => (
              <button key={id} className={"chip" + (filter === id ? " active" : "")} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            {filtered.map((e, i) => (
              <React.Fragment key={i}>
                {i > 0 && <hr className="divider" style={{ marginLeft: 64 }} />}
                <LogRow entry={e} showTime onClick={() => onOpenResult(e)} />
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <div className="col" style={{ alignItems: "center", padding: "34px", color: "var(--muted)", gap: 6 }}><I.history size={28} /> <span style={{ fontWeight: 600, fontSize: 14 }}>Nothing here yet</span></div>
            )}
          </div>
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

function LogRow({ entry, showTime, onClick }) {
  const M = D().money;
  return (
    <button onClick={onClick} className="row between" style={{ width: "100%", textAlign: "left", padding: "13px 16px", gap: 12 }}>
      <div className="row" style={{ gap: 12, minWidth: 0 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={entry.name} size={40} />
          <span className="row" style={{ position: "absolute", right: -3, bottom: -3, width: 18, height: 18, borderRadius: "50%", background: entry.authorized ? "var(--success)" : "var(--danger)", color: "#fff", justifyContent: "center", border: "2px solid var(--surface)" }}>
            {entry.authorized ? <I.check size={10} sw={4} /> : <I.x size={10} sw={4} />}
          </span>
        </div>
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{entry.regId}</span>
        </div>
      </div>
      <div className="col" style={{ alignItems: "flex-end", gap: 3, flex: "0 0 auto" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: entry.authorized ? "var(--success)" : "var(--danger)" }}>{entry.authorized ? "Cleared" : M("$", entry.balance)}</span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{showTime ? entry.at : (entry.method === "lookup" ? "Lookup" : "Scan")}</span>
      </div>
    </button>
  );
}

/* ─────────────────────────── PROFILE ─────────────────────────── */
function ProfileScreen({ session, institution, onLogout, onSwitchInstitution }) {
  return (
    <>
      <StatusBar />
      <div className="view screen-anim">
        <div className="pad" style={{ paddingTop: 4 }}>
          <AppBar title="Profile" />
          <div className="card card-pad row" style={{ gap: 15, marginBottom: 16 }}>
            <Avatar name={session.invigilator} size={62} />
            <div className="col" style={{ gap: 3 }}>
              <span className="h2" style={{ fontSize: 19 }}>{session.invigilator}</span>
              <span className="pill pill-neutral" style={{ alignSelf: "flex-start" }}>{session.invigilatorRole}</span>
              <span className="body" style={{ fontSize: 12.5, marginTop: 2 }}>{institution.name}</span>
            </div>
          </div>

          {/* institution / scope card */}
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="label-sm">Connected institution</span>
              <span className="pill pill-success" style={{ height: 24 }}><span className="dot" style={{ background: "var(--success)" }} /> Synced</span>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <div className="row" style={{ width: 44, height: 44, borderRadius: 13, background: "var(--accent)", color: "#fff", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>{institution.short}</div>
              <div className="col" style={{ gap: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{institution.name}</span>
                <span className="body" style={{ fontSize: 12 }}>{institution.recordCount.toLocaleString()} records cached locally</span>
              </div>
            </div>
            <button className="btn btn-soft btn-sm" style={{ marginTop: 14 }} onClick={onSwitchInstitution}><I.refresh size={18} /> Switch institution</button>
          </div>

          <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
            {[
              { icon: I.cap, label: "Switch exam session", sub: session.course },
              { icon: I.bell, label: "Notifications", sub: "Finance alerts on" },
              { icon: I.shield, label: "Override permissions", sub: "Supervisor PIN required" },
              { icon: I.gear, label: "App settings" },
            ].map((it, i) => {
              const Ico = it.icon;
              return (
                <React.Fragment key={i}>
                  {i > 0 && <hr className="divider" style={{ marginLeft: 60 }} />}
                  <button className="row between" style={{ width: "100%", padding: "14px 16px", textAlign: "left" }}>
                    <div className="row" style={{ gap: 13 }}>
                      <div className="row" style={{ width: 36, height: 36, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent-ink)", justifyContent: "center" }}><Ico size={19} /></div>
                      <div className="col" style={{ gap: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{it.label}</span>
                        {it.sub && <span className="body" style={{ fontSize: 12 }}>{it.sub}</span>}
                      </div>
                    </div>
                    <I.chevron size={19} style={{ color: "var(--muted)" }} />
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <button className="btn btn-ghost" onClick={onLogout} style={{ color: "var(--danger)" }}><I.logout size={20} /> Sign out</button>
          <div className="row" style={{ justifyContent: "center", marginTop: 18, color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>ExamPass · v1.0</div>
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

/* ─────────────────────────── SESSION FORM (sheet) ─────────────────────────── */
function SessionForm({ exam, onSave, onClose }) {
  const [f, setF] = useState({ ...exam });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.code.trim() && f.name.trim();
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="row between" style={{ marginBottom: 4 }}>
          <h2 className="h2">Exam session</h2>
          <button onClick={onClose} className="row" style={{ width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)", justifyContent: "center" }}><I.x size={20} /></button>
        </div>
        <p className="body" style={{ fontSize: 13, marginBottom: 18 }}>These details appear on the scanner home and on every verification.</p>

        <span className="fld-label">Exam code</span>
        <input className="field" style={{ paddingLeft: 16, marginBottom: 13, fontFamily: "var(--mono)", fontSize: 15 }} value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="e.g. CS 304" />

        <span className="fld-label">Exam name</span>
        <input className="field" style={{ paddingLeft: 16, marginBottom: 13 }} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Operating Systems" />

        <div className="row" style={{ gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span className="fld-label">Date</span>
            <input className="field" style={{ paddingLeft: 16, marginBottom: 13 }} value={f.date} onChange={(e) => set("date", e.target.value)} placeholder="29 May 2026" />
          </div>
          <div style={{ flex: 1 }}>
            <span className="fld-label">Time</span>
            <input className="field" style={{ paddingLeft: 16, marginBottom: 13 }} value={f.time} onChange={(e) => set("time", e.target.value)} placeholder="09:00 – 11:00" />
          </div>
        </div>

        <span className="fld-label">Location</span>
        <input className="field" style={{ paddingLeft: 16, marginBottom: 20 }} value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Hall B · Block 2" />

        <button className="btn btn-primary" disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }} onClick={() => valid && onSave(f)}>
          <I.check size={20} /> Save session
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { InstitutionScreen, LoginScreen, SyncScreen, ScanHomeScreen, ScanningScreen, ResultScreen, LookupScreen, HistoryScreen, ProfileScreen, SessionForm });
