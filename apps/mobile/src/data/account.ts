import { useSyncExternalStore } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { MyAccountSchema } from "@kairn/contracts";
import { nativeCookie, nativeOrigin } from "./native-auth.mjs";
let epoch = 0;
let suppressed = false;
let boundClient: QueryClient | undefined;
export function bindNativeAccountClient(client: QueryClient) {
  boundClient = client;
}
export class NativeSessionRequired extends Error {}
let controller = new AbortController();
const listeners = new Set<() => void>();
export function clearPrivateAccount(client: QueryClient, suppress = false) {
  // An already closed account must not remount again on every failed hydration.
  if (suppress && suppressed) return;
  suppressed = suppress;
  controller.abort();
  controller = new AbortController();
  epoch++;
  void client.cancelQueries();
  client.clear();
  for (const listener of listeners) listener();
}
export const useAccountEpoch = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => epoch,
  );
export async function accountFetch(path: string, init: RequestInit = {}, expectedEpoch = epoch) {
  if (expectedEpoch !== epoch) throw new Error("Account changed. Retry this action.");
  if (suppressed) throw new NativeSessionRequired("Sign in to continue.");
  const generation = epoch;
  const origin = nativeOrigin();
  if (!origin) throw new Error("The account API is not configured.");
  const cookie = await nativeCookie();
  if (generation !== epoch) throw new Error("Account changed. Retry this action.");
  const headers = new Headers(init.headers);
  headers.set("Origin", origin);
  headers.set("Cookie", cookie);
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers,
    credentials: "omit",
    signal: AbortSignal.any([controller.signal, ...(init.signal ? [init.signal] : [])]),
  });
  if (generation !== epoch) throw new Error("Account changed. Retry this action.");
  if (response.status === 401) {
    if (boundClient) clearPrivateAccount(boundClient, true);
    throw new NativeSessionRequired("Your session ended. Sign in again.");
  }
  if (!response.ok)
    throw new Error(
      response.status === 412
        ? "Your profile changed elsewhere. Reload the saved profile before retrying."
        : response.status === 429
          ? "Too many attempts. Please wait."
          : "Account service is unavailable. Check your connection and try again.",
    );
  return response;
}
export async function loadNativeAccount() {
  if (suppressed) return null;
  try {
    return MyAccountSchema.parse(await (await accountFetch("/api/v1/me")).json());
  } catch (error) {
    if (error instanceof NativeSessionRequired) return null;
    throw error;
  }
}
