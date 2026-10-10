CREATE TYPE "jengapact"."agreement_form" AS ENUM('jbc_1999', 'fidic_2017_red', 'fidic_2017_yellow', 'bespoke');--> statement-breakpoint
CREATE TYPE "jengapact"."agreement_status" AS ENUM('draft', 'negotiating', 'ready_for_signature', 'executed', 'superseded');--> statement-breakpoint
CREATE TYPE "jengapact"."authority_action" AS ENUM('draft_clause', 'execute_agreement', 'submit_variation', 'review_technical', 'review_commercial', 'authorize_variation', 'submit_claim', 'assess_valuation', 'issue_certificate', 'record_payment', 'resolve_issue', 'export_evidence');--> statement-breakpoint
CREATE TYPE "jengapact"."certificate_status" AS ENUM('draft', 'issued', 'superseded');--> statement-breakpoint
CREATE TYPE "jengapact"."claim_status" AS ENUM('draft', 'submitted', 'under_assessment', 'assessed', 'certified', 'withdrawn');--> statement-breakpoint
CREATE TYPE "jengapact"."clause_status" AS ENUM('proposed', 'in_review', 'agreed', 'disputed');--> statement-breakpoint
CREATE TYPE "jengapact"."credential_kind" AS ENUM('architect', 'quantity_surveyor', 'engineer', 'nca_contractor', 'other');--> statement-breakpoint
CREATE TYPE "jengapact"."credential_status" AS ENUM('self_declared', 'document_reviewed', 'independently_verified', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "jengapact"."document_category" AS ENUM('agreement', 'drawing', 'boq', 'instruction', 'site_report', 'photo', 'minutes', 'claim', 'certificate', 'approval', 'defect', 'dispute', 'handover', 'other');--> statement-breakpoint
CREATE TYPE "jengapact"."instruction_status" AS ENUM('issued', 'acknowledged', 'superseded', 'closed');--> statement-breakpoint
CREATE TYPE "jengapact"."invitation_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "jengapact"."issue_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "jengapact"."issue_status" AS ENUM('open', 'awaiting_response', 'under_negotiation', 'referred', 'resolved', 'withdrawn', 'closed');--> statement-breakpoint
CREATE TYPE "jengapact"."issue_type" AS ENUM('scope', 'payment', 'delay', 'quality', 'defect', 'safety', 'instruction', 'other');--> statement-breakpoint
CREATE TYPE "jengapact"."milestone_status" AS ENUM('pending', 'in_progress', 'verified', 'certified', 'paid', 'locked');--> statement-breakpoint
CREATE TYPE "jengapact"."notification_status" AS ENUM('queued', 'sent', 'delivered', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "jengapact"."org_kind" AS ENUM('client', 'contractor', 'consultancy', 'government', 'other');--> statement-breakpoint
CREATE TYPE "jengapact"."org_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "jengapact"."payment_method" AS ENUM('rtgs', 'pesalink', 'mpesa_b2b', 'cheque', 'other');--> statement-breakpoint
CREATE TYPE "jengapact"."project_role" AS ENUM('client', 'contractor', 'lead_consultant', 'quantity_surveyor', 'engineer', 'project_manager', 'subcontractor', 'legal_adviser', 'dispute_professional', 'operations', 'observer');--> statement-breakpoint
CREATE TYPE "jengapact"."project_stage" AS ENUM('initiated', 'negotiate', 'agree', 'sign', 'build', 'verify', 'approve', 'pay', 'closeout');--> statement-breakpoint
CREATE TYPE "jengapact"."proposal_status" AS ENUM('proposed', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "jengapact"."review_decision" AS ENUM('approved', 'rejected', 'changes_requested', 'noted');--> statement-breakpoint
CREATE TYPE "jengapact"."review_type" AS ENUM('technical', 'commercial');--> statement-breakpoint
CREATE TYPE "jengapact"."urgency" AS ENUM('routine', 'urgent', 'emergency');--> statement-breakpoint
CREATE TYPE "jengapact"."variation_status" AS ENUM('draft', 'submitted', 'under_review', 'changes_requested', 'rejected', 'ready_for_authorization', 'approved_pending_execution', 'executed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "jengapact"."version_status" AS ENUM('draft', 'in_review', 'executed', 'superseded');--> statement-breakpoint
CREATE TABLE "jengapact"."agreement_clauses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agreement_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"section_code" varchar(16) NOT NULL,
	"heading" text NOT NULL,
	"body" text NOT NULL,
	"status" "jengapact"."clause_status" DEFAULT 'proposed' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."agreement_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agreement_id" uuid NOT NULL,
	"label" varchar(24) NOT NULL,
	"status" "jengapact"."version_status" DEFAULT 'draft' NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"created_by" uuid NOT NULL,
	"executed_at" timestamp with time zone,
	"superseded_by_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"form" "jengapact"."agreement_form" NOT NULL,
	"status" "jengapact"."agreement_status" DEFAULT 'draft' NOT NULL,
	"current_version_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."authority_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"action" "jengapact"."authority_action" NOT NULL,
	"role" "jengapact"."project_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "jengapact"."document_category" DEFAULT 'other' NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"uploaded_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."evidence_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" uuid NOT NULL,
	"linked_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"reference" varchar(24) NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"issued_by_id" uuid NOT NULL,
	"urgency" "jengapact"."urgency" DEFAULT 'routine' NOT NULL,
	"status" "jengapact"."instruction_status" DEFAULT 'issued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "jengapact"."project_role" NOT NULL,
	"invited_by" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"status" "jengapact"."invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" text NOT NULL,
	"amount_minor" bigint DEFAULT 0 NOT NULL,
	"status" "jengapact"."milestone_status" DEFAULT 'pending' NOT NULL,
	"target_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."negotiation_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clause_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"previous_body" text NOT NULL,
	"proposed_body" text NOT NULL,
	"justification" text,
	"status" "jengapact"."proposal_status" DEFAULT 'proposed' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"type" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"status" "jengapact"."notification_status" DEFAULT 'queued' NOT NULL,
	"related_entity_type" varchar(40),
	"related_entity_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "jengapact"."org_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "jengapact"."org_kind" DEFAULT 'other' NOT NULL,
	"registration_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."payment_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"claim_id" uuid,
	"reference" varchar(24) NOT NULL,
	"certified_minor" bigint NOT NULL,
	"retention_minor" bigint DEFAULT 0 NOT NULL,
	"status" "jengapact"."certificate_status" DEFAULT 'draft' NOT NULL,
	"issued_by_id" uuid,
	"issued_at" timestamp with time zone,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."payment_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"reference" varchar(24) NOT NULL,
	"claimant_id" uuid NOT NULL,
	"claimed_minor" bigint NOT NULL,
	"period_end" date,
	"status" "jengapact"."claim_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"certificate_id" uuid,
	"amount_minor" bigint NOT NULL,
	"method" "jengapact"."payment_method" DEFAULT 'rtgs' NOT NULL,
	"external_reference" varchar(80),
	"paid_at" date NOT NULL,
	"recorded_by_id" uuid NOT NULL,
	"evidence_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."professional_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "jengapact"."credential_kind" NOT NULL,
	"registration_number" text NOT NULL,
	"issuing_body" text NOT NULL,
	"status" "jengapact"."credential_status" DEFAULT 'self_declared' NOT NULL,
	"verification_method" text,
	"verified_at" timestamp with time zone,
	"expires_at" date,
	"evidence_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."project_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_role" "jengapact"."project_role",
	"event_type" varchar(64) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" uuid,
	"summary" text NOT NULL,
	"previous_state" varchar(40),
	"resulting_state" varchar(40),
	"clause_ref" varchar(40),
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."project_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"reference" varchar(24) NOT NULL,
	"type" "jengapact"."issue_type" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reporter_id" uuid NOT NULL,
	"severity" "jengapact"."issue_severity" DEFAULT 'medium' NOT NULL,
	"status" "jengapact"."issue_status" DEFAULT 'open' NOT NULL,
	"responsible_user_id" uuid,
	"deadline" date,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jengapact"."project_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "jengapact"."project_role" NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(40) NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"county" text,
	"project_type" text,
	"currency" varchar(3) DEFAULT 'KES' NOT NULL,
	"stage" "jengapact"."project_stage" DEFAULT 'initiated' NOT NULL,
	"original_contract_minor" bigint,
	"client_org_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."retention_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"certificate_id" uuid,
	"amount_minor" bigint NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(24),
	"job_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"valuer_id" uuid NOT NULL,
	"assessed_minor" bigint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."variation_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variation_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"type" "jengapact"."review_type" NOT NULL,
	"decision" "jengapact"."review_decision" NOT NULL,
	"notes" text,
	"assessed_minor" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."variations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"agreement_id" uuid,
	"reference" varchar(24) NOT NULL,
	"title" text NOT NULL,
	"originator_id" uuid NOT NULL,
	"reason" text,
	"description" text NOT NULL,
	"scope_exclusions" text,
	"status" "jengapact"."variation_status" DEFAULT 'draft' NOT NULL,
	"claimed_minor" bigint DEFAULT 0 NOT NULL,
	"assessed_minor" bigint,
	"committed_minor" bigint,
	"time_impact_days" integer DEFAULT 0 NOT NULL,
	"tax_included" boolean DEFAULT false NOT NULL,
	"instruction_ref" varchar(40),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."auth_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."auth_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(320) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jengapact"."auth_verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jengapact"."agreement_clauses" ADD CONSTRAINT "agreement_clauses_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "jengapact"."agreements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."agreement_clauses" ADD CONSTRAINT "agreement_clauses_version_id_agreement_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "jengapact"."agreement_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."agreement_versions" ADD CONSTRAINT "agreement_versions_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "jengapact"."agreements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."agreement_versions" ADD CONSTRAINT "agreement_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."agreements" ADD CONSTRAINT "agreements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."agreements" ADD CONSTRAINT "agreements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."authority_rules" ADD CONSTRAINT "authority_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."evidence_links" ADD CONSTRAINT "evidence_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "jengapact"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."evidence_links" ADD CONSTRAINT "evidence_links_linked_by_id_users_id_fk" FOREIGN KEY ("linked_by_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."instructions" ADD CONSTRAINT "instructions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."instructions" ADD CONSTRAINT "instructions_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."invitations" ADD CONSTRAINT "invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_clause_id_agreement_clauses_id_fk" FOREIGN KEY ("clause_id") REFERENCES "jengapact"."agreement_clauses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "jengapact"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "jengapact"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "jengapact"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_certificates" ADD CONSTRAINT "payment_certificates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_certificates" ADD CONSTRAINT "payment_certificates_claim_id_payment_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "jengapact"."payment_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_certificates" ADD CONSTRAINT "payment_certificates_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_claims" ADD CONSTRAINT "payment_claims_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_claims" ADD CONSTRAINT "payment_claims_claimant_id_users_id_fk" FOREIGN KEY ("claimant_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_records" ADD CONSTRAINT "payment_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_records" ADD CONSTRAINT "payment_records_certificate_id_payment_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "jengapact"."payment_certificates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."payment_records" ADD CONSTRAINT "payment_records_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."professional_credentials" ADD CONSTRAINT "professional_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "jengapact"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."professional_credentials" ADD CONSTRAINT "professional_credentials_evidence_document_id_documents_id_fk" FOREIGN KEY ("evidence_document_id") REFERENCES "jengapact"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_events" ADD CONSTRAINT "project_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "jengapact"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_issues" ADD CONSTRAINT "project_issues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_issues" ADD CONSTRAINT "project_issues_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_issues" ADD CONSTRAINT "project_issues_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_memberships" ADD CONSTRAINT "project_memberships_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_memberships" ADD CONSTRAINT "project_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "jengapact"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."project_memberships" ADD CONSTRAINT "project_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "jengapact"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."projects" ADD CONSTRAINT "projects_client_org_id_organizations_id_fk" FOREIGN KEY ("client_org_id") REFERENCES "jengapact"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."retention_entries" ADD CONSTRAINT "retention_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."retention_entries" ADD CONSTRAINT "retention_entries_certificate_id_payment_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "jengapact"."payment_certificates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."valuations" ADD CONSTRAINT "valuations_claim_id_payment_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "jengapact"."payment_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."valuations" ADD CONSTRAINT "valuations_valuer_id_users_id_fk" FOREIGN KEY ("valuer_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."variation_reviews" ADD CONSTRAINT "variation_reviews_variation_id_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "jengapact"."variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."variation_reviews" ADD CONSTRAINT "variation_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."variations" ADD CONSTRAINT "variations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "jengapact"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."variations" ADD CONSTRAINT "variations_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "jengapact"."agreements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."variations" ADD CONSTRAINT "variations_originator_id_users_id_fk" FOREIGN KEY ("originator_id") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."variations" ADD CONSTRAINT "variations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "jengapact"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "jengapact"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jengapact"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "jengapact"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agreement_clauses_version_idx" ON "jengapact"."agreement_clauses" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agreement_versions_label_uniq" ON "jengapact"."agreement_versions" USING btree ("agreement_id","label");--> statement-breakpoint
CREATE INDEX "agreements_project_idx" ON "jengapact"."agreements" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "authority_rules_uniq" ON "jengapact"."authority_rules" USING btree ("project_id","action","role");--> statement-breakpoint
CREATE INDEX "documents_project_idx" ON "jengapact"."documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "evidence_links_entity_idx" ON "jengapact"."evidence_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instructions_reference_uniq" ON "jengapact"."instructions" USING btree ("project_id","reference");--> statement-breakpoint
CREATE INDEX "invitations_project_idx" ON "jengapact"."invitations" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_uniq" ON "jengapact"."invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "milestones_project_seq_uniq" ON "jengapact"."milestones" USING btree ("project_id","sequence");--> statement-breakpoint
CREATE INDEX "negotiation_proposals_clause_idx" ON "jengapact"."negotiation_proposals" USING btree ("clause_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "jengapact"."notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_uniq" ON "jengapact"."organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_idx" ON "jengapact"."organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_certificates_reference_uniq" ON "jengapact"."payment_certificates" USING btree ("project_id","reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_claims_reference_uniq" ON "jengapact"."payment_claims" USING btree ("project_id","reference");--> statement-breakpoint
CREATE INDEX "payment_records_project_idx" ON "jengapact"."payment_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "payment_records_certificate_idx" ON "jengapact"."payment_records" USING btree ("certificate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_records_external_ref_uniq" ON "jengapact"."payment_records" USING btree ("project_id","external_reference") WHERE "jengapact"."payment_records"."external_reference" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "professional_credentials_user_idx" ON "jengapact"."professional_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_events_project_idx" ON "jengapact"."project_events" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "project_events_entity_idx" ON "jengapact"."project_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_issues_reference_uniq" ON "jengapact"."project_issues" USING btree ("project_id","reference");--> statement-breakpoint
CREATE INDEX "project_issues_project_idx" ON "jengapact"."project_issues" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_memberships_uniq" ON "jengapact"."project_memberships" USING btree ("project_id","user_id","role");--> statement-breakpoint
CREATE INDEX "project_memberships_project_idx" ON "jengapact"."project_memberships" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_memberships_user_idx" ON "jengapact"."project_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_reference_uniq" ON "jengapact"."projects" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "retention_entries_project_idx" ON "jengapact"."retention_entries" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uniq" ON "jengapact"."users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "valuations_claim_idx" ON "jengapact"."valuations" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "variation_reviews_variation_idx" ON "jengapact"."variation_reviews" USING btree ("variation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variations_reference_uniq" ON "jengapact"."variations" USING btree ("project_id","reference");--> statement-breakpoint
CREATE INDEX "variations_project_idx" ON "jengapact"."variations" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_account_uniq" ON "jengapact"."auth_accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx" ON "jengapact"."auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_uniq" ON "jengapact"."auth_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "jengapact"."auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_idx" ON "jengapact"."auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_users_email_uniq" ON "jengapact"."auth_users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "jengapact"."auth_verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "auth_verifications_expires_idx" ON "jengapact"."auth_verifications" USING btree ("expires_at");