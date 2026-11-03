import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { Stack } from "expo-router/stack";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "../theme/unistyles";

export default function RootLayout() {
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
    });
    return () => subscription.remove();
  }, []);
  return (
    <QueryClientProvider client={client}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          // Expo's iOS shell owns its status bar; this option is needed on Android.
          ...(Platform.OS === "android" ? { statusBarStyle: "dark" } : {}),
        }}
      >
        <Stack.Screen name="index" options={{ title: "Kairn Dev" }} />
        <Stack.Screen name="prototype" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
