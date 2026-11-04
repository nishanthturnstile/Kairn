import { useState, type ReactNode } from "react";
import { X, ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  FormField,
  TextArea,
  Select,
  Checkbox,
  RadioGroup,
  SegmentedControl,
} from "../components/ui/form-controls";
import { Dialog } from "../components/ui/dialog";
import { AppearanceControl } from "../components/appearance";
import { AudienceSelector, Status } from "../components/prototype-controls";
import type { Scope } from "./controller";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="atlas-catalog-section">
      <div>
        <h2>{title}</h2>
        <p className="atlas-meta">{description}</p>
      </div>
      <div className="atlas-catalog-specimen">{children}</div>
    </section>
  );
}
export function ComponentCatalog() {
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
  const [scope, setScope] = useState<Scope>("journey-review");
  const [dialog, setDialog] = useState(false);
  const [notice, setNotice] = useState(
    "This is a component specimen. Nothing is uploaded or published.",
  );
  return (
    <div className="atlas-catalog">
      <div className="atlas-catalog-intro">
        <div>
          <h1>The details belong together.</h1>
          <p>
            Open atlas, from a quiet field to a shared journey. Working controls and honest states
            for web, Android and iOS.
          </p>
          <p className="atlas-catalog-state">
            Development catalog · fictional content · changes last for this visit
          </p>
        </div>
        <AppearanceControl />
      </div>
      <nav className="atlas-catalog-nav" aria-label="Component families">
        <a href="#actions">Actions</a>
        <a href="#forms">Forms</a>
        <a href="#selection">Selection</a>
        <a href="#feedback">Feedback & layers</a>
        <a href="#content">Journey content</a>
      </nav>
      <Section
        id="actions"
        title="Clear actions. Consistent emphasis."
        description="Primary, secondary, quiet and destructive. Labels stay visible while busy. Every enabled target is at least 44px, including compact and icon controls."
      >
        <div className="atlas-actions">
          <Button pending={pending} onClick={() => setPending(true)}>
            Save sample
          </Button>
          <Button variant="secondary" onClick={() => setPending(false)}>
            Clear pending example
          </Button>
          <Button
            variant="quiet"
            onClick={() => setNotice("A quiet action was activated. No data changed.")}
          >
            View details
          </Button>
        </div>
        <p className="atlas-catalog-state" role="status">
          {pending
            ? "Pending specimen. No timer or real save; clear it explicitly."
            : "Ready for a sample action."}
        </p>
        <div className="atlas-actions">
          <Button variant="destructive" onClick={() => setDialog(true)}>
            Inspect withdrawal impact
          </Button>
          <Button disabled variant="secondary">
            Publish unavailable
          </Button>
          <Button
            size="icon"
            variant="quiet"
            aria-label="Dismiss example notice"
            onClick={() => setNotice("")}
          >
            <X aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setNotice("Compact control activated.")}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
        </div>
      </Section>
      <Section
        id="forms"
        title="Room for the whole thought."
        description="A journey-edit composition with retained values, local dates, help and validation. Uses the same field anatomy as real account forms; no durable save is claimed."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(!title.trim());
            setNotice(
              title.trim()
                ? "Draft specimen retained for this visit. No durable save or publication."
                : "Enter a journey title before continuing.",
            );
          }}
        >
          <FormField
            label="Journey title"
            hint="Up to 160 characters. Your title stays here if an action fails."
            error={error ? "Could not save this example. Your title is retained." : ""}
          >
            {(id, help) => (
              <Input
                id={id}
                aria-describedby={help}
                aria-invalid={error}
                maxLength={160}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            )}
          </FormField>
          <FormField
            label="Chapter notes"
            optional
            hint="Describe what happened. Unknown locations can stay unknown."
          >
            {(id, help) => (
              <TextArea
                id={id}
                aria-describedby={help}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            )}
          </FormField>
          <FormField label="Activity" hint="A rest or transfer day is still a chapter.">
            {(id, help) => (
              <Select
                id={id}
                aria-describedby={help}
                value={activity}
                onChange={(event) => setActivity(event.target.value)}
              >
                <option value="rest">Rest day</option>
                <option value="hike">Hiking</option>
                <option value="transfer">
                  Train transfer with an unexpectedly long description
                </option>
              </Select>
            )}
          </FormField>
          <FormField
            label="Local date"
            optional
            hint="Leave blank when the date is unknown. No timezone is inferred."
          >
            {(id, help) => <Input id={id} type="date" aria-describedby={help} />}
          </FormField>
          <FormField
            label="Source owner"
            hint="Attribution is separate from publication permission."
          >
            {(id, help) => (
              <Input
                id={id}
                aria-describedby={help}
                value="Asha Fernando With A Very Long Display Name"
                readOnly
              />
            )}
          </FormField>
          <FormField
            label="Sharing link"
            hint="A real link is available only after an authorized publication."
          >
            {(id, help) => (
              <Input
                id={id}
                aria-describedby={help}
                placeholder="Publication unavailable"
                disabled
              />
            )}
          </FormField>
          <div className="atlas-actions">
            <Button type="submit">Keep specimen draft</Button>
            <Button variant="secondary" onClick={() => setError(!error)}>
              {error ? "Clear error example" : "Show error example"}
            </Button>
          </div>
        </form>
      </Section>
      <Section
        id="selection"
        title="A choice you can read."
        description="Full-row hit areas, visible selection and separate focus. Arrow keys move through grouped radio choices. Audience and original-file export remain different permissions."
      >
        <SegmentedControl
          label="Journey view"
          value={view}
          options={["Story", "Explore", "Learn"]}
          onChange={setView}
        />
        <p className="atlas-catalog-state">Selected view: {view}. The draft above is retained.</p>
        <Checkbox
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          label="Include the rest day"
          description="Keep the chapter even when no route was recorded."
        />
        <Checkbox
          checked={false}
          disabled
          label="Export original files"
          description="Requires a separate grant for named files and a recipient."
        />
        <RadioGroup
          label="Location evidence"
          value={activity}
          onChange={setActivity}
          options={[
            {
              value: "rest",
              label: "Unknown",
              description: "Preserve the gap. Do not invent a connecting track.",
            },
            {
              value: "hike",
              label: "Recorded",
              description: "An original track supports the observation.",
            },
            {
              value: "transfer",
              label: "Reported",
              description: "A contributor described this transfer.",
            },
          ]}
        />
        <AudienceSelector
          value={scope}
          onChange={setScope}
          audience="Mira and Leo (coauthors); Noor (publisher)"
        />
      </Section>
      <Section
        id="feedback"
        title="State, without guesswork."
        description="Critical errors and permission limits stay in the page. Confirmation protects focus, supports Escape and returns to its trigger. Cancel keeps the current permission."
      >
        {notice && (
          <p role="status" className="atlas-notice">
            {notice}
          </p>
        )}
        <p role="status" className="atlas-notice" data-tone="error">
          Upload paused. Your original is retained. Sign in again before retrying.
        </p>
        <p className="atlas-notice" data-tone="review">
          Review only. Publication is blocked until the source owner permits it.
        </p>
        <p className="atlas-notice" data-tone="success">
          Account verification complete. Sharing remains a separate choice.
        </p>
        <details>
          <summary>What does withdrawing a source affect?</summary>
          <p>
            Dependent hosted versions become unavailable. Already downloaded copies cannot be
            recalled. Independent recovery confirmation may still be pending.
          </p>
        </details>
        <Button variant="secondary" onClick={() => setDialog(true)}>
          Open confirmation specimen
        </Button>
        <p className="atlas-catalog-state">
          <LoaderCircle aria-hidden="true" size={16} /> Loading can be announced without requiring
          animation.
        </p>
      </Section>
      <Section
        id="content"
        title="A journey, even without a photograph."
        description="Text, chronology, uncertainty and attribution carry the composition. No decorative map or generated photograph stands in for evidence."
      >
        <p className="atlas-meta">12 July 2026 / location unknown</p>
        <h2>A day without a track</h2>
        <p>
          We stayed in town while the ridge disappeared into cloud. A gap in the record stays a gap.
        </p>
        <div className="atlas-actions">
          <Status tone="review">Rest day</Status>
          <Status>No recorded location</Status>
          <Status tone="review">Review only</Status>
        </div>
        <hr />
        <h3>Tea stop · LKR 600 per group of 4</h3>
        <p>
          Reported by Leo Martin, 12 July 2026. Fictional dated observation, not a current price.
        </p>
        <p className="atlas-meta">
          Source: sample-moment-5. Attribution does not imply export permission.
        </p>
        <a href="/prototype/reader">Read the chapter specimen</a>
      </Section>
      <Dialog
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
        <p>
          Journey review and dependent hosted output become unavailable. Your original remains
          yours. Already downloaded copies cannot be recalled.
        </p>
        <p className="atlas-meta">
          Illustrative confirmation only. No restriction receipt is created.
        </p>
      </Dialog>
    </div>
  );
}
