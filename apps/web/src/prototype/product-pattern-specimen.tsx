import { useState } from "react";
import ridge from "./generated/ridge-sample.png";
import {
  JourneyTimeline,
  MomentGallery,
  type TimelineEntry,
  type MomentItem,
} from "../components/journey-patterns";
import { Button } from "../components/ui/button";
import fixture from "./generated/product-patterns.json";

const baseTimeline: TimelineEntry[] = fixture.timeline.map((entry) => ({
  ...entry,
  evidence:
    entry.evidence === "reported"
      ? "reported"
      : entry.evidence === "estimated"
        ? "estimated"
        : "unknown",
}));
const longTimeline: TimelineEntry[] = [
  ...baseTimeline,
  ...Array.from({ length: 15 }, (_, index) => ({
    id: `long-day-${index + 4}`,
    dayLabel: `Day ${index + 4}`,
    title: index % 3 === 0 ? "A pause between places" : "A day with an incomplete record",
    evidence: "unknown" as const,
  })),
];

const moments: MomentItem[] = fixture.moments.map(({ media, ...item }) => ({
  ...item,
  scope:
    item.scope === "publication"
      ? "publication"
      : item.scope === "journey-review"
        ? "journey-review"
        : "only-me",
  ...(media
    ? {
        media: {
          src: media === "ridge" ? ridge : "data:image/png;base64,AA==",
          alt:
            media === "ridge"
              ? "Generated illustration of a ridge above cloud"
              : "Unavailable fictional photograph",
          caption:
            media === "ridge"
              ? "Generated demonstration illustration · not journey evidence"
              : "Image unavailable specimen · caption retained",
        },
      }
    : {}),
}));

export function ProductPatternSpecimen() {
  const [extended, setExtended] = useState(false);
  const [stageId, setStageId] = useState<string | null>(null);
  const [momentId, setMomentId] = useState<string | null>(null);
  const items = moments.filter(
    (item) =>
      !stageId || fixture.moments.find((source) => source.id === item.id)?.stage === stageId,
  );
  return (
    <div className="journey-pattern-specimen">
      <p className="journey-pattern-meta">
        Fictional owner/reviewer projection. Select a stage to filter moments. Unknown times and
        parallel accounts remain separate.
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          setExtended(!extended);
          setStageId(null);
          setMomentId(null);
        }}
      >
        {extended ? "Show short timeline" : "Show 18-day timeline"}
      </Button>
      <JourneyTimeline
        entries={extended ? longTimeline : baseTimeline}
        selectedId={stageId}
        onSelect={(id) => {
          setStageId(id);
          setMomentId(null);
        }}
      />
      <Button
        variant="secondary"
        onClick={() => {
          setStageId(null);
          setMomentId(null);
        }}
      >
        Show all specimen moments
      </Button>
      <MomentGallery
        items={items}
        selectedId={momentId}
        onSelect={setMomentId}
        onClose={() => setMomentId(null)}
        emptyMessage="No permitted moments in this stage. Other stages remain available."
      />
    </div>
  );
}
