/* directory.ts — client for the central institution directory.
 *
 * The directory maps each institution to how the app reaches it. The app queries
 * it at selection time to learn how to connect to the chosen institution, then
 * scopes to it. Configured via configureDirectory() (see directoryConfig.ts). */
import { OsimConnection } from "./types";

export interface DirectoryEntry {
  id: string;
  name: string;
  abbr: string;
  baseUrl: string;
  short: string;
  location: string;
  accent: string;
  logo: string;
}

type DirectoryConfig = {
  baseUrl: string | null; // central registry, e.g. https://registry.exampass.example
  appToken?: string | null; // app-level auth for the directory endpoint
};

const config: DirectoryConfig = { baseUrl: null, appToken: null };

export function configureDirectory(next: Partial<DirectoryConfig>) {
  Object.assign(config, next);
}

export function isDirectoryConfigured(): boolean {
  return !!config.baseUrl;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (config.appToken) h["Authorization"] = `Bearer ${config.appToken}`;
  return h;
}

/** Listing for the institution search. Empty query → the full list. */
export async function searchDirectory(query: string): Promise<DirectoryEntry[]> {
  if (!config.baseUrl) return [];
  try {
    const r = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/institutions?q=${encodeURIComponent(query)}`, {
      headers: headers(),
    });
    const j = await r.json().catch(() => null);
    const list = (j?.data ?? j) as DirectoryEntry[] | null;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** The full registry (no query) — fetched once, cached on-device, filtered client-side. */
export async function listInstitutions(): Promise<DirectoryEntry[]> {
  return searchDirectory("");
}

/** A directory connection plus the registration flag. `provisioned` marks a
 * tenant that is set up for ExamPass. */
export interface DirectoryConnection extends OsimConnection {
  provisioned: boolean;
}

/** Fetch the connection for one tenant: { baseUrl, abbr, provisioned, apiKey? }.
 * Cached by the resolver after the first fetch. */
export async function fetchInstitutionConnection(instId: string): Promise<DirectoryConnection | null> {
  if (!config.baseUrl) return null;
  try {
    const r = await fetch(
      `${config.baseUrl.replace(/\/+$/, "")}/institutions/${encodeURIComponent(instId)}/connection`,
      { headers: headers() }
    );
    const j = await r.json().catch(() => null);
    const c = (j?.data ?? j) as (Partial<OsimConnection> & { provisioned?: boolean }) | null;
    if (c && c.baseUrl && c.abbr) {
      const base: DirectoryConnection = { baseUrl: c.baseUrl, abbr: c.abbr, provisioned: !!c.provisioned };
      if (c.apiKey) base.apiKey = c.apiKey;
      return base;
    }
    return null;
  } catch {
    return null;
  }
}

/* ---- OTP (email second factor, served by the same directory API) ---- */

async function postJSON(path: string, body: unknown): Promise<any> {
  if (!config.baseUrl) return { ok: false, message: "Verification service unavailable" };
  try {
    const r = await fetch(`${config.baseUrl.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json().catch(() => ({}))) ?? {};
  } catch {
    return { ok: false, message: "No connection — check your internet and try again" };
  }
}

/** Request an OTP for a (already membership-verified) email. In dev the API
 * echoes the code, which we print to the Metro/npx console so you don't have to
 * open Mailpit. */
export async function requestOtp(instId: string, email: string): Promise<{ ok: boolean; message?: string }> {
  const j = await postJSON("/otp/request", { institution: instId, email });
  if (__DEV__ && j?.devCode) {
    console.log(
      `\n┌──────────────── DEV OTP ────────────────\n│  ${email}\n│  CODE: ${j.devCode}\n└─────────────────────────────────────────\n`
    );
  }
  return { ok: !!j?.ok, message: j?.message };
}

/** Verify an OTP code. */
export async function verifyOtp(
  instId: string,
  email: string,
  code: string
): Promise<{ ok: boolean; message?: string }> {
  const j = await postJSON("/otp/verify", { institution: instId, email, code });
  return { ok: !!j?.ok, message: j?.message };
}
