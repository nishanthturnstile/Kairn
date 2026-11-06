import type { ComponentProps } from "react";

export function TextArea({ className = "", ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={`atlas-input atlas-textarea ${className}`}
      {...props}
    />
  );
}
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select data-slot="select" className={`atlas-input ${className}`} {...props} />;
}
