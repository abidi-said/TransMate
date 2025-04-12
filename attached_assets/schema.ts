import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Transmate specific schemas
export const configSchema = z.object({
  defaultLanguage: z.string(),
  languages: z.array(z.string()),
  translationFilePath: z.string(),
  sourcePatterns: z.array(z.string()),
  ignorePatterns: z.array(z.string()).optional(),
  keyPattern: z.string().optional(),
  aiTranslation: z.object({
    enabled: z.boolean(),
    provider: z.string(),
    apiKey: z.string().optional(),
    model: z.string().optional(),
    contextLength: z.number().optional(),
    temperature: z.number().min(0).max(1).optional(),
    includeContext: z.boolean().optional(),
  }).optional(),
  externalSync: z.object({
    source: z.string().optional(),
    format: z.enum(["csv", "xls", "xlsx"]).optional(),
    mergeStrategy: z.enum(["override", "keep-existing"]).optional(),
    columnMapping: z.record(z.string()).optional(),
    url: z.string().optional(),
  }).optional(),
  options: z.object({
    interactive: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    verbose: z.boolean().optional(),
    maxConcurrent: z.number().optional(),
  }).optional(),
  hooks: z.object({
    beforeTranslation: z.string().optional(),
    afterTranslation: z.string().optional(),
    beforeSync: z.string().optional(),
    afterSync: z.string().optional(),
  }).optional(),
});

export type TransmateConfig = z.infer<typeof configSchema>;

export const commandSchema = z.object({
  name: z.string(),
  description: z.string(),
  options: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
  })),
});

export type Command = z.infer<typeof commandSchema>;

export const featureSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(),
});

export type Feature = z.infer<typeof featureSchema>;

// Translation quality rating
export const qualityRatingSchema = z.enum(["good", "needs_review", "machine_generated", "unverified"]);

export type QualityRating = z.infer<typeof qualityRatingSchema>;

// Translation metadata
export const translationMetadataSchema = z.object({
  lastUpdated: z.string().optional(),
  lastUpdatedBy: z.string().optional(),
  quality: qualityRatingSchema.optional(),
  isAutoDetected: z.boolean().optional(),
  usageCount: z.number().optional(),
  version: z.number().optional(),
  history: z.array(
    z.object({
      value: z.string(),
      updatedAt: z.string(),
      updatedBy: z.string().optional(),
    })
  ).optional(),
  suggestions: z.array(
    z.object({
      value: z.string(),
      confidence: z.number().optional(),
      source: z.string().optional(),
    })
  ).optional(),
});

export type TranslationMetadata = z.infer<typeof translationMetadataSchema>;

// Translation entry with metadata
export const translationEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  metadata: translationMetadataSchema.optional(),
});

export type TranslationEntry = z.infer<typeof translationEntrySchema>;
export const planSchema = z.object({
  name: z.enum(["free", "pro", "team", "enterprise"]),
  price: z.number(),
  features: z.array(z.string()),
  limits: z.object({
    languages: z.number().or(z.literal("unlimited")),
    aiTranslations: z.number().or(z.literal("unlimited")),
    teamMembers: z.number().or(z.literal("unlimited")),
    historyRetention: z.number().or(z.literal("unlimited")),
  })
});

export type Plan = z.infer<typeof planSchema>;
export const RoleType = z.enum([
  "project_owner",
  "reviewer", 
  "moderator",
  "developer",
  "translator",
  "viewer"
]);

export type Role = z.infer<typeof RoleType>;

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
  passwordHash: z.string(),
  role: RoleType,
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  ownerId: z.number(),
  repoUrl: z.string().optional(),
  repoType: z.enum(["github", "gitlab", "bitbucket"]).optional(),
  repoToken: z.string().optional(),
  isPaid: z.boolean().default(false),
  createdAt: z.date(),
});

export type Project = z.infer<typeof projectSchema>;

export const projectMemberSchema = z.object({
  userId: z.number(),
  projectId: z.number(),
  role: RoleType,
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const translationMemorySchema = z.object({
  sourceText: z.string(),
  translations: z.array(z.object({
    targetLanguage: z.string(),
    translatedText: z.string(),
    quality: z.number(),
    usageCount: z.number(),
    lastUsed: z.date()
  }))
});

export const qualityCheckSchema = z.object({
  type: z.enum(['spelling', 'grammar', 'consistency', 'length', 'placeholders']),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  suggestions: z.array(z.string())
});

export const translationDeadlineSchema = z.object({
  projectId: z.number(),
  languageId: z.string(),
  deadline: z.date(),
  assignedTo: z.number(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue'])
});

export const translationMetricsSchema = z.object({
  userId: z.number(),
  period: z.string(),
  translationsCount: z.number(),
  qualityScore: z.number(),
  reviewsCount: z.number(),
  averageResponseTime: z.number(),
  completionRate: z.number()
});

export const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'translation.created',
    'translation.updated',
    'translation.deleted',
    'quality.check.failed',
    'deadline.approaching',
    'review.completed'
  ])),
  secret: z.string(),
  active: z.boolean()
});

export type TranslationMemory = z.infer<typeof translationMemorySchema>;
export type QualityCheck = z.infer<typeof qualityCheckSchema>;
export type TranslationDeadline = z.infer<typeof translationDeadlineSchema>;
export type TranslationMetrics = z.infer<typeof translationMetricsSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
