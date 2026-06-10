/* icons.jsx — minimal line-icon set (functional UI glyphs) */
const Icon = ({ d, size = 24, sw = 1.9, fill = "none", style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  scan: (p) => <Icon {...p}><path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M20 16v2a2 2 0 0 1-2 2h-2" /><path d="M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></Icon>,
  history: (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" /></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Icon>,
  user: (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" /></Icon>,
  check: (p) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>,
  checkBig: (p) => <Icon {...p} sw={2.4}><path d="M20 6 9 17l-5-5" /></Icon>,
  x: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>,
  xBig: (p) => <Icon {...p} sw={2.4}><path d="M18 6 6 18M6 6l12 12" /></Icon>,
  chevron: (p) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>,
  back: (p) => <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>,
  lock: (p) => <Icon {...p}><rect x="5" y="11" width="14" height="9" rx="2.4" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>,
  mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></Icon>,
  id: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="8.5" cy="11" r="2.2" /><path d="M5.5 16.5c.4-1.6 1.6-2.4 3-2.4s2.6.8 3 2.4" /><path d="M14 9.5h4M14 12.5h4M14 15.5h2.5" /></Icon>,
  pin: (p) => <Icon {...p}><path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.4" /></Icon>,
  wallet: (p) => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.3" fill="currentColor" stroke="none" /></Icon>,
  seat: (p) => <Icon {...p}><path d="M6 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2l1 8H5l1-8Z" /><path d="M4 13h13a2 2 0 0 1 2 2v3" /><path d="M5 18v2M17 18v2" /></Icon>,
  gender: (p) => <Icon {...p}><circle cx="10" cy="13" r="5" /><path d="m14 9 5-5M15 4h4v4" /></Icon>,
  cap: (p) => <Icon {...p}><path d="M2 8.5 12 4l10 4.5-10 4.5L2 8.5Z" /><path d="M6 10.6V15c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4.4" /><path d="M22 8.5V14" /></Icon>,
  calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>,
  clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  bell: (p) => <Icon {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></Icon>,
  shield: (p) => <Icon {...p}><path d="M12 3 5 6v5c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6l-7-3Z" /></Icon>,
  flash: (p) => <Icon {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></Icon>,
  keypad: (p) => <Icon {...p}><circle cx="6" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="18" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="6" cy="18" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" /><circle cx="18" cy="18" r="1.4" fill="currentColor" stroke="none" /></Icon>,
  gear: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Icon>,
  logout: (p) => <Icon {...p}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5M21 12H9" /></Icon>,
  signal: (p) => <Icon {...p} fill="currentColor" sw={0}><rect x="2" y="9" width="3" height="5" rx="1" /><rect x="7" y="6" width="3" height="8" rx="1" /><rect x="12" y="3" width="3" height="11" rx="1" /><rect x="17" y="3" width="3" height="11" rx="1" opacity="0.35" /></Icon>,
  wifi: (p) => <Icon {...p}><path d="M2 8.5a15 15 0 0 1 20 0" /><path d="M5 12a10 10 0 0 1 14 0" /><path d="M8.5 15.5a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></Icon>,
  battery: (p) => <Icon {...p} sw={1.4}><rect x="2" y="7" width="18" height="10" rx="3" /><rect x="4" y="9" width="13" height="6" rx="1.5" fill="currentColor" stroke="none" /><path d="M22 10v4" /></Icon>,
  plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  refresh: (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" /></Icon>,
  alert: (p) => <Icon {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" /></Icon>,
  edit: (p) => <Icon {...p}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m13.5 6.5 3 3" /></Icon>,
};

window.Icon = Icon;
window.I = I;
