import { useId, type ComponentProps, type ReactNode } from "react";
import { Field, FieldLabel, FieldDescription, FieldError } from "./field";

export function FormField({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (id: string, descriptionId: string) => ReactNode;
}) {
  const id = useId();
  return (
    <Field data-invalid={!!error} className="atlas-field">
      <FieldLabel htmlFor={id}>
        {label}
        {optional && <span className="atlas-meta"> (optional)</span>}
      </FieldLabel>
      {children(id, `${id}-help`)}
      {error ? (
        <FieldError id={`${id}-help`}>{error}</FieldError>
      ) : (
        <FieldDescription id={`${id}-help`}>{hint}</FieldDescription>
      )}
    </Field>
  );
}
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
export function Checkbox({
  label,
  description,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string; description?: string }) {
  return (
    <label className="atlas-choice">
      <input type="checkbox" {...props} />
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}
export type Choice = { value: string; label: string; description?: string; disabled?: boolean };
export function RadioGroup({
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
  const name = useId();
  return (
    <fieldset className="atlas-radio-group" disabled={disabled}>
      <legend>{label}</legend>
      {options.map((option) => (
        <label className="atlas-choice" key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span>
            <strong>{option.label}</strong>
            {option.description && <small>{option.description}</small>}
          </span>
        </label>
      ))}
    </fieldset>
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
  const name = useId();
  return (
    <fieldset className="atlas-segmented">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option} data-selected={value === option}>
          <input
            className="atlas-segment-input"
            type="radio"
            name={name}
            checked={value === option}
            value={option}
            onChange={() => onChange(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );
}
