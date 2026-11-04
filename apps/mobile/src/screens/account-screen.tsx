import { useEffect, useRef, useState } from "react";
import { Alert, Image, Share, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient, onlineManager } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fontNotices } from "../assets/font-notices";
import { StyleSheet } from "react-native-unistyles";
import { z } from "zod";
import { createAvatarTransfer } from "@kairn/shared";
import {
  AvatarStatusSchema,
  AccountDataExportSchema,
  BioSchema,
  AvatarUploadResultSchema,
  DisplayNameSchema,
  PasswordSchema,
  ProfileSchema,
} from "@kairn/contracts";
import {
  setNativeInvalidator,
  initializeNativeAuth,
  nativeAuthRequest,
  nativeCookie,
  retryNativeStorage,
  nativeStorageFailed,
} from "../data/native-auth.mjs";
import {
  bindNativeAccountClient,
  accountFetch as sendAccountRequest,
  clearPrivateAccount,
  loadNativeAccount,
  useAccountEpoch,
} from "../data/account";
import { readApiUrl } from "../data/system-query";

function Action({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function AccountScreen() {
  const epoch = useAccountEpoch();
  const configured = readApiUrl(process.env.EXPO_PUBLIC_API_URL);
  if (configured.error || !configured.baseUrl)
    return (
      <View style={styles.section}>
        <Text style={styles.body}>Account service is not configured.</Text>
      </View>
    );
  initializeNativeAuth(configured.baseUrl);
  return <ConfiguredAccount key={epoch} origin={configured.baseUrl} />;
}
function ConfiguredAccount({ origin }: { origin: string }) {
  const client = useQueryClient();
  bindNativeAccountClient(client);
  const epoch = useAccountEpoch();
  const accountFetch = (path: string, init?: RequestInit) => sendAccountRequest(path, init, epoch);
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; action?: string }>();
  const [mode, setMode] = useState<"sign-in" | "create" | "recover" | "reset" | "verify">(
    params.action === "recover" ? "recover" : "sign-in",
  );
  const [message, setMessage] = useState(() =>
    nativeStorageFailed()
      ? "Secure account storage is unavailable. Retry account access before continuing."
      : "",
  );
  const [intentHydrated, setIntentHydrated] = useState(false);
  setNativeInvalidator((reason) => {
    clearPrivateAccount(client, true);
    setMessage(
      reason === "session"
        ? "Your session ended. Sign in again."
        : "Secure account storage is unavailable. Retry account access before continuing.",
    );
  });
  const [shown, show] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);
  const resetToken = useRef<string | null>(null);
  const intent = useRef({ digest: "", id: "", etag: "" });
  const profileTag = useRef("");
  const nameInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const profileNameInput = useRef<TextInput>(null);
  const bioInput = useRef<TextInput>(null);
  const query = useQuery({
    queryKey: ["native-account", epoch],
    queryFn: loadNativeAccount,
    retry: false,
  });
  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) =>
      onlineManager.setOnline(state.isConnected === true && state.isInternetReachable !== false),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (params.token) {
          await SecureStore.setItemAsync(
            "kairn-intent.reset",
            JSON.stringify({ token: params.token, expires: Date.now() + 30 * 60 * 1000 }),
            { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
          );
          router.replace("/reset-password");
        }
        const pending = await SecureStore.getItemAsync("kairn-intent.reset");
        if (pending) {
          const parsed = z
            .object({ token: z.string().max(8192), expires: z.number() })
            .safeParse(JSON.parse(pending));
          if (parsed.success && parsed.data.expires > Date.now()) {
            if (active) {
              resetToken.current = parsed.data.token;
              setMode("reset");
            }
          } else await SecureStore.deleteItemAsync("kairn-intent.reset");
        }
      } catch {
        if (active) {
          clearPrivateAccount(client, true);
          setMessage("Secure account storage is unavailable. Retry before continuing.");
        }
      } finally {
        if (active) setIntentHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.token, router]);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account action failed.");
    } finally {
      setBusy(false);
    }
  };
  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    onSubmitInvalid: ({ formApi }) => {
      if (formApi.getFieldMeta("name")?.errors.length) nameInput.current?.focus();
      else if (formApi.getFieldMeta("email")?.errors.length) emailInput.current?.focus();
      else passwordInput.current?.focus();
    },
    onSubmit: async ({ value }) =>
      run(async () => {
        if (mode === "sign-in") {
          await nativeAuthRequest("sign-in/email", {
            email: value.email,
            password: value.password,
          });
          form.reset();
          clearPrivateAccount(client);
        } else if (mode === "create") {
          await nativeAuthRequest("sign-up/email", {
            name: value.name,
            email: value.email,
            password: value.password,
            callbackURL: `${origin}/verify-email`,
          });
          form.setFieldValue("password", "");
          setMessage("Check your email to verify, then sign in.");
          setMode("verify");
        } else if (mode === "reset") {
          if (!resetToken.current) throw new Error("Request another reset email.");
          await nativeAuthRequest("reset-password", {
            token: resetToken.current,
            newPassword: value.password,
          });
          resetToken.current = null;
          await SecureStore.deleteItemAsync("kairn-intent.reset");
          form.reset();
          clearPrivateAccount(client, true);
          await nativeAuthRequest("sign-out", {});
          setMode("sign-in");
          setMessage("Password updated. Sign in again.");
        } else if (mode === "verify") {
          await nativeAuthRequest("send-verification-email", {
            email: value.email,
            callbackURL: `${origin}/verify-email`,
          });
          setMessage(
            "If verification is needed, a new email is on its way. Wait a minute before resending.",
          );
        } else {
          await nativeAuthRequest("request-password-reset", {
            email: value.email,
            redirectTo: `${origin}/reset-password`,
          });
          setMessage("If recovery is available, a reset email is on its way.");
        }
      }),
  });
  const profile = useForm({
    defaultValues: { displayName: "", bio: "" },
    onSubmitInvalid: ({ formApi }) => {
      if (formApi.getFieldMeta("displayName")?.errors.length) profileNameInput.current?.focus();
      else bioInput.current?.focus();
    },
    onSubmit: async ({ value }) =>
      run(async () => {
        if (!query.data) return;
        const digest = JSON.stringify(value);
        if (intent.current.digest !== digest)
          intent.current = { digest, id: Crypto.randomUUID(), etag: profileTag.current };
        const response = await accountFetch("/api/v1/me/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json", "if-match": intent.current.etag },
          body: JSON.stringify({ ...value, commandId: intent.current.id }),
        });
        const saved = ProfileSchema.parse(await response.json());
        profileTag.current = saved.etag;
        intent.current = { digest: "", id: "", etag: "" };
        profile.reset({ displayName: saved.displayName, bio: saved.bio ?? "" });
        await query.refetch();
        setMessage("Profile saved.");
      }),
  });
  useEffect(() => {
    if (query.data) {
      profileTag.current = query.data.profile.etag;
      profile.reset({
        displayName: query.data.profile.displayName,
        bio: query.data.profile.bio ?? "",
      });
    }
  }, [query.data?.accountId]);
  const avatarQuery = useQuery({
    queryKey: ["native-avatar", epoch, query.data?.accountId],
    enabled: !!query.data,
    queryFn: async () =>
      AvatarStatusSchema.parse(await (await accountFetch("/api/v1/me/avatar/status")).json()),
    retry: false,
    staleTime: 60000,
  });
  const sessions = useQuery({
    queryKey: ["native-sessions", epoch, query.data?.accountId],
    enabled: !!query.data,
    queryFn: async () =>
      z
        .array(z.object({ id: z.string(), current: z.boolean(), description: z.string() }))
        .parse(await nativeAuthRequest("list-sessions")),
    retry: false,
  });
  const [transfer, setTransfer] = useState<ReturnType<typeof createAvatarTransfer> | null>(null);
  const resumeAvatar = async (pending: ReturnType<typeof createAvatarTransfer>) => {
    await pending.resume();
    setTransfer(null);
    await avatarQuery.refetch();
    setMessage("Avatar uploaded. Processing continues privately.");
  };
  useEffect(() => {
    setTransfer(null);
  }, [epoch]);
  const avatar = avatarQuery.data;
  const avatarKey = avatar?.state === "available" ? `${avatar.avatarId}:${avatar.revision}` : "";
  const [failedAvatar, setFailedAvatar] = useState("");
  const [avatarCookie, setAvatarCookie] = useState("");
  useEffect(() => {
    let active = true;
    void nativeCookie()
      .then((cookie) => {
        if (active) setAvatarCookie(cookie);
      })
      .catch(() => {
        if (active) setAvatarCookie("");
      });
    return () => {
      active = false;
    };
  }, [epoch, avatar?.state]);
  if (!intentHydrated)
    return (
      <View style={styles.section}>
        <Text style={styles.body}>Loading secure account state…</Text>
      </View>
    );
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.kicker}>KAIRN / YOUR PRIVATE ACCOUNT</Text>
      <Text style={styles.heading}>
        {mode === "reset"
          ? "Choose a new password"
          : query.data
            ? "Your account"
            : mode === "create"
              ? "A place for your journeys."
              : mode === "recover"
                ? "Recover access"
                : mode === "verify"
                  ? "Verify your email"
                  : "Welcome back."}
      </Text>
      {message ? (
        <>
          <Text accessibilityRole="alert" style={styles.notice}>
            {message}
          </Text>
          <Action
            title="Retry account access"
            onPress={() =>
              void run(async () => {
                await retryNativeStorage();
                clearPrivateAccount(client);
              })
            }
          />
        </>
      ) : null}
      {query.isPending ? (
        <Text style={styles.body}>
          {query.fetchStatus === "paused"
            ? "You are offline. Reconnect to load your account."
            : "Loading your account…"}
        </Text>
      ) : query.isError ? (
        <>
          <Text accessibilityRole="alert" style={styles.body}>
            Account storage or connection is unavailable.
          </Text>
          <Action
            title="Retry account storage and connection"
            onPress={() =>
              void run(async () => {
                await retryNativeStorage();
                clearPrivateAccount(client);
              })
            }
          />
        </>
      ) : query.data && mode !== "reset" ? (
        <>
          <Text style={styles.body}>{query.data.privateEmail}</Text>
          <View style={styles.section}>
            <Text style={styles.subheading}>Private profile</Text>
            <profile.Field
              name="displayName"
              validators={{
                onSubmit: ({ value }) =>
                  DisplayNameSchema.safeParse(value).success
                    ? undefined
                    : "Use a display name of 1–80 characters.",
              }}
            >
              {(field) => (
                <>
                  <Text style={styles.label}>Display name</Text>
                  <TextInput
                    ref={profileNameInput}
                    accessibilityLabel="Display name"
                    editable={!busy}
                    autoComplete="name"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    style={styles.input}
                  />
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {field.state.meta.errors.join(" ")}
                  </Text>
                </>
              )}
            </profile.Field>
            <profile.Field
              name="bio"
              validators={{
                onSubmit: ({ value }) =>
                  BioSchema.safeParse(value).success ? undefined : "Use at most 500 characters.",
              }}
            >
              {(field) => (
                <>
                  <Text style={styles.label}>Bio (optional)</Text>
                  <TextInput
                    ref={bioInput}
                    accessibilityLabel="Bio (optional)"
                    editable={!busy}
                    multiline
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    style={[styles.input, styles.bio]}
                  />
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {field.state.meta.errors.join(" ")}
                  </Text>
                </>
              )}
            </profile.Field>
            <Action
              title="Save profile"
              disabled={busy}
              onPress={() => void profile.handleSubmit()}
            />
            <Text style={styles.body}>Reloading replaces unsaved profile edits.</Text>
            <Action
              title="Reload saved profile"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  const result = await query.refetch();
                  if (result.isError || !result.data)
                    throw new Error("Saved profile could not be loaded.");
                  profileTag.current = result.data.profile.etag;
                  intent.current = { digest: "", id: "", etag: "" };
                  profile.reset({
                    displayName: result.data.profile.displayName,
                    bio: result.data.profile.bio ?? "",
                  });
                  setMessage("Saved profile loaded.");
                })
              }
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.subheading}>Private avatar</Text>
            {avatar?.state === "available" && avatarCookie && failedAvatar !== avatarKey ? (
              <Image
                source={{
                  uri: `${origin}/api/v1/me/avatar?account=${query.data.accountId}&revision=${avatar.revision}`,
                  headers: { Cookie: avatarCookie },
                  cache: "reload",
                }}
                onError={() => setFailedAvatar(avatarKey)}
                accessibilityLabel="Your private avatar"
                style={styles.avatar}
              />
            ) : (
              <Text style={styles.initials}>{query.data.profile.displayName.slice(0, 1)}</Text>
            )}
            {avatar?.state === "processing" ? (
              <Text style={styles.body}>Your image is processing privately.</Text>
            ) : avatar?.state === "failed" ? (
              <Text style={styles.error}>
                Choose another JPEG or PNG; this image could not be processed.
              </Text>
            ) : null}
            <Action
              title="Choose avatar"
              disabled={busy || !!transfer || avatar?.state === "processing"}
              onPress={() =>
                void run(async () => {
                  const selection = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.9,
                  });
                  if (selection.canceled) return;
                  const asset = selection.assets[0];
                  if (!asset || !["image/jpeg", "image/png"].includes(asset.mimeType ?? ""))
                    throw new Error("Choose a JPEG or PNG. Convert HEIC images before importing.");
                  const bytes = await (await fetch(asset.uri)).arrayBuffer();
                  if (bytes.byteLength > 5242880)
                    throw new Error("Choose an image smaller than 5 MiB.");
                  const hash = [
                    ...new Uint8Array(
                      await Crypto.digest(
                        Crypto.CryptoDigestAlgorithm.SHA256,
                        new Uint8Array(bytes),
                      ),
                    ),
                  ]
                    .map((byte) => byte.toString(16).padStart(2, "0"))
                    .join("");
                  const id = Crypto.randomUUID();
                  const commandId = Crypto.randomUUID();
                  const completeId = Crypto.randomUUID();
                  const removeId = Crypto.randomUUID();
                  const pending = createAvatarTransfer({
                    allocate: async () => {
                      const response = await accountFetch("/api/v1/me/avatar/uploads", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          commandId,
                          uploadId: id,
                          contentType: asset.mimeType,
                          byteLength: bytes.byteLength,
                          sha256: hash,
                        }),
                      });
                      AvatarUploadResultSchema.parse(await response.json());
                      return z.string().parse(response.headers.get("etag"));
                    },
                    write: async () => {
                      await accountFetch(`/api/v1/me/avatar/uploads/${id}/bytes`, {
                        method: "PUT",
                        headers: { "content-type": asset.mimeType! },
                        body: bytes,
                      });
                    },
                    complete: async () => {
                      const response = await accountFetch(
                        `/api/v1/me/avatar/uploads/${id}/complete`,
                        {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ commandId: completeId }),
                        },
                      );
                      return z.string().parse(response.headers.get("etag"));
                    },
                    remove: async (etag) => {
                      await accountFetch("/api/v1/me/avatar", {
                        method: "DELETE",
                        headers: { "content-type": "application/json", "if-match": etag },
                        body: JSON.stringify({ commandId: removeId }),
                      });
                    },
                  });
                  setTransfer(pending);
                  await resumeAvatar(pending);
                })
              }
            />
            {transfer ? (
              <>
                <Text style={styles.body}>
                  Upload interrupted. Retry or discard before choosing another image.
                </Text>
                <Action
                  title="Retry avatar upload"
                  disabled={busy}
                  onPress={() => void run(() => resumeAvatar(transfer))}
                />
                <Action
                  title="Discard avatar upload"
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      await transfer.discard();
                      setTransfer(null);
                      await avatarQuery.refetch();
                      setMessage(
                        "Upload removed from access. Recovery confirmation may be pending.",
                      );
                    })
                  }
                />
              </>
            ) : null}
            <Action title="Refresh avatar" onPress={() => void avatarQuery.refetch()} />
            {avatar?.state === "available" ? (
              <Action
                title="Remove avatar"
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "Remove your avatar?",
                    "Managed access is removed immediately. Recovery confirmation may remain pending.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () =>
                          void run(async () => {
                            await accountFetch("/api/v1/me/avatar", {
                              method: "DELETE",
                              headers: {
                                "content-type": "application/json",
                                "if-match": avatar.etag,
                              },
                              body: JSON.stringify({ commandId: Crypto.randomUUID() }),
                            });
                            await avatarQuery.refetch();
                            setMessage(
                              "Avatar access removed. Recovery confirmation may be pending.",
                            );
                          }),
                      },
                    ],
                  )
                }
              />
            ) : null}
          </View>
          <View style={styles.section}>
            <Text style={styles.subheading}>Security and data</Text>
            <Text style={styles.body}>Session controls need a recent sign-in.</Text>
            {sessions.isError ? (
              <Text style={styles.error}>Sign in again to manage sessions.</Text>
            ) : (
              sessions.data?.map((session) => (
                <View key={session.id}>
                  <Text style={styles.body}>
                    {session.current ? "This session" : session.description}
                  </Text>
                  {!session.current ? (
                    <Action
                      title="Revoke session"
                      onPress={() =>
                        void run(async () => {
                          await nativeAuthRequest("revoke-session", { sessionId: session.id });
                          await sessions.refetch();
                        })
                      }
                    />
                  ) : null}
                </View>
              ))
            )}
            <Action
              title="Revoke other sessions"
              onPress={() =>
                void run(async () => {
                  await nativeAuthRequest("revoke-other-sessions", {});
                  await sessions.refetch();
                })
              }
            />
            <Action
              title="Export account data"
              onPress={() =>
                void run(async () => {
                  const data = AccountDataExportSchema.parse(
                    await (await accountFetch("/api/v1/me/export")).json(),
                  );
                  await Share.share({
                    title: "Kairn account data",
                    message: JSON.stringify(data, null, 2),
                  });
                })
              }
            />
            <Text style={styles.body}>
              Export includes your private profile and managed-avatar manifest. Choose where to
              share it.
            </Text>
            <Action
              title="Reset password"
              onPress={() =>
                void run(async () => {
                  clearPrivateAccount(client, true);
                  router.replace({ pathname: "/account", params: { action: "recover" } });
                  await nativeAuthRequest("sign-out", {});
                })
              }
            />
            <Action
              title="Sign out"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  clearPrivateAccount(client, true);
                  await nativeAuthRequest("sign-out", {});
                  clearPrivateAccount(client, true);
                })
              }
            />
          </View>
        </>
      ) : (
        <View style={styles.section}>
          {mode === "create" ? (
            <form.Field
              name="name"
              validators={{
                onSubmit: ({ value }) =>
                  DisplayNameSchema.safeParse(value).success
                    ? undefined
                    : "Use a name of 1–80 characters.",
              }}
            >
              {(field) => (
                <>
                  <Text style={styles.label}>Display name</Text>
                  <TextInput
                    ref={nameInput}
                    accessibilityLabel="Display name"
                    editable={!busy}
                    autoComplete="name"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    style={styles.input}
                  />
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {field.state.meta.errors.join(" ")}
                  </Text>
                </>
              )}
            </form.Field>
          ) : null}
          {mode !== "reset" ? (
            <form.Field
              name="email"
              validators={{
                onSubmit: ({ value }) =>
                  z.email().safeParse(value).success ? undefined : "Enter a valid email address.",
              }}
            >
              {(field) => (
                <>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    ref={emailInput}
                    accessibilityLabel="Email"
                    editable={!busy}
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    style={styles.input}
                  />
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {field.state.meta.errors.join(" ")}
                  </Text>
                </>
              )}
            </form.Field>
          ) : null}
          {["sign-in", "create", "reset"].includes(mode) ? (
            <form.Field
              name="password"
              validators={{
                onSubmit: ({ value }) =>
                  mode === "sign-in"
                    ? value
                      ? undefined
                      : "Enter a password."
                    : PasswordSchema.safeParse(value).success
                      ? undefined
                      : "Use 15–128 characters. Passphrases are welcome.",
              }}
            >
              {(field) => (
                <>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    ref={passwordInput}
                    accessibilityLabel="Password"
                    editable={!busy}
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    textContentType={mode === "sign-in" ? "password" : "newPassword"}
                    secureTextEntry={!shown}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    style={styles.input}
                  />
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {field.state.meta.errors.join(" ")}
                  </Text>
                  <Action
                    title={shown ? "Hide password" : "Show password"}
                    onPress={() => show(!shown)}
                  />
                </>
              )}
            </form.Field>
          ) : null}
          <Action
            title={
              busy
                ? "Please wait…"
                : mode === "create"
                  ? "Create account"
                  : mode === "sign-in"
                    ? "Sign in"
                    : mode === "reset"
                      ? "Save new password"
                      : "Send email"
            }
            disabled={busy}
            onPress={() => void form.handleSubmit()}
          />
          {(["sign-in", "create", "recover", "verify"] as const)
            .filter((next) => next !== mode)
            .map((next) => (
              <Action
                key={next}
                title={
                  next === "create"
                    ? "Create account"
                    : next === "recover"
                      ? "Recover access"
                      : next === "verify"
                        ? "Resend verification"
                        : "Sign in"
                }
                onPress={() => {
                  form.setFieldValue("password", "");
                  setMode(next);
                  setMessage("");
                }}
              />
            ))}
        </View>
      )}
      <Action title="Connection status" onPress={() => router.push("/status")} />
      <Action
        title={showLicenses ? "Hide font licenses" : "Font licenses"}
        onPress={() => setShowLicenses(!showLicenses)}
      />
      {showLicenses ? (
        <View style={styles.section}>
          <Text style={styles.fontSpecimen}>Newsreader Medium 500</Text>
          <Text style={styles.fontStrong}>Instrument Sans Bold 700</Text>
          <Text style={styles.body}>{fontNotices.Newsreader}</Text>
          <Text style={styles.body}>{fontNotices.InstrumentSans}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  page: {
    padding: theme.spacing.xl,
    paddingBottom: rt.insets.bottom + theme.spacing.xxl,
    gap: theme.spacing.lg,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.large,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  fontSpecimen: { fontFamily: "Newsreader500", fontSize: 24, color: theme.colors.text },
  fontStrong: { fontFamily: "InstrumentSans700", fontSize: 16, color: theme.colors.text },
  heading: { fontFamily: "Newsreader600", fontSize: 34, lineHeight: 40, color: theme.colors.text },
  subheading: { fontFamily: "InstrumentSans600", fontSize: 22, color: theme.colors.text },
  label: { fontFamily: "InstrumentSans600", fontSize: 16, color: theme.colors.text },
  body: { fontFamily: "InstrumentSans400", fontSize: 16, lineHeight: 24, color: theme.colors.text },
  kicker: { fontFamily: "InstrumentSans500", fontSize: 12, color: theme.colors.secondaryText },
  input: {
    fontFamily: "InstrumentSans400",
    fontSize: 17,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.controlBorder,
    borderWidth: 1,
    borderRadius: theme.radius.small,
    padding: theme.spacing.md,
    minHeight: 48,
  },
  bio: { minHeight: 104, textAlignVertical: "top" },
  error: { fontFamily: "InstrumentSans400", color: theme.colors.error, fontSize: 14 },
  notice: {
    fontFamily: "InstrumentSans500",
    fontSize: 16,
    lineHeight: 24,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.successSurface,
    color: theme.colors.text,
    borderRadius: theme.radius.small,
  },
  button: {
    minHeight: 48,
    padding: theme.spacing.md,
    borderRadius: theme.radius.small,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  buttonText: { fontFamily: "InstrumentSans600", fontSize: 16, color: theme.colors.primaryText },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  initials: { fontFamily: "Newsreader600", fontSize: 44, color: theme.colors.primary },
}));
