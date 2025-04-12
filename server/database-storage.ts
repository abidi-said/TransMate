import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  users, projects, projectMembers, languages, translationFiles, translationKeys, 
  translations, translationMemory, projectSettings, apiKeys, activityLogs, payments,
  type User, type InsertUser, type Project, type InsertProject, type ProjectMember, 
  type InsertProjectMember, type Language, type InsertLanguage, type TranslationFile, 
  type InsertTranslationFile, type TranslationKey, type InsertTranslationKey, type Translation, 
  type InsertTranslation, type TranslationMemoryEntry, type InsertTranslationMemoryEntry, 
  type ProjectSettings, type InsertProjectSettings, type ApiKey, type InsertApiKey, 
  type ActivityLog, type InsertActivityLog, type Payment, type InsertPayment 
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";

// Create PostgreSQL session store for Express sessions
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Initialize PostgreSQL-based session store
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "inactive",
      lastLoginAt: null
    }).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(id: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, {
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      subscriptionStatus: "active"
    });
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Get projects where user is a member
    const memberProjectsResult = await db.select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));
    
    const memberProjectIds = memberProjectsResult.map(row => row.projectId);
    
    // Get projects created by the user
    const createdProjectsResult = await db.select()
      .from(projects)
      .where(eq(projects.createdBy, userId));
    
    // If the user is not a member of any projects, just return created projects
    if (memberProjectIds.length === 0) {
      return createdProjectsResult;
    }
    
    // Otherwise, get all projects where user is a member and combine with created projects
    const memberProjects = await db.select()
      .from(projects)
      .where(inArray(projects.id, memberProjectIds));
    
    // Combine and deduplicate
    const allProjects = [...memberProjects, ...createdProjectsResult];
    const uniqueProjects = Array.from(new Map(allProjects.map(p => [p.id, p])).values());
    
    return uniqueProjects;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    const newProject = result[0];
    
    // Automatically add creator as admin
    await this.addProjectMember({
      projectId: newProject.id,
      userId: newProject.createdBy,
      role: "admin"
    });
    
    return newProject;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Project member operations
  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const members = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    
    // Get users for each member
    const result: (ProjectMember & { user: User })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    
    return result;
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const result = await db.insert(projectMembers).values(member).returning();
    return result[0];
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const result = await db.delete(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
    return result.count > 0;
  }

  // Language operations
  async getLanguages(projectId: number): Promise<Language[]> {
    return db.select().from(languages).where(eq(languages.projectId, projectId));
  }

  async getLanguage(id: number): Promise<Language | undefined> {
    const result = await db.select().from(languages).where(eq(languages.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    const result = await db.insert(languages).values({
      ...language,
      isDefault: language.isDefault || false
    }).returning();
    return result[0];
  }

  // Translation file operations
  async getTranslationFiles(projectId: number): Promise<TranslationFile[]> {
    return db.select().from(translationFiles).where(eq(translationFiles.projectId, projectId));
  }

  async getTranslationFile(id: number): Promise<TranslationFile | undefined> {
    const result = await db.select().from(translationFiles).where(eq(translationFiles.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTranslationFile(file: InsertTranslationFile): Promise<TranslationFile> {
    const result = await db.insert(translationFiles).values({
      ...file,
      lastSyncedAt: null,
      updatedAt: null
    }).returning();
    return result[0];
  }

  async updateTranslationFile(id: number, data: Partial<TranslationFile>): Promise<TranslationFile | undefined> {
    const result = await db.update(translationFiles)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(translationFiles.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTranslationFile(id: number): Promise<boolean> {
    const result = await db.delete(translationFiles).where(eq(translationFiles.id, id));
    return result !== undefined;
  }

  // Translation key operations
  async getTranslationKeys(projectId: number): Promise<TranslationKey[]> {
    return db.select().from(translationKeys).where(eq(translationKeys.projectId, projectId));
  }

  async getTranslationKey(id: number): Promise<TranslationKey | undefined> {
    const result = await db.select().from(translationKeys).where(eq(translationKeys.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTranslationKeyByKey(projectId: number, key: string): Promise<TranslationKey | undefined> {
    const result = await db.select().from(translationKeys).where(
      and(
        eq(translationKeys.projectId, projectId),
        eq(translationKeys.key, key)
      )
    );
    return result.length > 0 ? result[0] : undefined;
  }

  async createTranslationKey(key: InsertTranslationKey): Promise<TranslationKey> {
    const result = await db.insert(translationKeys).values({
      ...key,
      description: key.description || null,
      tags: key.tags || null,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateTranslationKey(id: number, data: Partial<TranslationKey>): Promise<TranslationKey | undefined> {
    const result = await db.update(translationKeys)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(translationKeys.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTranslationKey(id: number): Promise<boolean> {
    const result = await db.delete(translationKeys).where(eq(translationKeys.id, id));
    return result.count > 0;
  }

  // Translation operations
  async getTranslations(keyId: number): Promise<Translation[]> {
    return db.select().from(translations).where(eq(translations.keyId, keyId));
  }

  async getTranslation(id: number): Promise<Translation | undefined> {
    const result = await db.select().from(translations).where(eq(translations.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTranslationByLanguage(keyId: number, languageId: number): Promise<Translation | undefined> {
    const result = await db.select().from(translations).where(
      and(
        eq(translations.keyId, keyId),
        eq(translations.languageId, languageId)
      )
    );
    return result.length > 0 ? result[0] : undefined;
  }

  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const result = await db.insert(translations).values({
      ...translation,
      isApproved: translation.isApproved || false,
      isAiGenerated: translation.isAiGenerated || false,
      createdBy: translation.createdBy || null,
      approvedBy: null,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateTranslation(id: number, data: Partial<Translation>): Promise<Translation | undefined> {
    const result = await db.update(translations)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(translations.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Translation memory operations
  async addTranslationMemoryEntry(entry: InsertTranslationMemoryEntry): Promise<TranslationMemoryEntry> {
    const result = await db.insert(translationMemory).values(entry).returning();
    return result[0];
  }

  async findSimilarTranslations(projectId: number, sourceLanguage: string, targetLanguage: string, sourceText: string): Promise<TranslationMemoryEntry[]> {
    // Basic implementation to find similar translations
    // In a real implementation, you'd want to use a more sophisticated fuzzy matching algorithm
    // or a third-party service like Elasticsearch for better results
    return db.select().from(translationMemory).where(
      and(
        eq(translationMemory.projectId, projectId),
        eq(translationMemory.sourceLanguage, sourceLanguage),
        eq(translationMemory.targetLanguage, targetLanguage)
      )
    );
    // Note: Real-world implementation would need to filter by similarity to sourceText
  }

  // Project settings operations
  async getProjectSettings(projectId: number): Promise<ProjectSettings | undefined> {
    const result = await db.select().from(projectSettings).where(eq(projectSettings.projectId, projectId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createOrUpdateProjectSettings(settings: InsertProjectSettings | (Partial<ProjectSettings> & { projectId: number })): Promise<ProjectSettings> {
    const existing = await this.getProjectSettings(settings.projectId);
    
    if (existing) {
      const result = await db.update(projectSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(projectSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(projectSettings).values({
        ...settings,
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }

  // API key operations
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const result = await db.insert(apiKeys).values({
      ...apiKey,
      lastUsedAt: null
    }).returning();
    return result[0];
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return result.count > 0;
  }

  // Activity log operations
  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values({
      ...log,
      projectId: log.projectId || null,
      userId: log.userId || null,
      resourceId: log.resourceId || null,
      details: log.details || null
    }).returning();
    return result[0];
  }

  async getActivityLogs(projectId: number, limit: number = 20): Promise<(ActivityLog & { user?: User })[]> {
    const logs = await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.projectId, projectId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
    
    // Get user for each log
    const result: (ActivityLog & { user?: User })[] = [];
    for (const log of logs) {
      if (log.userId) {
        const user = await this.getUser(log.userId);
        result.push(user ? { ...log, user } : log);
      } else {
        result.push(log);
      }
    }
    
    return result;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values({
      ...payment,
      currency: payment.currency || "usd",
      providerPaymentId: payment.providerPaymentId || null,
      details: payment.details || {}
    }).returning();
    return result[0];
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return db.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByProviderPaymentId(provider: string, providerPaymentId: string): Promise<Payment[]> {
    return db.select()
      .from(payments)
      .where(
        and(
          eq(payments.provider, provider),
          eq(payments.providerPaymentId, providerPaymentId)
        )
      );
  }

  async updatePaymentStatus(id: number, status: string, providerPaymentId?: string): Promise<Payment | undefined> {
    const updateData: Partial<Payment> = { status };
    if (providerPaymentId) {
      updateData.providerPaymentId = providerPaymentId;
    }
    
    const result = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
}