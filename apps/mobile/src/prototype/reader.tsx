import { ChapterNavigation, PracticalDetail, Media } from "../components/journey-content";
import { Picker, SegmentedControl } from "../components/ui/selection";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { ReaderSearch } from "@kairn/shared";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { JournalButton, JournalText } from "../components/journal-controls";
import { SamplePage } from "./screens";
import reader from "./generated/reader.json";
import { parseReaderSearch } from "./reader-navigation";
import { useSample } from "./context";

function ReaderChapter({
  chapter,
  mode,
  allDays,
  onReadDay,
}: {
  chapter: (typeof reader.chapters)[number];
  mode: "Story" | "Explore";
  allDays: boolean;
  onReadDay: () => void;
}) {
  return (
    <View style={allDays ? styles.day : styles.chapter}>
      <View accessibilityLiveRegion={allDays ? "none" : "polite"}>
        <JournalText muted>
          Day {chapter.day} / {chapter.date} / {chapter.place}
        </JournalText>
        <JournalText editorial>{chapter.title}</JournalText>
      </View>
      <JournalText muted>
        {chapter.activity} · Evidence: {chapter.evidence}
      </JournalText>
      <JournalText>
        {mode === "Story"
          ? chapter.body
          : chapter.route.length
            ? "This sample describes sequence, not surveyed geography."
            : "No location was recorded. No connecting route is inferred."}
      </JournalText>
      {mode === "Story" && (
        <View style={styles.reflection}>
          <JournalText editorial>{chapter.reflection}</JournalText>
          <JournalText muted>{chapter.author}</JournalText>
        </View>
      )}
      <JournalText muted>
        Fictional source {chapter.source} / {chapter.author}
      </JournalText>
      {allDays && <JournalButton secondary label={`Read day ${chapter.day}`} onPress={onReadDay} />}
    </View>
  );
}

export function NativeReader() {
  const { chapter: chapterParam, view, days, category: categoryParam } = useLocalSearchParams();
  const chapterValue = typeof chapterParam === "string" ? chapterParam : undefined;
  const viewValue = typeof view === "string" ? view : undefined;
  const daysValue = typeof days === "string" ? days : undefined;
  const categoryValue = typeof categoryParam === "string" ? categoryParam : undefined;
  const search = useMemo(
    () =>
      parseReaderSearch({
        chapter: chapterValue,
        view: viewValue,
        days: daysValue,
        category: categoryValue,
      }),
    [chapterValue, viewValue, daysValue, categoryValue],
  );
  const router = useRouter();
  const { rememberReading } = useSample();
  useFocusEffect(
    useCallback(() => {
      rememberReading(search);
    }, [search, rememberReading]),
  );
  const selected = Math.max(
    0,
    reader.chapters.findIndex((entry) => entry.id === search.chapter),
  );
  const mode = search.view ?? "Story";
  const allDays = search.days === "all";
  const category = search.category ?? "All details";
  const [context, setContext] = useState(false);
  const chapter = reader.chapters[selected]!;
  function update(next: ReaderSearch, push = false) {
    const valid = parseReaderSearch(next);
    // setParams merges: write defaults explicitly so an old filter/scope is cleared.
    const params = {
      chapter: valid.chapter ?? reader.chapters[0]!.id,
      view: valid.view ?? "Story",
      days: valid.days ?? "one",
      category: valid.category ?? "All details",
    };
    if (push) router.push({ pathname: "/prototype/reader", params });
    else router.setParams(params);
  }
  function choose(index: number) {
    const next = reader.chapters[index];
    const { days: _days, ...rest } = search;
    if (next) update({ ...rest, chapter: next.id });
  }
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
          if (value === "Story" || value === "Explore" || value === "Learn")
            update({ ...search, view: value });
        }}
      />
      <SegmentedControl
        label="Reading scope"
        value={allDays ? "All days" : "One day"}
        options={["One day", "All days"]}
        onChange={(value) => {
          const { days: _days, ...rest } = search;
          update(value === "All days" ? { ...rest, days: "all" } : rest);
        }}
      />
      <ChapterNavigation
        chapters={reader.chapters}
        selected={allDays ? null : selected}
        onSelect={choose}
      />
      {mode === "Learn" ? (
        <>
          <JournalText editorial>The details you take with you</JournalText>
          <JournalText>
            Firsthand observations. All values are fictional examples, not current quotes.
          </JournalText>
          <JournalText muted>
            Practical details span the whole sample. Your day and reading scope are kept when you
            return to Story or Explore.
          </JournalText>
          <Picker
            label="Find practical details"
            value={category}
            options={["All details", ...reader.details.map((item) => item.category)].map(
              (value) => ({ value, label: value }),
            )}
            onChange={(value) => update({ ...search, category: value })}
          />
          {reader.details
            .filter((item) => category === "All details" || category === item.category)
            .map((item) => (
              <PracticalDetail
                key={item.category}
                {...item}
                onReadSource={() => {
                  const { days: _days, ...rest } = search;
                  update(
                    { ...rest, chapter: reader.chapters[item.chapter]!.id, view: "Story" },
                    true,
                  );
                }}
              />
            ))}
        </>
      ) : (
        <>
          {allDays && (
            <View accessibilityLiveRegion="polite">
              <JournalText editorial>All days</JournalText>
              <JournalText>
                Every chapter in order, including rest and transfer days. Unknown locations remain
                gaps.
              </JournalText>
            </View>
          )}
          <View style={styles.chapter}>
            {(allDays ? reader.chapters : [chapter]).map((item) => (
              <ReaderChapter
                key={item.id}
                chapter={item}
                mode={mode}
                allDays={allDays}
                onReadDay={() => choose(reader.chapters.findIndex((entry) => entry.id === item.id))}
              />
            ))}
          </View>
          {allDays && (
            <JournalText muted>
              Route context: Day {chapter.day} / {chapter.title}
            </JournalText>
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
          {!allDays && (
            <View style={styles.pagination}>
              <JournalButton
                secondary
                disabled={selected === 0}
                label="Previous day"
                onPress={() => choose(selected - 1)}
              />
              <JournalButton
                disabled={selected === reader.chapters.length - 1}
                label="Next day"
                onPress={() => choose(selected + 1)}
              />
            </View>
          )}
        </>
      )}
    </SamplePage>
  );
}

const styles = StyleSheet.create((theme) => ({
  chapter: { gap: theme.spacing.lg },
  day: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
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
