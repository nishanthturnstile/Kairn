import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      type="button"
      data-slot="button"
      data-variant={variant}
      className={`sample-button sample-button-${variant}`}
      {...props}
    >
      {children}
    </button>
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
  const id = useId();
  return (
    <div className="sample-field">
      <label htmlFor={id}>{label}</label>
      {children(id, `${id}-help`)}
      <p id={`${id}-help`} className={error ? "sample-error" : "sample-muted"}>
        {error || hint}
      </p>
    </div>
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
  return (
    <fieldset className="sample-audience">
      <legend>Who can use this source?</legend>
      <p className="sample-muted">Review audience: {audience}</p>
      {scopeOptions.map((option) => (
        <label key={option.value} className="sample-choice">
          <input
            type="radio"
            name="source-scope"
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
