import { z } from "zod";

// Selected baseline D04/D05. These are wire bounds, not authorization or rate-limit enforcement.
export const accountJourneyLimits = {
  displayName: 80,
  bio: 500,
  journeyTitle: 160,
  passwordMin: 15,
  passwordMax: 128,
  pageDefault: 20,
  pageMax: 100,
  jsonBytes: 65_536,
} as const;

/** JSON Schema regex quantifiers and JS /u both count Unicode scalars, including astral text. */
export function boundedText(minimum: number, maximum: number, trim = false) {
  const text = trim ? z.string().trim() : z.string();
  // A negative end assertion avoids JS `$` accepting an extra final line terminator.
  return text.regex(new RegExp(`^[^\\p{Cs}]{${minimum},${maximum}}(?![\\s\\S])`, "u"));
}

export const DomainIdSchema = z.uuid();
export const RevisionSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
export const GenerationSchema = RevisionSchema;
export const ServerTimestampSchema = z.iso.datetime();
export const CommandSchema = z.strictObject({ commandId: DomainIdSchema });
export const EntityTagSchema = z
  .string()
  .regex(/^"[A-Za-z0-9_-]{1,128}"$/)
  .describe(
    "One opaque strong ETag. Send the current value as If-Match; weak tags, lists and * are invalid.",
  );
export const RevisionHeadersSchema = z.object({ "if-match": EntityTagSchema });

export const PageQuerySchema = z.object({
  cursor: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,2048}$/)
    .optional()
    .describe("Opaque server cursor bound to account, scope and filters; never a bearer secret."),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(accountJourneyLimits.pageMax)
    .default(accountJourneyLimits.pageDefault),
});

export const ProblemCodeSchema = z.enum([
  "invalid_request",
  "session_required",
  "reauthentication_required",
  "forbidden",
  "unavailable",
  "conflict",
  "command_payload_conflict",
  "stale_revision",
  "stale_impact",
  "rate_limited",
  "dependency_unavailable",
  "internal_error",
]);
export const ProblemDetailsSchema = z
  .strictObject({
    type: z.string().url(),
    title: z.string().min(1).max(120),
    status: z.number().int().min(400).max(599),
    code: ProblemCodeSchema,
    requestId: DomainIdSchema,
    operationId: DomainIdSchema.optional(),
    fieldErrors: z
      .array(
        z.strictObject({
          field: z.string().regex(/^[a-zA-Z][a-zA-Z0-9.]{0,79}$/),
          code: z.enum(["required", "invalid", "too_long", "out_of_range", "ambiguous_time"]),
          message: z.string().min(1).max(256),
        }),
      )
      .max(20)
      .optional(),
    retryAfterSeconds: z.number().int().positive().max(86_400).optional(),
  })
  .describe("RFC 9457 domain failure. Safe messages never echo secrets or hidden resource fields.");

const OperationReferenceSchema = z.strictObject({
  operationId: DomainIdSchema,
  statusLocation: z.string().regex(/^\/api\/v1\/operations\/[0-9a-f-]{36}$/i),
});
export const RestrictionPendingSchema = OperationReferenceSchema.extend({
  status: z.literal("restricted_pending_confirmation"),
  access: z.literal("denied"),
  recoveryConfirmation: z.literal("pending"),
  retryAfterSeconds: z.number().int().min(5).max(30),
});
export const RestrictionCompleteSchema = OperationReferenceSchema.extend({
  status: z.literal("restriction_complete"),
  access: z.literal("denied"),
  recoveryConfirmation: z.literal("confirmed"),
});
export const RestrictionResultSchema = z
  .discriminatedUnion("status", [RestrictionPendingSchema, RestrictionCompleteSchema])
  .refine((value) => value.statusLocation === `/api/v1/operations/${value.operationId}`, {
    message: "Status location must identify this operation.",
    path: ["statusLocation"],
  });

// A post-deletion receipt reads this minimal projection outside account guards. It grants no writes.
export const OperationStatusSchema = z
  .strictObject({
    restriction: RestrictionResultSchema,
    cleanup: z.enum(["not_applicable", "pending", "running", "complete", "delayed"]),
    updatedAt: ServerTimestampSchema,
  })
  .describe(
    "Restriction confirmation and byte/PII cleanup are independent. Contains no target identity.",
  );

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type RestrictionResult = z.infer<typeof RestrictionResultSchema>;
export type OperationStatus = z.infer<typeof OperationStatusSchema>;
