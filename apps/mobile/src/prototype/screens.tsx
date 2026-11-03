import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { StyleSheet } from "react-native-unistyles";
import {
  JournalButton,
  JournalField,
  JournalStatus,
  JournalText,
} from "../components/journal-controls";
import { useSample } from "./context";
import { project, seed, type Scope } from "./controller";

export function SamplePage({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
        <View style={styles.page}>
          <JournalStatus>Fictional sample · resets on relaunch</JournalStatus>
          {children}
          <View style={styles.footer}>
            <Link href="/prototype" style={styles.link}>
              Journeys
            </Link>
            <Link href="/prototype/components" style={styles.link}>
              Component specimens
            </Link>
            <Link href="/prototype/samples" style={styles.link}>
              Sample controls
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function NativeJourneys() {
  const { state, dispatch } = useSample();
  const [title, setTitle] = useState(seed.journey.title);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <SamplePage>
      <JournalText title>Your journeys</JournalText>
      <JournalText muted>A place for what happened along the way.</JournalText>
      {state.joined ? (
        <View style={styles.section}>
          <JournalText editorial>{state.title}</JournalText>
          <JournalText>
            {seed.journey.start} — {seed.journey.end}
          </JournalText>
          <JournalText muted>No cover · {seed.journey.place}</JournalText>
          <Link
            href="/prototype/journey"
            style={styles.link}
            onPress={() => dispatch({ type: "revisit" })}
          >
            Open journey
          </Link>
        </View>
      ) : (
        <View style={styles.section}>
          <JournalText editorial>Every journey starts with a little space.</JournalText>
          <JournalText>
            Create the shared journal, or join your group’s. Your gallery stays private until you
            choose what to contribute.
          </JournalText>
          <JournalText muted>No journeys yet · no cover image needed</JournalText>
        </View>
      )}
      <View style={styles.columns}>
        <View style={styles.column}>
          <JournalText title>Create a sample journey</JournalText>
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
            }}
          />
        </View>
        <View style={styles.column}>
          <JournalText title>Join your group</JournalText>
          <JournalField
            label="Sample invitation code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            hint="Use RIDGE. No invitation is sent."
          />
          <JournalButton
            label="Join sample journey"
            secondary
            onPress={() => dispatch({ type: "join", code })}
          />
        </View>
      </View>
      <View accessibilityLiveRegion="polite">
        <JournalText>{state.notice}</JournalText>
      </View>
    </SamplePage>
  );
}
export function NativeJourney() {
  const { state, dispatch } = useSample();
  const output = project(state);
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
      <JournalText title>{state.title}</JournalText>
      <JournalText>
        {seed.journey.start} — {seed.journey.end}
      </JournalText>
      <JournalStatus>No cover · sample-journey-01</JournalStatus>
      <JournalText title>Independent powers</JournalText>
      <JournalText>
        {actor.name} · {actor.admin ? "Administrator" : "Participant"}
        {actor.coauthor ? " · Coauthor" : ""}
        {actor.publisher ? " · Publisher" : ""}
      </JournalText>
      <JournalText>
        {output.canReview
          ? "You can review the shared draft and contributed sources."
          : "The shared draft and other people’s review sources are not available to this actor."}
      </JournalText>
      <JournalText title>Prepared continuation</JournalText>
      <JournalText>
        Load the prepared web continuation. This prototype does not sync devices.
      </JournalText>
      <JournalButton
        secondary
        label="Load review-moment-19"
        onPress={() => dispatch({ type: "reset", scenario: "review-moment-19" })}
      />
      {state.scenario === "review-moment-19" && output.canViewContinuation && (
        <View style={styles.section}>
          <JournalText title>Rain at the tea stop</JournalText>
          <JournalText>{output.continuation.content}</JournalText>
          <JournalStatus review>Journey review · not publication</JournalStatus>
          <JournalText muted>sample-moment-19 · Dev Raman · prepared sample</JournalText>
        </View>
      )}
      <JournalText muted>Capture, People and story walkthroughs follow in P03–P05.</JournalText>
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
export function NativeSpecimens() {
  const [scope, setScope] = useState<Scope>("journey-review");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const options = [
    { value: "only-me", label: "Only me", detail: "Private to the source owner." },
    {
      value: "journey-review",
      label: "Journey review",
      detail: "Coauthors and publishers can review. No publication.",
    },
    {
      value: "publication",
      label: "Allow journey publication and sharing",
      detail: "Eligible for approved presentations of this journey.",
    },
  ] as const;
  return (
    <SamplePage>
      <JournalText title>The field-journal kit</JournalText>
      <JournalText muted>
        Isolated component examples. No source permissions change here.
      </JournalText>
      <View style={styles.section}>
        <JournalText title>Audience & rights</JournalText>
        <JournalText muted>
          Review audience: Mira Sen and Leo Martin (coauthors); Mira Sen and Noor Jayasinghe
          (publishers).
        </JournalText>
        <View accessibilityRole="radiogroup">
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: scope === option.value }}
              onPress={() => setScope(option.value)}
              style={({ pressed }) => [
                styles.choice,
                scope === option.value && styles.chosen,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radio, scope === option.value && styles.radioSelected]} />
              <View style={styles.optionText}>
                <JournalText>{option.label}</JournalText>
                <JournalText muted>{option.detail}</JournalText>
              </View>
            </Pressable>
          ))}
        </View>
        <JournalStatus review>Review only · publication blocked</JournalStatus>
        <JournalText muted>
          Original-file export needs separate approval: named files, recipient and expiry.
        </JournalText>
      </View>
      <View style={styles.section}>
        <JournalText title>Actions & feedback</JournalText>
        <JournalButton label="Save sample" pending={pending} onPress={() => setPending(true)} />
        <JournalButton secondary label="Clear pending example" onPress={() => setPending(false)} />
        <JournalButton secondary label="Publish unavailable" disabled onPress={() => {}} />
        <View accessibilityLiveRegion="polite">
          <JournalText>
            {pending ? "Pending specimen. No timer or real save." : "Ready for a sample action."}
          </JournalText>
        </View>
        <JournalField
          label="Journey title"
          defaultValue="Four friends, a slow train, and the long way home through the hill country"
          multiline
          error={error ? "Could not save this example. Your title is retained." : ""}
          hint="Long text stays readable."
        />
        <JournalButton
          secondary
          label={error ? "Retry sample" : "Show error example"}
          onPress={() => setError(!error)}
        />
      </View>
      <View style={styles.section}>
        <JournalText title>People & sources</JournalText>
        <JournalText>Asha Fernando With A Very Long Display Name</JournalText>
        <JournalText muted>Administrator only · no draft or source-review access</JournalText>
        <JournalText>Rain at the tea stop</JournalText>
        <JournalText muted>Dev Raman · note · location unknown</JournalText>
        <JournalStatus review>Review only</JournalStatus>
        <JournalText>
          Saving, uploading, contributing and permitting publication are separate steps.
        </JournalText>
      </View>
      <View style={styles.section}>
        <JournalText title>Chapter & practical detail</JournalText>
        <JournalText editorial>A day without a track</JournalText>
        <JournalText>
          We stayed in town while the ridge disappeared into cloud. A gap in the record stays a gap.
        </JournalText>
        <JournalStatus review>Day 2 · rest stage · location unknown</JournalStatus>
        <JournalText muted>
          Prepared chapter specimen · source: sample-moment-8 · not an assembled story
        </JournalText>
        <JournalText>Tea stop · LKR 600 per group of 4</JournalText>
        <JournalText muted>
          Observed 12 July 2026 · Leo Martin · source: sample-moment-5
        </JournalText>
        <JournalStatus review>Reported · sample cost</JournalStatus>
        <JournalText muted>
          A dated observation, not a current price. Editing and source navigation follow in P04.
        </JournalText>
      </View>
      <View style={styles.section}>
        <JournalText title>Impact confirmation</JournalText>
        <JournalButton
          secondary
          label="Inspect withdrawal impact"
          onPress={() => setConfirm(true)}
        />
        {confirm && (
          <>
            <JournalText>Withdraw “Rain at the tea stop”?</JournalText>
            <JournalText>
              Journey review and dependent hosted output become unavailable. Your original remains
              yours. Already downloaded copies cannot be recalled.
            </JournalText>
            <JournalText muted>Illustrative only. No restriction receipt is created.</JournalText>
            <JournalButton
              secondary
              label="Keep the current permission"
              onPress={() => setConfirm(false)}
            />
          </>
        )}
      </View>
      <View style={styles.section}>
        <JournalText editorial>No cover. Still your journey.</JournalText>
        <JournalText>
          11–14 July 2026 · An intentional space before the first photograph.
        </JournalText>
      </View>
    </SamplePage>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  fill: { flex: 1, backgroundColor: theme.colors.background },
  page: {
    padding: rt.screen.width >= 768 ? 32 : 16,
    paddingBottom: Math.max(rt.insets.bottom, 24),
    gap: 24,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },
  section: { borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 24, gap: 16 },
  columns: { flexDirection: rt.screen.width >= 768 ? "row" : "column", gap: 32 },
  column: { flex: 1, gap: 16 },
  footer: { gap: 8, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 16 },
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
    padding: 12,
    borderRadius: 8,
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
