import { useRef, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./button";
import { useModalFocus } from "./modal-focus";

export type Choice = { value: string; label: string; description?: string; disabled?: boolean };
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
  const restoreFocus = useModalFocus(open, trigger);
  function close() {
    setOpen(false);
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
        style={({ pressed }) => [
          styles.choice,
          styles.picker,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.label, styles.pickerValue]}>
          {options.find((option) => option.value === value)?.label || "Choose an option"}
        </Text>
        <Text style={[styles.detail, styles.pickerAction]}>Change</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={close}
        onDismiss={restoreFocus}
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
  pickerValue: { flex: 1 },
  pickerAction: { flexShrink: 0 },
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
  radio: { borderRadius: theme.radius.round },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.primaryText,
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
