import { useCallback, useEffect, useRef, type RefObject } from "react";
import { AccessibilityInfo, Platform, type View } from "react-native";

// RN 0.88 emits Modal.onDismiss on iOS only. Android removes the modal when
// visible becomes false; request focus after that commit, never on first mount.
export function useModalFocus(open: boolean, trigger: RefObject<View | null>) {
  const wasOpen = useRef(false);
  const restoreFocus = useCallback(() => {
    if (trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, "focus");
  }, [trigger]);

  useEffect(() => {
    const closed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!closed || Platform.OS === "ios") return;
    const frame = requestAnimationFrame(restoreFocus);
    return () => cancelAnimationFrame(frame);
  }, [open, restoreFocus]);

  return restoreFocus;
}
