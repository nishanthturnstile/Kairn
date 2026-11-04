import { useId } from "react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Media } from "./journey-content";
import "./journey-patterns.css";

export type TimelineEntry = {
  id: string;
  dayLabel: string;
  title: string;
  timeLabel?: string;
  timezoneLabel?: string;
  locationLabel?: string;
  evidence: "recorded" | "reported" | "estimated" | "unknown";
  branchLabel?: string;
  contributors?: readonly string[];
};

// Order and time labels belong to the caller. Never sort unknown times or infer a route.
export function JourneyTimeline({
  entries,
  selectedId,
  onSelect,
}: {
  entries: readonly TimelineEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const id = useId();
  if (!entries.length) return <p>No chronology is available.</p>;
  return (
    <ol className="journey-timeline" aria-label="Journey timeline">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button
            type="button"
            data-slot="button"
            className="journey-timeline-button"
            aria-label={`${entry.dayLabel}: ${entry.title}`}
            aria-pressed={selectedId === entry.id}
            aria-describedby={`${id}-${entry.id}`}
            onClick={() => onSelect(entry.id)}
          >
            <span className="journey-pattern-meta">{entry.dayLabel}</span>
            <strong className="journey-pattern-title">{entry.title}</strong>
            <span id={`${id}-${entry.id}`} className="journey-pattern-meta">
              {entry.timeLabel || "Time unknown"} · {entry.timezoneLabel || "Timezone unknown"}
              <br />
              {entry.locationLabel || "Location unknown"} · Evidence: {entry.evidence}
              {entry.branchLabel && (
                <>
                  <br />
                  Parallel account: {entry.branchLabel}
                </>
              )}
              {!!entry.contributors?.length && (
                <>
                  <br />
                  {entry.contributors.join(", ")}
                </>
              )}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

type Scope = "only-me" | "journey-review" | "publication";
const scopeLabels = {
  "only-me": "Only me",
  "journey-review": "Review only",
  publication: "Publication permitted",
};
export function SourceScopeSummary({
  scope,
  withdrawn = false,
}: {
  scope: Scope;
  withdrawn?: boolean;
}) {
  return (
    <div className="journey-scope">
      <strong>{withdrawn ? "Withdrawn from the journey" : scopeLabels[scope]}</strong>
      <p>
        {withdrawn
          ? "Journey review and publication cannot use this source. The owner retains their original."
          : scope === "only-me"
            ? "Private to the source owner."
            : scope === "journey-review"
              ? "Coauthors and publishers may review this source. Publication is not permitted."
              : "This source may be considered for an approved version. Permission alone does not publish it."}
      </p>
      <p className="journey-pattern-meta">
        Attribution and permission to use a source do not grant original-file export.
      </p>
    </div>
  );
}

export type MomentItem = {
  id: string;
  title: string;
  owner: string;
  attribution: string;
  kind: string;
  capturedLabel: string;
  enteredLabel: string;
  scope: Scope;
  withdrawn: boolean;
  body: string;
  media?: { src: string; alt: string; caption: string };
};

// Only already-authorized items may enter this component. It never fetches originals.
export function MomentGallery({
  items,
  selectedId,
  onSelect,
  onClose,
  emptyMessage = "No moments are available.",
}: {
  items: readonly MomentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  emptyMessage?: string;
}) {
  const selected = items.find((item) => item.id === selectedId);
  return (
    <div className="journey-moments">
      {!items.length && <p role="status">{emptyMessage}</p>}
      <ul className="journey-moment-list" aria-label="Available moments">
        {items.map((item) => (
          <li className="journey-moment" key={item.id}>
            <h3 className="journey-pattern-title">{item.title}</h3>
            <p className="journey-pattern-meta">
              Source owner: {item.owner} · {item.kind}
            </p>
            <p className="journey-pattern-meta">Captured: {item.capturedLabel}</p>
            <p>{item.withdrawn ? "Withdrawn from the journey" : scopeLabels[item.scope]}</p>
            <Button variant="secondary" onClick={() => onSelect(item.id)}>
              Open moment: {item.title}
            </Button>
          </li>
        ))}
      </ul>
      <Dialog
        open={!!selected}
        title={selected?.title || "Moment unavailable"}
        onClose={onClose}
        closeLabel="Close moment"
        fullScreen
      >
        {selected && (
          <div className="journey-moment-detail">
            <p className="journey-pattern-meta">
              Source owner: {selected.owner} · Credit: {selected.attribution} · {selected.kind}
            </p>
            <p>Captured: {selected.capturedLabel}</p>
            <p className="journey-pattern-meta">Entered: {selected.enteredLabel}</p>
            {selected.media ? (
              <Media key={selected.id} {...selected.media} presentation="detail" />
            ) : (
              selected.kind !== "note" &&
              selected.kind !== "remembered" && (
                <p className="journey-media-unavailable">
                  {selected.kind} preview unavailable. The source description remains below.
                </p>
              )
            )}
            <p>{selected.body}</p>
            <SourceScopeSummary scope={selected.scope} withdrawn={selected.withdrawn} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
