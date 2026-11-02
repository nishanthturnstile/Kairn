import { tokens } from "@kairn/design-tokens";
import { StyleSheet } from "react-native-unistyles";

export const theme = {
  colors: {
    background: tokens.color.paper50,
    surface: tokens.color.paper0,
    text: tokens.color.ink950,
    secondaryText: tokens.color.ink700,
    border: tokens.color.line200,
    primary: tokens.color.forest800,
    primaryText: tokens.color.white,
    successSurface: tokens.color.forest100,
    error: tokens.color.danger800,
  },
  spacing: tokens.spacing,
  radius: tokens.radius,
  typography: tokens.typography.mobile,
  // System fonts until the approved font files and licensing are delivered.
};
type AppThemes = { light: typeof theme };
type AppBreakpoints = typeof tokens.layout.breakpoint;
declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}
StyleSheet.configure({
  themes: { light: theme },
  breakpoints: tokens.layout.breakpoint,
  settings: { initialTheme: "light" },
});
