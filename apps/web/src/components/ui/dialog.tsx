import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

// The platform dialog supplies top-layer focus containment, inert siblings and Escape.
export function Dialog({
  open,
  title,
  children,
  onClose,
  action,
  actionLabel,
  destructive = false,
  closeLabel = "Cancel",
  fullScreen = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  action?: () => void;
  actionLabel?: string;
  destructive?: boolean;
  closeLabel?: string;
  fullScreen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement;
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={fullScreen ? "atlas-dialog atlas-dialog-fullscreen" : "atlas-dialog"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={id}>{title}</h2>
      <div
        className="atlas-dialog-body"
        tabIndex={fullScreen ? 0 : undefined}
        role={fullScreen ? "region" : undefined}
        aria-label={fullScreen ? `${title} details` : undefined}
      >
        {children}
      </div>
      <div className="atlas-actions">
        <Button ref={closeRef} variant="secondary" autoFocus onClick={onClose}>
          {closeLabel}
        </Button>
        {action && (
          <Button variant={destructive ? "destructive" : "primary"} onClick={action}>
            {actionLabel}
          </Button>
        )}
      </div>
    </dialog>
  );
}
