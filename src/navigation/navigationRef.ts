/* navigationRef — lets the AppState context drive navigation (the data actions
 * navigate as a side-effect, mirroring the old state machine) without threading
 * a navigation prop everywhere. */
import { createNavigationContainerRef, StackActions } from "@react-navigation/native";
import { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) navigationRef.navigate(name as never);
}

/** Replace the current top route — keeps the Scanning⇄Result flow at depth 1. */
export function replace(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) navigationRef.dispatch(StackActions.replace(name));
}

/** Reset the whole stack to a single root (after login/sync or on logout). */
export function resetTo(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) navigationRef.reset({ index: 0, routes: [{ name }] });
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
}
