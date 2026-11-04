import { useSyncExternalStore } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { MyAccountSchema } from "@kairn/contracts";

export const accountTabId = crypto.randomUUID();
let epoch = 0;
let suppressed = false;
let boundClient: QueryClient | undefined;
export function bindAccountClient(client: QueryClient) {
  boundClient = client;
}
let controller = new AbortController();
const listeners = new Set<() => void>();
export class AccountRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function clearAccount(client: QueryClient, suppress = false) {
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
    () => 0,
  );
export async function accountRequest(path: string, init: RequestInit = {}, expectedEpoch = epoch) {
  if (expectedEpoch !== epoch) throw new DOMException("Account changed", "AbortError");
  if (suppressed && path.startsWith("/api/v1/"))
    throw new AccountRequestError(401, "session_required", "Sign in to continue.");
  const generation = epoch;
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.any([controller.signal, ...(init.signal ? [init.signal] : [])]),
  });
  if (generation !== epoch) throw new DOMException("Account changed", "AbortError");
  if (response.status === 401 && path !== "/api/v1/me" && boundClient)
    clearAccount(boundClient, true);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const code =
      body && typeof body === "object" && "code" in body && typeof body.code === "string"
        ? body.code
        : "unavailable";
    const messages: Record<number, string> = {
      401: "Your session ended. Sign in again.",
      403: "This action is unavailable. Verify your email or sign in again.",
      409: "An earlier request conflicts with this save. Refresh and review your changes.",
      412: "Your profile changed elsewhere. Reload the saved profile before trying again.",
      429: "Too many attempts. Please wait before trying again.",
    };
    throw new AccountRequestError(
      response.status,
      code,
      messages[response.status] ??
        "The request could not be completed. Check your connection and try again.",
    );
  }
  return response;
}
export const authRequest = (path: string, body: unknown) =>
  accountRequest(`/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
export async function ownAccount(signal: AbortSignal) {
  if (suppressed) return null;
  try {
    return MyAccountSchema.parse(await (await accountRequest("/api/v1/me", { signal })).json());
  } catch (error) {
    if (error instanceof AccountRequestError && error.status === 401) return null;
    throw error;
  }
}
