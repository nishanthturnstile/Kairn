import type { ReactNode } from "react";
import { Text, View, type TextInputProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./ui/button";
import { Field } from "./ui/field";

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
    <Button
      label={label}
      onPress={onPress}
      variant={secondary ? "secondary" : "primary"}
      disabled={disabled}
      pending={pending}
    />
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
      accessibilityRole={title || editorial ? "header" : undefined}
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
  return <Field label={label} hint={hint ?? ""} error={error ?? ""} {...props} />;
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
    fontFamily: "InstrumentSans400",
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    flexShrink: 1,
  },
  title: { fontFamily: "InstrumentSans600", fontSize: 19, lineHeight: 26 },
  editorial: { fontFamily: "Newsreader500", fontSize: 32, lineHeight: 38 },
  muted: { color: theme.colors.secondaryText, fontSize: 14, lineHeight: 21 },
  status: {
    backgroundColor: theme.colors.selected,
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
