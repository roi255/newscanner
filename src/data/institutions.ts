/* institutions.ts — bundled institution registry (the "college list").
 *
 * ⚠️ SCAFFOLD. This is the in-bundle source of truth for which OSIM tenants the
 * app can reach. It is the seam that will be replaced by the central directory
 * service (see src/api/osim/directory.ts): once that exists, this file goes away
 * and the list is fetched + cached at runtime instead of shipped in the APK.
 *
 * Provenance: tenant ids/codes were extracted from the OSIM platform's
 * multi-tenant deployment manifests. Test/template tenants (demo, institution1,
 * mn2) are intentionally excluded.
 *
 * Connection details for each tenant are resolved at runtime from the central
 * directory; this file carries only public registry fields.
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
  connectId: string; // pre-shared 6-char institution ID — the picker's search key
  location: string;
  accent: string; // brand accent (hex)
  baseUrl: string; // OSIM base URL (no trailing slash)
}

/** Default OSIM host for a tenant without a custom domain. */
const cloud = (id: string) => `https://${id}.osim.cloud`;

export const TENANTS: TenantInfo[] = [
  // ── Live tenants with keys already provisioned (.env). Keep first so the app
  //    defaults to a working tenant (AppState seeds from TENANTS[0]). ──
  { id: "stemmuco", name: "Stella Maris Mtwara University College", short: "STE", abbr: "STEMMUCO", connectId: "NEP4Q6", location: "Mtwara, Tanzania", accent: "#1f6f4a", baseUrl: "https://stemmuco.osim.cloud" },
  { id: "makumira", name: "Tumaini University Makumira", short: "TUMA", abbr: "TUMA", connectId: "VSHVMH", location: "Usa River, Arusha", accent: "#8081a4", baseUrl: "https://osim.makumira.ac.tz" },

  // ── Remaining tenants — keys filled later in .env, names/abbr to confirm. ──
  { id: "ajuco", name: "Archbishop James University College", short: "AJUCO", abbr: "AJUCO", connectId: "1NP75D", location: "Songea, Ruvuma", accent: "#b8432a", baseUrl: cloud("ajuco") },
  { id: "amucta", name: "Archbishop Mihayo University College of Tabora", short: "AMU", abbr: "AMUCTA", connectId: "DDSETS", location: "Tabora, Tanzania", accent: "#6d28d9", baseUrl: cloud("amucta") },
  { id: "bugando", name: "Catholic University of Health and Allied Sciences (Bugando)", short: "CUHAS", abbr: "BUGANDO", connectId: "1RMGKN", location: "Mwanza, Tanzania", accent: "#9d8318", baseUrl: cloud("bugando") },
  { id: "carumuco", name: "Cardinal Rugambwa Memorial University College", short: "CRMU", abbr: "CARUMUCO", connectId: "WEKACK", location: "Bukoba, Kagera", accent: "#be123c", baseUrl: cloud("carumuco") },
  { id: "chatocohest", name: "chatocohest", short: "CHATO", abbr: "CHATOCOHEST", connectId: "E8BGVG", location: "Chato, Geita", accent: "#9d8417", baseUrl: "https://chato.campusmaster.cloud" }, // TODO confirm display name
  { id: "dartu", name: "dartu", short: "DART", abbr: "DARTU", connectId: "C9SW5H", location: "Tanzania", accent: "#c2410c", baseUrl: cloud("dartu") }, // TODO confirm display name
  { id: "fhti", name: "fhti", short: "FHTI", abbr: "FHTI", connectId: "995BC9", location: "Tanzania", accent: "#7c3aed", baseUrl: cloud("fhti") }, // TODO confirm display name
  { id: "hkmu", name: "Hubert Kairuki Memorial University", short: "HKMU", abbr: "HKMU", connectId: "B05W55", location: "Dar es Salaam", accent: "#0c9b58", baseUrl: "https://osim.ku.ac.tz" },
  { id: "kiahs", name: "kiahs", short: "KIAHS", abbr: "KIAHS", connectId: "YVZCGX", location: "Tanzania", accent: "#0f766e", baseUrl: cloud("kiahs") }, // TODO confirm display name
  { id: "kiut", name: "Kampala International University in Tanzania", short: "KIUT", abbr: "KIUT", connectId: "VVVPPA", location: "Dar es Salaam", accent: "#329a4a", baseUrl: cloud("kiut") },
  { id: "ksp", name: "ksp", short: "KSP", abbr: "KSP", connectId: "HB0HHV", location: "Tanzania", accent: "#a16207", baseUrl: cloud("ksp") }, // TODO confirm display name
  { id: "lihas", name: "lihas", short: "LIHAS", abbr: "LIHAS", connectId: "Z8HM7K", location: "Tanzania", accent: "#0891b2", baseUrl: cloud("lihas") }, // TODO confirm display name
  { id: "mti", name: "mti", short: "MTI", abbr: "MTI", connectId: "3QXG96", location: "Tanzania", accent: "#9333ea", baseUrl: cloud("mti") }, // TODO confirm display name
  { id: "rhti", name: "rhti", short: "RHTI", abbr: "RHTI", connectId: "DEXS6H", location: "Tanzania", accent: "#b5262d", baseUrl: "https://osim.rhti.ac.tz" }, // TODO confirm display name
  { id: "saut", name: "St. Augustine University of Tanzania", short: "SAUT", abbr: "SAUT", connectId: "JXT758", location: "Mwanza, Tanzania", accent: "#1e40af", baseUrl: "https://sautarusha.osim.cloud" },
  { id: "smmuco", name: "smmuco", short: "SMMU", abbr: "SMMUCO", connectId: "3Q3M3Q", location: "Tanzania", accent: "#9e8359", baseUrl: cloud("smmuco") }, // TODO confirm display name
  { id: "socaite", name: "socaite", short: "SOCA", abbr: "SOCAITE", connectId: "DAWF57", location: "Tanzania", accent: "#898621", baseUrl: cloud("socaite") }, // TODO confirm display name
  { id: "stc", name: "stc", short: "STC", abbr: "STC", connectId: "8JGMC9", location: "Tanzania", accent: "#3c02d9", baseUrl: cloud("stc") }, // TODO confirm display name
  { id: "sumait", name: "Abdulrahman Al-Sumait University", short: "SUM", abbr: "SUMAIT", connectId: "N5YPVY", location: "Chukwani, Zanzibar", accent: "#106c40", baseUrl: cloud("sumait") },
  { id: "tudarco", name: "Tumaini University Dar es Salaam College", short: "TUDA", abbr: "TUDARCO", connectId: "7XRPDC", location: "Dar es Salaam", accent: "#1e3a8a", baseUrl: cloud("tudarco") },
  { id: "uoa", name: "University of Arusha", short: "UOA", abbr: "UOA", connectId: "NYM6J4", location: "Arusha, Tanzania", accent: "#98822c", baseUrl: cloud("uoa") },
  { id: "wiarc", name: "wiarc", short: "WIARC", abbr: "WIARC", connectId: "22BQXF", location: "Tanzania", accent: "#0369a1", baseUrl: cloud("wiarc") }, // TODO confirm display name
];

export function getTenant(id: string): TenantInfo | null {
  return TENANTS.find((t) => t.id === id) ?? null;
}
