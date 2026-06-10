/* components.jsx — shared UI building blocks */

function StatusBar({ onDark }) {
  return (
    <div className={"statusbar" + (onDark ? " on-dark" : "")}>
      <div className="notch" />
      <span>9:41</span>
      <div className="sb-right">
        <I.signal size={17} />
        <I.wifi size={16} />
        <I.battery size={24} />
      </div>
    </div>
  );
}

function HomeIndicator({ onDark }) {
  return <div className={"home-ind" + (onDark ? " on-dark" : "")} />;
}

/* Avatar — photo placeholder (silhouette). Swap for <img src={photo}> when API supplies one. */
function Avatar({ name, size = 48, photo, square }) {
  const r = square ? "var(--r-md)" : "50%";
  return (
    <div className="photo-ph" style={{ width: size, height: size, borderRadius: r }}>
      {photo
        ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <I.user size={Math.round(size * 0.5)} sw={1.7} style={{ opacity: 0.85 }} />}
    </div>
  );
}

/* Big student photo for result screens */
function StudentPhoto({ student, size = 96 }) {
  return (
    <div style={{ position: "relative", flex: "0 0 auto" }}>
      <div className="photo-ph" style={{ width: size, height: size, borderRadius: "var(--r-lg)" }}>
        {student.photo
          ? <img src={student.photo} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (
            <div className="col" style={{ alignItems: "center", gap: 6 }}>
              <I.user size={Math.round(size * 0.42)} sw={1.5} style={{ opacity: 0.8 }} />
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: 0.5, opacity: 0.7 }}>PHOTO</span>
            </div>
          )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Ico, label, value, mono, valueColor }) {
  return (
    <div className="row" style={{ gap: 13, padding: "11px 0" }}>
      <div className="row" style={{ width: 34, height: 34, borderRadius: 11, background: "var(--surface-2)", color: "var(--text-2)", justifyContent: "center", flex: "0 0 auto" }}>
        <Ico size={18} />
      </div>
      <div className="col" style={{ gap: 1, minWidth: 0 }}>
        <span className="label-sm">{label}</span>
        <span className={mono ? "mono" : ""} style={{ fontSize: mono ? 14 : 15.5, fontWeight: 700, color: valueColor || "var(--text)", letterSpacing: mono ? "-0.3px" : 0 }}>{value}</span>
      </div>
    </div>
  );
}

const TABS = [
  { id: "scan", label: "Home", icon: I.scan },
  { id: "history", label: "History", icon: I.history },
  { id: "lookup", label: "Lookup", icon: I.keypad },
  { id: "profile", label: "Profile", icon: I.user },
];

function TabBar({ active, onNav }) {
  return (
    <div className="tabbar">
      {TABS.map((t) => {
        const Ico = t.icon;
        return (
          <button key={t.id} className={"tab" + (active === t.id ? " active" : "")} onClick={() => onNav(t.id)}>
            <Ico size={23} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Top app bar used inside scrolling screens */
function AppBar({ title, sub, onBack, right }) {
  return (
    <div className="row between" style={{ padding: "6px 0 14px", gap: 12 }}>
      <div className="row" style={{ gap: 10, minWidth: 0 }}>
        {onBack && (
          <button className="row" onClick={onBack} style={{ width: 40, height: 40, borderRadius: 13, background: "var(--surface)", justifyContent: "center", boxShadow: "var(--shadow-sm)", flex: "0 0 auto" }}>
            <I.back size={22} />
          </button>
        )}
        <div className="col" style={{ minWidth: 0 }}>
          <h2 className="h2" style={{ lineHeight: 1.1 }}>{title}</h2>
          {sub && <span className="body" style={{ fontSize: 13, marginTop: 2 }}>{sub}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { StatusBar, HomeIndicator, Avatar, StudentPhoto, DetailRow, TabBar, AppBar, TABS });
