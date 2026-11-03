import { z } from "zod";
import { DisplayIdentitySchema } from "./accounts.js";
import {
  CommandSchema,
  DomainIdSchema,
  EntityTagSchema,
  GenerationSchema,
  PageQuerySchema,
  RevisionSchema,
  ServerTimestampSchema,
} from "./common.js";

export const SourceScopeSchema = z.enum(["only_me", "journey_review", "publication_reuse"]);
export const SourceGrantSchema = z
  .strictObject({
    sourceId: DomainIdSchema,
    ownerAccountId: DomainIdSchema,
    journeyId: DomainIdSchema,
    revision: RevisionSchema,
    etag: EntityTagSchema,
    scope: SourceScopeSchema,
  })
  .describe(
    "Only me means no active journey grant. Publication reuse never grants original-file export.",
  );
export const ChangeSourceGrantSchema = CommandSchema.extend({ scope: SourceScopeSchema });
export const ExportAssetBindingSchema = z.strictObject({
  assetId: DomainIdSchema,
  sourceId: DomainIdSchema,
  assetRevision: RevisionSchema,
  sourceGrantId: DomainIdSchema,
  sourceGrantRevision: RevisionSchema,
});
export const ExactExportAssetsSchema = z
  .array(ExportAssetBindingSchema)
  .min(1)
  .max(100)
  .refine(
    (assets) => new Set(assets.map((asset) => asset.assetId)).size === assets.length,
    "Each exact asset must occur once.",
  )
  .describe(
    "Exact existing assets; one source-grant revision per asset. No avatar, future-files or source-wide wildcard.",
  );
export const CreateExportRequestSchema = CommandSchema.extend({
  requestId: DomainIdSchema,
  ownerAccountId: DomainIdSchema,
  assets: ExactExportAssetsSchema,
});
export const ExportRequestSchema = z.strictObject({
  requestId: DomainIdSchema,
  journeyId: DomainIdSchema,
  owner: DisplayIdentitySchema,
  requester: DisplayIdentitySchema,
  requesterMembershipId: DomainIdSchema,
  requesterMembershipEpoch: GenerationSchema,
  revision: RevisionSchema,
  etag: EntityTagSchema,
  state: z.enum(["requested", "approved", "declined", "expired", "invalidated"]),
  assets: ExactExportAssetsSchema,
  expiresAt: ServerTimestampSchema,
});
export const ApproveExportSchema = CommandSchema.extend({
  grantId: DomainIdSchema,
  assets: ExactExportAssetsSchema,
  expiresAt: ServerTimestampSchema,
}).describe(
  "Owner chooses up to seven days (default 24 hours). Service rechecks exact request, eligible assets, recipient epoch, source revisions and server time.",
);
export const ExportGrantSchema = z
  .strictObject({
    grantId: DomainIdSchema,
    journeyId: DomainIdSchema,
    ownerAccountId: DomainIdSchema,
    recipientAccountId: DomainIdSchema,
    recipientMembershipId: DomainIdSchema,
    recipientMembershipEpoch: GenerationSchema,
    revision: RevisionSchema,
    etag: EntityTagSchema,
    state: z.enum(["active", "revoked", "expired", "invalidated"]),
    assets: ExactExportAssetsSchema,
    issuedAt: ServerTimestampSchema,
    expiresAt: ServerTimestampSchema,
  })
  .refine(
    (grant) =>
      Date.parse(grant.expiresAt) > Date.parse(grant.issuedAt) &&
      Date.parse(grant.expiresAt) - Date.parse(grant.issuedAt) <= 7 * 24 * 60 * 60 * 1000,
    "Export approval must expire within seven days of issue.",
  )
  .describe(
    "Reference, never bearer file authority. Managed delivery rechecks every live binding; rejoining cannot restore an old epoch.",
  );
export const ExportRequestPageSchema = z.strictObject({
  items: z.array(ExportRequestSchema).max(100),
  nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
});
export const ExportGrantPageSchema = z.strictObject({
  items: z.array(ExportGrantSchema).max(100),
  nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
});
