// Narrow adapter around the pinned SDK: its client declarations import server-only
// Bun/database types. The adjacent declaration exposes only the native operations
// used here; all account/domain payloads are validated by the universal contracts.
import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
let fault = false;
let invalidate = () => {};
export function setNativeInvalidator(callback) {
  invalidate = callback;
}
function storageFailure() {
  fault = true;
  invalidate("storage");
  return new Error("Secure account storage is unavailable.");
}
let client;
let origin;
const storage = {
  getItem: (key) => {
    try {
      return SecureStore.getItem(key);
    } catch {
      throw storageFailure();
    }
  },
  setItem: (key, value) => {
    try {
      SecureStore.setItem(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      throw storageFailure();
    }
  },
  getItemAsync: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      throw storageFailure();
    }
  },
  setItemAsync: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      throw storageFailure();
    }
  },
};
export function initializeNativeAuth(baseUrl) {
  if (!client) {
    origin = baseUrl;
    client = createAuthClient({
      baseURL: baseUrl,
      plugins: [
        expoClient({
          scheme: "kairn-dev",
          storagePrefix: "kairn-auth",
          storage,
          disableCache: true,
        }),
      ],
    });
  }
}
export async function nativeCookie() {
  if (fault || !client)
    throw new Error(
      "Secure account storage is unavailable. Retry account storage before continuing.",
    );
  const cookie = await client.getCookie();
  if (fault) throw new Error("Secure account storage is unavailable.");
  return cookie;
}
let pendingAuth = Promise.resolve();
export function nativeAuthRequest(path, body) {
  const result = pendingAuth.then(() => sendAuthRequest(path, body));
  pendingAuth = result.then(
    () => {},
    () => {},
  );
  return result;
}
async function sendAuthRequest(path, body) {
  if (fault || !client) throw new Error("Secure account storage is unavailable.");
  const result = await client.$fetch(`/api/auth/${path}`.replace("/api/auth", ""), {
    method: body === undefined ? "GET" : "POST",
    headers: { Origin: "kairn-dev://" },
    ...(body === undefined ? {} : { body }),
  });
  if (fault) throw new Error("Secure account storage is unavailable.");
  if (
    result.error?.status === 401 &&
    ["get-session", "list-sessions", "revoke-session", "revoke-other-sessions"].includes(path)
  )
    invalidate("session");
  if (result.error)
    throw new Error(
      result.error.status === 429
        ? "Too many attempts. Please wait before trying again."
        : "Account action failed. Check verification, your password and connection.",
    );
  return result.data;
}
export function nativeStorageFailed() {
  return fault;
}
export async function retryNativeStorage() {
  try {
    await SecureStore.getItemAsync("kairn-storage-probe");
    fault = false;
  } catch {
    throw storageFailure();
  }
}
export function nativeOrigin() {
  return origin;
}
