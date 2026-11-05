import { useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button, IconButton } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { Checkbox, Picker, RadioGroup, SegmentedControl } from "../components/ui/selection";
import { Dialog, Notice } from "../components/ui/feedback";
import { JournalText, JournalStatus } from "../components/journal-controls";
import { SamplePage } from "./screens";
import { ProductPatternSpecimen } from "./product-pattern-specimen";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <JournalText editorial>{title}</JournalText>
      <JournalText muted>{description}</JournalText>
      <View style={styles.specimen}>{children}</View>
    </View>
  );
}
export function NativeComponentCatalog() {
  const impactTrigger = useRef<View>(null);
  const confirmationTrigger = useRef<View>(null);
  const returnFocusRef = useRef<View | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [title, setTitle] = useState(
    "Four friends, a slow train, and the long way home through the hill country",
  );
  const [notes, setNotes] = useState(
    "A rest day belongs to the journey, even without a recorded location.",
  );
  const [view, setView] = useState("Story");
  const [activity, setActivity] = useState("rest");
  const [checked, setChecked] = useState(true);
  const [scope, setScope] = useState("journey-review");
  const [dialog, setDialog] = useState(false);
  const [notice, setNotice] = useState(
    "This is a component specimen. Nothing is uploaded or published.",
  );
  return (
    <SamplePage>
      <JournalText editorial>The details belong together.</JournalText>
      <JournalText>
        Open atlas, from a quiet field to a shared journey. The same contracts, adapted to your
        device.
      </JournalText>
      <JournalText muted>
        Development catalog · fictional content · changes last for this visit
      </JournalText>
      <Section
        title="Clear actions."
        description="Primary, secondary, quiet and destructive. Labels remain visible while busy. Every target is at least 48dp and grows with text."
      >
        <Button label="Save sample" pending={pending} onPress={() => setPending(true)} />
        <Button
          label="Clear pending example"
          variant="secondary"
          onPress={() => setPending(false)}
        />
        <JournalText muted>
          {pending
            ? "Pending specimen. No timer or real save; clear it explicitly."
            : "Ready for a sample action."}
        </JournalText>
        <Button
          label="View details"
          variant="quiet"
          onPress={() => setNotice("A quiet action was activated. No data changed.")}
        />
        <Button
          label="Inspect withdrawal impact"
          ref={impactTrigger}
          variant="destructive"
          onPress={() => {
            returnFocusRef.current = impactTrigger.current;
            setDialog(true);
          }}
        />
        <Button label="Publish unavailable" disabled variant="secondary" onPress={() => {}} />
        <IconButton
          label="Dismiss example notice"
          onPress={() => setNotice("")}
          icon={
            <View style={styles.cross}>
              <View style={styles.crossFirst} />
              <View style={styles.crossSecond} />
            </View>
          }
        />
      </Section>
      <Section
        title="Room for the whole thought."
        description="A journey-edit composition with retained values, help and validation. Account forms share these button and input implementations."
      >
        <Field
          label="Journey title"
          value={title}
          onChangeText={setTitle}
          maxLength={160}
          multiline
          hint="Up to 160 characters. Your title stays here if an action fails."
          error={error ? "Could not save this example. Your title is retained." : ""}
        />
        <Field
          label="Chapter notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          optional
          hint="Unknown locations can stay unknown."
        />
        <Picker
          label="Activity"
          value={activity}
          onChange={setActivity}
          options={[
            { value: "rest", label: "Rest day" },
            { value: "hike", label: "Hiking" },
            { value: "transfer", label: "Train transfer with an unexpectedly long description" },
          ]}
        />
        <Field
          label="Source owner"
          value="Asha Fernando With A Very Long Display Name"
          editable={false}
          hint="Attribution is separate from publication permission."
        />
        <Field
          label="Sharing link"
          placeholder="Publication unavailable"
          editable={false}
          hint="A real link requires an authorized publication."
        />
        <Button
          label="Keep specimen draft"
          onPress={() => {
            setError(!title.trim());
            setNotice(
              title.trim()
                ? "Draft specimen retained for this visit. No durable save or publication."
                : "Enter a journey title before continuing.",
            );
          }}
        />
        <Button
          label={error ? "Clear error example" : "Show error example"}
          variant="secondary"
          onPress={() => setError(!error)}
        />
      </Section>
      <Section
        title="A choice you can read."
        description="Full-row hit areas and programmatic selection. The picker supports cancellation and Android back. Original-file export remains a separate grant."
      >
        <SegmentedControl
          label="Journey view"
          value={view}
          options={["Story", "Explore", "Learn"]}
          onChange={setView}
        />
        <JournalText muted>Selected view: {view}. The draft above is retained.</JournalText>
        <Checkbox
          label="Include the rest day"
          checked={checked}
          onChange={setChecked}
          description="Keep the chapter even without a recorded route."
        />
        <Checkbox
          label="Export original files"
          checked={false}
          onChange={() => {}}
          disabled
          description="Requires a separate grant for named files and a recipient."
        />
        <RadioGroup
          label="Who can use this source?"
          value={scope}
          onChange={setScope}
          options={[
            { value: "only-me", label: "Only me", description: "Private to the source owner." },
            {
              value: "journey-review",
              label: "Journey review",
              description: "Coauthors and publishers can review. No publication.",
            },
            {
              value: "publication",
              label: "Allow journey publication and sharing",
              description: "Eligible for approved presentations of this journey.",
            },
          ]}
        />
        <JournalText muted>
          Review audience: Mira and Leo (coauthors); Noor (publisher).
        </JournalText>
      </Section>
      <Section
        title="State, without guesswork."
        description="Persistent notices and a confirmation with an explicit Cancel action. No animation is required to understand the state."
      >
        {!!notice && <Notice>{notice}</Notice>}
        <Notice tone="error">
          Upload paused. Your original is retained. Sign in again before retrying.
        </Notice>
        <Notice tone="review">
          Review only. Publication is blocked until the source owner permits it.
        </Notice>
        <Notice tone="success">
          Account verification complete. Sharing remains a separate choice.
        </Notice>
        <Button
          label="Open confirmation specimen"
          ref={confirmationTrigger}
          variant="secondary"
          onPress={() => {
            returnFocusRef.current = confirmationTrigger.current;
            setDialog(true);
          }}
        />
      </Section>
      <Section
        title="A journey without a photograph."
        description="Text, chronology, uncertainty and attribution carry the composition."
      >
        <JournalText muted>12 July 2026 / location unknown</JournalText>
        <JournalText editorial>A day without a track</JournalText>
        <JournalText>
          We stayed in town while the ridge disappeared into cloud. A gap in the record stays a gap.
        </JournalText>
        <JournalStatus review>Rest day · no recorded location · review only</JournalStatus>
        <JournalText title>Tea stop · LKR 600 per group of 4</JournalText>
        <JournalText>
          Reported by Leo Martin, 12 July 2026. Fictional dated observation, not a current price.
        </JournalText>
        <JournalText muted>
          Source: sample-moment-5. Attribution does not imply export permission.
        </JournalText>
      </Section>
      <Section
        title="Every account has its place."
        description="Caller-ordered chronology, parallel accounts and a bounded permitted collection. Open a moment for ownership, capture versus entry time and source permission; media loads only in the viewer."
      >
        <ProductPatternSpecimen />
      </Section>
      <Dialog
        returnFocusRef={returnFocusRef}
        open={dialog}
        title="Withdraw this source?"
        onClose={() => setDialog(false)}
        destructive
        actionLabel="Confirm specimen withdrawal"
        action={() => {
          setDialog(false);
          setNotice(
            "Confirmation specimen completed. No permission changed and no restriction receipt was created.",
          );
        }}
      >
        <JournalText>
          Journey review and dependent hosted output become unavailable. Your original remains
          yours. Already downloaded copies cannot be recalled.
        </JournalText>
        <JournalText muted>
          Illustrative confirmation only. No restriction receipt is created.
        </JournalText>
      </Dialog>
    </SamplePage>
  );
}
const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  specimen: {
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.medium,
  },
  cross: { width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  crossFirst: {
    position: "absolute",
    width: 20,
    height: 2,
    backgroundColor: theme.colors.primary,
    transform: [{ rotate: "45deg" }],
  },
  crossSecond: {
    position: "absolute",
    width: 20,
    height: 2,
    backgroundColor: theme.colors.primary,
    transform: [{ rotate: "-45deg" }],
  },
}));
