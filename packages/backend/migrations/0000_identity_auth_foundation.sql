CREATE SCHEMA "authn";
--> statement-breakpoint
CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE TABLE "authn"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authn"."rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "authn"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "authn"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "authn"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity"."account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject_id" text,
	"state" text DEFAULT 'active' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"policy_generation" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "account_auth_subject_id_unique" UNIQUE("auth_subject_id"),
	CONSTRAINT "account_state_check" CHECK ("identity"."account"."state" IN ('active', 'deleting', 'deleted')),
	CONSTRAINT "active_account_auth_mapping" CHECK ("identity"."account"."state" <> 'active' OR "identity"."account"."auth_subject_id" IS NOT NULL),
	CONSTRAINT "account_revision_check" CHECK ("identity"."account"."revision" BETWEEN 1 AND 9007199254740991 AND "identity"."account"."policy_generation" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "account_deletion_time_check" CHECK (("identity"."account"."state" = 'active' AND "identity"."account"."deleted_at" IS NULL) OR ("identity"."account"."state" <> 'active' AND "identity"."account"."deleted_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "identity"."profile" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"revision" bigint DEFAULT 1 NOT NULL,
	CONSTRAINT "profile_display_name_bounds" CHECK (char_length("identity"."profile"."display_name") BETWEEN 1 AND 80 AND "identity"."profile"."display_name" = btrim("identity"."profile"."display_name")),
	CONSTRAINT "profile_bio_bounds" CHECK ("identity"."profile"."bio" IS NULL OR char_length("identity"."profile"."bio") <= 500),
	CONSTRAINT "profile_revision_check" CHECK ("identity"."profile"."revision" BETWEEN 1 AND 9007199254740991)
);
--> statement-breakpoint
CREATE TABLE "identity"."retired_auth_subject" (
	"auth_subject_id" text PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"deny_generation" bigint NOT NULL,
	"retired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retired_subject_generation_check" CHECK ("identity"."retired_auth_subject"."deny_generation" BETWEEN 1 AND 9007199254740991)
);
--> statement-breakpoint
ALTER TABLE "authn"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "authn"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authn"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "authn"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."account" ADD CONSTRAINT "account_auth_subject_id_user_id_fk" FOREIGN KEY ("auth_subject_id") REFERENCES "authn"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."profile" ADD CONSTRAINT "profile_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."retired_auth_subject" ADD CONSTRAINT "retired_auth_subject_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "authn"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "authn"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "authn"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "retired_subject_account_idx" ON "identity"."retired_auth_subject" USING btree ("account_id");