import { useId } from "react";
import type { EditablePowers } from "@kairn/contracts";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field";

export function CapabilityEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: EditablePowers;
  onChange: (powers: EditablePowers) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <FieldSet disabled={disabled}>
      <FieldLegend>Journey powers</FieldLegend>
      <FieldDescription id={`${id}-audience`}>
        Coauthors and publishers can review contributed material. These powers never grant access to
        private galleries or original-file downloads.
      </FieldDescription>
      <FieldGroup>
        <Field orientation="horizontal">
          <input
            id={`${id}-coauthor`}
            type="checkbox"
            checked={value.coauthor}
            aria-describedby={`${id}-audience`}
            onChange={(event) => onChange({ ...value, coauthor: event.target.checked })}
          />
          <FieldLabel htmlFor={`${id}-coauthor`}>Coauthor · edits the shared story</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <input
            id={`${id}-publisher`}
            type="checkbox"
            checked={value.publisher}
            aria-describedby={`${id}-audience`}
            onChange={(event) => onChange({ ...value, publisher: event.target.checked })}
          />
          <FieldLabel htmlFor={`${id}-publisher`}>Publisher · approves publication</FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
