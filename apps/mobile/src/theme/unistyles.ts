import { tokens } from "@kairn/design-tokens";
import { StyleSheet } from "react-native-unistyles";

function makeTheme(appearance: "light" | "dark") {
  const color = tokens.theme[appearance];
  return {
    colors: {
      background: color.canvas,
      surface: color.surface,
      text: color.text,
      secondaryText: color.muted,
      border: color.divider,
      controlBorder: color.border,
      primary: color.action,
      primaryText: color.onAction,
      selected: color.selected,
      success: color.success,
      successSurface: color.successSurface,
      error: color.danger,
      errorSurface: color.dangerSurface,
      onError: color.onDanger,
      reviewSurface: color.reviewSurface,
      reviewText: color.review,
      riverSurface: color.infoSurface,
      info: color.info,
      warning: color.warning,
      warningSurface: color.warningSurface,
      scrim: color.scrim,
      elevated: color.elevated,
    },
    spacing: tokens.spacing,
    radius: tokens.radius,
    typography: tokens.typography.mobile,
    control: tokens.control.native,
    controlRadius: tokens.control.radius,
  };
}
export const theme = makeTheme("light");
export const darkTheme = makeTheme("dark");
type AppThemes = { light: typeof theme; dark: typeof darkTheme };
type AppBreakpoints = typeof tokens.layout.breakpoint;
declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}
StyleSheet.configure({
  themes: { light: theme, dark: darkTheme },
  breakpoints: tokens.layout.breakpoint,
  settings: { adaptiveThemes: true },
});
