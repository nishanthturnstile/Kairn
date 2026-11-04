import { runAsAccount, type AccountActor } from "@kairn/backend/identity";
import { createDatabase, createDatabasePool } from "@kairn/backend/database";
import { startJobProducer } from "@kairn/backend/job-producer";
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

export async function verifyTypedProducer(
  pool: ReturnType<typeof createDatabasePool>,
  producer: Awaited<ReturnType<typeof startJobProducer>>,
) {
  return createDatabase(pool).transaction(async (tx) => {
    const result = await producer.email(tx, "b039656c-f32c-4eec-8756-328de4feb8c0");
    const inserted: boolean = result.inserted;
    // @ts-expect-error A query outside a transaction cannot stand in for an atomic producer send.
    producer.email(createDatabase(pool), result.id);
    return inserted;
  });
}
