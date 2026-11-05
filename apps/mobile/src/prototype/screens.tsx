import { AppearanceControl } from "../theme/appearance";
import { useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link as RouterLink, usePathname, useRouter } from "expo-router";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import {
  JournalButton,
  JournalField,
  JournalStatus,
  JournalText,
} from "../components/journal-controls";
import { useSample } from "./context";
import { project, seed } from "./controller";
import { JournalMark, NativeJourneyCover } from "./visuals";
import { JourneyTimeline, MomentGallery } from "../components/journey-patterns";
import { journeyPresentation } from "./journey-presenter";

const StyledScrollView = withUnistyles(ScrollView);
// Router Link forwards styles through a non-native component. Resolve them
// through Unistyles so labels and selection react to device appearance changes.
const Link = withUnistyles(RouterLink);

export function SamplePage({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, reading } = useSample();
  const actor = state.data.actors.find((item) => item.id === state.actorId)!;
  const home = pathname === "/prototype" || pathname === "/prototype/";
  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <JournalMark />
          <Text style={styles.brandText}>Kairn</Text>
        </View>
        {home ? (
          <View style={styles.account} accessibilityLabel={actor.name + ", sample account"}>
            <Text style={styles.accountText}>
              {actor.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/prototype"))}
            style={styles.back}
          >
            <Text style={styles.navLabel}>Back</Text>
          </Pressable>
        )}
      </View>
      <StyledScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        // Let the native scroll view move the focused input above the iOS IME.
        // Shrinking its parent alone can leave a lower input outside the viewport.
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
      >
        <View style={styles.page}>
          {children}
          <AppearanceControl />
          <JournalText muted>Fictional prototype · changes reset on relaunch</JournalText>
        </View>
      </StyledScrollView>
      <View style={styles.footer}>
        <Link
          href={{ pathname: "/prototype/reader", params: reading ?? {} }}
          replace
          accessibilityRole="link"
          accessibilityState={{ selected: pathname.endsWith("/reader") }}
          style={[styles.navLink, pathname.endsWith("/reader") && styles.activeNav]}
        >
          Read
        </Link>
        <Link
          href="/prototype"
          replace
          accessibilityRole="link"
          accessibilityState={{ selected: home }}
          style={[styles.navLink, home && styles.activeNav]}
        >
          Journeys
        </Link>
        <Link
          href="/prototype/components"
          accessibilityRole="link"
          accessibilityState={{ selected: pathname.endsWith("/components") }}
          replace
          style={[styles.navLink, pathname.endsWith("/components") && styles.activeNav]}
        >
          Design kit
        </Link>
        <Link
          href="/prototype/samples"
          accessibilityRole="link"
          accessibilityState={{ selected: pathname.endsWith("/samples") }}
          replace
          style={[styles.navLink, pathname.endsWith("/samples") && styles.activeNav]}
        >
          Samples
        </Link>
      </View>
    </View>
  );
}
export function NativeJourneys() {
  const { state, dispatch } = useSample();
  const [form, setForm] = useState<"create" | "join" | null>(null);
  const [title, setTitle] = useState(seed.journey.title);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <SamplePage>
      <View style={styles.heading}>
        <Text style={styles.greeting}>Your places. Your people. Your stories.</Text>
        <Text accessibilityRole="header" style={styles.pageTitle}>
          Your journeys
        </Text>
        <JournalText muted>Keep a little of the way you felt.</JournalText>
      </View>
      <View style={styles.quickActions}>
        <View style={styles.flex}>
          <JournalButton
            label="Create journey"
            onPress={() => setForm(form === "create" ? null : "create")}
          />
        </View>
        <View style={styles.flex}>
          <JournalButton
            label="Join with invite"
            secondary
            onPress={() => setForm(form === "join" ? null : "join")}
          />
        </View>
      </View>
      {form && (
        <View style={styles.section}>
          <JournalText title>
            {form === "create" ? "Start a shared journal" : "Join your group"}
          </JournalText>
          {form === "create" ? (
            <>
              <JournalField
                label="Journey title"
                value={title}
                onChangeText={setTitle}
                maxLength={160}
                error={error}
                hint="Only a local sample is created."
              />
              <JournalButton
                label="Create sample journey"
                onPress={() => {
                  setError(title.trim() ? "" : "Enter a journey title.");
                  dispatch({ type: "create", title });
                  if (title.trim()) setForm(null);
                }}
              />
            </>
          ) : (
            <>
              <JournalField
                label="Sample invitation code"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                hint="Use RIDGE. No invitation is sent."
              />
              <JournalButton
                label="Join sample journey"
                onPress={() => {
                  dispatch({ type: "join", code });
                  if (code.trim().toUpperCase() === "RIDGE") setForm(null);
                }}
              />
              <JournalText>{state.notice}</JournalText>
            </>
          )}
          <JournalButton label="Close" secondary onPress={() => setForm(null)} />
        </View>
      )}
      <View style={styles.sectionHeading}>
        <JournalText title>
          {state.joined ? "Back to your story" : "A little inspiration"}
        </JournalText>
        <Text style={styles.meta}>{state.joined ? "1 journal" : "Sample"}</Text>
      </View>
      <NativeJourneyCover title={state.joined ? state.title : seed.journey.title}>
        {state.joined ? (
          <Link
            href="/prototype/journey"
            accessibilityRole="link"
            style={styles.openLink}
            onPress={() => dispatch({ type: "revisit" })}
          >
            Open journey
          </Link>
        ) : (
          <JournalButton
            label="Explore sample"
            onPress={() => dispatch({ type: "reset", scenario: "prepared-trip" })}
          />
        )}
      </NativeJourneyCover>
      <View style={styles.privacy}>
        <JournalMark />
        <View style={styles.flex}>
          <JournalText title>Yours until you share.</JournalText>
          <JournalText muted>
            Your gallery stays private. You choose the moments your group can see.
          </JournalText>
        </View>
      </View>
      {!state.joined && (
        <JournalText muted>No journeys yet. The journal above is a prepared sample.</JournalText>
      )}
      <View accessibilityLiveRegion="polite">
        <JournalText muted>{state.notice}</JournalText>
      </View>
    </SamplePage>
  );
}
export function NativeJourney() {
  const { state, dispatch } = useSample();
  const output = project(state);
  const [continuation, setContinuation] = useState(false);
  const [stageId, setStageId] = useState<string | null>(null);
  const [momentId, setMomentId] = useState<string | null>(null);
  const presentation = journeyPresentation(state);
  const filtered = output.visibleMoments.filter((source) => !stageId || source.stage === stageId);
  if (!state.joined)
    return (
      <SamplePage>
        <JournalText title>Journey unavailable</JournalText>
        <JournalText>Create or join the sample journey first.</JournalText>
      </SamplePage>
    );
  const actor = state.data.actors.find((item) => item.id === state.actorId)!;
  return (
    <SamplePage>
      <JournalStatus>Private sample journal</JournalStatus>
      <NativeJourneyCover title={state.title} />
      <View style={styles.section}>
        <JournalText title>Your place in this journey</JournalText>
        <JournalText>{actor.name}</JournalText>
        <View style={styles.pills}>
          <JournalStatus>{actor.admin ? "Administrator" : "Participant"}</JournalStatus>
          {actor.coauthor && <JournalStatus>Coauthor</JournalStatus>}
          {actor.publisher && <JournalStatus>Publisher</JournalStatus>}
        </View>
        <JournalText>
          {output.canReview
            ? "You can review the shared draft and contributed sources."
            : "The shared draft and other people’s review sources are not available to this actor."}
        </JournalText>
        <JournalText muted>Private galleries are never a group library.</JournalText>
      </View>
      <JournalButton
        secondary
        label="Prepared continuation"
        onPress={() => setContinuation(!continuation)}
      />
      {continuation && (
        <View style={styles.section}>
          <JournalText>
            Load the prepared web continuation. This prototype does not sync devices.
          </JournalText>
          <JournalButton
            secondary
            label="Load review-moment-19"
            onPress={() => dispatch({ type: "reset", scenario: "review-moment-19" })}
          />
        </View>
      )}
      {state.scenario === "review-moment-19" && output.canViewContinuation && (
        <View style={styles.section}>
          <JournalText title>Rain at the tea stop</JournalText>
          <JournalText>{output.continuation.content}</JournalText>
          <JournalStatus review>Journey review · not publication</JournalStatus>
          <JournalText muted>sample-moment-19 · Dev Raman · prepared sample</JournalText>
        </View>
      )}
      <View style={styles.section}>
        <JournalText title>{output.canReview ? "Journey timeline" : "Your moments"}</JournalText>
        <JournalText>Only your sources and contributions you can review appear here.</JournalText>
        {output.canReview && (
          <>
            <JournalText muted>
              Stage order is prepared sample data. Clock times and locations have not been supplied.
            </JournalText>
            <JourneyTimeline
              entries={presentation.timeline}
              selectedId={stageId}
              onSelect={(id) => {
                setStageId(id);
                setMomentId(null);
              }}
            />
          </>
        )}
        {stageId && (
          <JournalButton
            secondary
            label="Show all moments"
            onPress={() => {
              setStageId(null);
              setMomentId(null);
            }}
          />
        )}
        <MomentGallery
          items={presentation.moments.filter((item) =>
            filtered.some((source) => source.id === item.id),
          )}
          selectedId={momentId}
          onSelect={setMomentId}
          onClose={() => setMomentId(null)}
          emptyMessage="No moments are available for this stage and participant."
        />
      </View>
      <JournalText muted>
        Capture, transfers and connected story editing remain to be implemented.
      </JournalText>
    </SamplePage>
  );
}

