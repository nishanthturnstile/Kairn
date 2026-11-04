export type AppearancePreference = "system" | "light" | "dark";
export function readAppearance(): AppearancePreference {
  try {
    const value = localStorage.getItem("kairn.appearance");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}
// Runs before React mounts, including on the standalone approved reader. No inline script/CSP exception.
if (typeof document !== "undefined") {
  const preference = readAppearance();
  document.documentElement.dataset.appearance =
    preference === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
}
