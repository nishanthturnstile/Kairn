import { z } from "zod";
import {
  accountJourneyLimits,
  boundedText,
  CommandSchema,
  DomainIdSchema,
  EntityTagSchema,
  RevisionSchema,
  ServerTimestampSchema,
} from "./common.js";

export const DisplayNameSchema = boundedText(1, accountJourneyLimits.displayName, true).describe(
  "1–80 Unicode scalars after trimming surrounding whitespace; never derived from email.",
);
export const BioSchema = boundedText(0, accountJourneyLimits.bio, true);
export const PasswordSchema = boundedText(
  accountJourneyLimits.passwordMin,
  accountJourneyLimits.passwordMax,
).describe(
  "15–128 Unicode scalars, unchanged: no trimming, normalization or truncation. Server blocklist also required.",
);

export const ProfileFieldsSchema = z.strictObject({
  displayName: DisplayNameSchema,
  bio: BioSchema.nullable(),
});
export const UpdateProfileSchema = ProfileFieldsSchema.extend(CommandSchema.shape);
export const ProfileSchema = ProfileFieldsSchema.extend({
  revision: RevisionSchema,
  etag: EntityTagSchema,
});
export const MyAccountSchema = z
  .strictObject({
    accountId: DomainIdSchema,
    accountRevision: RevisionSchema,
    etag: EntityTagSchema,
    state: z.literal("active"),
    emailVerified: z.literal(true),
    privateEmail: z.email().max(320),
    profile: ProfileSchema,
  })
  .describe(
    "Verified own-account projection only; display identity has a separate safe projection.",
  );
export const DisplayIdentitySchema = z.strictObject({
  accountId: DomainIdSchema,
  displayName: DisplayNameSchema,
});

export type MyAccount = z.infer<typeof MyAccountSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export const AvatarUploadSchema = CommandSchema.extend({
  uploadId: DomainIdSchema,
  contentType: z.enum(["image/jpeg", "image/png"]),
  byteLength: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024),
  sha256: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]{64}$/),
}).describe(
  "Declared bounds only; server verifies actual type, pixels (12 MP maximum) and sanitizes before use.",
);
export const AvatarUploadResultSchema = z
  .strictObject({
    uploadId: DomainIdSchema,
    uploadPath: z.string().regex(/^\/api\/v1\/me\/avatar\/uploads\/[0-9a-f-]{36}\/bytes$/i),
    expiresAt: ServerTimestampSchema,
  })
  .describe("Authenticated bounded byte path; no storage key, bucket URL or bearer upload URL.");
export const AvatarStatusSchema = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("absent") }),
  z.strictObject({ state: z.literal("processing"), uploadId: DomainIdSchema }),
  z.strictObject({
    state: z.literal("failed"),
    uploadId: DomainIdSchema,
    reason: z.enum(["unsupported_type", "too_large", "invalid_image", "processing_unavailable"]),
  }),
  z.strictObject({
    state: z.literal("available"),
    avatarId: DomainIdSchema,
    revision: RevisionSchema,
    etag: EntityTagSchema,
    contentType: z.enum(["image/jpeg", "image/png"]),
    width: z.number().int().min(1).max(512),
    height: z.number().int().min(1).max(512),
    managedPath: z.literal("/api/v1/me/avatar"),
  }),
]);
export const AccountDataExportSchema = z
  .strictObject({
    exportedAt: ServerTimestampSchema,
    account: MyAccountSchema,
    avatar: AvatarStatusSchema,
  })
  .describe(
    "Immediate authenticated profile JSON and managed-avatar manifest. No credentials, session tokens or archive claim.",
  );
