import { SegmentedControl, Select, TextArea } from "../components/ui/form-controls";
import { useState } from "react";
import { AudienceSelector, Button, Field, Status } from "../components/prototype-controls";
import { useSample } from "./context";
import { project } from "./controller";
import { JourneyTimeline, MomentGallery } from "../components/journey-patterns";
import { journeyPresentation } from "./journey-presenter";

export function JourneyWorkspace() {
  const { state, dispatch } = useSample();
  const output = project(state);
  const [area, setArea] = useState("Moments");
  const [filter, setFilter] = useState("All days");
  const [caption, setCaption] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [stageId, setStageId] = useState<string | null>(null);
  const [momentId, setMomentId] = useState<string | null>(null);
  const presentation = journeyPresentation(state);
  const filtered = output.visibleMoments.filter(
    (source) =>
      (!stageId || source.stage === stageId) &&
      (filter === "All days" ||
        `Day ${state.data.stages.find((stage) => stage.id === source.stage)?.day}` === filter),
  );
  return (
    <section className="atlas-workspace">
      <SegmentedControl
        label="Journey workspace"
        value={area}
        options={["Moments", "Story", "People", "Review"]}
        onChange={setArea}
      />
      {area === "Moments" && (
        <>
          <h2>Small moments. A whole journey.</h2>
          <p>Only your sources and contributions you can review appear here.</p>
          <label className="atlas-filter">
            Moment day
            <Select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setStageId(null);
                setMomentId(null);
              }}
            >
              {[
                "All days",
                ...Array.from(new Set(state.data.stages.map((stage) => `Day ${stage.day}`))),
              ].map((day) => (
                <option key={day}>{day}</option>
              ))}
            </Select>
          </label>
          {output.canReview && (
            <>
              <h3>Journey timeline</h3>
              <p>
                Stage order is prepared sample data. Clock times and locations have not been
                supplied.
              </p>
              <JourneyTimeline
                entries={presentation.timeline}
                selectedId={stageId}
                onSelect={(id) => {
                  setStageId(id);
                  setFilter("All days");
                  setMomentId(null);
                }}
              />
            </>
          )}
          {(stageId || filter !== "All days") && (
            <Button
              variant="secondary"
              onClick={() => {
                setStageId(null);
                setFilter("All days");
                setMomentId(null);
              }}
            >
              Show all moments
            </Button>
          )}
          <MomentGallery
            items={presentation.moments.filter((item) =>
              filtered.some((source) => source.id === item.id),
            )}
            selectedId={momentId}
            onSelect={setMomentId}
            onClose={() => setMomentId(null)}
            emptyMessage="No moments are available for this day, stage and participant."
          />
          {filtered
            .filter((source) => source.id === "sample-moment-19" && source.owner === state.actorId)
            .map((source) => (
              <section className="atlas-detail" key={source.id} aria-label="Source permission">
                <h3>Permission for {source.title}</h3>
                <AudienceSelector
                  value={source.scope}
                  onChange={(scope) => dispatch({ type: "scope", scope })}
                  audience="Journey coauthors and publishers"
                />
              </section>
            ))}
        </>
      )}
      {area === "Story" && (
        <>
          <h2>Give the shared story its voice.</h2>
          {output.canEdit && output.draft ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPrevious(output.draft!.caption);
                dispatch({ type: "caption", caption: caption ?? output.draft!.caption });
                setCaption(null);
              }}
            >
              <Field
                label="Journey caption"
                hint="Session-only sample edit. Other contributors’ original sources stay unchanged."
              >
                {(id, descriptionId) => (
                  <TextArea
                    id={id}
                    aria-describedby={descriptionId}
                    value={caption ?? output.draft!.caption}
                    onChange={(event) => setCaption(event.target.value)}
                    rows={4}
                  />
                )}
              </Field>
              <div className="sample-inline">
                <Button type="submit">Save sample caption</Button>
                <Button
                  variant="secondary"
                  disabled={previous === null}
                  onClick={() => {
                    if (previous !== null) dispatch({ type: "caption", caption: previous });
                    setPrevious(null);
                    setCaption(null);
                  }}
                >
                  Undo last caption edit
                </Button>
              </div>
              <p className="atlas-meta">
                Draft revision {output.draft.revision}. Saving does not publish.
              </p>
            </form>
          ) : (
            <p>
              Coauthor access is needed to edit this draft. Being an administrator does not grant
              story access.
            </p>
          )}
        </>
      )}
      {area === "People" && (
        <>
          <h2>One journey, different perspectives.</h2>
          <p>Journey roles and permission to use someone’s sources are separate.</p>
          {state.data.actors
            .filter((actor) => actor.member)
            .map((actor) => (
              <article className="atlas-detail" key={actor.id}>
                <h3>{actor.name}</h3>
                <div className="sample-inline">
                  <Status>Participant</Status>
                  {actor.admin && <Status>Administrator</Status>}
                  {actor.coauthor && <Status>Coauthor</Status>}
                  {actor.publisher && <Status>Publisher</Status>}
                </div>
              </article>
            ))}
        </>
      )}
      {area === "Review" && (
        <>
          <h2>A deliberate step before sharing.</h2>
          {output.canPublish ? (
            <>
              <p>
                {output.approved.sourceIds.length} sample sources remain eligible in the prepared
                approved set. Private, withdrawn and unapproved material is excluded.
              </p>
              <p>
                Original-file exports require a separate grant. This prototype does not issue a
                publication or sharing link.
              </p>
            </>
          ) : (
            <p>
              A designated publisher must review a publication. Your ability to contribute does not
              grant publishing permission.
            </p>
          )}
          <Status>Private draft remains private</Status>
        </>
      )}
    </section>
  );
}
