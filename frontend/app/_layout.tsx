import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, Text, TextInput, View } from "react-native";

// Dense fintech UI: cap OS text scaling so numeric layouts never collapse or
// overlap on devices with enlarged accessibility text.
// @ts-expect-error defaultProps exists at runtime
Text.defaultProps = { ...(Text.defaultProps || {}), maxFontSizeMultiplier: 1.15 };
// @ts-expect-error defaultProps exists at runtime
TextInput.defaultProps = { ...(TextInput.defaultProps || {}), maxFontSizeMultiplier: 1.15 };
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { fontMap } from "@/src/typography";
import { WalletProvider } from "@/src/wallet/WalletContext";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts(fontMap);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#0B0F19" }} />;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B0F19" }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <WalletProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#0B0F19" },
                  }}
                >
                  <Stack.Screen name="asset/[id]" options={{ presentation: "transparentModal", animation: "fade" }} />
                  <Stack.Screen name="select-asset" options={{ presentation: "transparentModal", animation: "fade" }} />
                  <Stack.Screen name="send/index" options={{ presentation: "modal" }} />
                  <Stack.Screen name="receive/index" options={{ presentation: "modal" }} />
                </Stack>
              </WalletProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
