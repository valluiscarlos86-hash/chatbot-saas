CREATE TABLE "tiendanube_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"store_id" text NOT NULL,
	"access_token" text NOT NULL,
	"store_url" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tiendanube_accounts_org_id_unique" UNIQUE("org_id")
);
