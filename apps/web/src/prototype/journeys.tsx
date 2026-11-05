import { Input } from "../components/ui/input";
import { useEffect, useRef, useState } from "react";
import { JourneyWorkspace } from "./workspace";
import { Link } from "@tanstack/react-router";
import { Button, Field, Status } from "../components/prototype-controls";
import { useSample } from "./context";
import { project, seed } from "./controller";
import { JourneyCover, JournalIcon } from "./visuals";

export function Journeys() {
  const { state, dispatch } = useSample();
  const [form, setForm] = useState<"create" | "join" | null>(null);
  const [title, setTitle] = useState(seed.journey.title);
  const [code, setCode] = useState("");
  const [titleError, setTitleError] = useState("");
  const formPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (form) formPanel.current?.querySelector("input")?.focus();
  }, [form]);
  return (
    <>
      <div className="sample-page-heading">
        <div>
          <p className="sample-greeting">Your places. Your people. Your stories.</p>
          <h1>Your journeys</h1>
          <p className="sample-lead">Keep a little of the way you felt.</p>
        </div>
        <Button
          onClick={() => setForm(form === "create" ? null : "create")}
          aria-expanded={form === "create"}
        >
          <JournalIcon name="plus" />
          Create journey
        </Button>
      </div>
      {form && (
        <section className="sample-form-panel" ref={formPanel}>
          <div className="sample-section-heading">
            <h2>{form === "create" ? "Start a shared journal" : "Join your group"}</h2>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Close
            </Button>
          </div>
          {form === "create" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setTitleError(title.trim() ? "" : "Enter a journey title.");
                dispatch({ type: "create", title });
                if (title.trim()) setForm(null);
              }}
            >
              <Field
                label="Journey title"
                hint="Only a local sample is created."
                error={titleError}
              >
                {(id, descriptionId) => (
                  <Input
                    id={id}
                    aria-describedby={descriptionId}
                    aria-invalid={!!titleError}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={160}
                    required
                  />
                )}
              </Field>
              <Button type="submit">Create sample journey</Button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                dispatch({ type: "join", code });
                if (code.trim().toUpperCase() === "RIDGE") setForm(null);
              }}
            >
              <Field label="Sample invitation code" hint="Use RIDGE. No invitation is sent.">
                {(id, descriptionId) => (
                  <Input
                    id={id}
                    aria-describedby={descriptionId}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    autoCapitalize="characters"
                  />
                )}
              </Field>
              <Button type="submit">Join sample journey</Button>
              <p role="status">{state.notice}</p>
            </form>
          )}
        </section>
      )}
      <div className="sample-section-heading">
        <h2>{state.joined ? "Back to your story" : "A little inspiration to begin"}</h2>
        <span className="sample-muted">
          {state.joined ? "1 shared journal" : "Explore the fictional sample"}
        </span>
      </div>
      <JourneyCover title={state.joined ? state.title : seed.journey.title}>
        {state.joined ? (
          <Link
            className="sample-open"
            to="/prototype/journey/$journeyId"
            params={{ journeyId: seed.journey.id }}
            onClick={() => dispatch({ type: "revisit" })}
          >
            Open journey
            <JournalIcon name="arrow" />
          </Link>
        ) : (
          <Button onClick={() => dispatch({ type: "reset", scenario: "prepared-trip" })}>
            Explore sample
            <JournalIcon name="arrow" />
          </Button>
        )}
      </JourneyCover>
      <div className="sample-home-bottom">
        <section className="sample-invite">
          <span className="sample-icon-tile">
            <JournalIcon name="journeys" />
          </span>
          <div>
            <h2>Better remembered together.</h2>
            <p>Have an invitation? Find your people and add your perspective.</p>
            <Button
              variant="secondary"
              onClick={() => setForm(form === "join" ? null : "join")}
              aria-expanded={form === "join"}
            >
              Join with invite
              <JournalIcon name="arrow" />
            </Button>
          </div>
        </section>
        <section className="sample-private">
          <JournalIcon name="lock" />
          <h3>Yours until you share.</h3>
          <p>Your gallery stays private. You choose the moments your group can see.</p>
        </section>
      </div>
      {!state.joined && (
        <p className="sample-muted">
          No journeys in your account yet. The journal above is a prepared sample.
        </p>
      )}
    </>
  );
}

export function JourneyOverview({ journeyId }: { journeyId: string }) {
  const { state, dispatch } = useSample();
  const output = project(state);
  if (!state.joined || journeyId !== state.journeyId)
    return (
      <section className="sample-empty">
        <h1>Journey unavailable</h1>
        <p>Create or join the sample journey in this session first.</p>
        <Link to="/prototype">Back to journeys</Link>
      </section>
    );
  const actor = state.data.actors.find((item) => item.id === state.actorId)!;
  return (
    <>
      <div className="sample-section-heading">
        <Link to="/prototype">Back to journeys</Link>
        <Status>Private sample journal</Status>
      </div>
      <JourneyCover title={state.title} compact />
      <JourneyWorkspace key={state.actorId} />
      <div className="sample-two">
        <section className="sample-note">
          <h2>Your place in this journey</h2>
          <p>
            <strong>{actor.name}</strong>
          </p>
          <div className="sample-inline">
            <Status>{actor.admin ? "Administrator" : "Participant"}</Status>
            {actor.coauthor && <Status>Coauthor</Status>}
            {actor.publisher && <Status>Publisher</Status>}
          </div>
          <p>
            {output.canReview
              ? "You can review the shared draft and contributed sources."
              : "The shared draft and other people’s review sources are not available to this actor."}
          </p>
          <p className="sample-muted">Private galleries are never a group library.</p>
        </section>
        <section className="sample-note">
          <span className="sample-icon-tile">
            <JournalIcon name="reader" />
          </span>
          <h2>Every detail has a story.</h2>
          <p>Explore the controls for notes, audience, source credits and practical details.</p>
          <Link to="/prototype/components">
            View the design system
            <JournalIcon name="arrow" />
          </Link>
        </section>
      </div>
      <details className="sample-continuation">
        <summary>Prepared continuation</summary>
        <p>Load the prepared web continuation. This prototype does not sync devices.</p>
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "reset", scenario: "review-moment-19" })}
        >
          Load review-moment-19
        </Button>
      </details>
      {state.scenario === "review-moment-19" && output.canViewContinuation && (
        <div className="sample-note">
          <strong>Rain at the tea stop</strong>
          <p>{output.continuation.content}</p>
          <Status tone="review">Journey review · not eligible for publication</Status>
          <p className="sample-muted">
            sample-moment-19 · Dev Raman · prepared sample, not a live transfer
          </p>
        </div>
      )}
    </>
  );
}
