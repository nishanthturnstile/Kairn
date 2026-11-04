import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button as CoreButton } from "./ui/button";
import { FormField } from "./ui/form-controls";

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <CoreButton
      variant={
        variant === "danger" ? "destructive" : variant === "secondary" ? "secondary" : "primary"
      }
      pending={props["aria-busy"] === true}
      {...props}
    >
      {children}
    </CoreButton>
  );
}
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, descriptionId: string) => ReactNode;
}) {
  return (
    <FormField label={label} hint={hint ?? ""} error={error ?? ""}>
      {children}
    </FormField>
  );
}
export function Status({
  children,
  tone = "quiet",
}: {
  children: ReactNode;
  tone?: "quiet" | "review" | "error";
}) {
  return <span className={`sample-status sample-status-${tone}`}>{children}</span>;
}
export const scopeOptions = [
  { value: "only-me", label: "Only me", detail: "Private to the source owner." },
  {
    value: "journey-review",
    label: "Journey review",
    detail: "Coauthors and publishers can review. No publication.",
  },
  {
    value: "publication",
    label: "Allow journey publication and sharing",
    detail: "Eligible for approved presentations of this journey.",
  },
] as const;
export function AudienceSelector({
  value,
  onChange,
  audience,
}: {
  value: string;
  onChange: (value: (typeof scopeOptions)[number]["value"]) => void;
  audience: string;
}) {
  const name = useId();
  return (
    <fieldset className="sample-audience">
      <legend>Who can use this source?</legend>
      <p className="sample-muted">Review audience: {audience}</p>
      {scopeOptions.map((option) => (
        <label key={option.value} className="sample-choice">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>
            <strong>{option.label}</strong>
            <small>{option.detail}</small>
          </span>
        </label>
      ))}
      <p className="sample-muted">
        Original-file export needs separate approval for named files, recipient and expiry.
      </p>
    </fieldset>
  );
}
