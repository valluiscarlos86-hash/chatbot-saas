CREATE TABLE "chatbot_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"business_name" text,
	"business_description" text,
	"contact_info" text,
	"bot_name" text,
	"bot_tone" text DEFAULT 'friendly',
	"welcome_message" text,
	"escalation_rules" text,
	"office_hours" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD CONSTRAINT "chatbot_configs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;