import type { ReactNode } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function JournalButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
  pending = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      disabled={disabled || pending}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
        (disabled || pending) && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
export function JournalText({
  children,
  title = false,
  muted = false,
  editorial = false,
}: {
  children: ReactNode;
  title?: boolean;
  muted?: boolean;
  editorial?: boolean;
}) {
  return (
    <Text
      accessibilityRole={title ? "header" : undefined}
      style={[
        styles.text,
        title && styles.title,
        muted && styles.muted,
        editorial && styles.editorial,
      ]}
    >
      {children}
    </Text>
  );
}
export function JournalField({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || hint}
        style={[styles.input, error && styles.errorBorder]}
        {...props}
      />
      <Text accessibilityLiveRegion="polite" style={[styles.hint, error && styles.errorText]}>
        {error || hint}
      </Text>
    </View>
  );
}
export function JournalStatus({
  children,
  review = false,
}: {
  children: ReactNode;
  review?: boolean;
}) {
  return (
    <View style={[styles.status, review && styles.review]}>
      <Text style={[styles.statusText, review && styles.reviewText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    fontFamily: "InstrumentSans",
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    flexShrink: 1,
  },
  title: { fontFamily: "InstrumentSans600", fontSize: 19, lineHeight: 26 },
  editorial: { fontFamily: "Newsreader500", fontSize: 32, lineHeight: 38 },
  muted: { color: theme.colors.secondaryText, fontSize: 14, lineHeight: 21 },
  button: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.controlBorder },
  buttonText: {
    fontFamily: "InstrumentSans600",
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.primaryText,
    textAlign: "center",
  },
  secondaryText: { color: theme.colors.primary },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  field: { gap: 8 },
  label: {
    fontFamily: "InstrumentSans600",
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  input: {
    fontFamily: "InstrumentSans",
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    minHeight: 48,
    padding: 12,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
  },
  hint: {
    fontFamily: "InstrumentSans",
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.secondaryText,
  },
  errorBorder: { borderColor: theme.colors.error },
  errorText: { color: theme.colors.error },
  status: {
    backgroundColor: theme.colors.successSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.round,
    alignSelf: "flex-start",
  },
  statusText: {
    fontFamily: "InstrumentSans600",
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.primary,
  },
  review: { backgroundColor: theme.colors.reviewSurface },
  reviewText: { color: theme.colors.reviewText },
}));
