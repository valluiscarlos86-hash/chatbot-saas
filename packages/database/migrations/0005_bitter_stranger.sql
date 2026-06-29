CREATE TYPE "public"."document_source" AS ENUM('file', 'url');--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "source_type" "document_source" DEFAULT 'file' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "source_url" text;