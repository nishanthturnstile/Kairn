import { useState, type Ref } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export function Input({
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { ref?: Ref<TextInput> }) {
  const [focused, setFocused] = useState(false);
  const { theme } = useUnistyles();
  return (
    <TextInput
      placeholderTextColor={theme.colors.secondaryText}
      selectionColor={theme.colors.primary}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.input,
        props.multiline && styles.multiline,
        props.editable === false && styles.readonly,
        focused && styles.focused,
        style,
      ]}
      {...props}
    />
  );
}
const styles = StyleSheet.create((theme) => ({
  field: { gap: theme.spacing.sm },
  label: {
    fontFamily: "InstrumentSans600",
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text,
  },
  input: {
    fontFamily: "InstrumentSans400",
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    minHeight: theme.control.minHeight,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    borderRadius: theme.controlRadius,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  readonly: { opacity: 0.65 },
  focused: { borderColor: theme.colors.primary, borderWidth: 2 },
  errorBorder: { borderColor: theme.colors.error },
  error: { color: theme.colors.error },
  hint: {
    fontFamily: "InstrumentSans400",
    fontSize: theme.typography.compactBody.fontSize,
    lineHeight: theme.typography.compactBody.lineHeight,
    color: theme.colors.secondaryText,
  },
}));
