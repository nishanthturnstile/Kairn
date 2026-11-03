import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Field, Status } from "../components/prototype-controls";
import { useSample } from "./context";
import { project, seed } from "./controller";

export function Journeys() {
  const { state, dispatch } = useSample();
  const [title, setTitle] = useState(seed.journey.title);
  const [code, setCode] = useState("");
  const [titleError, setTitleError] = useState("");
  return (
    <>
      <h1>Your journeys</h1>
      <p className="sample-lead">A place for what happened along the way.</p>
      {state.joined ? (
        <article className="sample-journey">
          <div className="sample-journey-line" aria-hidden="true" />
          <div>
            <Status>Sample journey · no cover</Status>
            <h2>{state.title}</h2>
            <p>
              {seed.journey.start} — {seed.journey.end}
            </p>
            <p className="sample-muted">{seed.journey.place}</p>
            <Link
              to="/prototype/journey/$journeyId"
              params={{ journeyId: seed.journey.id }}
              onClick={() => dispatch({ type: "revisit" })}
            >
              Open journey
            </Link>
          </div>
        </article>
      ) : (
        <section className="sample-empty">
          <h2>Every journey starts with a little space.</h2>
          <p>
            Create the shared journal, or join your group’s. Your gallery stays private until you
            choose what to contribute.
          </p>
          <span className="sample-muted">No journeys yet · no cover image needed</span>
        </section>
      )}
      <div className="sample-two">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setTitleError(title.trim() ? "" : "Enter a journey title.");
            dispatch({ type: "create", title });
          }}
        >
          <h2>Create a sample journey</h2>
          <Field label="Journey title" hint="Only a local sample is created." error={titleError}>
            {(id, descriptionId) => (
              <input
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "join", code });
          }}
        >
          <h2>Join your group</h2>
          <Field label="Sample invitation code" hint="Use RIDGE. No invitation is sent.">
            {(id, descriptionId) => (
              <input
                id={id}
                aria-describedby={descriptionId}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoCapitalize="characters"
              />
            )}
          </Field>
          <Button type="submit" variant="secondary">
            Join sample journey
          </Button>
        </form>
      </div>
    </>
  );
}
export function JourneyOverview({ journeyId }: { journeyId: string }) {
  const { state, dispatch } = useSample();
  const output = project(state);
  if (!state.joined || journeyId !== state.journeyId)
    return (
      <>
        <h1>Journey unavailable</h1>
        <p>Create or join the sample journey in this session first.</p>
        <Link to="/prototype">Back to journeys</Link>
      </>
    );
  const actor = state.data.actors.find((item) => item.id === state.actorId)!;
  return (
    <>
      <Link to="/prototype">Back to journeys</Link>
      <h1>{state.title}</h1>
      <p className="sample-lead">
        {seed.journey.start} — {seed.journey.end}
      </p>
      <Status>No cover · sample</Status>
      <h2>One journey, independent powers</h2>
      <p>
        {actor.name} · {actor.admin ? "Administrator" : "Participant"}
        {actor.coauthor ? " · Coauthor" : ""}
        {actor.publisher ? " · Publisher" : ""}
      </p>
      <p>
        {output.canReview
          ? "You can review the shared draft and contributed sources."
          : "The shared draft and other people’s review sources are not available to this actor."}
      </p>
      <p className="sample-muted">
        {state.journeyId} · Private galleries are never a group library.
      </p>
      <h2>Prepared continuation</h2>
      <p>Load the prepared web continuation. This prototype does not sync devices.</p>
      <Button
        variant="secondary"
        onClick={() => dispatch({ type: "reset", scenario: "review-moment-19" })}
      >
        Load review-moment-19
      </Button>
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
      <p>
        <Link to="/prototype/components">Inspect the component specimens</Link>
      </p>
      <p className="sample-muted">
        Capture, story composition, People and publication controls arrive in P03–P05.
      </p>
    </>
  );
}
