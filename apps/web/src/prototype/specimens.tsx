import { useState } from "react";
import { AudienceSelector, Button, Field, Status } from "../components/prototype-controls";
import type { Scope } from "./controller";

export function Specimens() {
  const [scope, setScope] = useState<Scope>("journey-review");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(true);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <h1>The field-journal kit</h1>
      <p className="sample-lead">Small controls. Clear consequences.</p>
      <p className="sample-muted">
        Component specimens · isolated examples, no source permissions change here.
      </p>
      <section className="sample-specimen">
        <h2>Audience & rights</h2>
        <AudienceSelector
          value={scope}
          onChange={setScope}
          audience="Mira Sen, Leo Martin (coauthors); Mira Sen, Noor Jayasinghe (publishers)."
        />
        <div className="sample-inline">
          <Status tone="review">Review only · publication blocked</Status>
          <Status>Original export · not approved</Status>
        </div>
      </section>
      <section className="sample-specimen">
        <h2>Actions & feedback</h2>
        <div className="sample-inline">
          <Button disabled={pending} aria-busy={pending} onClick={() => setPending(true)}>
            {pending ? "Saving sample…" : "Save sample"}
          </Button>
          <Button variant="secondary" onClick={() => setPending(false)}>
            Clear pending example
          </Button>
          <Button disabled variant="secondary">
            Publish unavailable
          </Button>
        </div>
        <p role="status">
          {pending
            ? "Pending specimen. No timer or real save. Clear it explicitly."
            : "Ready for a sample action."}
        </p>
        <Field
          label="Journey title"
          hint="A long title wraps without hiding the action."
          error={error ? "Could not save this example. Your title is retained." : ""}
        >
          {(id, descriptionId) => (
            <input
              id={id}
              aria-describedby={descriptionId}
              aria-invalid={error}
              defaultValue="Four friends, a slow train, and the long way home through the hill country"
            />
          )}
        </Field>
        <Button variant="secondary" onClick={() => setError(!error)}>
          {error ? "Retry sample" : "Show error example"}
        </Button>
      </section>
      <section className="sample-specimen">
        <h2>People & source rows</h2>
        <div className="sample-row">
          <span className="sample-avatar" aria-hidden="true">
            AF
          </span>
          <div>
            <strong>Asha Fernando With A Very Long Display Name</strong>
            <p className="sample-muted">Administrator only · no draft or source-review access</p>
          </div>
        </div>
        <div className="sample-row">
          <div>
            <strong>Rain at the tea stop</strong>
            <p className="sample-muted">Dev Raman · note · location unknown</p>
          </div>
          <Status tone="review">Review only</Status>
        </div>
        <p>Saving, uploading, contributing and permitting publication are separate steps.</p>
      </section>
      <section className="sample-specimen">
        <h2>Impact confirmation</h2>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Inspect withdrawal impact
        </Button>
        {confirm && (
          <div className="sample-note">
            <h3>Withdraw “Rain at the tea stop”?</h3>
            <p>
              Journey review and dependent hosted output become unavailable. Your original remains
              yours. Already downloaded copies cannot be recalled.
            </p>
            <p className="sample-muted">
              Illustrative confirmation only. No restriction receipt is created.
            </p>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep the current permission
            </Button>
          </div>
        )}
      </section>
      <section className="sample-empty">
        <h2>No cover. Still your journey.</h2>
        <p>
          11–14 July 2026 · A quiet, intentional space for a journal that hasn’t received its first
          photograph.
        </p>
      </section>
    </>
  );
}
export function ReaderShell() {
  return (
    <>
      <h1>The long way to the ridge</h1>
      <p className="sample-lead">A shared journey, told together.</p>
      <Status>Fictional public sample · shell only</Status>
      <nav className="sample-inline" aria-label="Public views">
        <span aria-current="page">Story</span>
        <span>Explore · P05</span>
        <span>Learn · P05</span>
      </nav>
      <section className="sample-empty">
        <h2>The story is still taking shape.</h2>
        <p>
          The approved-reader walkthrough arrives in P05. This page is a labelled navigation shell;
          it doesn’t publish or expose a draft.
        </p>
      </section>
    </>
  );
}
