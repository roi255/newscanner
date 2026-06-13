/* institutions.ts — bundled institution registry (the "college list").
 *
 * ⚠️ SCAFFOLD. This is the in-bundle source of truth for which OSIM tenants the
 * app can reach. It is the seam that will be replaced by the central directory
 * service (see src/api/osim/directory.ts): once that exists, this file goes away
 * and the list is fetched + cached at runtime instead of shipped in the APK.
 *
 * Provenance: tenant ids/codes were extracted from the OSIM platform's
 * multi-tenant deployment manifests (each is an `osim_<id>` database +
 * `cis_sys_api_app` client). Test/template tenants (demo, institution1, mn2) are
 * intentionally excluded.
 *
 * NOT in this file: the per-tenant API keys. Those are secrets stored inside
 * each tenant's own database — config.ts reads them from an UNTRACKED .env at
 * build time. Tenants with no key are inert (no live scanning) until one lands.
 *
 * PROVISIONAL — confirm before relying on a tenant for live scanning:
 *   • `name`    — entries marked `// TODO confirm` are placeholders (the code).
 *   • `abbr`    — must equal the `org_abbr` the tenant's OSIM returns, or the
 *                 institution-match guard in client.ts rejects the scan. Unknown
 *                 ones default to the uppercased id and need verifying.
 *   • `baseUrl` — defaults to `<id>.osim.cloud`; tenants on a custom domain
 *                 (e.g. makumira) are set explicitly.
 */

export interface TenantInfo {
  id: string; // tenant code — matches the osim_<id> database
  name: string; // display name shown in the institution picker
  short: string; // logo text (≤5 chars)
  abbr: string; // expected org_abbr — confirms we reached the right tenant
  location: string;
  accent: string; // brand accent (hex)
  baseUrl: string; // OSIM base URL (no trailing slash)
}

/** Default OSIM host for a tenant without a custom domain. */
const cloud = (id: string) => `https://${id}.osim.cloud`;

export const TENANTS: TenantInfo[] = [
  // ── Live tenants with keys already provisioned (.env). Keep first so the app
  //    defaults to a working tenant (AppState seeds from TENANTS[0]). ──
  { id: "stemmuco", name: "Stella Maris Mtwara University College", short: "STE", abbr: "STEMMUCO", location: "Mtwara, Tanzania", accent: "#1f6f4a", baseUrl: "https://stemmuco.osim.cloud" },
  { id: "makumira", name: "Tumaini University Makumira", short: "TUMA", abbr: "TUMA", location: "Usa River, Arusha", accent: "#2456b8", baseUrl: "https://osim.makumira.ac.tz" },

  // ── Remaining tenants — keys filled later in .env, names/abbr to confirm. ──
  { id: "ajuco", name: "Archbishop James University College", short: "AJUCO", abbr: "AJUCO", location: "Songea, Ruvuma", accent: "#b8432a", baseUrl: cloud("ajuco") },
  { id: "amucta", name: "Archbishop Mihayo University College of Tabora", short: "AMU", abbr: "AMUCTA", location: "Tabora, Tanzania", accent: "#6d28d9", baseUrl: cloud("amucta") },
  { id: "bugando", name: "Catholic University of Health and Allied Sciences (Bugando)", short: "CUHAS", abbr: "BUGANDO", location: "Mwanza, Tanzania", accent: "#0e7490", baseUrl: cloud("bugando") },
  { id: "carumuco", name: "Cardinal Rugambwa Memorial University College", short: "CRMU", abbr: "CARUMUCO", location: "Bukoba, Kagera", accent: "#be123c", baseUrl: cloud("carumuco") },
  { id: "chatocohest", name: "chatocohest", short: "CHATO", abbr: "CHATOCOHEST", location: "Chato, Geita", accent: "#15803d", baseUrl: cloud("chatocohest") }, // TODO confirm display name
  { id: "dartu", name: "dartu", short: "DART", abbr: "DARTU", location: "Tanzania", accent: "#c2410c", baseUrl: cloud("dartu") }, // TODO confirm display name
  { id: "fhti", name: "fhti", short: "FHTI", abbr: "FHTI", location: "Tanzania", accent: "#7c3aed", baseUrl: cloud("fhti") }, // TODO confirm display name
  { id: "hkmu", name: "Hubert Kairuki Memorial University", short: "HKMU", abbr: "HKMU", location: "Dar es Salaam", accent: "#b91c1c", baseUrl: cloud("hkmu") },
  { id: "kiahs", name: "kiahs", short: "KIAHS", abbr: "KIAHS", location: "Tanzania", accent: "#0f766e", baseUrl: cloud("kiahs") }, // TODO confirm display name
  { id: "kiut", name: "Kampala International University in Tanzania", short: "KIUT", abbr: "KIUT", location: "Dar es Salaam", accent: "#1d4ed8", baseUrl: cloud("kiut") },
  { id: "ksp", name: "ksp", short: "KSP", abbr: "KSP", location: "Tanzania", accent: "#a16207", baseUrl: cloud("ksp") }, // TODO confirm display name
  { id: "lihas", name: "lihas", short: "LIHAS", abbr: "LIHAS", location: "Tanzania", accent: "#0891b2", baseUrl: cloud("lihas") }, // TODO confirm display name
  { id: "mti", name: "mti", short: "MTI", abbr: "MTI", location: "Tanzania", accent: "#9333ea", baseUrl: cloud("mti") }, // TODO confirm display name
  { id: "rhti", name: "rhti", short: "RHTI", abbr: "RHTI", location: "Tanzania", accent: "#ea580c", baseUrl: cloud("rhti") }, // TODO confirm display name
  { id: "saut", name: "St. Augustine University of Tanzania", short: "SAUT", abbr: "SAUT", location: "Mwanza, Tanzania", accent: "#1e40af", baseUrl: cloud("saut") },
  { id: "smmuco", name: "smmuco", short: "SMMU", abbr: "SMMUCO", location: "Tanzania", accent: "#047857", baseUrl: cloud("smmuco") }, // TODO confirm display name
  { id: "socaite", name: "socaite", short: "SOCA", abbr: "SOCAITE", location: "Tanzania", accent: "#7e22ce", baseUrl: cloud("socaite") }, // TODO confirm display name
  { id: "stc", name: "stc", short: "STC", abbr: "STC", location: "Tanzania", accent: "#b45309", baseUrl: cloud("stc") }, // TODO confirm display name
  { id: "sumait", name: "Abdulrahman Al-Sumait University", short: "SUM", abbr: "SUMAIT", location: "Chukwani, Zanzibar", accent: "#065f46", baseUrl: cloud("sumait") },
  { id: "tudarco", name: "Tumaini University Dar es Salaam College", short: "TUDA", abbr: "TUDARCO", location: "Dar es Salaam", accent: "#1e3a8a", baseUrl: cloud("tudarco") },
  { id: "uoa", name: "University of Arusha", short: "UOA", abbr: "UOA", location: "Arusha, Tanzania", accent: "#c026d3", baseUrl: cloud("uoa") },
  { id: "wiarc", name: "wiarc", short: "WIARC", abbr: "WIARC", location: "Tanzania", accent: "#0369a1", baseUrl: cloud("wiarc") }, // TODO confirm display name
];

export function getTenant(id: string): TenantInfo | null {
  return TENANTS.find((t) => t.id === id) ?? null;
}
