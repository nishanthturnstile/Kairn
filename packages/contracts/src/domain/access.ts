import { z } from "zod";
import { DisplayIdentitySchema } from "./accounts.js";
import {
  CommandSchema,
  DomainIdSchema,
  GenerationSchema,
  RevisionSchema,
  ServerTimestampSchema,
} from "./common.js";
import { EditablePowersSchema, JourneyDetailsSchema } from "./journeys.js";

export const CreateInvitationSchema = z
  .strictObject({
    ...CommandSchema.shape,
    invitationId: DomainIdSchema,
    recipientEmail: z.email().max(320),
    powers: EditablePowersSchema,
  })
  .describe(
    "New or explicitly reissued offer. No administrator checkbox; server supplies seven-day expiry.",
  );
export const InvitationStateSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
  "superseded",
]);
export const InvitationSchema = z
  .strictObject({
    invitationId: DomainIdSchema,
    revision: RevisionSchema,
    state: InvitationStateSchema,
    powers: EditablePowersSchema,
    expiresAt: ServerTimestampSchema,
    delivery: z.enum(["queued", "smtp_accepted", "failed", "expired"]),
  })
  .describe(
    "Management projection. SMTP acceptance is not delivery confirmation; no secret/hash/payload.",
  );
export const ResolveInvitationSchema = z
  .strictObject({
    token: z
      .string()
      .length(43)
      .regex(/^[A-Za-z0-9_-]{43}$/),
  })
  .describe(
    "32-byte base64url domain secret. Redacted POST body only; never URL query, logs or Query keys.",
  );
export const ResolvedInvitationSchema = z
  .discriminatedUnion("state", [
    z.strictObject({ state: z.literal("authentication_required") }),
    z.strictObject({ state: z.literal("verification_required") }),
    z.strictObject({
      state: z.literal("ready"),
      invitation: InvitationSchema.extend({ state: z.literal("pending") }),
      journeyId: DomainIdSchema,
      details: JourneyDetailsSchema,
      inviter: DisplayIdentitySchema,
    }),
  ])
  .describe(
    "Only the verified matching recipient receives journey details. Resolution never accepts.",
  );

export const ImpactReferenceSchema = z
  .strictObject({
    impactToken: z
      .string()
      .length(43)
      .regex(/^[A-Za-z0-9_-]{43}$/),
  })
  .describe(
    "Five-minute hashed secret bound server-side to exact actor/action/target/revisions/generations.",
  );
export const ChangeCapabilitiesSchema = z
  .strictObject({
    ...CommandSchema.shape,
    ...ImpactReferenceSchema.shape,
    powers: EditablePowersSchema,
  })
  .describe(
    "Replaces only coauthor/publisher. Administration changes exclusively through accepted transfer.",
  );
export const MutationResultSchema = z.strictObject({
  status: z.literal("accepted"),
  commandId: DomainIdSchema,
  resourceId: DomainIdSchema,
  revision: RevisionSchema,
});
export const ImpactActionSchema = z.enum([
  "leave",
  "remove_member",
  "archive",
  "delete_journey",
  "transfer_administration",
  "change_capabilities",
]);
export const JourneyImpactRequestSchema = z
  .strictObject({
    action: ImpactActionSchema,
    memberId: DomainIdSchema.optional(),
    powers: EditablePowersSchema.optional(),
  })
  .superRefine((value, context) => {
    const needsMember = [
      "remove_member",
      "transfer_administration",
      "change_capabilities",
    ].includes(value.action);
    if (needsMember !== (value.memberId !== undefined))
      context.addIssue({
        code: "custom",
        path: ["memberId"],
        message: "Member must match the requested action.",
      });
    if ((value.action === "change_capabilities") !== (value.powers !== undefined))
      context.addIssue({
        code: "custom",
        path: ["powers"],
        message: "Proposed powers are required only for a capability change.",
      });
  });
export const ImpactSchema = z.strictObject({
  ...ImpactReferenceSchema.shape,
  action: ImpactActionSchema,
  expiresAt: ServerTimestampSchema,
  journeyId: DomainIdSchema,
  journeyRevision: RevisionSchema,
  policyGeneration: GenerationSchema,
  requiresFreshSession: z.boolean(),
  freezesAdministration: z.boolean(),
  otherOwnersOriginalsRetained: z.literal(true),
});
export const LifecycleCommandSchema = z.strictObject({
  ...CommandSchema.shape,
  ...ImpactReferenceSchema.shape,
});
export const DeleteJourneySchema = LifecycleCommandSchema.extend({
  confirmSharedRecordDeletion: z.literal(true),
  typedTitle: z.string().min(1).max(320),
}).describe(
  "Two requester confirmations, current impact and fresh authentication; server compares the exact current title.",
);

export type Invitation = z.infer<typeof InvitationSchema>;
export type Impact = z.infer<typeof ImpactSchema>;
