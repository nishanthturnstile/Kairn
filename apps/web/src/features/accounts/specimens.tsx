import { useRef, useState } from "react";
import { ArrowRight, BookOpen, LockKeyhole, Route as RouteIcon } from "lucide-react";
import {
  DisplayNameSchema,
  PasswordSchema,
  type EditablePowers,
  type RestrictionResult,
} from "@kairn/contracts";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../../components/ui/empty";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { CapabilityEditor } from "../../components/access/capability-editor";
import { RestrictionStatus } from "../../components/access/restriction-status";
import "./specimens.css";

const fixtureOperationId = "e059a464-720b-458b-8dc5-928afdb27796";
const pending: RestrictionResult = {
  operationId: fixtureOperationId,
  statusLocation: `/api/v1/operations/${fixtureOperationId}`,
  status: "restricted_pending_confirmation",
  access: "denied",
  recoveryConfirmation: "pending",
  retryAfterSeconds: 5,
};
const confirmed: RestrictionResult = {
  operationId: fixtureOperationId,
  statusLocation: `/api/v1/operations/${fixtureOperationId}`,
  status: "restriction_complete",
  access: "denied",
  recoveryConfirmation: "confirmed",
};

function JourneyLine() {
  return (
    <svg viewBox="0 0 280 110" className="journey-line" fill="none" aria-hidden="true">
      <path d="M10 82C54 82 35 24 83 24S123 88 165 65S202 17 265 26" />
      <circle cx="10" cy="82" r="5" />
      <circle cx="165" cy="65" r="5" />
      <circle cx="265" cy="26" r="5" />
    </svg>
  );
}

function AccountFormSpecimen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [valid, setValid] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameError = submitted && !DisplayNameSchema.safeParse(name).success;
  const passwordError = submitted && !PasswordSchema.safeParse(password).success;
  return (
    <section className="specimen-panel" aria-labelledby="account-specimen-title">
      <p className="specimen-kicker">01 / Account fields</p>
      <h2 id="account-specimen-title">A place for your journeys.</h2>
      <p>One account, your private history. Share a journey when you choose.</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          const nameValid = DisplayNameSchema.safeParse(name).success;
          const passwordValid = PasswordSchema.safeParse(password).success;
          setValid(nameValid && passwordValid);
          if (!nameValid) nameRef.current?.focus();
          else if (!passwordValid) passwordRef.current?.focus();
        }}
      >
        <FieldGroup>
          <Field data-invalid={nameError}>
            <FieldLabel htmlFor="specimen-name">Display name</FieldLabel>
            <Input
              id="specimen-name"
              name="name"
              ref={nameRef}
              value={name}
              autoComplete="name"
              aria-invalid={nameError}
              aria-describedby={nameError ? "specimen-name-error" : "specimen-name-hint"}
              onChange={(event) => {
                setName(event.target.value);
                setValid(false);
              }}
            />
            <FieldDescription id="specimen-name-hint">
              Your name, up to 80 characters. Email is never used as your display name.
            </FieldDescription>
            {nameError ? (
              <FieldError id="specimen-name-error">
                Enter a name between 1 and 80 characters.
              </FieldError>
            ) : null}
          </Field>
          <Field data-invalid={passwordError}>
            <FieldLabel htmlFor="specimen-password">Password</FieldLabel>
            <Input
              id="specimen-password"
              name="password"
              ref={passwordRef}
              value={password}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={passwordError}
              aria-describedby={
                passwordError ? "specimen-password-error" : "specimen-password-hint"
              }
              onChange={(event) => {
                setPassword(event.target.value);
                setValid(false);
              }}
            />
            <FieldDescription id="specimen-password-hint">
              15–128 characters. Spaces, paste and password managers are welcome. Use sample text
              here.
            </FieldDescription>
            {passwordError ? (
              <FieldError id="specimen-password-error">
                Use 15–128 characters; spaces are preserved.
              </FieldError>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              aria-controls="specimen-password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </Button>
          </Field>
          <Button type="submit">
            Validate sample fields <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Button>
          <p className="specimen-feedback" role="status">
            {valid
              ? "Sample fields are valid. No account was created or saved."
              : "Local validation only. Nothing is sent or stored."}
          </p>
        </FieldGroup>
      </form>
    </section>
  );
}

