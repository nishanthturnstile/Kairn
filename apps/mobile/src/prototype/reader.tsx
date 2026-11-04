import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
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
      <Image
        source={require("./generated/ridge-sample.png")}
        style={styles.cover}
        accessibilityLabel="Green hills in morning mist. AI-generated sample image."
      />
      <JournalText muted>Fictional journey · generated sample imagery</JournalText>
      <View style={styles.modes}>
        {(["Story", "Explore", "Learn"] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === item }}
            onPress={() => setMode(item)}
            style={[styles.mode, mode === item && styles.selected]}
          >
            <Text style={styles.label}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.chapters}>
        {reader.chapters.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Day ${item.day}, ${item.title}`}
            accessibilityState={{ selected: selected === index }}
            onPress={() => setSelected(index)}
            style={[styles.chapter, selected === index && styles.selected]}
          >
            <Text style={styles.day}>Day {item.day}</Text>
            <Text style={styles.label}>{item.title}</Text>
            <Text style={styles.meta}>{item.activity}</Text>
          </Pressable>
        ))}
      </View>
      {mode === "Learn" ? (
        <>
          <JournalText editorial>The details you take with you</JournalText>
          <JournalText>
            Firsthand observations. All values are fictional examples, not current quotes.
          </JournalText>
          {reader.details.map((item) => (
            <View style={styles.detail} key={item.category}>
              <JournalText muted>{item.category}</JournalText>
              <JournalText editorial>{item.title}</JournalText>
              <JournalText>{item.value}</JournalText>
              <JournalText>{item.body}</JournalText>
              <JournalText muted>
                {item.author} / {item.date}
              </JournalText>
              <JournalButton
                secondary
                label="Read source chapter"
                onPress={() => {
                  setSelected(item.chapter);
                  setMode("Story");
                }}
              />
            </View>
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
  cover: { width: "100%", aspectRatio: 1.5, borderRadius: theme.radius.medium },
  modes: { flexDirection: "row", gap: theme.spacing.sm, marginVertical: theme.spacing.lg },
  mode: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    borderRadius: theme.radius.small,
    padding: theme.spacing.sm,
  },
  selected: { backgroundColor: theme.colors.successSurface, borderColor: theme.colors.primary },
  label: {
    fontFamily: "InstrumentSans600",
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: "InstrumentSans",
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.secondaryText,
  },
  chapters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  chapter: {
    flexBasis: "46%",
    flexGrow: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.small,
  },
  day: { fontFamily: "Newsreader500", fontSize: 24, lineHeight: 28, color: theme.colors.primary },
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
