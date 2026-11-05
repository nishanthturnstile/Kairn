import type { ReactNode } from "react";
import { Image, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { seed } from "./controller";

export function JournalMark() {
  return (
    <View accessible={false} style={styles.mark}>
      <View style={styles.markLine} />
      <View style={styles.markLineShort} />
    </View>
  );
}
export function NativeContributors() {
  return (
    <View style={styles.members}>
      <View
        style={styles.stack}
        accessibilityLabel="Mira Sen, Dev Raman, Asha Fernando, Leo Martin and Noor Jayasinghe"
      >
        {["MS", "DR", "AF", "+2"].map((initials, index) => (
          <View
            key={initials}
            style={[
              styles.avatar,
              index === 1 && styles.clayAvatar,
              index === 2 && styles.riverAvatar,
            ]}
          >
            <Text style={styles.initials}>{initials}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.memberLabel}>Shared by five</Text>
    </View>
  );
}
export function NativeJourneyCover({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.cover}>
      <View style={styles.media}>
        <Image
          source={require("./generated/ridge-sample.png")}
          style={styles.image}
          accessibilityLabel="A path through misty green hills. AI-generated fictional sample."
        />
        <View style={styles.mediaLabel}>
          <Text style={styles.mediaText}>Fictional journey · sample image</Text>
        </View>
      </View>
      <View style={styles.coverBody}>
        <View style={styles.meta}>
          <Text style={styles.metaText}>Hill country</Text>
          <Text style={styles.metaText}>11–14 July 2026</Text>
        </View>
        <Text accessibilityRole="header" style={styles.coverTitle}>
          {title}
        </Text>
        <NativeContributors />
        {children}
      </View>
    </View>
  );
}
export function NativeKitCover() {
  return (
    <View style={styles.kitCover}>
      <Image
        source={require("./generated/ridge-sample.png")}
        style={styles.image}
        accessibilityLabel="Generated hill-country sample"
      />
      <View style={styles.mediaLabel}>
        <Text style={styles.mediaText}>Fictional sample image</Text>
      </View>
    </View>
  );
}
export const sampleTitle = seed.journey.title;
const styles = StyleSheet.create((theme) => ({
  mark: {
    width: 28,
    height: 30,
    borderWidth: 1.5,
    borderRadius: 5,
    borderColor: theme.colors.primary,
    padding: 6,
    gap: 5,
  },
  markLine: { height: 1.5, width: 13, backgroundColor: theme.colors.primary },
  markLineShort: { height: 1.5, width: 8, backgroundColor: theme.colors.primary },
  cover: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.large,
    overflow: "hidden",
  },
  media: { height: 216, backgroundColor: theme.colors.successSurface },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  mediaLabel: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
  },
  mediaText: {
    fontFamily: "InstrumentSans400",
    fontSize: 10,
    lineHeight: 16,
    color: theme.colors.secondaryText,
  },
  coverBody: { padding: 20, gap: 18 },
  meta: { flexDirection: "row", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  metaText: {
    fontFamily: "InstrumentSans400",
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.secondaryText,
  },
  coverTitle: {
    fontFamily: "Newsreader500",
    fontSize: 34,
    lineHeight: 38,
    color: theme.colors.text,
  },
  members: { flexDirection: "row", alignItems: "center", gap: 12 },
  stack: { flexDirection: "row", paddingLeft: 6 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.successSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  clayAvatar: { backgroundColor: theme.colors.reviewSurface },
  riverAvatar: { backgroundColor: theme.colors.riverSurface },
  initials: { fontFamily: "InstrumentSans600", fontSize: 10, color: theme.colors.text },
  memberLabel: { fontFamily: "InstrumentSans400", fontSize: 12, color: theme.colors.secondaryText },
  kitCover: { height: 164, borderRadius: theme.radius.large, overflow: "hidden" },
}));
