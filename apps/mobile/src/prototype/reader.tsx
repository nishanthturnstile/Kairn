import { ChapterNavigation, PracticalDetail, Media } from "../components/journey-content";
import { SegmentedControl } from "../components/ui/selection";
import { useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { JournalButton, JournalText } from "../components/journal-controls";
import { SamplePage } from "./screens";
import reader from "./generated/reader.json";

export function NativeReader() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"Story" | "Explore" | "Learn">("Story");
  const [context, setContext] = useState(false);
  const chapter = reader.chapters[selected]!;
  return (
    <SamplePage>
      <JournalText muted>
        {reader.place} / {reader.dates}
      </JournalText>
      <JournalText title>{reader.title}</JournalText>
      <JournalText>{reader.description}</JournalText>
      <Media
        source={require("./generated/ridge-sample.png")}
        alt="Green hills in morning mist. AI-generated sample image."
        caption="Fictional journey · generated sample imagery"
      />
      <SegmentedControl
        label="Journey view"
        value={mode}
        options={["Story", "Explore", "Learn"]}
        onChange={(value) => {
          if (value === "Story" || value === "Explore" || value === "Learn") setMode(value);
        }}
      />
      <ChapterNavigation chapters={reader.chapters} selected={selected} onSelect={setSelected} />
      {mode === "Learn" ? (
        <>
          <JournalText editorial>The details you take with you</JournalText>
          <JournalText>
            Firsthand observations. All values are fictional examples, not current quotes.
          </JournalText>
          {reader.details.map((item) => (
            <PracticalDetail
              key={item.category}
              {...item}
              onReadSource={() => {
                setSelected(item.chapter);
                setMode("Story");
              }}
            />
          ))}
        </>
      ) : (
        <>
          <View accessibilityLiveRegion="polite">
            <JournalText muted>
              Day {chapter.day} / {chapter.date}
            </JournalText>
            <JournalText editorial>{chapter.title}</JournalText>
          </View>
          <JournalText>
            {mode === "Story"
              ? chapter.body
              : `${chapter.activity}. ${chapter.evidence}. ${chapter.route.length ? "This sample describes sequence, not surveyed geography." : "No location was recorded. We do not infer a connecting route."}`}
          </JournalText>
          {mode === "Story" && (
            <View style={styles.reflection}>
              <JournalText editorial>{chapter.reflection}</JournalText>
              <JournalText muted>{chapter.author}</JournalText>
            </View>
          )}
          <JournalButton
            secondary
            label={context ? "Close route context" : "Open route context"}
            onPress={() => setContext(!context)}
          />
          {context && (
            <View style={styles.detail}>
              <JournalText editorial>{chapter.place}</JournalText>
              <JournalText>Evidence: {chapter.evidence}.</JournalText>
              <JournalText>
                {chapter.route.length
                  ? "This chapter has illustrative route points. Live maps are not connected in this prototype."
                  : "No track for this day. Its place in the story is preserved."}
              </JournalText>
              <JournalText muted>
                Recorded: solid line. Reported: dashed. Estimated: dotted. Unknown: gap.
              </JournalText>
            </View>
          )}
          <JournalText muted>
            Fictional source {chapter.source} / {chapter.author}
          </JournalText>
          <View style={styles.pagination}>
            <JournalButton
              secondary
              disabled={selected === 0}
              label="Previous day"
              onPress={() => setSelected(selected - 1)}
            />
            <JournalButton
              disabled={selected === reader.chapters.length - 1}
              label="Next day"
              onPress={() => setSelected(selected + 1)}
            />
          </View>
        </>
      )}
    </SamplePage>
  );
}

const styles = StyleSheet.create((theme) => ({
  reflection: {
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.successSurface,
    borderRadius: theme.radius.medium,
  },
  detail: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  pagination: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    marginTop: theme.spacing.xl,
  },
}));
