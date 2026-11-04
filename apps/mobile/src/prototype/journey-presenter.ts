import type { MomentItem, TimelineEntry } from "../components/journey-patterns";
import { project, type SampleState } from "./controller";

// Sample presentation only. Real consumers must receive authorized server projections.
export function journeyPresentation(state: SampleState) {
  const output = project(state);
  const moments: MomentItem[] = output.visibleMoments.map((source) => ({
    id: source.id,
    title: source.title,
    owner:
      state.data.actors.find((actor) => actor.id === source.owner)?.name || "Source owner unknown",
    attribution: source.attribution,
    kind: source.kind,
    capturedLabel: source.capturedAt
      ? `${source.capturedAt.replace("T", " ")} · ${source.timezone || "Timezone unknown"}`
      : "Time unknown",
    enteredLabel: source.enteredAt || "Entry time unknown",
    scope:
      source.scope === "publication"
        ? "publication"
        : source.scope === "journey-review"
          ? "journey-review"
          : "only-me",
    withdrawn: source.withdrawn,
    body: source.content,
  }));
  const timeline: TimelineEntry[] = output.canReview
    ? state.data.stages.map((stage) => ({
        id: stage.id,
        dayLabel: `Day ${stage.day}`,
        title: stage.title,
        evidence:
          stage.evidence === "recorded"
            ? "recorded"
            : stage.evidence === "reported"
              ? "reported"
              : stage.evidence === "estimated"
                ? "estimated"
                : "unknown",
        // These stages have no clock time, timezone or location coordinates.
        contributors: [
          ...new Set(
            output.visibleMoments
              .filter((source) => source.stage === stage.id)
              .map(
                (source) =>
                  state.data.actors.find((actor) => actor.id === source.owner)?.name ||
                  "Source owner unknown",
              ),
          ),
        ],
      }))
    : [];
  return { moments, timeline };
}
