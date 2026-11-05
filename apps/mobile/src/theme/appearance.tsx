import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { UnistylesRuntime } from "react-native-unistyles";
import { Picker } from "../components/ui/selection";

type Preference = "system" | "light" | "dark";
const Context = createContext<{
  preference: Preference;
  setPreference: (value: Preference) => void;
}>({ preference: "system", setPreference: () => {} });
function apply(value: Preference) {
  UnistylesRuntime.setAdaptiveThemes(value === "system");
  if (value !== "system") UnistylesRuntime.setTheme(value);
}
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setValue] = useState<Preference>("system");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync("kairn.appearance")
      .then((value) => {
        if (active) {
          const next = value === "dark" || value === "light" ? value : "system";
          apply(next);
          setValue(next);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function setPreference(value: Preference) {
    apply(value);
    setValue(value);
    void SecureStore.setItemAsync("kairn.appearance", value).catch(() => {});
  }
  if (!ready) return null;
  return <Context value={{ preference, setPreference }}>{children}</Context>;
}
export function AppearanceControl() {
  const { preference, setPreference } = useContext(Context);
  return (
    <Picker
      label="Appearance"
      value={preference}
      options={[
        { value: "system", label: "Use device setting" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
      onChange={(value) => {
        if (value === "system" || value === "light" || value === "dark") setPreference(value);
      }}
    />
  );
}
