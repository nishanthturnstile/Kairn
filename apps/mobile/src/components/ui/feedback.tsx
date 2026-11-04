import { useRef, type ReactNode, type RefObject } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./button";
import { useModalFocus } from "./modal-focus";

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "review" | "success";
}) {
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, styles[tone]]}>
      <Text
        style={[
          styles.body,
          tone === "error" && styles.errorText,
          tone === "review" && styles.reviewText,
          tone === "success" && styles.successText,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
export function Dialog({
  open,
  title,
  children,
  onClose,
  action,
  actionLabel,
  destructive = false,
  returnFocusRef,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  action?: () => void;
  actionLabel?: string;
  destructive?: boolean;
  returnFocusRef: RefObject<View | null>;
}) {
  const cancelRef = useRef<View>(null);
  const restoreFocus = useModalFocus(open, returnFocusRef);
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onDismiss={restoreFocus}
      onShow={() => {
        if (cancelRef.current) AccessibilityInfo.sendAccessibilityEvent(cancelRef.current, "focus");
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.scrim}
      >
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          <Button ref={cancelRef} label="Cancel" variant="secondary" onPress={onClose} />
          {action && (
            <Button
              label={actionLabel || "Confirm"}
              variant={destructive ? "destructive" : "primary"}
              onPress={action}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  notice: { padding: theme.spacing.lg, borderRadius: theme.controlRadius },
  info: { backgroundColor: theme.colors.riverSurface },
  error: { backgroundColor: theme.colors.errorSurface },
  review: { backgroundColor: theme.colors.reviewSurface },
  success: { backgroundColor: theme.colors.successSurface },
  body: {
    fontFamily: "InstrumentSans400",
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text,
  },
  errorText: { color: theme.colors.error },
  reviewText: { color: theme.colors.reviewText },
  successText: { color: theme.colors.success },
  scrim: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.xl,
    paddingTop: rt.insets.top + theme.spacing.xl,
    paddingBottom: rt.insets.bottom + theme.spacing.xl,
    backgroundColor: theme.colors.scrim,
  },
  dialog: {
    maxHeight: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.medium,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  title: {
    fontFamily: "Newsreader500",
    fontSize: theme.typography.sectionTitle.fontSize,
    lineHeight: theme.typography.sectionTitle.lineHeight,
    color: theme.colors.text,
  },
}));