function HistorySpecimen() {
  return (
    <section className="specimen-panel" aria-labelledby="history-specimen-title">
      <p className="specimen-kicker">02 / First journey</p>
      <h2 id="history-specimen-title">Your journeys</h2>
      <Empty>
        <EmptyHeader>
          <JourneyLine />
          <EmptyTitle>Your next chapter starts here.</EmptyTitle>
          <EmptyDescription>
            Journeys you create or join will appear here. Your personal moments stay private until
            you choose to contribute.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p>
            Creation and invitation actions arrive with the connected account and journey flows.
          </p>
        </EmptyContent>
      </Empty>
      <div className="specimen-no-cover">
        <RouteIcon aria-hidden="true" />
        <div>
          <p className="specimen-kicker">Synthetic no-cover example</p>
          <h3>A weekend in the hills</h3>
          <p>3–4 November 2026 · Asia/Kolkata</p>
          <p>Participant · Private journey</p>
        </div>
      </div>
      <p className="specimen-caption">
        A journey has one identity for everyone who joins. An intended date does not mark it
        completed.
      </p>
    </section>
  );
}

function PeopleSpecimen() {
  const [powers, setPowers] = useState<EditablePowers>({ coauthor: false, publisher: false });
  const [saved, setSaved] = useState(false);
  return (
    <section className="specimen-panel" aria-labelledby="people-specimen-title">
      <p className="specimen-kicker">03 / Independent powers</p>
      <h2 id="people-specimen-title">People, with clear permissions.</h2>
      <div className="specimen-person">
        <span className="specimen-initials" aria-hidden="true">
          AM
        </span>
        <div>
          <h3>Alex Morgan · sample member</h3>
          <p>Participant</p>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <CapabilityEditor
          value={powers}
          onChange={(value) => {
            setPowers(value);
            setSaved(false);
          }}
        />
        <p className="specimen-caption">
          Administration: River Chen, sample organiser. Transferring administration requires a
          separate offer and acceptance.
        </p>
        <Button type="submit" variant="secondary">
          Preview sample powers
        </Button>
        <p className="specimen-feedback" role="status">
          {saved
            ? `Sample selection: ${powers.coauthor ? "coauthor" : "no editing"}; ${powers.publisher ? "publisher" : "no publishing"}. No permission changed.`
            : "Review the audience before saving. Original-file approval stays separate."}
        </p>
      </form>
    </section>
  );
}

function RestrictionSpecimen() {
  const [complete, setComplete] = useState(false);
  return (
    <section className="specimen-panel" aria-labelledby="restriction-specimen-title">
      <p className="specimen-kicker">04 / Honest operation status</p>
      <h2 id="restriction-specimen-title">Know what has happened.</h2>
      <RestrictionStatus result={complete ? confirmed : pending} />
      <Button type="button" variant="secondary" onClick={() => setComplete((value) => !value)}>
        {complete ? "Show pending fixture" : "Show confirmed fixture"}
      </Button>
      <Button type="button" disabled aria-busy="true">
        Checking confirmation…
      </Button>
      <p className="specimen-caption">
        These are labeled fixture states. No recovery journal is connected.
      </p>
    </section>
  );
}

export function AccountJourneySpecimens() {
  return (
    <div className="account-specimens">
      <div className="specimen-intro">
        <p className="specimen-kicker">
          <BookOpen aria-hidden="true" /> Accounts & journeys / Development specimens
        </p>
        <h1>
          A shared journey.
          <br />
          <em>Your choices.</em>
        </h1>
        <p>
          Private by default. Clear about who can do what. A first look at the forms, journey
          identity and access feedback.
        </p>
      </div>
      <Alert role="note">
        <LockKeyhole aria-hidden="true" />
        <AlertTitle>Development fixtures only</AlertTitle>
        <AlertDescription>
          These components do not create accounts, journeys or permissions. Use sample input.
          Account, database and device acceptance are still pending.
        </AlertDescription>
      </Alert>
      <div className="specimen-grid">
        <AccountFormSpecimen />
        <HistorySpecimen />
        <PeopleSpecimen />
        <RestrictionSpecimen />
      </div>
    </div>
  );
}
