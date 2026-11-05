import { useRef, type RefObject } from "react";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./ui/button";
import { Dialog } from "./ui/feedback";
import { Media } from "./journey-content";
import { JournalText } from "./journal-controls";

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

export function JourneyTimeline({
  entries,
  selectedId,
  onSelect,
}: {
  entries: readonly TimelineEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!entries.length) return <JournalText>No chronology is available.</JournalText>;
  return (
    <View accessibilityLabel="Journey timeline" style={styles.list}>
      {entries.map((entry) => (
        <Pressable
          key={entry.id}
          accessibilityRole="button"
          accessibilityLabel={`${entry.dayLabel}: ${entry.title}`}
          accessibilityHint={`${entry.timeLabel || "Time unknown"}. ${entry.timezoneLabel || "Timezone unknown"}. ${entry.locationLabel || "Location unknown"}. Evidence: ${entry.evidence}.${entry.branchLabel ? ` Parallel account: ${entry.branchLabel}.` : ""}${entry.contributors?.length ? ` ${entry.contributors.join(", ")}.` : ""}`}
          accessibilityState={{ selected: selectedId === entry.id }}
          onPress={() => onSelect(entry.id)}
          style={({ pressed }) => [
            styles.timeline,
            selectedId === entry.id && styles.selected,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.meta}>{entry.dayLabel}</Text>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.meta}>
            {entry.timeLabel || "Time unknown"} · {entry.timezoneLabel || "Timezone unknown"}
          </Text>
          <Text style={styles.meta}>
            {entry.locationLabel || "Location unknown"} · Evidence: {entry.evidence}
          </Text>
          {entry.branchLabel && (
            <Text style={styles.meta}>Parallel account: {entry.branchLabel}</Text>
          )}
          {!!entry.contributors?.length && (
            <Text style={styles.meta}>{entry.contributors.join(", ")}</Text>
          )}
        </Pressable>
      ))}
    </View>
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
    <View style={styles.list}>
      <JournalText title>
        {withdrawn ? "Withdrawn from the journey" : scopeLabels[scope]}
      </JournalText>
      <JournalText>
        {withdrawn
          ? "Journey review and publication cannot use this source. The owner retains their original."
          : scope === "only-me"
            ? "Private to the source owner."
            : scope === "journey-review"
              ? "Coauthors and publishers may review this source. Publication is not permitted."
              : "This source may be considered for an approved version. Permission alone does not publish it."}
      </JournalText>
      <JournalText muted>
        Attribution and permission to use a source do not grant original-file export.
      </JournalText>
    </View>
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
  media?: { source: ImageSourcePropType; alt: string; caption: string };
};

function MomentRow({
  item,
  onOpen,
}: {
  item: MomentItem;
  onOpen: (id: string, ref: RefObject<View | null>) => void;
}) {
  const trigger = useRef<View>(null);
  return (
    <View style={styles.moment}>
      <JournalText title>{item.title}</JournalText>
      <JournalText muted>
        Source owner: {item.owner} · {item.kind}
      </JournalText>
      <JournalText muted>Captured: {item.capturedLabel}</JournalText>
      <JournalText>
        {item.withdrawn ? "Withdrawn from the journey" : scopeLabels[item.scope]}
      </JournalText>
      <Button
        ref={trigger}
        label={`Open moment: ${item.title}`}
        variant="secondary"
        onPress={() => onOpen(item.id, trigger)}
      />
    </View>
  );
}

// The caller supplies an authorized, bounded collection, never the private gallery.
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
  const origin = useRef<RefObject<View | null>>({ current: null });
  const selected = items.find((item) => item.id === selectedId);
  return (
    <View style={styles.list}>
      {!items.length && <JournalText>{emptyMessage}</JournalText>}
      {items.map((item) => (
        <MomentRow
          key={item.id}
          item={item}
          onOpen={(id, trigger) => {
            origin.current = trigger;
            onSelect(id);
          }}
        />
      ))}
      <Dialog
        open={!!selected}
        title={selected?.title || "Moment unavailable"}
        onClose={onClose}
        returnFocusRef={origin.current}
        closeLabel="Close moment"
        fullScreen
      >
        {selected && (
          <View style={styles.detail}>
            <JournalText muted>
              Source owner: {selected.owner} · Credit: {selected.attribution} · {selected.kind}
            </JournalText>
            <JournalText>Captured: {selected.capturedLabel}</JournalText>
            <JournalText muted>Entered: {selected.enteredLabel}</JournalText>
            {selected.media ? (
              <Media key={selected.id} {...selected.media} presentation="detail" />
            ) : (
              selected.kind !== "note" &&
              selected.kind !== "remembered" && (
                <JournalText>
                  {selected.kind} preview unavailable. The source description remains below.
                </JournalText>
              )
            )}
            <JournalText>{selected.body}</JournalText>
            <SourceScopeSummary scope={selected.scope} withdrawn={selected.withdrawn} />
          </View>
        )}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { gap: theme.spacing.md },
  timeline: {
    minHeight: theme.control.minHeight,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    borderRadius: theme.controlRadius,
    backgroundColor: theme.colors.surface,
  },
  selected: { backgroundColor: theme.colors.selected, borderColor: theme.colors.primary },
  pressed: { opacity: 0.78 },
  title: {
    fontFamily: "InstrumentSans600",
    fontSize: theme.typography.cardTitle.fontSize,
    lineHeight: theme.typography.cardTitle.lineHeight,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: "InstrumentSans400",
    fontSize: theme.typography.compactBody.fontSize,
    lineHeight: theme.typography.compactBody.lineHeight,
    color: theme.colors.secondaryText,
  },
  moment: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  detail: { gap: theme.spacing.lg },
}));
