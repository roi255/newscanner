/* directoryConfig.ts — side-effect module: point the app at the central
 * directory from the build-time env. Import once (App.tsx).
 *
 * EXPO_PUBLIC_DIRECTORY_URL unset ⇒ directory stays unconfigured ⇒ the app falls
 * back to the bundled institution list (no behaviour change). Set it to the
 * directory's public base URL to activate runtime fetching.
 *
 * Static process.env.* member access so Expo inlines it at build time. */
import { configureDirectory } from "./directory";

configureDirectory({
  baseUrl: process.env.EXPO_PUBLIC_DIRECTORY_URL ?? null,
  appToken: process.env.EXPO_PUBLIC_DIRECTORY_TOKEN ?? null,
});
