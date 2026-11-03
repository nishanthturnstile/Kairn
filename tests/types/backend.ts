import { runAsAccount, type AccountActor } from "@kairn/backend/identity";
import { createDatabasePool } from "@kairn/backend/database";
import { privateProfile } from "../../packages/backend/src/identity/schema.js";

export async function verifyTypedProfile(
  pool: ReturnType<typeof createDatabasePool>,
  actor: AccountActor,
) {
  return runAsAccount(pool, actor, async (tx) => {
    const rows = await tx.select({ displayName: privateProfile.displayName }).from(privateProfile);
    const name: string | undefined = rows[0]?.displayName;
    // @ts-expect-error A profile revision remains a number after declaration repairs.
    tx.update(privateProfile).set({ revision: "invalid" });
    // @ts-expect-error The selected schema cannot expose an invented credential field.
    tx.select({ secret: privateProfile.sessionToken }).from(privateProfile);
    return name;
  });
}