export function NativeSamples() {
  const { state, dispatch } = useSample();
  return (
    <SamplePage>
      <JournalText title>Sample controls</JournalText>
      <JournalText>
        No accounts, uploads, AI, maps or business API writes. Nothing here proves a durable save.
      </JournalText>
      <JournalText title>Act as</JournalText>
      {seed.actors.map((actor) => (
        <JournalButton
          key={actor.id}
          secondary={state.actorId !== actor.id}
          label={`${actor.name}${state.actorId === actor.id ? " · selected" : ""}`}
          onPress={() => dispatch({ type: "actor", id: actor.id })}
        />
      ))}
      <JournalText title>Prepared checkpoint</JournalText>
      {seed.scenarios.map((scenario) => (
        <JournalButton
          key={scenario}
          secondary={state.scenario !== scenario}
          label={scenario}
          onPress={() => dispatch({ type: "reset", scenario })}
        />
      ))}
      <JournalButton
        label="Reset all sample changes"
        onPress={() => dispatch({ type: "reset", scenario: "first-run" })}
      />
      <JournalText muted>Seed {seed.version} · Reload/relaunch clears session state.</JournalText>
    </SamplePage>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  fill: { flex: 1, backgroundColor: theme.colors.background, paddingTop: rt.insets.top },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brand: { flexDirection: "row", gap: 10, alignItems: "center" },
  brandText: {
    fontFamily: "Newsreader500",
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.primary,
  },
  account: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.successSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: { fontFamily: "InstrumentSans600", fontSize: 13, color: theme.colors.primary },
  back: { minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "center" },
  navLabel: { fontFamily: "InstrumentSans600", fontSize: 14, color: theme.colors.primary },
  page: {
    padding: rt.screen.width >= 768 ? 32 : 16,
    paddingBottom: 32,
    gap: 20,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  heading: { gap: 8, marginBottom: 4 },
  greeting: {
    fontFamily: "InstrumentSans400",
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.secondaryText,
  },
  pageTitle: {
    fontFamily: "Newsreader500",
    fontSize: 40,
    lineHeight: 44,
    color: theme.colors.text,
    letterSpacing: -0.6,
  },
  quickActions: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  meta: { fontFamily: "InstrumentSans400", fontSize: 12, color: theme.colors.secondaryText },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.medium,
    padding: 20,
    gap: 16,
  },
  privacy: { flexDirection: "row", gap: 16, padding: 16 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  columns: { flexDirection: rt.screen.width >= 768 ? "row" : "column", gap: 24 },
  column: { flex: 1, gap: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 4,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Math.max(rt.insets.bottom, 12),
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  navLink: {
    flex: 1,
    fontFamily: "InstrumentSans600",
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.secondaryText,
    minHeight: 48,
    paddingHorizontal: 6,
    paddingVertical: 14,
    borderRadius: theme.controlRadius,
    textAlign: "center",
    overflow: "hidden",
  },
  activeNav: { backgroundColor: theme.colors.selected, color: theme.colors.primary },
  openLink: {
    fontFamily: "InstrumentSans600",
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.primaryText,
    backgroundColor: theme.colors.primary,
    minHeight: 48,
    padding: 13,
    textAlign: "center",
    borderRadius: theme.controlRadius,
    overflow: "hidden",
  },
  link: {
    fontFamily: "InstrumentSans600",
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 48,
    paddingVertical: 12,
    textDecorationLine: "underline",
  },
  choice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 64,
    padding: 14,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    marginVertical: 4,
  },
  chosen: { backgroundColor: theme.colors.successSurface, borderColor: theme.colors.primary },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.controlBorder,
    marginTop: 3,
  },
  radioSelected: { borderWidth: 6, borderColor: theme.colors.primary },
  optionText: { flex: 1, gap: 4 },
  pressed: { opacity: 0.8 },
}));
