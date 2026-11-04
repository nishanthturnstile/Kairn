import { TextArea } from "../../components/ui/form-controls";
import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createAvatarTransfer } from "@kairn/shared";
import {
  AvatarStatusSchema,
  BioSchema,
  AvatarUploadResultSchema,
  DisplayNameSchema,
  PasswordSchema,
  ProfileSchema,
  type MyAccount,
} from "@kairn/contracts";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "../../components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import {
  accountTabId,
  bindAccountClient,
  accountRequest as sendAccountRequest,
  authRequest,
  clearAccount,
  ownAccount,
  useAccountEpoch,
} from "./session";
import "./specimens.css";
import "./account.css";

type Mode =
  | "sign-in"
  | "create-account"
  | "recover"
  | "reset-password"
  | "verify-email"
  | "account";
function PasswordInput(props: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  newPassword: boolean;
}) {
  const [shown, show] = useState(false);
  return (
    <>
      <Input
        id={props.id}
        name="password"
        type={shown ? "text" : "password"}
        autoComplete={props.newPassword ? "new-password" : "current-password"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        aria-invalid={props.invalid}
        aria-describedby={`${props.id}-error`}
      />
      <Button type="button" variant="secondary" aria-pressed={shown} onClick={() => show(!shown)}>
        {shown ? "Hide password" : "Show password"}
      </Button>
    </>
  );
}
function Notice({ message }: { message: string }) {
  return (
    <Alert role="status">
      <AlertTitle>Account update</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
export function AccountPage({ mode }: { mode: Mode }) {
  const epoch = useAccountEpoch();

  const client = useQueryClient();
  bindAccountClient(client);
  const account = useQuery({
    queryKey: ["account", epoch],
    queryFn: ({ signal }) => ownAccount(signal),
    retry: false,
    staleTime: 0,
  });
  const [message, setMessage] = useState("");
  const token = useRef<string | null>(null);
  useEffect(() => {
    if (mode === "reset-password") {
      const url = new URL(window.location.href);
      token.current = url.searchParams.get("token");
      if (url.search) window.history.replaceState(null, "", url.pathname);
      if (!token.current) setMessage("This reset link is unavailable. Request a new email.");
    }
  }, [mode]);
  useEffect(() => {
    const onChange = (event: MessageEvent) => {
      const change = z
        .object({ sender: z.uuid(), type: z.enum(["changed", "signed-out"]) })
        .safeParse(event.data);
      if (change.success && change.data.sender !== accountTabId)
        clearAccount(client, change.data.type === "signed-out");
    };
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("kairn-account") : undefined;
    channel?.addEventListener("message", onChange);
    return () => {
      channel?.close();
    };
  }, [client]);
  const changed = (suppress = false) => {
    clearAccount(client, suppress);
    const channel = new BroadcastChannel("kairn-account");
    channel.postMessage({ sender: accountTabId, type: suppress ? "signed-out" : "changed" });
    channel.close();
  };
  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      setMessage("");
      try {
        if (mode === "sign-in") {
          await authRequest("sign-in/email", { email: value.email, password: value.password });
          form.reset();
          changed();
          window.location.assign("/account");
        } else if (mode === "create-account") {
          await authRequest("sign-up/email", {
            name: value.name,
            email: value.email,
            password: value.password,
            callbackURL: `${window.location.origin}/verify-email`,
          });
          form.setFieldValue("password", "");
          setMessage(
            "Check your email to verify your account, then sign in. You can request another email below.",
          );
        } else if (mode === "reset-password") {
          if (!token.current)
            throw new Error("This reset link is unavailable. Request another email.");
          await authRequest("reset-password", {
            token: token.current,
            newPassword: value.password,
          });
          token.current = null;
          form.reset();
          changed(true);
          try {
            await authRequest("sign-out", {});
          } catch {
            setMessage("Password updated. Sign out could not be confirmed. Sign in again.");
            return;
          }
          setMessage("Password updated. Sign in with your new password.");
        } else if (mode === "verify-email") {
          await authRequest("send-verification-email", {
            email: value.email,
            callbackURL: `${window.location.origin}/verify-email`,
          });
          setMessage(
            "If verification is needed, a new email is on its way. Allow a minute before requesting another.",
          );
        } else {
          await authRequest("request-password-reset", {
            email: value.email,
            redirectTo: `${window.location.origin}/reset-password`,
          });
          setMessage(
            "If this account can be recovered, a reset email is on its way. Allow a minute before requesting another.",
          );
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Account service is unavailable.");
      }
    },
  });
  const titles: Record<Mode, string> = {
    "sign-in": "Welcome back.",
    "create-account": "A place for your journeys.",
    recover: "Find your way back.",
    "reset-password": "Choose a new password.",
    "verify-email": "Verify your email.",
    account: "Your account",
  };
  return (
    <section
      className="account-specimens account-live"
      data-view={mode}
      aria-labelledby="account-heading"
    >
      <div className="specimen-intro">
        <p className="specimen-kicker">KAIRN / YOUR PRIVATE ACCOUNT</p>
        <h1 id="account-heading">{titles[mode]}</h1>
        <p>Your profile stays private. Sharing a journey is always a separate choice.</p>
      </div>
      <nav aria-label="Account">
        <a href="/sign-in">Sign in</a>
        <a href="/create-account">Create account</a>
        <a href="/recover">Recover access</a>
        <a href="/account">Your account</a>
      </nav>
      {["reset-password", "verify-email"].includes(mode) ? (
        <Button
          variant="secondary"
          onClick={() => {
            if (mode === "verify-email") window.location.href = "kairn-dev://verify-email";
            else if (token.current)
              window.location.href = `kairn-dev://reset-password?token=${encodeURIComponent(token.current)}`;
          }}
        >
          {mode === "reset-password" ? "Open reset in the app" : "Open Kairn"}
        </Button>
      ) : null}
      {message ? <Notice message={message} /> : null}
      {mode === "account" ? (
        account.isPending ? (
          <p role="status">
            {account.fetchStatus === "paused"
              ? "You are offline. Reconnect to load your account."
              : "Loading your account…"}
          </p>
        ) : account.isError ? (
          <>
            <Notice message="Your account could not be loaded. Check your connection and retry." />
            <Button onClick={() => void account.refetch()}>Retry</Button>
          </>
        ) : account.data ? (
          <PrivateAccount
            key={`${epoch}:${account.data.accountId}`}
            account={account.data}
            onChanged={changed}
          />
        ) : (
          <p>
            Your session ended. <a href="/sign-in">Sign in to continue</a>.
          </p>
        )
      ) : (
        <section className="specimen-panel">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void form
                .handleSubmit()
                .then(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
            }}
          >
            <FieldGroup>
              {mode === "create-account" ? (
                <form.Field
                  name="name"
                  validators={{
                    onSubmit: ({ value }) =>
                      DisplayNameSchema.safeParse(value).success
                        ? undefined
                        : "Use 1–80 characters for your display name.",
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor="account-name">Display name</FieldLabel>
                      <Input
                        id="account-name"
                        autoComplete="name"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      <FieldError>{field.state.meta.errors.join(" ")}</FieldError>
                    </Field>
                  )}
                </form.Field>
              ) : null}
              {mode !== "reset-password" ? (
                <form.Field
                  name="email"
                  validators={{
                    onSubmit: ({ value }) =>
                      z.email().safeParse(value).success
                        ? undefined
                        : "Enter a valid email address.",
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor="account-email">Email</FieldLabel>
                      <Input
                        id="account-email"
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      <FieldError>{field.state.meta.errors.join(" ")}</FieldError>
                    </Field>
                  )}
                </form.Field>
              ) : null}
              {["sign-in", "create-account", "reset-password"].includes(mode) ? (
                <form.Field
                  name="password"
                  validators={{
                    onSubmit: ({ value }) =>
                      mode === "sign-in"
                        ? value
                          ? undefined
                          : "Enter your password."
                        : PasswordSchema.safeParse(value).success
                          ? undefined
                          : "Use 15–128 characters. Spaces and passphrases are welcome.",
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor="account-password">
                        {mode === "reset-password" ? "New password" : "Password"}
                      </FieldLabel>
                      <PasswordInput
                        id="account-password"
                        value={field.state.value}
                        onChange={field.handleChange}
                        invalid={field.state.meta.errors.length > 0}
                        newPassword={mode !== "sign-in"}
                      />
                      <FieldError id="account-password-error">
                        {field.state.meta.errors.join(" ")}
                      </FieldError>
                      <FieldDescription>
                        Paste and password managers are supported.
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>
              ) : null}
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(pending) => (
                  <Button type="submit" pending={pending}>
                    {mode === "sign-in"
                      ? "Sign in"
                      : mode === "create-account"
                        ? "Create account"
                        : mode === "reset-password"
                          ? "Save new password"
                          : mode === "verify-email"
                            ? "Send verification email"
                            : "Send reset email"}
                  </Button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>
          {mode === "create-account" ? (
            <p>
              <a href="/verify-email">Need another verification email?</a>
            </p>
          ) : null}
          {mode === "verify-email" ? (
            <p>
              If you arrived from your verification email, you can now try signing in. An expired or
              used link needs a new email.
            </p>
          ) : null}
        </section>
      )}
    </section>
  );
}
function PrivateAccount({
  account,
  onChanged,
}: {
  account: MyAccount;
  onChanged: (suppress?: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const epoch = useAccountEpoch();
  const accountRequest = (path: string, init?: RequestInit) =>
    sendAccountRequest(path, init, epoch);
  const intent = useRef({ id: crypto.randomUUID(), digest: "", etag: "" });
  const profileTag = useRef(account.profile.etag);
  const data = useQuery({
    queryKey: ["account-avatar", epoch, account.accountId],
    queryFn: async () =>
      AvatarStatusSchema.parse(await (await accountRequest("/api/v1/me/avatar/status")).json()),
    retry: false,
    staleTime: 60000,
  });
  const sessions = useQuery({
    queryKey: ["account-sessions", epoch, account.accountId],
    queryFn: async () =>
      z
        .array(
          z.object({
            id: z.string(),
            current: z.boolean(),
            description: z.string(),
            createdAt: z.string(),
            expiresAt: z.string(),
          }),
        )
        .parse(await (await accountRequest("/api/auth/list-sessions")).json()),
    retry: false,
  });
  const form = useForm({
    defaultValues: { displayName: account.profile.displayName, bio: account.profile.bio ?? "" },
    onSubmit: async ({ value }) => {
      const digest = JSON.stringify(value);
      if (intent.current.digest !== digest)
        intent.current = { id: crypto.randomUUID(), digest, etag: profileTag.current };
      try {
        const response = await accountRequest("/api/v1/me/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json", "if-match": intent.current.etag },
          body: JSON.stringify({ commandId: intent.current.id, ...value }),
        });
        const saved = ProfileSchema.parse(await response.json());
        profileTag.current = saved.etag;
        intent.current = { id: crypto.randomUUID(), digest: "", etag: "" };
        if (JSON.stringify(form.state.values) === digest)
          form.reset({ displayName: saved.displayName, bio: saved.bio ?? "" });
        setMessage("Profile saved.");
        await client.invalidateQueries({ queryKey: ["account"] });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
      }
    },
  });
  const act = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account service is unavailable.");
    }
  };
  const [transfer, setTransfer] = useState<ReturnType<typeof createAvatarTransfer> | null>(null);
  const [uploading, setUploading] = useState(false);
  const resumeAvatar = async (pending: ReturnType<typeof createAvatarTransfer>) => {
    setUploading(true);
    try {
      await pending.resume();
      setTransfer(null);
      setMessage("Avatar uploaded. Processing continues privately; refresh to check its status.");
      await data.refetch();
    } finally {
      setUploading(false);
    }
  };
  const avatar = data.data;
  const avatarKey = avatar?.state === "available" ? `${avatar.avatarId}:${avatar.revision}` : "";
  const [failedAvatar, setFailedAvatar] = useState("");
  return (
    <>
      <section className="specimen-panel">
        <h2>Private profile</h2>
        <p>{account.privateEmail}</p>
        {message ? <Notice message={message} /> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="displayName"
              validators={{
                onSubmit: ({ value }) =>
                  DisplayNameSchema.safeParse(value).success
                    ? undefined
                    : "Enter a display name of 1–80 characters.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="profile-name">Display name</FieldLabel>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  <FieldError>{field.state.meta.errors.join(" ")}</FieldError>
                </Field>
              )}
            </form.Field>
            <form.Field
              name="bio"
              validators={{
                onSubmit: ({ value }) =>
                  BioSchema.safeParse(value).success ? undefined : "Use at most 500 characters.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="profile-bio">Bio (optional)</FieldLabel>
                  <TextArea
                    id="profile-bio"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    maxLength={1000}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  <FieldError>{field.state.meta.errors.join(" ")}</FieldError>
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(pending) => (
                <Button type="submit" pending={pending}>
                  Save profile
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload saved profile
        </Button>
        <h3>Avatar</h3>
        {avatar?.state === "available" && failedAvatar !== avatarKey ? (
          <img
            className="account-avatar"
            src={`/api/v1/me/avatar?account=${account.accountId}&revision=${avatar.revision}`}
            onError={() => setFailedAvatar(avatarKey)}
            alt="Your private avatar"
          />
        ) : (
          <span className="account-initials" aria-label="Avatar initials">
            {
              Array.from(
                new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
                  account.profile.displayName,
                ),
              )[0]?.segment
            }
          </span>
        )}
        <Field>
          <FieldLabel htmlFor="avatar-file">Choose a JPEG or PNG (up to 5 MiB)</FieldLabel>
          <input
            id="avatar-file"
            type="file"
            accept="image/jpeg,image/png"
            disabled={uploading || !!transfer || avatar?.state === "processing"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void act(async () => {
                if (file.size > 5242880 || !["image/jpeg", "image/png"].includes(file.type))
                  throw new Error("Choose a JPEG or PNG up to 5 MiB. Convert HEIC images first.");
                const bytes = await file.arrayBuffer();
                const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
                  .map((byte) => byte.toString(16).padStart(2, "0"))
                  .join("");
                const uploadId = crypto.randomUUID();
                const commandId = crypto.randomUUID();
                const completeId = crypto.randomUUID();
                const removeId = crypto.randomUUID();
                const pending = createAvatarTransfer({
                  allocate: async () => {
                    const response = await accountRequest("/api/v1/me/avatar/uploads", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        commandId,
                        uploadId,
                        contentType: file.type,
                        byteLength: file.size,
                        sha256: hash,
                      }),
                    });
                    AvatarUploadResultSchema.parse(await response.json());
                    return z.string().parse(response.headers.get("etag"));
                  },
                  write: async () => {
                    await accountRequest(`/api/v1/me/avatar/uploads/${uploadId}/bytes`, {
                      method: "PUT",
                      headers: { "content-type": file.type },
                      body: bytes,
                    });
                  },
                  complete: async () => {
                    const response = await accountRequest(
                      `/api/v1/me/avatar/uploads/${uploadId}/complete`,
                      {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ commandId: completeId }),
                      },
                    );
                    return z.string().parse(response.headers.get("etag"));
                  },
                  remove: async (etag) => {
                    await accountRequest("/api/v1/me/avatar", {
                      method: "DELETE",
                      headers: { "content-type": "application/json", "if-match": etag },
                      body: JSON.stringify({ commandId: removeId }),
                    });
                  },
                });
                setTransfer(pending);
                await resumeAvatar(pending);
              });
            }}
          />
        </Field>
        {transfer ? (
          <>
            <p role="status">
              Upload interrupted. Retry this upload or discard it before choosing another image.
            </p>
            <Button disabled={uploading} onClick={() => void act(() => resumeAvatar(transfer))}>
              Retry avatar upload
            </Button>
            <Button
              disabled={uploading}
              variant="secondary"
              onClick={() =>
                void act(async () => {
                  setUploading(true);
                  try {
                    await transfer.discard();
                    setTransfer(null);
                    setMessage("Upload removed from access. Recovery confirmation may be pending.");
                    await data.refetch();
                  } finally {
                    setUploading(false);
                  }
                })
              }
            >
              Discard avatar upload
            </Button>
          </>
        ) : null}
        {avatar?.state === "failed" ? (
          <p role="alert">This image could not be processed. Choose another JPEG or PNG.</p>
        ) : avatar?.state === "processing" ? (
          <p role="status">Your avatar is processing.</p>
        ) : null}
        <Button variant="secondary" onClick={() => void data.refetch()}>
          Refresh avatar status
        </Button>
        {avatar?.state === "available" ? (
          <Button
            variant="secondary"
            onClick={() =>
              void act(async () => {
                const result = await (
                  await accountRequest("/api/v1/me/avatar", {
                    method: "DELETE",
                    headers: { "content-type": "application/json", "if-match": avatar.etag },
                    body: JSON.stringify({ commandId: crypto.randomUUID() }),
                  })
                ).json();
                setMessage(
                  result.recoveryConfirmation === "confirmed"
                    ? "Avatar removed. Recovery confirmation complete."
                    : "Avatar removed from access. Recovery confirmation is pending.",
                );
                await data.refetch();
              })
            }
          >
            Remove avatar
          </Button>
        ) : null}
        <h3>Your data</h3>
        <Button
          variant="secondary"
          onClick={() =>
            void act(async () => {
              const response = await accountRequest("/api/v1/me/export");
              const url = URL.createObjectURL(await response.blob());
              const link = document.createElement("a");
              link.href = url;
              link.download = "kairn-account.json";
              link.click();
              URL.revokeObjectURL(url);
            })
          }
        >
          Download account data
        </Button>
      </section>
      <section className="specimen-panel">
        <h2>Security and sessions</h2>
        <p>
          Sign in again to refresh authentication before managing sessions or changing your
          password.
        </p>
        <a href="/recover">Change password through a reset email</a>
        {sessions.isPending ? (
          <p>Loading sessions…</p>
        ) : sessions.isError ? (
          <p role="alert">Sessions are unavailable. Sign in again to continue.</p>
        ) : (
          <ul>
            {sessions.data.map((session) => (
              <li key={session.id}>
                <p>
                  {session.current ? "This session" : session.description} · expires{" "}
                  {new Date(session.expiresAt).toLocaleDateString()}
                </p>
                {!session.current ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void act(async () => {
                        await authRequest("revoke-session", { sessionId: session.id });
                        await sessions.refetch();
                      })
                    }
                  >
                    Revoke session
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="secondary"
          onClick={() =>
            void act(async () => {
              await authRequest("revoke-other-sessions", {});
              await sessions.refetch();
            })
          }
        >
          Revoke other sessions
        </Button>
        <Button
          onClick={() =>
            void act(async () => {
              onChanged(true);
              await authRequest("sign-out", {});
              onChanged(true);
              window.location.assign("/sign-in");
            })
          }
        >
          Sign out
        </Button>
      </section>
    </>
  );
}
