import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Select } from "./ui/form-controls";
import { readAppearance, type AppearancePreference } from "./appearance-init";

type Preference = AppearancePreference;
const AppearanceContext = createContext<{
  preference: Preference;
  setPreference: (value: Preference) => void;
}>({ preference: "system", setPreference: () => {} });
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState(readAppearance);
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      document.documentElement.dataset.appearance =
        preference === "system" ? (system.matches ? "dark" : "light") : preference;
    }
    apply();
    system.addEventListener("change", apply);
    try {
      localStorage.setItem("kairn.appearance", preference);
    } catch {
      /* Usable in memory when storage is restricted. */
    }
    return () => system.removeEventListener("change", apply);
  }, [preference]);
  return <AppearanceContext value={{ preference, setPreference }}>{children}</AppearanceContext>;
}
export function AppearanceControl() {
  const id = useId();
  const { preference, setPreference } = useContext(AppearanceContext);
  return (
    <div className="atlas-appearance">
      <label htmlFor={id}>Appearance</label>
      <Select
        id={id}
        value={preference}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "light" || value === "dark" || value === "system") setPreference(value);
        }}
      >
        <option value="system">Use device setting</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
    </div>
  );
}
