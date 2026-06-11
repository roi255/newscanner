/* ScanningScreen — real camera + QR decode (expo-camera).
 *
 * A decoded QR yields a `code`; the parent runs the cache-first lookup and
 * either navigates to the result or (unknown card) returns false so we keep
 * scanning. A permission gate + "Simulate a scan" fallback keep the whole flow
 * reviewable on a device/emulator without a printed card. */
import React, { useRef, useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Body } from "../components/Typography";
import { ViewfinderFrame } from "../components/ui";
import { I } from "../components/icons";
import { useTheme } from "../theme/ThemeProvider";
import { Institution } from "../data/exam";

export function ScanningScreen({
  institution,
  fetchingOnline,
  processing,
  onCancel,
  onDetected,
  onSimulate,
}: {
  institution: Institution;
  fetchingOnline: boolean;
  processing: boolean;
  onCancel: () => void;
  /** resolves true if the code was recognised (parent will navigate). */
  onDetected: (code: string) => Promise<boolean>;
  onSimulate: () => void;
}) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lockRef = useRef(false);

  async function handleBarcode(data: string) {
    if (lockRef.current || processing) return;
    lockRef.current = true;
    setNotFound(false);
    const recognised = await onDetected(data);
    if (!recognised) {
      setNotFound(true);
      setTimeout(() => {
        lockRef.current = false;
        setNotFound(false);
      }, 1400);
    }
  }

  const granted = permission?.granted;

  return (
    <View className="flex-1" style={{ backgroundColor: "#0c0c11" }}>
      <StatusBar style="light" />
      {granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={processing ? undefined : ({ data }) => handleBarcode(data)}
        />
      ) : null}
      {/* darkening scrim over the camera for legible chrome */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: granted ? "rgba(8,8,14,0.35)" : "transparent" }]} />

      <View
        className="flex-1 items-center px-[30px]"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}
      >
        {/* top controls */}
        <View className="flex-row items-center justify-between w-full mt-1.5">
          <Pressable
            onPress={onCancel}
            className="w-[42px] h-[42px] rounded-sm items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <I.x size={22} color="#fff" />
          </Pressable>
          {granted ? (
            <Pressable
              onPress={() => setTorch((v) => !v)}
              className="w-[42px] h-[42px] rounded-sm items-center justify-center"
              style={{ backgroundColor: torch ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.12)" }}
            >
              <I.flash size={20} color="#fff" />
            </Pressable>
          ) : (
            <View className="w-[42px] h-[42px]" />
          )}
        </View>

        {granted ? (
          <ScanningContent
            fetchingOnline={fetchingOnline}
            processing={processing}
            notFound={notFound}
            accent={tokens.hex.accent}
          />
        ) : (
          <PermissionGate
            loading={!permission}
            onEnable={requestPermission}
            onSimulate={onSimulate}
          />
        )}

        {/* footer */}
        <View className="flex-row items-center gap-2">
          <I.shield size={15} color="rgba(255,255,255,0.55)" />
          <AppText className="text-[12.5px] font-jakarta-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
            Verifying against {institution.name}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function ScanningContent({
  fetchingOnline,
  processing,
  notFound,
  accent,
}: {
  fetchingOnline: boolean;
  processing: boolean;
  notFound: boolean;
  accent: string;
}) {
  let title = "Reading QR code…";
  let sub = "Hold steady over the exam-card QR";
  if (notFound) {
    title = "Card not recognized";
    sub = "Try again or use manual lookup";
  } else if (fetchingOnline) {
    title = "Verifying…";
    sub = "Checking registration with the institution";
  }

  return (
    <View className="flex-1 items-center justify-center w-full" style={{ gap: 30 }}>
      <ViewfinderFrame size={228} scanning={!processing && !notFound} />
      <View className="items-center" style={{ gap: 8 }}>
        <View className="flex-row items-center gap-2.5">
          {processing && fetchingOnline ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <View className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: notFound ? "#fff" : accent }} />
          )}
          <AppText className="font-jakarta-bold text-[16px] text-white">{title}</AppText>
        </View>
        <AppText className="text-[13.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>
          {sub}
        </AppText>
      </View>
    </View>
  );
}

function PermissionGate({
  loading,
  onEnable,
  onSimulate,
}: {
  loading: boolean;
  onEnable: () => void;
  onSimulate: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center w-full" style={{ gap: 18 }}>
      <View
        className="w-[72px] h-[72px] rounded-lg items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
      >
        <I.scan size={34} color="#fff" />
      </View>
      {loading ? (
        <AppText className="text-white font-jakarta-bold text-[16px]">Preparing camera…</AppText>
      ) : (
        <>
          <View className="items-center" style={{ gap: 6 }}>
            <AppText className="text-white font-jakarta-bold text-[18px]">Camera access needed</AppText>
            <Body className="text-center" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 250 }}>
              Allow camera access to scan examination QR cards.
            </Body>
          </View>
          <Pressable onPress={onEnable} className="h-[50px] px-6 rounded-md bg-white items-center justify-center">
            <AppText className="font-jakarta-bold text-[15px]" style={{ color: "#0c0c11" }}>
              Enable camera
            </AppText>
          </Pressable>
          <Pressable onPress={onSimulate} className="h-11 px-5 items-center justify-center">
            <AppText className="font-jakarta-semibold text-[13.5px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              Simulate a scan
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  );
}
