import { useRef, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./button";

export type Choice = { value: string; label: string; description?: string; disabled?: boolean };
export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.choice,
        checked && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.indicator, checked && styles.checked]}>
        <View style={checked && styles.checkMark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.detail}>{description}</Text>}
      </View>
    </Pressable>
  );
}
export function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Choice[];
  onChange: (value: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityHint={option.description}
          accessibilityState={{ checked: value === option.value, disabled: option.disabled }}
          disabled={option.disabled}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [
            styles.choice,
            value === option.value && styles.selected,
            pressed && styles.pressed,
            option.disabled && styles.disabled,
          ]}
        >
          <View style={[styles.indicator, styles.radio, value === option.value && styles.checked]}>
            <View style={value === option.value && styles.radioDot} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.label}>{option.label}</Text>
            {option.description && <Text style={styles.detail}>{option.description}</Text>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segments}>
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="radio"
          accessibilityLabel={option}
          accessibilityState={{ checked: option === value }}
          onPress={() => onChange(option)}
          style={({ pressed }) => [
            styles.segment,
            option === value && styles.selected,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.label}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Picker({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: readonly Choice[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<View>(null);
  const heading = useRef<Text>(null);
  function close() {
    setOpen(false);
    if (trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, "focus");
  }
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${options.find((option) => option.value === value)?.label || "Choose an option"}`}
        accessibilityState={{ expanded: open, disabled }}
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={[styles.choice, styles.picker]}
      >
        <Text style={styles.label}>
          {options.find((option) => option.value === value)?.label || "Choose an option"}
        </Text>
        <Text style={styles.detail}>Change</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={close}
        onDismiss={() => {
          if (trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, "focus");
        }}
        onShow={() => {
          if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, "focus");
        }}
      >
        <View style={styles.scrim}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <Text ref={heading} accessibilityRole="header" style={styles.heading}>
              {label}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <RadioGroup
                label="Choose one option"
                value={value}
                options={options}
                onChange={(next) => {
                  onChange(next);
                  close();
                }}
              />
            </ScrollView>
            <Button label="Cancel" variant="secondary" onPress={close} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  group: { gap: theme.spacing.sm },
  choice: {
    minHeight: theme.control.minHeight,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.controlRadius,
  },
  picker: {
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    backgroundColor: theme.colors.surface,
    justifyContent: "space-between",
  },
  selected: { backgroundColor: theme.colors.selected },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
  copy: { flex: 1, gap: theme.spacing.xs },
  label: {
    fontFamily: "InstrumentSans600",
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text,
    flexShrink: 1,
  },
  detail: {
    fontFamily: "InstrumentSans400",
    fontSize: theme.typography.compactBody.fontSize,
    lineHeight: theme.typography.compactBody.lineHeight,
    color: theme.colors.secondaryText,
  },
  indicator: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    borderRadius: theme.radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkMark: {
    width: 9,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors.primaryText,
    transform: [{ rotate: "-45deg" }],
  },
  radio: { borderRadius: theme.radius.round },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.primaryText,
  },
  segments: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    borderRadius: theme.controlRadius,
    padding: theme.spacing.xs,
  },
  segment: {
    flexGrow: 1,
    minHeight: theme.control.minHeight,
    padding: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.controlRadius,
  },
  scrim: { flex: 1, backgroundColor: theme.colors.scrim, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "85%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.large,
    borderTopRightRadius: theme.radius.large,
    padding: theme.spacing.xl,
    paddingBottom: rt.insets.bottom + theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  heading: {
    fontFamily: "Newsreader500",
    fontSize: theme.typography.sectionTitle.fontSize,
    lineHeight: theme.typography.sectionTitle.lineHeight,
    color: theme.colors.text,
  },
}));
