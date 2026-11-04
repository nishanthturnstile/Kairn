import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useFonts } from "expo-font";
import { Text, View } from "react-native";
import { Stack } from "expo-router/stack";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "../theme/unistyles";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader500: require("../assets/fonts/Newsreader500.ttf"),
    Newsreader600: require("../assets/fonts/Newsreader600.ttf"),
    InstrumentSans400: require("../assets/fonts/InstrumentSans400.ttf"),
    InstrumentSans500: require("../assets/fonts/InstrumentSans500.ttf"),
    InstrumentSans600: require("../assets/fonts/InstrumentSans600.ttf"),
    InstrumentSans700: require("../assets/fonts/InstrumentSans700.ttf"),
  });
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
    });
    return () => subscription.remove();
  }, []);
  if (!fontsLoaded && !fontError)
    return (
      <View>
        <Text>Loading Kairn…</Text>
      </View>
    );
  if (fontError)
    return (
      <View>
        <Text accessibilityRole="alert">Kairn fonts could not load. Close and reopen the app.</Text>
      </View>
    );
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
        <Stack.Screen name="account" options={{ title: "Your account" }} />
        <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
        <Stack.Screen name="verify-email" options={{ title: "Verify email" }} />
        <Stack.Screen name="index" options={{ title: "Kairn Dev" }} />
      </Stack>
    </QueryClientProvider>
  );
}
