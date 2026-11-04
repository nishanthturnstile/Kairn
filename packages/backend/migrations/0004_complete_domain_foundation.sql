CREATE SCHEMA "sources";
--> statement-breakpoint
CREATE SCHEMA "operations";
--> statement-breakpoint
CREATE TABLE "identity"."profile_avatar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"quarantine_bucket" text NOT NULL,
	"quarantine_key" text NOT NULL,
	"input_content_type" text NOT NULL,
	"input_bytes" integer NOT NULL,
	"input_sha256" text NOT NULL,
	"verified_input_width" integer,
	"verified_input_height" integer,
	"failure_code" text,
	"representation_bucket" text,
	"representation_key" text,
	"representation_content_type" text,
	"representation_bytes" integer,
	"representation_sha256" text,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"upload_expires_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "avatar_id_owner_unique" UNIQUE("id","owner_account_id"),
	CONSTRAINT "avatar_quarantine_location_unique" UNIQUE("quarantine_bucket","quarantine_key"),
	CONSTRAINT "avatar_representation_location_unique" UNIQUE("representation_bucket","representation_key"),
	CONSTRAINT "avatar_input_pixels_check" CHECK (("identity"."profile_avatar"."verified_input_width" IS NULL AND "identity"."profile_avatar"."verified_input_height" IS NULL AND "identity"."profile_avatar"."state" NOT IN ('processing', 'available')) OR ("identity"."profile_avatar"."verified_input_width" IS NOT NULL AND "identity"."profile_avatar"."verified_input_height" IS NOT NULL AND "identity"."profile_avatar"."verified_input_width" BETWEEN 1 AND 12000000 AND "identity"."profile_avatar"."verified_input_height" BETWEEN 1 AND 12000000 AND "identity"."profile_avatar"."verified_input_width"::bigint * "identity"."profile_avatar"."verified_input_height"::bigint <= 12000000 AND ("identity"."profile_avatar"."width" IS NULL OR (greatest("identity"."profile_avatar"."width", "identity"."profile_avatar"."height") <= greatest("identity"."profile_avatar"."verified_input_width", "identity"."profile_avatar"."verified_input_height") AND least("identity"."profile_avatar"."width", "identity"."profile_avatar"."height") <= least("identity"."profile_avatar"."verified_input_width", "identity"."profile_avatar"."verified_input_height"))))),
	CONSTRAINT "avatar_failure_check" CHECK (("identity"."profile_avatar"."failure_code" IS NULL OR "identity"."profile_avatar"."failure_code" IN ('unsupported_type', 'too_large', 'invalid_image', 'processing_unavailable')) AND ("identity"."profile_avatar"."state" <> 'failed' OR "identity"."profile_avatar"."failure_code" IS NOT NULL)),
	CONSTRAINT "avatar_state_check" CHECK ("identity"."profile_avatar"."state" IN ('pending', 'quarantined', 'processing', 'available', 'failed', 'superseded', 'deleting', 'deleted')),
	CONSTRAINT "avatar_revision_check" CHECK ("identity"."profile_avatar"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "avatar_input_check" CHECK ("identity"."profile_avatar"."input_content_type" IN ('image/jpeg', 'image/png') AND "identity"."profile_avatar"."input_bytes" BETWEEN 1 AND 5242880 AND "identity"."profile_avatar"."input_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "avatar_location_check" CHECK (char_length("identity"."profile_avatar"."quarantine_bucket") BETWEEN 1 AND 128 AND char_length("identity"."profile_avatar"."quarantine_key") BETWEEN 1 AND 512 AND ("identity"."profile_avatar"."representation_bucket" IS NULL OR char_length("identity"."profile_avatar"."representation_bucket") BETWEEN 1 AND 128) AND ("identity"."profile_avatar"."representation_key" IS NULL OR char_length("identity"."profile_avatar"."representation_key") BETWEEN 1 AND 512)),
	CONSTRAINT "avatar_expiry_check" CHECK ("identity"."profile_avatar"."upload_expires_at" > "identity"."profile_avatar"."created_at" AND "identity"."profile_avatar"."upload_expires_at" <= "identity"."profile_avatar"."created_at" + interval '24 hours'),
	CONSTRAINT "avatar_representation_check" CHECK (("identity"."profile_avatar"."representation_bucket" IS NULL AND "identity"."profile_avatar"."representation_key" IS NULL AND "identity"."profile_avatar"."representation_content_type" IS NULL AND "identity"."profile_avatar"."representation_bytes" IS NULL AND "identity"."profile_avatar"."representation_sha256" IS NULL AND "identity"."profile_avatar"."width" IS NULL AND "identity"."profile_avatar"."height" IS NULL AND "identity"."profile_avatar"."state" <> 'available') OR ("identity"."profile_avatar"."representation_bucket" IS NOT NULL AND "identity"."profile_avatar"."representation_key" IS NOT NULL AND "identity"."profile_avatar"."representation_content_type" IS NOT NULL AND "identity"."profile_avatar"."representation_content_type" IN ('image/jpeg', 'image/png') AND "identity"."profile_avatar"."representation_bytes" IS NOT NULL AND "identity"."profile_avatar"."representation_bytes" BETWEEN 1 AND 5242880 AND "identity"."profile_avatar"."representation_sha256" IS NOT NULL AND "identity"."profile_avatar"."representation_sha256" ~ '^[0-9a-f]{64}$' AND "identity"."profile_avatar"."width" IS NOT NULL AND "identity"."profile_avatar"."height" IS NOT NULL AND "identity"."profile_avatar"."width" BETWEEN 1 AND 512 AND "identity"."profile_avatar"."height" BETWEEN 1 AND 512)),
	CONSTRAINT "avatar_deletion_check" CHECK (("identity"."profile_avatar"."state" = 'deleted') = ("identity"."profile_avatar"."deleted_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "identity"."profile_avatar" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journeys"."administration_transfer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"offering_membership_id" uuid NOT NULL,
	"offering_account_id" uuid NOT NULL,
	"offering_epoch" bigint NOT NULL,
	"target_membership_id" uuid NOT NULL,
	"target_account_id" uuid NOT NULL,
	"target_epoch" bigint NOT NULL,
	"journey_policy_generation" bigint NOT NULL,
	"state" text DEFAULT 'offered' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "transfer_revision_check" CHECK ("journeys"."administration_transfer"."revision" BETWEEN 1 AND 9007199254740991 AND "journeys"."administration_transfer"."offering_epoch" BETWEEN 1 AND 9007199254740991 AND "journeys"."administration_transfer"."target_epoch" BETWEEN 1 AND 9007199254740991 AND "journeys"."administration_transfer"."journey_policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "transfer_state_check" CHECK ("journeys"."administration_transfer"."state" IN ('offered', 'accepted', 'declined', 'cancelled', 'expired', 'invalidated')),
	CONSTRAINT "transfer_distinct_members_check" CHECK ("journeys"."administration_transfer"."offering_membership_id" <> "journeys"."administration_transfer"."target_membership_id" AND "journeys"."administration_transfer"."offering_account_id" <> "journeys"."administration_transfer"."target_account_id"),
	CONSTRAINT "transfer_expiry_check" CHECK ("journeys"."administration_transfer"."expires_at" > "journeys"."administration_transfer"."created_at" AND "journeys"."administration_transfer"."expires_at" <= "journeys"."administration_transfer"."created_at" + interval '72 hours'),
	CONSTRAINT "transfer_close_check" CHECK (("journeys"."administration_transfer"."state" = 'offered' AND "journeys"."administration_transfer"."closed_at" IS NULL) OR ("journeys"."administration_transfer"."state" <> 'offered' AND "journeys"."administration_transfer"."closed_at" IS NOT NULL AND "journeys"."administration_transfer"."closed_at" >= "journeys"."administration_transfer"."created_at"))
);
--> statement-breakpoint
ALTER TABLE "journeys"."administration_transfer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journeys"."invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"guard_id" uuid NOT NULL,
	"admission_epoch" bigint NOT NULL,
	"inviter_membership_id" uuid NOT NULL,
	"inviter_account_id" uuid NOT NULL,
	"inviter_membership_epoch" bigint NOT NULL,
	"secret_hash" text NOT NULL,
	"offered_coauthor" boolean DEFAULT false NOT NULL,
	"offered_publisher" boolean DEFAULT false NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"accepted_account_id" uuid,
	"accepted_membership_id" uuid,
	"accepted_membership_epoch" bigint,
	CONSTRAINT "invitation_secret_hash_unique" UNIQUE("secret_hash"),
	CONSTRAINT "invitation_secret_hash_check" CHECK ("journeys"."invitation"."secret_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "invitation_revision_check" CHECK ("journeys"."invitation"."revision" BETWEEN 1 AND 9007199254740991 AND "journeys"."invitation"."admission_epoch" BETWEEN 1 AND 9007199254740991 AND "journeys"."invitation"."inviter_membership_epoch" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "invitation_state_check" CHECK ("journeys"."invitation"."state" IN ('pending', 'accepted', 'declined', 'revoked', 'expired', 'superseded')),
	CONSTRAINT "invitation_expiry_check" CHECK ("journeys"."invitation"."expires_at" > "journeys"."invitation"."created_at" AND "journeys"."invitation"."expires_at" <= "journeys"."invitation"."created_at" + interval '7 days'),
	CONSTRAINT "invitation_close_check" CHECK (("journeys"."invitation"."state" = 'pending' AND "journeys"."invitation"."closed_at" IS NULL) OR ("journeys"."invitation"."state" <> 'pending' AND "journeys"."invitation"."closed_at" IS NOT NULL AND "journeys"."invitation"."closed_at" >= "journeys"."invitation"."created_at")),
	CONSTRAINT "invitation_acceptance_check" CHECK (("journeys"."invitation"."state" = 'accepted' AND "journeys"."invitation"."accepted_account_id" IS NOT NULL AND "journeys"."invitation"."accepted_membership_id" IS NOT NULL AND "journeys"."invitation"."accepted_membership_epoch" IS NOT NULL AND "journeys"."invitation"."accepted_membership_epoch" BETWEEN 1 AND 9007199254740991) OR ("journeys"."invitation"."state" <> 'accepted' AND "journeys"."invitation"."accepted_account_id" IS NULL AND "journeys"."invitation"."accepted_membership_id" IS NULL AND "journeys"."invitation"."accepted_membership_epoch" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "journeys"."invitation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journeys"."recipient_guard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"recipient_key" text NOT NULL,
	"recipient_email" text,
	"bound_account_id" uuid,
	"admission_epoch" bigint DEFAULT 1 NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"last_ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guard_journey_recipient_unique" UNIQUE("journey_id","recipient_key"),
	CONSTRAINT "guard_id_journey_unique" UNIQUE("id","journey_id"),
	CONSTRAINT "guard_recipient_key_check" CHECK ("journeys"."recipient_guard"."recipient_key" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "guard_revision_check" CHECK ("journeys"."recipient_guard"."revision" BETWEEN 1 AND 9007199254740991 AND "journeys"."recipient_guard"."admission_epoch" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "guard_email_check" CHECK ("journeys"."recipient_guard"."recipient_email" IS NULL OR char_length("journeys"."recipient_guard"."recipient_email") BETWEEN 3 AND 320)
);
--> statement-breakpoint
ALTER TABLE "journeys"."recipient_guard" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."export_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"recipient_account_id" uuid NOT NULL,
	"recipient_membership_id" uuid NOT NULL,
	"recipient_epoch" bigint NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "export_grant_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "export_grant_request_binding_unique" UNIQUE("id","request_id","owner_account_id","journey_id"),
	CONSTRAINT "export_grant_revision_check" CHECK ("sources"."export_grant"."revision" BETWEEN 1 AND 9007199254740991 AND "sources"."export_grant"."recipient_epoch" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "export_grant_state_check" CHECK ("sources"."export_grant"."state" IN ('active', 'revoked', 'expired', 'invalidated')),
	CONSTRAINT "export_grant_expiry_check" CHECK ("sources"."export_grant"."expires_at" > "sources"."export_grant"."issued_at" AND "sources"."export_grant"."expires_at" <= "sources"."export_grant"."issued_at" + interval '7 days'),
	CONSTRAINT "export_grant_close_check" CHECK (("sources"."export_grant"."state" = 'active' AND "sources"."export_grant"."closed_at" IS NULL) OR ("sources"."export_grant"."state" <> 'active' AND "sources"."export_grant"."closed_at" IS NOT NULL AND "sources"."export_grant"."closed_at" >= "sources"."export_grant"."issued_at"))
);
--> statement-breakpoint
ALTER TABLE "sources"."export_grant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."export_grant_asset" (
	"grant_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"source_grant_id" uuid NOT NULL,
	"asset_revision" bigint NOT NULL,
	"source_grant_revision" bigint NOT NULL,
	CONSTRAINT "export_grant_asset_grant_id_asset_id_pk" PRIMARY KEY("grant_id","asset_id"),
	CONSTRAINT "grant_asset_revision_check" CHECK ("sources"."export_grant_asset"."asset_revision" BETWEEN 1 AND 9007199254740991 AND "sources"."export_grant_asset"."source_grant_revision" BETWEEN 1 AND 9007199254740991)
);
--> statement-breakpoint
ALTER TABLE "sources"."export_grant_asset" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."export_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"requester_account_id" uuid NOT NULL,
	"requester_membership_id" uuid NOT NULL,
	"requester_epoch" bigint NOT NULL,
	"state" text DEFAULT 'requested' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "export_request_owner_journey_unique" UNIQUE("id","owner_account_id","journey_id"),
	CONSTRAINT "export_request_recipient_binding_unique" UNIQUE("id","owner_account_id","journey_id","requester_account_id","requester_membership_id","requester_epoch"),
	CONSTRAINT "export_request_revision_check" CHECK ("sources"."export_request"."revision" BETWEEN 1 AND 9007199254740991 AND "sources"."export_request"."requester_epoch" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "export_request_state_check" CHECK ("sources"."export_request"."state" IN ('requested', 'approved', 'declined', 'expired', 'invalidated')),
	CONSTRAINT "export_request_expiry_check" CHECK ("sources"."export_request"."expires_at" > "sources"."export_request"."created_at"),
	CONSTRAINT "export_request_close_check" CHECK (("sources"."export_request"."state" = 'requested' AND "sources"."export_request"."closed_at" IS NULL) OR ("sources"."export_request"."state" <> 'requested' AND "sources"."export_request"."closed_at" IS NOT NULL AND "sources"."export_request"."closed_at" >= "sources"."export_request"."created_at"))
);
--> statement-breakpoint
ALTER TABLE "sources"."export_request" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."export_request_asset" (
	"request_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"source_grant_id" uuid NOT NULL,
	"asset_revision" bigint NOT NULL,
	"source_grant_revision" bigint NOT NULL,
	CONSTRAINT "export_request_asset_request_id_asset_id_pk" PRIMARY KEY("request_id","asset_id"),
	CONSTRAINT "request_asset_issued_binding_unique" UNIQUE("request_id","asset_id","source_id","owner_account_id","journey_id","source_grant_id","asset_revision","source_grant_revision"),
	CONSTRAINT "request_asset_revision_check" CHECK ("sources"."export_request_asset"."asset_revision" BETWEEN 1 AND 9007199254740991 AND "sources"."export_request_asset"."source_grant_revision" BETWEEN 1 AND 9007199254740991)
);
--> statement-breakpoint
ALTER TABLE "sources"."export_request_asset" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."source_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"purpose" text DEFAULT 'original' NOT NULL,
	"kind" text NOT NULL,
	"state" text DEFAULT 'registered' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"content_type" text,
	"verified_bytes" bigint,
	"verified_sha256" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "asset_id_source_owner_unique" UNIQUE("id","source_id","owner_account_id"),
	CONSTRAINT "asset_purpose_check" CHECK ("sources"."source_asset"."purpose" = 'original'),
	CONSTRAINT "asset_kind_check" CHECK ("sources"."source_asset"."kind" IN ('image', 'audio', 'video', 'text', 'track')),
	CONSTRAINT "asset_state_check" CHECK ("sources"."source_asset"."state" IN ('registered', 'verified', 'deleting', 'deleted')),
	CONSTRAINT "asset_revision_check" CHECK ("sources"."source_asset"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "asset_verification_check" CHECK (("sources"."source_asset"."verified_bytes" IS NULL AND "sources"."source_asset"."verified_sha256" IS NULL AND "sources"."source_asset"."content_type" IS NULL AND "sources"."source_asset"."state" <> 'verified') OR ("sources"."source_asset"."verified_bytes" IS NOT NULL AND "sources"."source_asset"."verified_bytes" BETWEEN 1 AND 9007199254740991 AND "sources"."source_asset"."verified_sha256" IS NOT NULL AND "sources"."source_asset"."verified_sha256" ~ '^[0-9a-f]{64}$' AND "sources"."source_asset"."content_type" IS NOT NULL AND char_length("sources"."source_asset"."content_type") BETWEEN 1 AND 128)),
	CONSTRAINT "asset_deletion_check" CHECK (("sources"."source_asset"."state" IN ('registered', 'verified') AND "sources"."source_asset"."deleted_at" IS NULL) OR ("sources"."source_asset"."state" IN ('deleting', 'deleted') AND "sources"."source_asset"."deleted_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "sources"."source_asset" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."source_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"state" text NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_grant_source_journey_unique" UNIQUE("source_id","journey_id"),
	CONSTRAINT "source_grant_binding_unique" UNIQUE("id","source_id","journey_id","owner_account_id"),
	CONSTRAINT "source_grant_scope_check" CHECK ("sources"."source_grant"."scope" IN ('only_me', 'journey_review', 'publication_reuse')),
	CONSTRAINT "source_grant_state_check" CHECK ("sources"."source_grant"."state" IN ('active', 'withdrawn')),
	CONSTRAINT "source_grant_revision_check" CHECK ("sources"."source_grant"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "source_grant_scope_state_check" CHECK (("sources"."source_grant"."state" = 'withdrawn') = ("sources"."source_grant"."scope" = 'only_me')),
	CONSTRAINT "source_grant_actor_check" CHECK ("sources"."source_grant"."changed_by" IS NULL OR "sources"."source_grant"."changed_by" = "sources"."source_grant"."owner_account_id"),
	CONSTRAINT "source_grant_time_check" CHECK ("sources"."source_grant"."changed_at" >= "sources"."source_grant"."created_at")
);
--> statement-breakpoint
ALTER TABLE "sources"."source_grant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources"."source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"provenance" text NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "source_id_owner_unique" UNIQUE("id","owner_account_id"),
	CONSTRAINT "source_kind_check" CHECK ("sources"."source"."kind" IN ('photo', 'audio', 'video', 'note', 'location', 'track')),
	CONSTRAINT "source_provenance_check" CHECK ("sources"."source"."provenance" IN ('native_capture', 'selected_import')),
	CONSTRAINT "source_state_check" CHECK ("sources"."source"."state" IN ('active', 'deleting', 'deleted')),
	CONSTRAINT "source_revision_check" CHECK ("sources"."source"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "source_deletion_check" CHECK (("sources"."source"."state" = 'active' AND "sources"."source"."deleted_at" IS NULL) OR ("sources"."source"."state" <> 'active' AND "sources"."source"."deleted_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "sources"."source" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."abuse_counter" (
	"operation" text NOT NULL,
	"key_hash" text NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"window_seconds" integer NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "abuse_counter_operation_key_hash_window_started_at_pk" PRIMARY KEY("operation","key_hash","window_started_at"),
	CONSTRAINT "abuse_key_check" CHECK ("operations"."abuse_counter"."key_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "abuse_operation_check" CHECK ("operations"."abuse_counter"."operation" IN ('sign_in', 'register', 'auth_mail', 'invite_create', 'invite_resolve', 'policy_mutation', 'export', 'status_poll')),
	CONSTRAINT "abuse_window_check" CHECK ("operations"."abuse_counter"."window_seconds" BETWEEN 1 AND 86400 AND "operations"."abuse_counter"."count" >= 0 AND "operations"."abuse_counter"."expires_at" >= "operations"."abuse_counter"."window_started_at" + "operations"."abuse_counter"."window_seconds" * interval '1 second' AND "operations"."abuse_counter"."expires_at" <= "operations"."abuse_counter"."window_started_at" + "operations"."abuse_counter"."window_seconds" * interval '1 second' + interval '48 hours')
);
--> statement-breakpoint
ALTER TABLE "operations"."abuse_counter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."account_notice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_account_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"journey_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"revision" bigint DEFAULT 1 NOT NULL,
	CONSTRAINT "notice_event_recipient_unique" UNIQUE("event_id","recipient_account_id"),
	CONSTRAINT "notice_kind_check" CHECK ("operations"."account_notice"."kind" IN ('invitation', 'capability_change', 'transfer', 'lifecycle')),
	CONSTRAINT "notice_revision_check" CHECK ("operations"."account_notice"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "notice_read_check" CHECK ("operations"."account_notice"."read_at" IS NULL OR "operations"."account_notice"."read_at" >= "operations"."account_notice"."created_at")
);
--> statement-breakpoint
ALTER TABLE "operations"."account_notice" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_kind" text NOT NULL,
	"service_name" text,
	"operator_id" uuid,
	"inspection_purpose" text,
	"case_id" uuid,
	"actor_account_id" uuid,
	"command_id" uuid,
	"action" text NOT NULL,
	"journey_id" uuid,
	"source_id" uuid,
	"subject_account_id" uuid,
	"target_id" uuid NOT NULL,
	"revision" bigint NOT NULL,
	"policy_generation" bigint NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_actor_kind_check" CHECK ("operations"."audit_event"."actor_kind" IN ('account', 'service', 'operator')),
	CONSTRAINT "audit_action_check" CHECK ("operations"."audit_event"."action" IN ('profile.update', 'avatar.create', 'avatar.replace', 'avatar.delete', 'account.delete', 'journey.create', 'journey.update', 'journey.archive', 'journey.delete', 'membership.leave', 'membership.remove', 'capability.change', 'invitation.create', 'invitation.accept', 'invitation.decline', 'invitation.revoke', 'invitation.resend', 'invitation.reissue', 'transfer.offer', 'transfer.accept', 'transfer.decline', 'transfer.cancel', 'source.register', 'source_asset.register', 'source_scope.change', 'source_grant.withdraw', 'export.request', 'export.approve', 'export.decline', 'export.revoke', 'notice.read', 'restriction.confirm', 'cleanup.complete', 'operator.inspect')),
	CONSTRAINT "audit_version_check" CHECK ("operations"."audit_event"."revision" BETWEEN 1 AND 9007199254740991 AND "operations"."audit_event"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "audit_actor_check" CHECK (("operations"."audit_event"."actor_kind" = 'account' AND "operations"."audit_event"."actor_account_id" IS NOT NULL AND "operations"."audit_event"."command_id" IS NOT NULL AND "operations"."audit_event"."service_name" IS NULL AND "operations"."audit_event"."operator_id" IS NULL AND "operations"."audit_event"."inspection_purpose" IS NULL AND "operations"."audit_event"."case_id" IS NULL) OR ("operations"."audit_event"."actor_kind" = 'service' AND "operations"."audit_event"."actor_account_id" IS NULL AND "operations"."audit_event"."command_id" IS NULL AND "operations"."audit_event"."service_name" IS NOT NULL AND "operations"."audit_event"."service_name" IN ('lifecycle_worker', 'restriction_coordinator', 'identity_media_worker', 'email_worker') AND "operations"."audit_event"."operator_id" IS NULL AND "operations"."audit_event"."inspection_purpose" IS NULL AND "operations"."audit_event"."case_id" IS NULL) OR ("operations"."audit_event"."actor_kind" = 'operator' AND "operations"."audit_event"."actor_account_id" IS NULL AND "operations"."audit_event"."command_id" IS NULL AND "operations"."audit_event"."service_name" IS NOT NULL AND "operations"."audit_event"."service_name" = 'operator_console' AND "operations"."audit_event"."operator_id" IS NOT NULL AND "operations"."audit_event"."inspection_purpose" IS NOT NULL AND "operations"."audit_event"."inspection_purpose" IN ('support_case', 'incident_response', 'recovery', 'retention') AND "operations"."audit_event"."case_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "operations"."audit_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."command_receipt" (
	"actor_account_id" uuid NOT NULL,
	"command_id" uuid NOT NULL,
	"operation_type" text NOT NULL,
	"payload_digest" text NOT NULL,
	"result_state" text NOT NULL,
	"resource_kind" text,
	"resource_id" uuid,
	"resource_revision" bigint,
	"retention_state" text DEFAULT 'live' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "command_receipt_actor_account_id_command_id_pk" PRIMARY KEY("actor_account_id","command_id"),
	CONSTRAINT "command_type_check" CHECK ("operations"."command_receipt"."operation_type" IN ('profile.update', 'avatar.create', 'avatar.replace', 'avatar.delete', 'account.delete', 'journey.create', 'journey.update', 'journey.archive', 'journey.delete', 'membership.leave', 'membership.remove', 'capability.change', 'invitation.create', 'invitation.accept', 'invitation.decline', 'invitation.revoke', 'invitation.resend', 'invitation.reissue', 'transfer.offer', 'transfer.accept', 'transfer.decline', 'transfer.cancel', 'source.register', 'source_asset.register', 'source_scope.change', 'source_grant.withdraw', 'export.request', 'export.approve', 'export.decline', 'export.revoke', 'notice.read')),
	CONSTRAINT "command_payload_digest_check" CHECK ("operations"."command_receipt"."payload_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "command_result_state_check" CHECK ("operations"."command_receipt"."result_state" IN ('accepted', 'restriction_pending', 'restriction_complete')),
	CONSTRAINT "command_retention_check" CHECK ("operations"."command_receipt"."retention_state" IN ('live', 'redacted')),
	CONSTRAINT "command_resource_check" CHECK (("operations"."command_receipt"."resource_id" IS NULL AND "operations"."command_receipt"."resource_kind" IS NULL AND "operations"."command_receipt"."resource_revision" IS NULL) OR ("operations"."command_receipt"."resource_id" IS NOT NULL AND "operations"."command_receipt"."resource_kind" IS NOT NULL AND "operations"."command_receipt"."resource_kind" IN ('account', 'profile', 'avatar', 'journey', 'membership', 'invitation', 'transfer', 'source', 'source_grant', 'export_request', 'export_grant', 'lifecycle_operation') AND ("operations"."command_receipt"."resource_revision" IS NULL OR "operations"."command_receipt"."resource_revision" BETWEEN 1 AND 9007199254740991))),
	CONSTRAINT "command_expiry_check" CHECK ("operations"."command_receipt"."expires_at" > "operations"."command_receipt"."created_at" AND "operations"."command_receipt"."expires_at" <= "operations"."command_receipt"."created_at" + interval '30 days'),
	CONSTRAINT "command_redaction_check" CHECK ("operations"."command_receipt"."retention_state" <> 'redacted' OR ("operations"."command_receipt"."resource_id" IS NULL AND "operations"."command_receipt"."resource_kind" IS NULL AND "operations"."command_receipt"."resource_revision" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "operations"."command_receipt" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."domain_change" (
	"cursor" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "operations"."domain_change_cursor_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"scope" text NOT NULL,
	"account_id" uuid,
	"journey_id" uuid,
	"actor_account_id" uuid NOT NULL,
	"command_id" uuid NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" uuid NOT NULL,
	"revision" bigint NOT NULL,
	"policy_generation" bigint NOT NULL,
	"tombstone" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "change_versions_check" CHECK ("operations"."domain_change"."cursor" BETWEEN 1 AND 9007199254740991 AND "operations"."domain_change"."revision" BETWEEN 1 AND 9007199254740991 AND "operations"."domain_change"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "change_target_check" CHECK ("operations"."domain_change"."target_kind" IN ('account', 'profile', 'journey', 'membership', 'capability', 'invitation', 'transfer', 'source_grant', 'export_grant')),
	CONSTRAINT "change_scope_check" CHECK (("operations"."domain_change"."scope" = 'account' AND "operations"."domain_change"."account_id" IS NOT NULL AND "operations"."domain_change"."journey_id" IS NULL) OR ("operations"."domain_change"."scope" = 'journey' AND "operations"."domain_change"."journey_id" IS NOT NULL AND "operations"."domain_change"."account_id" IS NULL AND "operations"."domain_change"."target_kind" = 'journey' AND "operations"."domain_change"."target_id" = "operations"."domain_change"."journey_id"))
);
--> statement-breakpoint
ALTER TABLE "operations"."domain_change" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."email_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" text NOT NULL,
	"recipient_key" text NOT NULL,
	"auth_subject_id" text,
	"recipient_account_id" uuid,
	"invitation_id" uuid,
	"transfer_id" uuid,
	"actor_account_id" uuid,
	"command_id" uuid,
	"policy_generation" bigint NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"key_id" text,
	"ciphertext" "bytea",
	"nonce" "bytea",
	"authentication_tag" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"payload_purge_after" timestamp with time zone NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"smtp_accepted_at" timestamp with time zone,
	"last_error_code" text,
	CONSTRAINT "email_purpose_check" CHECK ("operations"."email_delivery"."purpose" IN ('verification', 'password_reset', 'invitation', 'transfer', 'security')),
	CONSTRAINT "email_recipient_key_check" CHECK ("operations"."email_delivery"."recipient_key" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "email_state_check" CHECK ("operations"."email_delivery"."state" IN ('queued', 'sending', 'smtp_accepted', 'failed', 'expired', 'cancelled')),
	CONSTRAINT "email_versions_check" CHECK ("operations"."email_delivery"."revision" BETWEEN 1 AND 9007199254740991 AND "operations"."email_delivery"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "email_attempt_check" CHECK ("operations"."email_delivery"."attempts" >= 0 AND ("operations"."email_delivery"."last_error_code" IS NULL OR "operations"."email_delivery"."last_error_code" IN ('smtp_unavailable', 'expired', 'invalidated', 'payload_unavailable'))),
	CONSTRAINT "email_lifetime_check" CHECK ("operations"."email_delivery"."expires_at" <= "operations"."email_delivery"."created_at" + CASE "operations"."email_delivery"."purpose" WHEN 'password_reset' THEN interval '30 minutes' WHEN 'invitation' THEN interval '7 days' WHEN 'transfer' THEN interval '72 hours' ELSE interval '24 hours' END),
	CONSTRAINT "email_time_check" CHECK ("operations"."email_delivery"."expires_at" > "operations"."email_delivery"."created_at" AND "operations"."email_delivery"."payload_purge_after" >= "operations"."email_delivery"."expires_at" AND "operations"."email_delivery"."payload_purge_after" <= "operations"."email_delivery"."expires_at" + interval '1 hour'),
	CONSTRAINT "email_command_pair_check" CHECK (("operations"."email_delivery"."actor_account_id" IS NULL) = ("operations"."email_delivery"."command_id" IS NULL)),
	CONSTRAINT "email_binding_check" CHECK (("operations"."email_delivery"."purpose" IN ('verification', 'password_reset') AND "operations"."email_delivery"."auth_subject_id" IS NOT NULL AND "operations"."email_delivery"."invitation_id" IS NULL AND "operations"."email_delivery"."transfer_id" IS NULL) OR ("operations"."email_delivery"."purpose" = 'invitation' AND "operations"."email_delivery"."invitation_id" IS NOT NULL AND "operations"."email_delivery"."auth_subject_id" IS NULL AND "operations"."email_delivery"."transfer_id" IS NULL) OR ("operations"."email_delivery"."purpose" = 'transfer' AND "operations"."email_delivery"."transfer_id" IS NOT NULL AND "operations"."email_delivery"."auth_subject_id" IS NULL AND "operations"."email_delivery"."invitation_id" IS NULL) OR ("operations"."email_delivery"."purpose" = 'security' AND "operations"."email_delivery"."recipient_account_id" IS NOT NULL)),
	CONSTRAINT "email_sealed_payload_check" CHECK (("operations"."email_delivery"."key_id" IS NULL AND "operations"."email_delivery"."ciphertext" IS NULL AND "operations"."email_delivery"."nonce" IS NULL AND "operations"."email_delivery"."authentication_tag" IS NULL AND "operations"."email_delivery"."state" IN ('smtp_accepted', 'expired', 'cancelled', 'failed')) OR ("operations"."email_delivery"."key_id" IS NOT NULL AND char_length("operations"."email_delivery"."key_id") BETWEEN 1 AND 64 AND "operations"."email_delivery"."ciphertext" IS NOT NULL AND octet_length("operations"."email_delivery"."ciphertext") BETWEEN 16 AND 65536 AND "operations"."email_delivery"."nonce" IS NOT NULL AND octet_length("operations"."email_delivery"."nonce") = 12 AND "operations"."email_delivery"."authentication_tag" IS NOT NULL AND octet_length("operations"."email_delivery"."authentication_tag") = 16)),
	CONSTRAINT "email_acceptance_check" CHECK (("operations"."email_delivery"."state" = 'smtp_accepted') = ("operations"."email_delivery"."smtp_accepted_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "operations"."email_delivery" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."impact_preview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_account_id" uuid NOT NULL,
	"secret_hash" text NOT NULL,
	"action" text NOT NULL,
	"journey_id" uuid,
	"target_account_id" uuid,
	"target_membership_id" uuid,
	"target_revision" bigint NOT NULL,
	"policy_generation" bigint NOT NULL,
	"impact_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_command_id" uuid,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "impact_preview_secret_hash_unique" UNIQUE("secret_hash"),
	CONSTRAINT "impact_secret_check" CHECK ("operations"."impact_preview"."secret_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "impact_digest_check" CHECK ("operations"."impact_preview"."impact_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "impact_action_check" CHECK ("operations"."impact_preview"."action" IN ('leave', 'remove_member', 'archive', 'delete_journey', 'delete_account', 'transfer_administration', 'change_capabilities')),
	CONSTRAINT "impact_versions_check" CHECK ("operations"."impact_preview"."target_revision" BETWEEN 1 AND 9007199254740991 AND "operations"."impact_preview"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "impact_expiry_check" CHECK ("operations"."impact_preview"."expires_at" > "operations"."impact_preview"."created_at" AND "operations"."impact_preview"."expires_at" <= "operations"."impact_preview"."created_at" + interval '5 minutes'),
	CONSTRAINT "impact_target_check" CHECK (("operations"."impact_preview"."action" = 'delete_account' AND "operations"."impact_preview"."target_account_id" IS NOT NULL AND "operations"."impact_preview"."target_account_id" = "operations"."impact_preview"."actor_account_id" AND "operations"."impact_preview"."journey_id" IS NULL AND "operations"."impact_preview"."target_membership_id" IS NULL) OR ("operations"."impact_preview"."action" <> 'delete_account' AND "operations"."impact_preview"."journey_id" IS NOT NULL AND "operations"."impact_preview"."target_account_id" IS NULL)),
	CONSTRAINT "impact_consumption_check" CHECK (("operations"."impact_preview"."consumed_command_id" IS NULL AND "operations"."impact_preview"."consumed_at" IS NULL) OR ("operations"."impact_preview"."consumed_command_id" IS NOT NULL AND "operations"."impact_preview"."consumed_at" IS NOT NULL AND "operations"."impact_preview"."consumed_at" >= "operations"."impact_preview"."created_at" AND "operations"."impact_preview"."consumed_at" <= "operations"."impact_preview"."expires_at"))
);
--> statement-breakpoint
ALTER TABLE "operations"."impact_preview" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."lifecycle_operation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_account_id" uuid NOT NULL,
	"command_id" uuid NOT NULL,
	"action" text NOT NULL,
	"resource_kind" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"journey_id" uuid,
	"target_account_id" uuid,
	"target_membership_id" uuid,
	"impact_digest" text NOT NULL,
	"target_revision" bigint NOT NULL,
	"policy_generation" bigint NOT NULL,
	"state" text DEFAULT 'denied' NOT NULL,
	"recovery_state" text DEFAULT 'pending' NOT NULL,
	"processed_units" integer DEFAULT 0 NOT NULL,
	"total_units" integer DEFAULT 0 NOT NULL,
	"next_unit_id" uuid,
	"revision" bigint DEFAULT 1 NOT NULL,
	"error_code" text,
	"status_receipt_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"receipt_hard_expires_at" timestamp with time zone,
	"terminal_at" timestamp with time zone,
	"terminal_available_until" timestamp with time zone,
	CONSTRAINT "lifecycle_operation_status_receipt_hash_unique" UNIQUE("status_receipt_hash"),
	CONSTRAINT "lifecycle_command_unique" UNIQUE("actor_account_id","command_id"),
	CONSTRAINT "lifecycle_action_check" CHECK ("operations"."lifecycle_operation"."action" IN ('leave', 'remove_member', 'archive', 'delete_journey', 'delete_account', 'transfer_administration', 'change_capabilities', 'invitation.revoke', 'invitation.supersede', 'invitation.decline', 'transfer.cancel', 'transfer.decline', 'transfer.invalidate', 'transfer.accept', 'journey.archive', 'journey.freeze', 'journey.delete', 'membership.leave', 'membership.remove', 'capability.remove', 'account.delete', 'source.narrow', 'source.withdraw', 'source.delete', 'export.revoke', 'export.invalidate', 'avatar.delete')),
	CONSTRAINT "lifecycle_state_check" CHECK ("operations"."lifecycle_operation"."state" IN ('denied', 'processing', 'complete', 'failed')),
	CONSTRAINT "lifecycle_recovery_check" CHECK ("operations"."lifecycle_operation"."recovery_state" IN ('pending', 'confirmed')),
	CONSTRAINT "lifecycle_version_check" CHECK ("operations"."lifecycle_operation"."revision" BETWEEN 1 AND 9007199254740991 AND "operations"."lifecycle_operation"."target_revision" BETWEEN 1 AND 9007199254740991 AND "operations"."lifecycle_operation"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "lifecycle_impact_check" CHECK ("operations"."lifecycle_operation"."impact_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "lifecycle_error_check" CHECK ("operations"."lifecycle_operation"."error_code" IS NULL OR "operations"."lifecycle_operation"."error_code" IN ('retryable', 'integrity_failure', 'cleanup_failed')),
	CONSTRAINT "lifecycle_progress_check" CHECK ("operations"."lifecycle_operation"."processed_units" >= 0 AND "operations"."lifecycle_operation"."total_units" >= "operations"."lifecycle_operation"."processed_units" AND ("operations"."lifecycle_operation"."state" <> 'complete' OR "operations"."lifecycle_operation"."processed_units" = "operations"."lifecycle_operation"."total_units") AND "operations"."lifecycle_operation"."updated_at" >= "operations"."lifecycle_operation"."created_at"),
	CONSTRAINT "lifecycle_target_check" CHECK (CASE
 WHEN "operations"."lifecycle_operation"."action" IN ('delete_account', 'account.delete') THEN "operations"."lifecycle_operation"."resource_kind" = 'account' AND "operations"."lifecycle_operation"."target_account_id" IS NOT NULL AND "operations"."lifecycle_operation"."target_account_id" = "operations"."lifecycle_operation"."actor_account_id" AND "operations"."lifecycle_operation"."resource_id" = "operations"."lifecycle_operation"."actor_account_id" AND "operations"."lifecycle_operation"."journey_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" IN ('archive', 'delete_journey', 'journey.archive', 'journey.freeze', 'journey.delete') THEN "operations"."lifecycle_operation"."resource_kind" = 'journey' AND "operations"."lifecycle_operation"."journey_id" IS NOT NULL AND "operations"."lifecycle_operation"."resource_id" = "operations"."lifecycle_operation"."journey_id" AND "operations"."lifecycle_operation"."target_account_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" IN ('leave', 'remove_member', 'change_capabilities', 'membership.leave', 'membership.remove', 'capability.remove') THEN "operations"."lifecycle_operation"."resource_kind" = 'membership' AND "operations"."lifecycle_operation"."journey_id" IS NOT NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NOT NULL AND "operations"."lifecycle_operation"."resource_id" = "operations"."lifecycle_operation"."target_membership_id" AND "operations"."lifecycle_operation"."target_account_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" IN ('transfer_administration', 'transfer.cancel', 'transfer.decline', 'transfer.invalidate', 'transfer.accept') THEN "operations"."lifecycle_operation"."resource_kind" = 'transfer' AND "operations"."lifecycle_operation"."journey_id" IS NOT NULL AND "operations"."lifecycle_operation"."target_account_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" IN ('invitation.revoke', 'invitation.supersede', 'invitation.decline') THEN "operations"."lifecycle_operation"."resource_kind" = 'invitation' AND "operations"."lifecycle_operation"."journey_id" IS NOT NULL AND "operations"."lifecycle_operation"."target_account_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" IN ('source.narrow', 'source.withdraw') THEN "operations"."lifecycle_operation"."resource_kind" = 'source_grant' AND "operations"."lifecycle_operation"."journey_id" IS NOT NULL AND "operations"."lifecycle_operation"."target_account_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" IN ('export.revoke', 'export.invalidate') THEN "operations"."lifecycle_operation"."resource_kind" = 'export_grant' AND "operations"."lifecycle_operation"."journey_id" IS NOT NULL AND "operations"."lifecycle_operation"."target_account_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" = 'source.delete' THEN "operations"."lifecycle_operation"."resource_kind" = 'source' AND "operations"."lifecycle_operation"."target_account_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL
 WHEN "operations"."lifecycle_operation"."action" = 'avatar.delete' THEN "operations"."lifecycle_operation"."resource_kind" = 'avatar' AND "operations"."lifecycle_operation"."journey_id" IS NULL AND "operations"."lifecycle_operation"."target_account_id" IS NULL AND "operations"."lifecycle_operation"."target_membership_id" IS NULL ELSE false END),
	CONSTRAINT "lifecycle_receipt_check" CHECK (("operations"."lifecycle_operation"."status_receipt_hash" IS NULL AND "operations"."lifecycle_operation"."receipt_hard_expires_at" IS NULL AND "operations"."lifecycle_operation"."terminal_available_until" IS NULL) OR ("operations"."lifecycle_operation"."action" IN ('delete_account', 'account.delete') AND "operations"."lifecycle_operation"."status_receipt_hash" IS NOT NULL AND "operations"."lifecycle_operation"."status_receipt_hash" ~ '^[0-9a-f]{64}$' AND "operations"."lifecycle_operation"."receipt_hard_expires_at" IS NOT NULL AND "operations"."lifecycle_operation"."receipt_hard_expires_at" > "operations"."lifecycle_operation"."created_at" AND "operations"."lifecycle_operation"."receipt_hard_expires_at" <= "operations"."lifecycle_operation"."created_at" + interval '45 days' AND ("operations"."lifecycle_operation"."terminal_available_until" IS NULL OR ("operations"."lifecycle_operation"."terminal_at" IS NOT NULL AND "operations"."lifecycle_operation"."terminal_available_until" > "operations"."lifecycle_operation"."terminal_at" AND "operations"."lifecycle_operation"."terminal_available_until" <= "operations"."lifecycle_operation"."terminal_at" + interval '7 days' AND "operations"."lifecycle_operation"."terminal_available_until" <= "operations"."lifecycle_operation"."receipt_hard_expires_at")))),
	CONSTRAINT "lifecycle_terminal_check" CHECK (("operations"."lifecycle_operation"."state" = 'complete' AND "operations"."lifecycle_operation"."terminal_at" IS NOT NULL AND "operations"."lifecycle_operation"."terminal_at" >= "operations"."lifecycle_operation"."created_at") OR ("operations"."lifecycle_operation"."state" <> 'complete' AND "operations"."lifecycle_operation"."terminal_at" IS NULL AND "operations"."lifecycle_operation"."terminal_available_until" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "operations"."lifecycle_operation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."restriction_delivery" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error_code" text,
	"revision" bigint DEFAULT 1 NOT NULL,
	CONSTRAINT "restriction_delivery_revision_check" CHECK ("operations"."restriction_delivery"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "restriction_delivery_state_check" CHECK ("operations"."restriction_delivery"."state" IN ('pending', 'confirmed')),
	CONSTRAINT "restriction_attempt_check" CHECK ("operations"."restriction_delivery"."attempts" >= 0 AND ("operations"."restriction_delivery"."last_error_code" IS NULL OR "operations"."restriction_delivery"."last_error_code" IN ('unavailable', 'unknown_outcome', 'integrity_failure')))
);
--> statement-breakpoint
ALTER TABLE "operations"."restriction_delivery" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."restriction_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"account_id" uuid,
	"journey_id" uuid,
	"membership_id" uuid,
	"source_id" uuid,
	"source_grant_id" uuid,
	"export_grant_id" uuid,
	"invitation_id" uuid,
	"transfer_id" uuid,
	"policy_generation" bigint NOT NULL,
	"integrity_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restriction_kind_check" CHECK ("operations"."restriction_event"."kind" IN ('invitation.revoke', 'invitation.supersede', 'invitation.decline', 'transfer.cancel', 'transfer.decline', 'transfer.invalidate', 'transfer.accept', 'journey.archive', 'journey.freeze', 'journey.delete', 'membership.leave', 'membership.remove', 'capability.remove', 'account.delete', 'source.narrow', 'source.withdraw', 'source.delete', 'export.revoke', 'export.invalidate', 'avatar.delete')),
	CONSTRAINT "restriction_generation_check" CHECK ("operations"."restriction_event"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "restriction_integrity_check" CHECK ("operations"."restriction_event"."integrity_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "restriction_target_check" CHECK (num_nonnulls("operations"."restriction_event"."account_id", "operations"."restriction_event"."journey_id", "operations"."restriction_event"."membership_id", "operations"."restriction_event"."source_id", "operations"."restriction_event"."source_grant_id", "operations"."restriction_event"."export_grant_id", "operations"."restriction_event"."invitation_id", "operations"."restriction_event"."transfer_id") > 0)
);
--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."restriction_receipt" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"external_receipt" text NOT NULL,
	"sequence" bigint NOT NULL,
	"checkpoint_sha256" text NOT NULL,
	"event_sha256" text NOT NULL,
	"key_id" text NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restriction_receipt_external_receipt_unique" UNIQUE("external_receipt"),
	CONSTRAINT "restriction_receipt_sequence_unique" UNIQUE("sequence"),
	CONSTRAINT "receipt_sequence_check" CHECK ("operations"."restriction_receipt"."sequence" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "receipt_checkpoint_check" CHECK ("operations"."restriction_receipt"."checkpoint_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "receipt_event_check" CHECK ("operations"."restriction_receipt"."event_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "receipt_external_check" CHECK (char_length("operations"."restriction_receipt"."external_receipt") BETWEEN 1 AND 256 AND "operations"."restriction_receipt"."external_receipt" ~ '^[A-Za-z0-9._:-]+$' AND char_length("operations"."restriction_receipt"."key_id") BETWEEN 1 AND 64 AND "operations"."restriction_receipt"."key_id" ~ '^[A-Za-z0-9._:-]+$')
);
--> statement-breakpoint
ALTER TABLE "operations"."restriction_receipt" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."profile" ADD COLUMN "avatar_id" uuid;--> statement-breakpoint
ALTER TABLE "identity"."profile_avatar" ADD CONSTRAINT "profile_avatar_owner_account_id_account_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."administration_transfer" ADD CONSTRAINT "transfer_offering_binding_fk" FOREIGN KEY ("offering_membership_id","journey_id","offering_account_id") REFERENCES "journeys"."membership"("id","journey_id","account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."administration_transfer" ADD CONSTRAINT "transfer_target_binding_fk" FOREIGN KEY ("target_membership_id","journey_id","target_account_id") REFERENCES "journeys"."membership"("id","journey_id","account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."invitation" ADD CONSTRAINT "invitation_guard_journey_fk" FOREIGN KEY ("guard_id","journey_id") REFERENCES "journeys"."recipient_guard"("id","journey_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."invitation" ADD CONSTRAINT "invitation_inviter_binding_fk" FOREIGN KEY ("inviter_membership_id","journey_id","inviter_account_id") REFERENCES "journeys"."membership"("id","journey_id","account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."invitation" ADD CONSTRAINT "invitation_acceptor_binding_fk" FOREIGN KEY ("accepted_membership_id","journey_id","accepted_account_id") REFERENCES "journeys"."membership"("id","journey_id","account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."recipient_guard" ADD CONSTRAINT "recipient_guard_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys"."recipient_guard" ADD CONSTRAINT "recipient_guard_bound_account_id_account_id_fk" FOREIGN KEY ("bound_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_grant" ADD CONSTRAINT "export_grant_request_recipient_fk" FOREIGN KEY ("request_id","owner_account_id","journey_id","recipient_account_id","recipient_membership_id","recipient_epoch") REFERENCES "sources"."export_request"("id","owner_account_id","journey_id","requester_account_id","requester_membership_id","requester_epoch") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_grant_asset" ADD CONSTRAINT "grant_asset_export_binding_fk" FOREIGN KEY ("grant_id","request_id","owner_account_id","journey_id") REFERENCES "sources"."export_grant"("id","request_id","owner_account_id","journey_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_grant_asset" ADD CONSTRAINT "grant_asset_exact_requested_binding_fk" FOREIGN KEY ("request_id","asset_id","source_id","owner_account_id","journey_id","source_grant_id","asset_revision","source_grant_revision") REFERENCES "sources"."export_request_asset"("request_id","asset_id","source_id","owner_account_id","journey_id","source_grant_id","asset_revision","source_grant_revision") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_request" ADD CONSTRAINT "export_request_owner_account_id_account_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_request" ADD CONSTRAINT "export_request_membership_fk" FOREIGN KEY ("requester_membership_id","journey_id","requester_account_id") REFERENCES "journeys"."membership"("id","journey_id","account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_request_asset" ADD CONSTRAINT "request_asset_request_binding_fk" FOREIGN KEY ("request_id","owner_account_id","journey_id") REFERENCES "sources"."export_request"("id","owner_account_id","journey_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_request_asset" ADD CONSTRAINT "request_asset_identity_fk" FOREIGN KEY ("asset_id","source_id","owner_account_id") REFERENCES "sources"."source_asset"("id","source_id","owner_account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."export_request_asset" ADD CONSTRAINT "request_asset_source_grant_fk" FOREIGN KEY ("source_grant_id","source_id","journey_id","owner_account_id") REFERENCES "sources"."source_grant"("id","source_id","journey_id","owner_account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."source_asset" ADD CONSTRAINT "asset_source_owner_fk" FOREIGN KEY ("source_id","owner_account_id") REFERENCES "sources"."source"("id","owner_account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."source_grant" ADD CONSTRAINT "source_grant_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."source_grant" ADD CONSTRAINT "source_grant_changed_by_account_id_fk" FOREIGN KEY ("changed_by") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."source_grant" ADD CONSTRAINT "source_grant_owner_fk" FOREIGN KEY ("source_id","owner_account_id") REFERENCES "sources"."source"("id","owner_account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources"."source" ADD CONSTRAINT "source_owner_account_id_account_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."account_notice" ADD CONSTRAINT "account_notice_recipient_account_id_account_id_fk" FOREIGN KEY ("recipient_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."account_notice" ADD CONSTRAINT "account_notice_event_id_audit_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "operations"."audit_event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."account_notice" ADD CONSTRAINT "account_notice_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."audit_event" ADD CONSTRAINT "audit_event_actor_account_id_account_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."audit_event" ADD CONSTRAINT "audit_event_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."audit_event" ADD CONSTRAINT "audit_event_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "sources"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."audit_event" ADD CONSTRAINT "audit_event_subject_account_id_account_id_fk" FOREIGN KEY ("subject_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."audit_event" ADD CONSTRAINT "audit_command_fk" FOREIGN KEY ("actor_account_id","command_id") REFERENCES "operations"."command_receipt"("actor_account_id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."command_receipt" ADD CONSTRAINT "command_receipt_actor_account_id_account_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."domain_change" ADD CONSTRAINT "domain_change_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."domain_change" ADD CONSTRAINT "domain_change_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."domain_change" ADD CONSTRAINT "change_command_fk" FOREIGN KEY ("actor_account_id","command_id") REFERENCES "operations"."command_receipt"("actor_account_id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."email_delivery" ADD CONSTRAINT "email_delivery_auth_subject_id_user_id_fk" FOREIGN KEY ("auth_subject_id") REFERENCES "authn"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."email_delivery" ADD CONSTRAINT "email_delivery_recipient_account_id_account_id_fk" FOREIGN KEY ("recipient_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."email_delivery" ADD CONSTRAINT "email_delivery_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "journeys"."invitation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."email_delivery" ADD CONSTRAINT "email_delivery_transfer_id_administration_transfer_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "journeys"."administration_transfer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."email_delivery" ADD CONSTRAINT "email_command_fk" FOREIGN KEY ("actor_account_id","command_id") REFERENCES "operations"."command_receipt"("actor_account_id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."impact_preview" ADD CONSTRAINT "impact_preview_actor_account_id_account_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."impact_preview" ADD CONSTRAINT "impact_preview_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."impact_preview" ADD CONSTRAINT "impact_preview_target_account_id_account_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."impact_preview" ADD CONSTRAINT "impact_member_journey_fk" FOREIGN KEY ("target_membership_id","journey_id") REFERENCES "journeys"."membership"("id","journey_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."impact_preview" ADD CONSTRAINT "impact_command_fk" FOREIGN KEY ("actor_account_id","consumed_command_id") REFERENCES "operations"."command_receipt"("actor_account_id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."lifecycle_operation" ADD CONSTRAINT "lifecycle_operation_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."lifecycle_operation" ADD CONSTRAINT "lifecycle_operation_target_account_id_account_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."lifecycle_operation" ADD CONSTRAINT "lifecycle_member_journey_fk" FOREIGN KEY ("target_membership_id","journey_id") REFERENCES "journeys"."membership"("id","journey_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."lifecycle_operation" ADD CONSTRAINT "lifecycle_command_fk" FOREIGN KEY ("actor_account_id","command_id") REFERENCES "operations"."command_receipt"("actor_account_id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_delivery" ADD CONSTRAINT "restriction_delivery_event_id_restriction_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "operations"."restriction_event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_operation_id_lifecycle_operation_id_fk" FOREIGN KEY ("operation_id") REFERENCES "operations"."lifecycle_operation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_journey_id_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "journeys"."journey"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "journeys"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "sources"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_source_grant_id_source_grant_id_fk" FOREIGN KEY ("source_grant_id") REFERENCES "sources"."source_grant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_export_grant_id_export_grant_id_fk" FOREIGN KEY ("export_grant_id") REFERENCES "sources"."export_grant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "journeys"."invitation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_event_transfer_id_administration_transfer_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "journeys"."administration_transfer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."restriction_receipt" ADD CONSTRAINT "restriction_receipt_event_id_restriction_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "operations"."restriction_event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "avatar_owner_state_idx" ON "identity"."profile_avatar" USING btree ("owner_account_id","state","id");--> statement-breakpoint
CREATE UNIQUE INDEX "avatar_one_available_owner" ON "identity"."profile_avatar" USING btree ("owner_account_id") WHERE "identity"."profile_avatar"."state" = 'available';--> statement-breakpoint
CREATE UNIQUE INDEX "avatar_one_pending_owner" ON "identity"."profile_avatar" USING btree ("owner_account_id") WHERE "identity"."profile_avatar"."state" IN ('pending', 'quarantined', 'processing');--> statement-breakpoint
CREATE INDEX "avatar_expiry_idx" ON "identity"."profile_avatar" USING btree ("state","upload_expires_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_one_offered_journey" ON "journeys"."administration_transfer" USING btree ("journey_id") WHERE "journeys"."administration_transfer"."state" = 'offered';--> statement-breakpoint
CREATE INDEX "transfer_offering_idx" ON "journeys"."administration_transfer" USING btree ("offering_membership_id");--> statement-breakpoint
CREATE INDEX "transfer_target_idx" ON "journeys"."administration_transfer" USING btree ("target_membership_id","state","id");--> statement-breakpoint
CREATE INDEX "transfer_expiry_idx" ON "journeys"."administration_transfer" USING btree ("state","expires_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_one_pending_guard" ON "journeys"."invitation" USING btree ("guard_id") WHERE "journeys"."invitation"."state" = 'pending';--> statement-breakpoint
CREATE INDEX "invitation_guard_history_idx" ON "journeys"."invitation" USING btree ("guard_id","state","id");--> statement-breakpoint
CREATE INDEX "invitation_journey_state_idx" ON "journeys"."invitation" USING btree ("journey_id","state","created_at","id");--> statement-breakpoint
CREATE INDEX "invitation_inviter_idx" ON "journeys"."invitation" USING btree ("inviter_membership_id");--> statement-breakpoint
CREATE INDEX "invitation_acceptor_idx" ON "journeys"."invitation" USING btree ("accepted_membership_id");--> statement-breakpoint
CREATE INDEX "invitation_expiry_idx" ON "journeys"."invitation" USING btree ("state","expires_at","id");--> statement-breakpoint
CREATE INDEX "guard_bound_account_idx" ON "journeys"."recipient_guard" USING btree ("bound_account_id","journey_id");--> statement-breakpoint
CREATE INDEX "export_grant_recipient_idx" ON "sources"."export_grant" USING btree ("recipient_account_id","state","expires_at","id");--> statement-breakpoint
CREATE INDEX "export_grant_owner_idx" ON "sources"."export_grant" USING btree ("owner_account_id","state","id");--> statement-breakpoint
CREATE INDEX "export_grant_membership_idx" ON "sources"."export_grant" USING btree ("recipient_membership_id");--> statement-breakpoint
CREATE INDEX "export_grant_journey_idx" ON "sources"."export_grant" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "grant_asset_requested_idx" ON "sources"."export_grant_asset" USING btree ("request_id","asset_id");--> statement-breakpoint
CREATE INDEX "grant_asset_asset_idx" ON "sources"."export_grant_asset" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "grant_asset_source_grant_idx" ON "sources"."export_grant_asset" USING btree ("source_grant_id");--> statement-breakpoint
CREATE INDEX "export_request_owner_idx" ON "sources"."export_request" USING btree ("owner_account_id","state","created_at","id");--> statement-breakpoint
CREATE INDEX "export_request_recipient_idx" ON "sources"."export_request" USING btree ("requester_account_id","state","created_at","id");--> statement-breakpoint
CREATE INDEX "export_request_membership_idx" ON "sources"."export_request" USING btree ("requester_membership_id");--> statement-breakpoint
CREATE INDEX "export_request_journey_idx" ON "sources"."export_request" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "export_request_expiry_idx" ON "sources"."export_request" USING btree ("state","expires_at","id");--> statement-breakpoint
CREATE INDEX "request_asset_asset_idx" ON "sources"."export_request_asset" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "request_asset_grant_idx" ON "sources"."export_request_asset" USING btree ("source_grant_id");--> statement-breakpoint
CREATE INDEX "asset_source_idx" ON "sources"."source_asset" USING btree ("source_id","id");--> statement-breakpoint
CREATE INDEX "asset_owner_idx" ON "sources"."source_asset" USING btree ("owner_account_id","state","id");--> statement-breakpoint
CREATE INDEX "source_grant_journey_idx" ON "sources"."source_grant" USING btree ("journey_id","state","source_id");--> statement-breakpoint
CREATE INDEX "source_grant_owner_idx" ON "sources"."source_grant" USING btree ("owner_account_id","id");--> statement-breakpoint
CREATE INDEX "source_grant_actor_idx" ON "sources"."source_grant" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "source_owner_idx" ON "sources"."source" USING btree ("owner_account_id","state","id");--> statement-breakpoint
CREATE INDEX "abuse_expiry_idx" ON "operations"."abuse_counter" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notice_recipient_cursor_idx" ON "operations"."account_notice" USING btree ("recipient_account_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notice_journey_idx" ON "operations"."account_notice" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "audit_actor_cursor_idx" ON "operations"."audit_event" USING btree ("actor_account_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "audit_command_idx" ON "operations"."audit_event" USING btree ("actor_account_id","command_id");--> statement-breakpoint
CREATE INDEX "audit_journey_cursor_idx" ON "operations"."audit_event" USING btree ("journey_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "audit_source_idx" ON "operations"."audit_event" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "audit_subject_idx" ON "operations"."audit_event" USING btree ("subject_account_id");--> statement-breakpoint
CREATE INDEX "command_expiry_idx" ON "operations"."command_receipt" USING btree ("retention_state","expires_at");--> statement-breakpoint
CREATE INDEX "change_account_cursor_idx" ON "operations"."domain_change" USING btree ("account_id","cursor");--> statement-breakpoint
CREATE INDEX "change_journey_cursor_idx" ON "operations"."domain_change" USING btree ("journey_id","cursor");--> statement-breakpoint
CREATE INDEX "change_command_idx" ON "operations"."domain_change" USING btree ("actor_account_id","command_id");--> statement-breakpoint
CREATE INDEX "email_pending_idx" ON "operations"."email_delivery" USING btree ("state","next_attempt_at","id");--> statement-breakpoint
CREATE INDEX "email_payload_expiry_idx" ON "operations"."email_delivery" USING btree ("payload_purge_after");--> statement-breakpoint
CREATE INDEX "email_auth_idx" ON "operations"."email_delivery" USING btree ("auth_subject_id");--> statement-breakpoint
CREATE INDEX "email_recipient_idx" ON "operations"."email_delivery" USING btree ("recipient_account_id");--> statement-breakpoint
CREATE INDEX "email_invitation_idx" ON "operations"."email_delivery" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "email_transfer_idx" ON "operations"."email_delivery" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX "email_command_idx" ON "operations"."email_delivery" USING btree ("actor_account_id","command_id");--> statement-breakpoint
CREATE INDEX "impact_actor_idx" ON "operations"."impact_preview" USING btree ("actor_account_id","id");--> statement-breakpoint
CREATE INDEX "impact_expiry_idx" ON "operations"."impact_preview" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "impact_journey_idx" ON "operations"."impact_preview" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "impact_account_idx" ON "operations"."impact_preview" USING btree ("target_account_id");--> statement-breakpoint
CREATE INDEX "impact_member_idx" ON "operations"."impact_preview" USING btree ("target_membership_id");--> statement-breakpoint
CREATE INDEX "lifecycle_pending_idx" ON "operations"."lifecycle_operation" USING btree ("state","updated_at","id");--> statement-breakpoint
CREATE INDEX "lifecycle_journey_idx" ON "operations"."lifecycle_operation" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "lifecycle_account_idx" ON "operations"."lifecycle_operation" USING btree ("target_account_id");--> statement-breakpoint
CREATE INDEX "lifecycle_membership_idx" ON "operations"."lifecycle_operation" USING btree ("target_membership_id");--> statement-breakpoint
CREATE INDEX "restriction_pending_idx" ON "operations"."restriction_delivery" USING btree ("state","next_attempt_at","event_id");--> statement-breakpoint
CREATE INDEX "restriction_operation_idx" ON "operations"."restriction_event" USING btree ("operation_id","id");--> statement-breakpoint
CREATE INDEX "restriction_account_idx" ON "operations"."restriction_event" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "restriction_journey_idx" ON "operations"."restriction_event" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "restriction_membership_idx" ON "operations"."restriction_event" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "restriction_source_idx" ON "operations"."restriction_event" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "restriction_source_grant_idx" ON "operations"."restriction_event" USING btree ("source_grant_id");--> statement-breakpoint
CREATE INDEX "restriction_export_grant_idx" ON "operations"."restriction_event" USING btree ("export_grant_id");--> statement-breakpoint
CREATE INDEX "restriction_invitation_idx" ON "operations"."restriction_event" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "restriction_transfer_idx" ON "operations"."restriction_event" USING btree ("transfer_id");--> statement-breakpoint
ALTER TABLE "identity"."profile" ADD CONSTRAINT "profile_avatar_owner_fk" FOREIGN KEY ("avatar_id","account_id") REFERENCES "identity"."profile_avatar"("id","owner_account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_avatar_idx" ON "identity"."profile" USING btree ("avatar_id");