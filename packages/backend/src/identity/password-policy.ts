import commonPasswords from "./common-passwords.json" with { type: "json" };
import { PasswordSchema } from "@kairn/contracts";

// Filtered, pinned NCSC/SecLists data; provenance and MIT notice ship with source.
// No credential-path network call and no candidate password retention.
const common = new Set([
  ...commonPasswords,
  "passwordpassword",
  "passwordpassword1",
  "password123456789",
  "123456789012345",
  "1234567890123456",
  "qwertyuiopasdfgh",
  "qwertyuiopasdfghjkl",
  "letmeinletmeinletmein",
  "iloveyouiloveyou",
  "correct horse battery staple",
  "this is my password",
  "thisismypassword",
  "password1234567890",
  "adminadminadmin",
  "welcome123456789",
]);

/** Matching may fold case; the value handed to the library hash is always unchanged. */
export function acceptsNewPassword(value: unknown, context: string[] = []): value is string {
  if (!PasswordSchema.safeParse(value).success || typeof value !== "string") return false;
  const folded = value.toLowerCase();
  if (common.has(folded) || /^(.)\1+$/u.test(value)) return false;
  return !["kairn", ...context].some((part) => {
    const normalized = part.trim().toLowerCase();
    return normalized.length >= 4 && folded.includes(normalized);
  });
}
