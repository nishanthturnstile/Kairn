import { z } from "zod";
import { DisplayIdentitySchema } from "./accounts.js";
import {
  accountJourneyLimits,
  boundedText,
  CommandSchema,
  DomainIdSchema,
  GenerationSchema,
  PageQuerySchema,
  RevisionSchema,
  ServerTimestampSchema,
} from "./common.js";

export const JourneyTitleSchema = boundedText(1, accountJourneyLimits.journeyTitle, true).describe(
  "1–160 Unicode scalars after trimming surrounding whitespace.",
);
export const JourneyCategorySchema = z.enum(["hike_trek", "cycling", "road_journey", "other"]);
export const CapabilitySchema = z.enum(["administrator", "coauthor", "publisher"]);
export const EditablePowersSchema = z.strictObject({
  coauthor: z.boolean(),
  publisher: z.boolean(),
});
export const MemberPowersSchema = EditablePowersSchema.extend({ administrator: z.boolean() });

export const JourneyTimeZoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((zone) => {
    if (zone !== "UTC" && !zone.includes("/")) return false;
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone }).format(0);
      return true;
    } catch {
      return false;
    }
  }, "Select a supported IANA timezone.");

export const IntendedTimeSchema = z
  .strictObject({
    local: z.string().regex(/^(?!0000)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    instant: z.iso.datetime({ precision: 0 }).regex(/:00Z$/),
    offsetMinutes: z.number().int().min(-840).max(840),
  })
  .describe(
    "Explicit intended minute and resolved UTC instant/offset; ambiguous times require an offset choice.",
  );

function matchesZone(time: z.infer<typeof IntendedTimeSchema>, zone: string) {
  const instant = Date.parse(time.instant);
  const localInstant = Date.parse(`${time.local}:00Z`);
  if (!Number.isFinite(localInstant) || localInstant - instant !== time.offsetMinutes * 60_000)
    return false;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(instant);
    const part = (name: Intl.DateTimeFormatPartTypes) =>
      parts.find((value) => value.type === name)?.value;
    return (
      `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}` ===
      time.local
    );
  } catch {
    return false;
  }
}

export const JourneyDetailsSchema = z
  .strictObject({
    title: JourneyTitleSchema,
    timeZone: JourneyTimeZoneSchema,
    start: IntendedTimeSchema,
    end: IntendedTimeSchema.nullable(),
    category: JourneyCategorySchema.nullable(),
  })
  .superRefine((value, context) => {
    for (const field of ["start", "end"] as const) {
      const time = value[field];
      if (time && !matchesZone(time, value.timeZone))
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Local time, offset and instant must agree in this timezone.",
        });
    }
    if (value.end && Date.parse(value.end.instant) < Date.parse(value.start.instant))
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "End cannot precede start.",
      });
  });
export const CreateJourneySchema = z.strictObject({
  ...CommandSchema.shape,
  journeyId: DomainIdSchema,
  details: JourneyDetailsSchema,
});
export const UpdateJourneySchema = z.strictObject({
  ...CommandSchema.shape,
  details: JourneyDetailsSchema,
});
export const MyMembershipSchema = z.strictObject({
  membershipId: DomainIdSchema,
  revision: RevisionSchema,
  epoch: GenerationSchema,
  state: z.literal("active"),
  powers: MemberPowersSchema,
});
export const JourneySummarySchema = z
  .strictObject({
    journeyId: DomainIdSchema,
    revision: RevisionSchema,
    policyGeneration: GenerationSchema,
    details: JourneyDetailsSchema,
    lifecycle: z.enum(["active", "archived"]),
    administration: z.enum(["assigned", "frozen"]),
    membership: MyMembershipSchema,
  })
  .describe("Active member summary; no draft, sources, publication, roster or implied completion.");

export const FormerJourneyReferenceSchema = z
  .strictObject({
    kind: z.literal("former"),
    journeyId: DomainIdSchema,
    previousPowers: MemberPowersSchema,
    endedAt: ServerTimestampSchema,
    endReason: z.enum(["left", "removed", "journey_deleted"]),
  })
  .describe("Opaque former history only: no protected title, dates, cover, category or roster.");
export const JourneyHistoryEntrySchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("current"), journey: JourneySummarySchema }),
  FormerJourneyReferenceSchema,
]);
export const JourneyHistoryQuerySchema = PageQuerySchema.extend({
  role: CapabilitySchema.optional(),
  status: z.enum(["active", "archived", "former"]).optional(),
  year: z.coerce.number().int().min(1).max(9999).optional(),
  category: JourneyCategorySchema.optional(),
});
export const JourneyHistorySchema = z
  .strictObject({
    items: z.array(JourneyHistoryEntrySchema).max(accountJourneyLimits.pageMax),
    nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
    formerExcludedByFilters: z.boolean(),
  })
  .describe(
    "One reference per canonical membership. Year/category filters exclude opaque former references.",
  );

export const ManagedPersonSchema = z.strictObject({
  identity: DisplayIdentitySchema,
  membership: MyMembershipSchema,
});
export const PeopleSchema = z.discriminatedUnion("view", [
  z.strictObject({
    view: z.literal("administration"),
    items: z.array(ManagedPersonSchema).max(100),
    nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
  }),
  z.strictObject({
    view: z.literal("self"),
    self: ManagedPersonSchema,
    administrator: DisplayIdentitySchema.nullable(),
  }),
]);

export type JourneySummary = z.infer<typeof JourneySummarySchema>;
export type JourneyHistoryEntry = z.infer<typeof JourneyHistoryEntrySchema>;
export type EditablePowers = z.infer<typeof EditablePowersSchema>;
