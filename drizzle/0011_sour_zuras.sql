CREATE TYPE "public"."study_card_state" AS ENUM('new', 'learning', 'review');--> statement-breakpoint
CREATE TYPE "public"."study_subject" AS ENUM('politics', 'english', 'math', 'major');--> statement-breakpoint
CREATE TABLE "quick_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"chosen" integer NOT NULL,
	"chosen_mask" integer,
	"correct" boolean NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"notes" text,
	"ease" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" "study_card_state" DEFAULT 'new' NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" "study_subject" DEFAULT 'english' NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_mistakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" "study_subject" NOT NULL,
	"topic" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"question_image" text,
	"question_text" text,
	"my_answer" text,
	"correct_answer" text,
	"analysis" text,
	"box" integer DEFAULT 1 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp with time zone DEFAULT now() NOT NULL,
	"mastered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" "study_subject" DEFAULT 'politics' NOT NULL,
	"stem" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer" integer NOT NULL,
	"answer_mask" integer,
	"explanation" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"prev_interval_days" integer DEFAULT 0 NOT NULL,
	"next_interval_days" integer DEFAULT 0 NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" "study_subject" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"exam_date" timestamp with time zone,
	"daily_new_cards" integer DEFAULT 20 NOT NULL,
	"daily_review_cap" integer DEFAULT 200 NOT NULL,
	"daily_minute_goals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_attempts" ADD CONSTRAINT "study_attempts_question_id_study_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."study_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_cards" ADD CONSTRAINT "study_cards_deck_id_study_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."study_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_reviews" ADD CONSTRAINT "study_reviews_card_id_study_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."study_cards"("id") ON DELETE cascade ON UPDATE no action;