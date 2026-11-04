import { useState } from "react";
import { Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./ui/button";
import { JournalText } from "./journal-controls";

type Chapter = { id: string; day: number; date: string; title: string; activity: string };
export function ChapterNavigation({
  chapters,
  selected,
  onSelect,
}: {
  chapters: readonly Chapter[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View accessibilityLabel="Journey chapters" style={styles.chapters}>
      {chapters.map((chapter, index) => (
        <Pressable
          key={chapter.id}
          accessibilityRole="button"
          accessibilityLabel={`Day ${chapter.day}, ${chapter.title}, ${chapter.activity}`}
          accessibilityState={{ selected: selected === index }}
          onPress={() => onSelect(index)}
          style={({ pressed }) => [
            styles.chapter,
            selected === index && styles.selected,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.day}>Day {chapter.day}</Text>
          <Text style={styles.label}>{chapter.title}</Text>
          <Text style={styles.meta}>
            {chapter.date} / {chapter.activity}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function PracticalDetail({
  category,
  title,
  value,
  body,
  author,
  date,
  onReadSource,
}: {
  category: string;
  title: string;
  value: string;
  body: string;
  author: string;
  date: string;
  onReadSource: () => void;
}) {
  return (
    <View style={styles.detail}>
      <JournalText muted>{category}</JournalText>
      <JournalText editorial>{title}</JournalText>
      <JournalText>{value}</JournalText>
      <JournalText>{body}</JournalText>
      <JournalText muted>
        Reported by {author}, {date}
      </JournalText>
      <Button variant="secondary" label="Read source chapter" onPress={onReadSource} />
    </View>
  );
}
export function Media({
  source,
  alt,
  caption,
  presentation = "cover",
}: {
  source?: ImageSourcePropType;
  alt: string;
  caption: string;
  presentation?: "cover" | "detail";
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={styles.media}>
      {source && !failed ? (
        <Image
          source={source}
          accessibilityLabel={alt}
          style={styles.image}
          resizeMode={presentation === "detail" ? "contain" : "cover"}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.fallback}>
          <JournalText>
            {source ? "This photograph could not load." : "No cover photograph."}
          </JournalText>
          <JournalText muted>
            The journey is still here. Continue with its chapters and source details.
          </JournalText>
        </View>
      )}
      <JournalText muted>{caption}</JournalText>
    </View>
  );
}
const styles = StyleSheet.create((theme) => ({
  chapters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  chapter: {
    flexBasis: "46%",
    flexGrow: 1,
    minHeight: theme.control.minHeight,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    borderRadius: theme.controlRadius,
  },
  selected: { backgroundColor: theme.colors.selected, borderColor: theme.colors.primary },
  pressed: { opacity: 0.78 },
  day: {
    fontFamily: "Newsreader500",
    fontSize: theme.typography.sectionTitle.fontSize,
    lineHeight: theme.typography.sectionTitle.lineHeight,
    color: theme.colors.primary,
  },
  label: {
    fontFamily: "InstrumentSans600",
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: "InstrumentSans400",
    fontSize: theme.typography.compactBody.fontSize,
    lineHeight: theme.typography.compactBody.lineHeight,
    color: theme.colors.secondaryText,
  },
  detail: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  media: { gap: theme.spacing.sm },
  image: { width: "100%", aspectRatio: 1.5, borderRadius: theme.radius.medium },
  fallback: {
    minHeight: 160,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.selected,
    borderRadius: theme.radius.medium,
  },
}));
