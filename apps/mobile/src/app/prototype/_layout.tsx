import { Stack } from "expo-router/stack";
import { useFonts } from "expo-font";
import { Text } from "react-native";
import { SampleProvider } from "../../prototype/context";
export default function Layout() {
  const [loaded, error] = useFonts({
    InstrumentSans: require("../../prototype/generated/instrument-400.ttf"),
    InstrumentSans600: require("../../prototype/generated/instrument-600.ttf"),
    Newsreader500: require("../../prototype/generated/newsreader-500.ttf"),
  });
  if (error)
    return <Text accessibilityRole="alert">Sample fonts could not load. Return and retry.</Text>;
  if (!loaded) return <Text>Loading sample fonts…</Text>;
  return (
    <SampleProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SampleProvider>
  );
}
