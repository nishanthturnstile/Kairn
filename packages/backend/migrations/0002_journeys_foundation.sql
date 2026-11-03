CREATE SCHEMA "journeys";
--> statement-breakpoint
CREATE TABLE "journeys"."journey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_account_id" uuid NOT NULL,
	"title" text,
	"time_zone" text,
	"start_local" text,
	"start_at" timestamp with time zone,
	"start_offset_minutes" integer,
	"end_local" text,
	"end_at" timestamp with time zone,
	"end_offset_minutes" integer,
	"category" text,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"administration" text DEFAULT 'assigned' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"policy_generation" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "journey_lifecycle_check" CHECK ("journeys"."journey"."lifecycle" IN ('active', 'archived', 'deleted')),
	CONSTRAINT "journey_administration_check" CHECK ("journeys"."journey"."administration" IN ('assigned', 'frozen')),
	CONSTRAINT "journey_revision_check" CHECK ("journeys"."journey"."revision" BETWEEN 1 AND 9007199254740991 AND "journeys"."journey"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "journey_title_check" CHECK ("journeys"."journey"."title" IS NULL OR (char_length("journeys"."journey"."title") BETWEEN 1 AND 160 AND "journeys"."journey"."title" = btrim("journeys"."journey"."title"))),
	CONSTRAINT "journey_details_check" CHECK ("journeys"."journey"."lifecycle" = 'deleted' OR ("journeys"."journey"."title" IS NOT NULL AND "journeys"."journey"."time_zone" IS NOT NULL AND "journeys"."journey"."start_local" IS NOT NULL AND "journeys"."journey"."start_at" IS NOT NULL AND "journeys"."journey"."start_offset_minutes" IS NOT NULL)),
	CONSTRAINT "journey_category_check" CHECK ("journeys"."journey"."category" IS NULL OR "journeys"."journey"."category" IN ('hike_trek', 'cycling', 'road_journey', 'other')),
	CONSTRAINT "journey_start_check" CHECK (("journeys"."journey"."start_local" IS NULL AND "journeys"."journey"."start_at" IS NULL AND "journeys"."journey"."start_offset_minutes" IS NULL) OR ("journeys"."journey"."start_local" IS NOT NULL AND "journeys"."journey"."start_at" IS NOT NULL AND "journeys"."journey"."start_offset_minutes" IS NOT NULL AND "journeys"."journey"."start_offset_minutes" BETWEEN -840 AND 840 AND "journeys"."journey"."start_local" ~ '^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' AND "journeys"."journey"."start_at" >= timestamptz '0001-01-01 00:00:00+00' AND "journeys"."journey"."start_at" < timestamptz '10000-01-01 00:00:00+00' AND extract(second FROM "journeys"."journey"."start_at" AT TIME ZONE 'UTC') = 0)),
	CONSTRAINT "journey_end_check" CHECK (("journeys"."journey"."end_local" IS NULL AND "journeys"."journey"."end_at" IS NULL AND "journeys"."journey"."end_offset_minutes" IS NULL) OR ("journeys"."journey"."end_local" IS NOT NULL AND "journeys"."journey"."end_at" IS NOT NULL AND "journeys"."journey"."end_offset_minutes" IS NOT NULL AND "journeys"."journey"."start_at" IS NOT NULL AND "journeys"."journey"."end_offset_minutes" BETWEEN -840 AND 840 AND "journeys"."journey"."end_local" ~ '^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' AND "journeys"."journey"."end_at" >= "journeys"."journey"."start_at" AND "journeys"."journey"."end_at" < timestamptz '10000-01-01 00:00:00+00' AND extract(second FROM "journeys"."journey"."end_at" AT TIME ZONE 'UTC') = 0)),
	CONSTRAINT "journey_deletion_time_check" CHECK (("journeys"."journey"."lifecycle" = 'deleted') = ("journeys"."journey"."deleted_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "journeys"."journey" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journeys"."member_capability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"membership_epoch" bigint NOT NULL,
	"capability" text NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_by" uuid,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "capability_membership_epoch_code_unique" UNIQUE("membership_id","membership_epoch","capability"),
	CONSTRAINT "capability_code_check" CHECK ("journeys"."member_capability"."capability" IN ('administrator', 'coauthor', 'publisher')),
	CONSTRAINT "capability_state_check" CHECK ("journeys"."member_capability"."state" IN ('active', 'revoked')),
	CONSTRAINT "capability_revision_check" CHECK ("journeys"."member_capability"."revision" BETWEEN 1 AND 9007199254740991 AND "journeys"."member_capability"."membership_epoch" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "capability_revocation_check" CHECK (("journeys"."member_capability"."state" = 'active' AND "journeys"."member_capability"."revoked_at" IS NULL AND "journeys"."member_capability"."revoked_by" IS NULL) OR ("journeys"."member_capability"."state" = 'revoked' AND "journeys"."member_capability"."revoked_at" IS NOT NULL AND "journeys"."member_capability"."revoked_at" >= "journeys"."member_capability"."assigned_at" AND "journeys"."member_capability"."revoked_by" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "journeys"."member_capability" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journeys"."membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"epoch" bigint DEFAULT 1 NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"end_reason" text,
	"previous_administrator" boolean DEFAULT false NOT NULL,
	"previous_coauthor" boolean DEFAULT false NOT NULL,
	"previous_publisher" boolean DEFAULT false NOT NULL,
	CONSTRAINT "membership_journey_account_unique" UNIQUE("journey_id","account_id"),
	CONSTRAINT "membership_id_journey_unique" UNIQUE("id","journey_id"),
	CONSTRAINT "membership_id_journey_account_unique" UNIQUE("id","journey_id","account_id"),
	CONSTRAINT "membership_state_check" CHECK ("journeys"."membership"."state" IN ('active', 'left', 'removed')),
	CONSTRAINT "membership_revision_check" CHECK ("journeys"."membership"."revision" BETWEEN 1 AND 9007199254740991 AND "journeys"."membership"."epoch" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "membership_end_check" CHECK (("journeys"."membership"."state" = 'active' AND "journeys"."membership"."ended_at" IS NULL AND "journeys"."membership"."end_reason" IS NULL) OR ("journeys"."membership"."ended_at" IS NOT NULL AND "journeys"."membership"."end_reason" IS NOT NULL AND "journeys"."membership"."ended_at" >= "journeys"."membership"."joined_at" AND (("journeys"."membership"."state" = 'left' AND "journeys"."membership"."end_reason" = 'left') OR ("journeys"."membership"."state" = 'removed' AND "journeys"."membership"."end_reason" IN ('removed', 'journey_deleted')))))
);
--> statement-breakpoint
ALTER TABLE "journeys"."membership" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "journeys"."journey" ADD CONSTRAINT "journey_creator_account_id_account_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."member_capability" ADD CONSTRAINT "member_capability_assigned_by_account_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."member_capability" ADD CONSTRAINT "member_capability_revoked_by_account_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."member_capability" ADD CONSTRAINT "capability_membership_journey_fk" FOREIGN KEY ("membership_id","journey_id") REFERENCES "journeys"."membership"("id","journey_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."membership" ADD CONSTRAINT "membership_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."membership" ADD CONSTRAINT "membership_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journey_creator_idx" ON "journeys"."journey" USING btree ("creator_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "journey_one_active_administrator" ON "journeys"."member_capability" USING btree ("journey_id") WHERE "journeys"."member_capability"."capability" = 'administrator' AND "journeys"."member_capability"."state" = 'active';--> statement-breakpoint
CREATE INDEX "capability_journey_current_idx" ON "journeys"."member_capability" USING btree ("journey_id","state","capability");--> statement-breakpoint
CREATE INDEX "capability_assigner_idx" ON "journeys"."member_capability" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "capability_revoker_idx" ON "journeys"."member_capability" USING btree ("revoked_by");--> statement-breakpoint
CREATE INDEX "membership_account_history_idx" ON "journeys"."membership" USING btree ("account_id","joined_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "membership_journey_state_idx" ON "journeys"."membership" USING btree ("journey_id","state","id");