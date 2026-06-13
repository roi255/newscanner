/* RootNavigator — native stack (Institution → Login → Sync → Main → Scanning →
 * Result) with a bottom-tab Main. Route wrappers bind the AppState context +
 * navigation to the (unchanged) presentational screens. Native-stack gives the
 * iOS edge swipe-back and proper Android back for free. */
import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

import { RootStackParamList, MainTabParamList } from "./types";
import { BottomTabBar } from "./BottomTabBar";
import { useTheme } from "../theme/ThemeProvider";
import { useAppState } from "../state/AppState";

import { InstitutionScreen } from "../screens/InstitutionScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { OperatorScreen } from "../screens/OperatorScreen";
import { SyncScreen } from "../screens/SyncScreen";
import { ScanHomeScreen } from "../screens/ScanHomeScreen";
import { ScanningScreen } from "../screens/ScanningScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { LookupScreen } from "../screens/LookupScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AccessLogScreen } from "../screens/AccessLogScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/* ---------- route wrappers ---------- */
function InstitutionRoute() {
  const { institutions, selectInstitution } = useAppState();
  return <InstitutionScreen institutions={institutions} onSelect={selectInstitution} />;
}

function LoginRoute() {
  const { inst, verifyMembership } = useAppState();
  const nav = useNavigation();
  return (
    <LoginScreen
      institution={inst}
      onVerify={verifyMembership}
      onChangeInstitution={() => nav.goBack()}
    />
  );
}

function OtpRoute() {
  const { otpEmail, submitOtp, resendOtp } = useAppState();
  return <OtpScreen email={otpEmail} onSubmit={submitOtp} onResend={resendOtp} />;
}

function OperatorRoute() {
  const { inst, operatorPrefill, startSession } = useAppState();
  return (
    <OperatorScreen
      institution={inst}
      initialName={operatorPrefill.name}
      initialPhone={operatorPrefill.phone}
      onStart={startSession}
    />
  );
}

function SyncRoute() {
  const { inst, syncDone, runOsimSync, localCacheCount } = useAppState();
  useEffect(() => {
    if (!inst.osim) return;
    let alive = true;
    // run the real roster sync, but keep the screen up at least ~1.4s
    Promise.all([runOsimSync(), new Promise((r) => setTimeout(r, 1400))]).then(() => {
      if (alive) syncDone();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <SyncScreen institution={inst} onDone={syncDone} auto={!inst.osim} cachedCount={inst.osim ? localCacheCount : undefined} />;
}

function HomeRoute() {
  const { session, inst, stats, log, localCacheCount, osimConnected, startScan, openEntry, openSessionForm } =
    useAppState();
  const nav = useNavigation<any>();
  return (
    <ScanHomeScreen
      session={session}
      institution={inst}
      stats={stats}
      recent={log}
      cacheCount={inst.recordCount || localCacheCount}
      connected={inst.osim ? osimConnected : null}
      onScan={startScan}
      onNav={(id) => nav.navigate(id === "history" ? "History" : "Profile")}
      onOpenResult={openEntry}
      onChangeSession={openSessionForm}
    />
  );
}

function HistoryRoute() {
  const { session, log, openEntry, clearHistory } = useAppState();
  return <HistoryScreen session={session} log={log} onOpenResult={openEntry} onClear={clearHistory} />;
}

function LookupRoute() {
  const { inst, log, openStudent, lookupStudent } = useAppState();
  return <LookupScreen institution={inst} recent={log} onVerify={openStudent} onLookup={lookupStudent} />;
}

function ProfileRoute() {
  const { session, inst, localCacheCount, logout, openSessionForm, settings, setSetting } = useAppState();
  const nav = useNavigation<any>();
  return (
    <ProfileScreen
      session={session}
      institution={inst}
      cacheCount={inst.osim ? localCacheCount : inst.recordCount}
      settings={settings}
      onSetSetting={setSetting}
      onLogout={logout}
      onSwitchInstitution={logout}
      onSwitchSession={openSessionForm}
      onOpenAccessLog={() => nav.navigate("AccessLog")}
    />
  );
}

function AccessLogRoute() {
  const nav = useNavigation();
  return <AccessLogScreen onBack={() => nav.goBack()} />;
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeRoute} />
      <Tab.Screen name="History" component={HistoryRoute} />
      <Tab.Screen name="Profile" component={ProfileRoute} />
    </Tab.Navigator>
  );
}

function ScanningRoute() {
  const { inst, scanState, cancelScan, onDetected, simulateScan, clearScanTimer } = useAppState();
  // If the user swipes/back-navigates away mid-scan, drop any pending result.
  useEffect(() => () => clearScanTimer(), [clearScanTimer]);
  return (
    <ScanningScreen
      institution={inst}
      fetchingOnline={scanState.fetchingOnline}
      processing={scanState.processing}
      onCancel={cancelScan}
      onDetected={onDetected}
      onSimulate={simulateScan}
    />
  );
}

function ResultRoute() {
  const { result, session, scanNext, doneToHome } = useAppState();
  if (!result) return null;
  return (
    <ResultScreen
      student={result.student}
      authorized={result.authorized}
      source={result.source}
      session={session}
      onScanNext={scanNext}
      onDone={doneToHome}
    />
  );
}

export function RootNavigator() {
  const { tokens } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Institution"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.hex.bg } }}
    >
      <Stack.Screen name="Institution" component={InstitutionRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="Otp" component={OtpRoute} />
      <Stack.Screen name="Operator" component={OperatorRoute} />
      <Stack.Screen name="Sync" component={SyncRoute} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Scanning"
        component={ScanningRoute}
        options={{ contentStyle: { backgroundColor: "#0c0c11" } }}
      />
      <Stack.Screen name="Result" component={ResultRoute} />
      <Stack.Screen name="AccessLog" component={AccessLogRoute} />
    </Stack.Navigator>
  );
}
