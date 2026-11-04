import type { ReactNode, Ref } from "react";
import { ActivityIndicator, Pressable, Text, type View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  pending = false,
  icon,
  ref,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet" | "destructive";
  disabled?: boolean;
  pending?: boolean;
  icon?: ReactNode;
  ref?: Ref<View>;
}) {
  const { theme } = useUnistyles();
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      disabled={disabled || pending}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {pending ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? theme.colors.primaryText
              : variant === "destructive"
                ? theme.colors.onError
                : theme.colors.primary
          }
        />
      ) : (
        icon
      )}
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.onPrimary,
          variant === "destructive" && styles.onDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.icon, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {icon}
    </Pressable>
  );
}
const styles = StyleSheet.create((theme) => ({
  button: {
    minHeight: theme.control.minHeight,
    borderRadius: theme.controlRadius,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.controlBorder },
  quiet: { backgroundColor: "transparent", borderColor: "transparent" },
  destructive: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  label: {
    fontFamily: "InstrumentSans600",
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.primary,
    textAlign: "center",
    flexShrink: 1,
  },
  onPrimary: { color: theme.colors.primaryText },
  onDanger: { color: theme.colors.onError },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
  icon: {
    minHeight: theme.control.iconSize,
    minWidth: theme.control.iconSize,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    borderRadius: theme.controlRadius,
  },
}));
