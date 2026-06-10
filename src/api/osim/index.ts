/* OSIM app-API integration (scaffold). Mirrors osim/application/controllers/
 * apiapp.php: request envelope + checksum, institution verification, exam-permit
 * eligibility, and an access-log audit trail. Dormant until a connection is set
 * in config.ts — the app stays on mock data otherwise. */
export * from "./types";
export * from "./checksum";
export * from "./qr";
export * from "./mapper";
export * from "./examTypes";
export * from "./localStore";
export * from "./accessLog";
export * from "./eligibility";
export * from "./client";
export * from "./config";
export * from "./directory";
export * from "./secureStore";
export * from "./session";
export * from "./resolver";
