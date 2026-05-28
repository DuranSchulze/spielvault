CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"companyId" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Company_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "Department" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Department_companyId_slug_key" UNIQUE("companyId","slug")
);
--> statement-breakpoint
CREATE TABLE "UserDepartment" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"departmentId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserDepartment_userId_departmentId_key" UNIQUE("userId","departmentId")
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Category_companyId_slug_key" UNIQUE("companyId","slug")
);
--> statement-breakpoint
CREATE TABLE "spiel_approval" (
	"id" text PRIMARY KEY NOT NULL,
	"spielId" text NOT NULL,
	"reviewerId" text NOT NULL,
	"action" text NOT NULL,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spiel_version" (
	"id" text PRIMARY KEY NOT NULL,
	"spielId" text NOT NULL,
	"savedByUserId" text NOT NULL,
	"title" text NOT NULL,
	"contentHtml" text,
	"contentJson" text,
	"contentPlain" text,
	"categoryId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Spiel" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"departmentId" text NOT NULL,
	"categoryId" text,
	"createdByUserId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"contentJson" text,
	"contentHtml" text,
	"contentPlain" text,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SpielVariable" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SpielVariable_companyId_key_key" UNIQUE("companyId","key")
);
--> statement-breakpoint
CREATE TABLE "user_spiel_favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"spielId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_spiel_favorite_userId_spielId_key" UNIQUE("userId","spielId")
);
--> statement-breakpoint
CREATE TABLE "api_token" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"name" text DEFAULT 'Browser Extension' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp,
	CONSTRAINT "api_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"action" text NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserDepartment" ADD CONSTRAINT "UserDepartment_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserDepartment" ADD CONSTRAINT "UserDepartment_departmentId_Department_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spiel_approval" ADD CONSTRAINT "spiel_approval_spielId_Spiel_id_fk" FOREIGN KEY ("spielId") REFERENCES "public"."Spiel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spiel_approval" ADD CONSTRAINT "spiel_approval_reviewerId_user_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spiel_version" ADD CONSTRAINT "spiel_version_spielId_Spiel_id_fk" FOREIGN KEY ("spielId") REFERENCES "public"."Spiel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spiel_version" ADD CONSTRAINT "spiel_version_savedByUserId_user_id_fk" FOREIGN KEY ("savedByUserId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Spiel" ADD CONSTRAINT "Spiel_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Spiel" ADD CONSTRAINT "Spiel_departmentId_Department_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Spiel" ADD CONSTRAINT "Spiel_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Spiel" ADD CONSTRAINT "Spiel_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SpielVariable" ADD CONSTRAINT "SpielVariable_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spiel_favorite" ADD CONSTRAINT "user_spiel_favorite_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spiel_favorite" ADD CONSTRAINT "user_spiel_favorite_spielId_Spiel_id_fk" FOREIGN KEY ("spielId") REFERENCES "public"."Spiel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;