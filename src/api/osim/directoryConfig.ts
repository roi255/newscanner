/* directoryConfig.ts — side-effect module: point the app at the central
 * directory. Import once (App.tsx).
 *
 * The base URL has a baked-in default, with an optional EXPO_PUBLIC_DIRECTORY_URL
 * override for staging. Static process.env.* member access so Expo inlines it at
 * build time. */
import { configureDirectory } from "./directory";

/** Default directory endpoint. Override via EXPO_PUBLIC_DIRECTORY_URL. */
export const DEFAULT_DIRECTORY_URL = "https://passcan.campusmaster.cloud";

configureDirectory({
  baseUrl: process.env.EXPO_PUBLIC_DIRECTORY_URL || DEFAULT_DIRECTORY_URL,
  appToken: process.env.EXPO_PUBLIC_DIRECTORY_TOKEN || null,
});
