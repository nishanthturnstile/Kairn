import { Stack } from "expo-router/stack";
import { SampleProvider } from "../../prototype/context";
export default function Layout() {
  return (
    <SampleProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SampleProvider>
  );
}
