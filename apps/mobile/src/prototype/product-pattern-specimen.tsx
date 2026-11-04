import { useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { JournalText } from "../components/journal-controls";
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
          source:
            media === "ridge"
              ? require("./generated/ridge-sample.png")
              : { uri: "data:image/png;base64,AA==" },
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
    <View style={styles.specimen}>
      <JournalText muted>
        Fictional owner/reviewer projection. Select a stage to filter moments. Unknown times and
        parallel accounts remain separate.
      </JournalText>
      <Button
        variant="secondary"
        label={extended ? "Show short timeline" : "Show 18-day timeline"}
        onPress={() => {
          setExtended(!extended);
          setStageId(null);
          setMomentId(null);
        }}
      />
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
        label="Show all specimen moments"
        onPress={() => {
          setStageId(null);
          setMomentId(null);
        }}
      />
      <MomentGallery
        items={items}
        selectedId={momentId}
        onSelect={setMomentId}
        onClose={() => setMomentId(null)}
        emptyMessage="No permitted moments in this stage. Other stages remain available."
      />
    </View>
  );
}
const styles = StyleSheet.create((theme) => ({ specimen: { gap: theme.spacing.lg } }));
