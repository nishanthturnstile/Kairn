import { z } from "zod";
import { DisplayIdentitySchema } from "./accounts.js";
import { ImpactReferenceSchema, LifecycleCommandSchema } from "./access.js";
import {
  CommandSchema,
  DomainIdSchema,
  GenerationSchema,
  PageQuerySchema,
  RevisionSchema,
  ServerTimestampSchema,
} from "./common.js";

export const TransferSchema = z
  .strictObject({
    transferId: DomainIdSchema,
    journeyId: DomainIdSchema,
    revision: RevisionSchema,
    state: z.enum(["offered", "accepted", "declined", "cancelled", "expired", "invalidated"]),
    offeringAdministrator: DisplayIdentitySchema,
    target: DisplayIdentitySchema,
    targetMembershipId: DomainIdSchema,
    targetMembershipEpoch: GenerationSchema,
    journeyPolicyGeneration: GenerationSchema,
    expiresAt: ServerTimestampSchema,
  })
  .describe(
    "One current offer to an existing active coauthor; accepting moves administration only.",
  );
export const OfferTransferSchema = LifecycleCommandSchema.extend({
  transferId: DomainIdSchema,
  targetMembershipId: DomainIdSchema,
});
export const AcceptTransferSchema = LifecycleCommandSchema;
export const TransferListSchema = z.strictObject({
  items: z.array(TransferSchema).max(100),
  nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
});

export const AccountDeletionImpactSchema = z
  .strictObject({
    ...ImpactReferenceSchema.shape,
    expiresAt: ServerTimestampSchema,
    accountRevision: RevisionSchema,
    accountPolicyGeneration: GenerationSchema,
    administrationResponsibilities: z
      .array(
        z.strictObject({
          journeyId: DomainIdSchema,
          journeyRevision: RevisionSchema,
          outcome: z.enum(["accepted_transfer", "administration_freeze"]),
        }),
      )
      .max(100),
    nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
    withdrawOwnedSourceReuse: z.literal(true),
    invalidateIssuedAndReceivedExports: z.literal(true),
    otherOwnersOriginalsRetained: z.literal(true),
  })
  .describe(
    "Server-owned impact. Commit must cover all responsibilities, including pages not displayed.",
  );
export const DeleteAccountSchema = LifecycleCommandSchema.extend({
  confirmAccountDeletion: z.literal(true),
  confirmation: z.literal("DELETE MY ACCOUNT"),
}).describe(
  "Fresh authentication and current impact required. No keep-sharing exception or client-authored successor list.",
);
export const DeletionReceiptPolicySchema = z
  .strictObject({
    hardExpiresAt: ServerTimestampSchema,
    terminalAvailableUntil: ServerTimestampSchema.nullable(),
  })
  .describe(
    "Read-only operation receipt: web path-scoped Secure/HttpOnly cookie, native separate SecureStore. Secret never serialized into status, URL or Query keys.",
  );

export const NoticeSchema = z.discriminatedUnion("targetState", [
  z.strictObject({
    noticeId: DomainIdSchema,
    createdAt: ServerTimestampSchema,
    read: z.boolean(),
    targetState: z.literal("unavailable"),
  }),
  z.strictObject({
    noticeId: DomainIdSchema,
    createdAt: ServerTimestampSchema,
    read: z.boolean(),
    targetState: z.literal("available"),
    kind: z.enum(["invitation", "capability_change", "transfer", "lifecycle"]),
    journeyId: DomainIdSchema,
  }),
]);
export const NoticePageSchema = z.strictObject({
  items: z.array(NoticeSchema).max(100),
  nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
});
export const MarkNoticeReadSchema = CommandSchema;

export const JourneyActionSchema = z.enum([
  "correct_details",
  "manage_people",
  "invite",
  "change_capabilities",
  "transfer_administration",
  "leave",
  "remove_member",
  "archive",
  "delete_journey",
]);
export const JourneyAccessSchema = z
  .strictObject({
    journeyId: DomainIdSchema,
    policyGeneration: GenerationSchema,
    actions: z
      .array(
        z.strictObject({
          action: JourneyActionSchema,
          available: z.boolean(),
          reason: z.enum([
            "permitted",
            "authority_required",
            "archived",
            "administration_frozen",
            "fresh_session_required",
          ]),
        }),
      )
      .max(20),
  })
  .describe(
    "Current UI guidance for a safely disclosed journey. Never authorization for a later write.",
  );
