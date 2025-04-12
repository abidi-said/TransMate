import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("translator").notNull(), // admin, translator, reviewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
});

// Projects model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultLanguage: text("default_language").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  defaultLanguage: true,
  createdBy: true,
});

// Project members model
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // admin, translator, reviewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).pick({
  projectId: true,
  userId: true,
  role: true,
});

// Languages model
export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  code: text("code").notNull(), // e.g., en, fr, de
  name: text("name").notNull(), // e.g., English, French, German
  isDefault: boolean("is_default").default(false).notNull(),
});

export const insertLanguageSchema = createInsertSchema(languages).pick({
  projectId: true,
  code: true,
  name: true,
  isDefault: true,
});

// Translation files model
export const translationFiles = pgTable("translation_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  languageId: integer("language_id").references(() => languages.id),
  name: text("name").notNull(), // e.g., en.json, translations.csv
  format: text("format").notNull(), // json, csv, etc.
  path: text("path").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertTranslationFileSchema = createInsertSchema(translationFiles).pick({
  projectId: true,
  languageId: true,
  name: true,
  format: true,
  path: true,
});

// Translation keys model
export const translationKeys = pgTable("translation_keys", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  key: text("key").notNull(), // e.g., common.buttons.submit
  description: text("description"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertTranslationKeySchema = createInsertSchema(translationKeys).pick({
  projectId: true,
  key: true,
  description: true,
  tags: true,
});

// Translations model
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  keyId: integer("key_id").notNull().references(() => translationKeys.id),
  languageId: integer("language_id").notNull().references(() => languages.id),
  value: text("value").notNull(),
  isApproved: boolean("is_approved").default(false),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  keyId: true,
  languageId: true,
  value: true,
  isApproved: true,
  isAiGenerated: true,
  createdBy: true,
});

// Translation memory model
export const translationMemory = pgTable("translation_memory", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  sourceText: text("source_text").notNull(),
  targetText: text("target_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationMemorySchema = createInsertSchema(translationMemory).pick({
  projectId: true,
  sourceLanguage: true,
  targetLanguage: true,
  sourceText: true,
  targetText: true,
});

// Project settings model
export const projectSettings = pgTable("project_settings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id).unique(),
  translationFilePath: text("translation_file_path").notNull(),
  sourcePatterns: text("source_patterns").array(),
  ignorePatterns: text("ignore_patterns").array(),
  gitRepository: text("git_repository"),
  gitBranch: text("git_branch"),
  aiTranslationEnabled: boolean("ai_translation_enabled").default(true),
  aiProvider: text("ai_provider").default("openai"),
  aiApiKey: text("ai_api_key"),
  aiModel: text("ai_model").default("gpt-4o"),
  aiInstructions: text("ai_instructions"),
  updatedAt: timestamp("updated_at"),
});

export const insertProjectSettingsSchema = createInsertSchema(projectSettings).pick({
  projectId: true,
  translationFilePath: true,
  sourcePatterns: true,
  ignorePatterns: true,
  gitRepository: true,
  gitBranch: true,
  aiTranslationEnabled: true,
  aiProvider: true,
  aiApiKey: true,
  aiModel: true,
  aiInstructions: true,
});

// API Keys model
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  userId: true,
  name: true,
  key: true,
});

// Activity logs model
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // e.g., created, updated, deleted
  resourceType: text("resource_type").notNull(), // e.g., translation, key, file
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  projectId: true,
  userId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  details: true,
});

// Payment model
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("usd").notNull(),
  status: text("status").notNull(), // succeeded, pending, failed
  provider: text("provider").notNull(), // stripe, d17, qpay, etc.
  providerPaymentId: text("provider_payment_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  amount: true,
  currency: true,
  status: true,
  provider: true,
  providerPaymentId: true,
  details: true,
});

// Create type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;

export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;

export type TranslationFile = typeof translationFiles.$inferSelect;
export type InsertTranslationFile = z.infer<typeof insertTranslationFileSchema>;

export type TranslationKey = typeof translationKeys.$inferSelect;
export type InsertTranslationKey = z.infer<typeof insertTranslationKeySchema>;

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;

export type TranslationMemoryEntry = typeof translationMemory.$inferSelect;
export type InsertTranslationMemoryEntry = z.infer<typeof insertTranslationMemorySchema>;

export type ProjectSettings = typeof projectSettings.$inferSelect;
export type InsertProjectSettings = z.infer<typeof insertProjectSettingsSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// CLI configuration type
export interface TransmateConfig {
  defaultLanguage: string;
  languages: string[];
  translationFilePath: string;
  sourcePatterns: string[];
  ignorePatterns: string[];
  aiTranslation?: {
    enabled: boolean;
    provider: string;
    apiKey?: string;
    model: string;
  };
  externalSync?: {
    source: string;
    url: string;
  };
}

// Schema for validating CLI config
export const configSchema = z.object({
  defaultLanguage: z.string().min(2),
  languages: z.array(z.string().min(2)).min(1),
  translationFilePath: z.string().includes("{language}"),
  sourcePatterns: z.array(z.string()).min(1),
  ignorePatterns: z.array(z.string()).optional(),
  aiTranslation: z.object({
    enabled: z.boolean(),
    provider: z.string(),
    apiKey: z.string().optional(),
    model: z.string(),
  }).optional(),
  externalSync: z.object({
    source: z.string(),
    url: z.string(),
  }).optional(),
});
