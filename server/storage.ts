import { users, projects, projectMembers, languages, translationFiles, translationKeys, translations, translationMemory, projectSettings, apiKeys, activityLogs, payments } from "@shared/schema";
import type { User, InsertUser, Project, InsertProject, ProjectMember, InsertProjectMember, Language, InsertLanguage, TranslationFile, InsertTranslationFile, TranslationKey, InsertTranslationKey, Translation, InsertTranslation, TranslationMemoryEntry, InsertTranslationMemoryEntry, ProjectSettings, InsertProjectSettings, ApiKey, InsertApiKey, ActivityLog, InsertActivityLog, Payment, InsertPayment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  
  // Project member operations
  getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: number, userId: number): Promise<boolean>;
  
  // Language operations
  getLanguages(projectId: number): Promise<Language[]>;
  getLanguage(id: number): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  
  // Translation file operations
  getTranslationFiles(projectId: number): Promise<TranslationFile[]>;
  getTranslationFile(id: number): Promise<TranslationFile | undefined>;
  createTranslationFile(file: InsertTranslationFile): Promise<TranslationFile>;
  updateTranslationFile(id: number, data: Partial<TranslationFile>): Promise<TranslationFile | undefined>;
  deleteTranslationFile(id: number): Promise<boolean>;
  
  // Translation key operations
  getTranslationKeys(projectId: number): Promise<TranslationKey[]>;
  getTranslationKey(id: number): Promise<TranslationKey | undefined>;
  getTranslationKeyByKey(projectId: number, key: string): Promise<TranslationKey | undefined>;
  createTranslationKey(key: InsertTranslationKey): Promise<TranslationKey>;
  updateTranslationKey(id: number, data: Partial<TranslationKey>): Promise<TranslationKey | undefined>;
  deleteTranslationKey(id: number): Promise<boolean>;
  
  // Translation operations
  getTranslations(keyId: number): Promise<Translation[]>;
  getTranslation(id: number): Promise<Translation | undefined>;
  getTranslationByLanguage(keyId: number, languageId: number): Promise<Translation | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslation(id: number, data: Partial<Translation>): Promise<Translation | undefined>;
  
  // Translation memory operations
  addTranslationMemoryEntry(entry: InsertTranslationMemoryEntry): Promise<TranslationMemoryEntry>;
  findSimilarTranslations(projectId: number, sourceLanguage: string, targetLanguage: string, sourceText: string): Promise<TranslationMemoryEntry[]>;
  
  // Project settings operations
  getProjectSettings(projectId: number): Promise<ProjectSettings | undefined>;
  createOrUpdateProjectSettings(settings: InsertProjectSettings | Partial<ProjectSettings> & { projectId: number }): Promise<ProjectSettings>;
  
  // API key operations
  getApiKeys(userId: number): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<boolean>;
  
  // Activity log operations
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(projectId: number, limit?: number): Promise<(ActivityLog & { user?: User })[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByProviderPaymentId(provider: string, providerPaymentId: string): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, providerPaymentId?: string): Promise<Payment | undefined>;
  
  // Session store
  sessionStore: any; // Using any for session store type
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private projectMembers: Map<number, ProjectMember>;
  private languages: Map<number, Language>;
  private translationFiles: Map<number, TranslationFile>;
  private translationKeys: Map<number, TranslationKey>;
  private translations: Map<number, Translation>;
  private translationMemory: Map<number, TranslationMemoryEntry>;
  private projectSettings: Map<number, ProjectSettings>;
  private apiKeys: Map<number, ApiKey>;
  private activityLogs: Map<number, ActivityLog>;
  private payments: Map<number, Payment>;
  
  currentId: { [key: string]: number } = {};
  sessionStore: any; // Using any for session store
  
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.projectMembers = new Map();
    this.languages = new Map();
    this.translationFiles = new Map();
    this.translationKeys = new Map();
    this.translations = new Map();
    this.translationMemory = new Map();
    this.projectSettings = new Map();
    this.apiKeys = new Map();
    this.activityLogs = new Map();
    this.payments = new Map();
    
    // Initialize currentId for each entity
    this.currentId = {
      users: 1,
      projects: 1,
      projectMembers: 1,
      languages: 1,
      translationFiles: 1,
      translationKeys: 1,
      translations: 1,
      translationMemory: 1,
      projectSettings: 1,
      apiKeys: 1,
      activityLogs: 1,
      payments: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeCustomerId === customerId
    );
  }
  
  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeSubscriptionId === subscriptionId
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "inactive",
      lastLoginAt: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }
  
  async updateUserStripeInfo(id: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, { 
      stripeCustomerId: data.stripeCustomerId, 
      stripeSubscriptionId: data.stripeSubscriptionId,
      subscriptionStatus: 'active'
    });
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Get projects where user is a member or creator
    const memberProjects = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
    
    // Get projects created by user
    const ownedProjects = Array.from(this.projects.values())
      .filter(project => project.createdBy === userId);
    
    // Get all unique projects
    const projectIds = new Set([
      ...memberProjects,
      ...ownedProjects.map(p => p.id)
    ]);
    
    return Array.from(projectIds).map(id => this.projects.get(id)).filter(Boolean) as Project[];
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentId.projects++;
    const now = new Date();
    const newProject: Project = { ...project, id, createdAt: now };
    this.projects.set(id, newProject);
    
    // Automatically add creator as admin
    await this.addProjectMember({
      projectId: id,
      userId: project.createdBy,
      role: "admin"
    });
    
    return newProject;
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  // Project member operations
  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const members = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
    
    return members.map(member => {
      const user = this.users.get(member.userId);
      return user ? { ...member, user } : undefined;
    }).filter(Boolean) as (ProjectMember & { user: User })[];
  }
  
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const id = this.currentId.projectMembers++;
    const now = new Date();
    const newMember: ProjectMember = { ...member, id, createdAt: now };
    this.projectMembers.set(id, newMember);
    return newMember;
  }
  
  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.projectMembers.values())
      .find(m => m.projectId === projectId && m.userId === userId);
    
    if (!member) return false;
    
    this.projectMembers.delete(member.id);
    return true;
  }
  
  // Language operations
  async getLanguages(projectId: number): Promise<Language[]> {
    return Array.from(this.languages.values())
      .filter(lang => lang.projectId === projectId);
  }
  
  async getLanguage(id: number): Promise<Language | undefined> {
    return this.languages.get(id);
  }
  
  async createLanguage(language: InsertLanguage): Promise<Language> {
    const id = this.currentId.languages++;
    const newLanguage: Language = { ...language, id };
    this.languages.set(id, newLanguage);
    return newLanguage;
  }
  
  // Translation file operations
  async getTranslationFiles(projectId: number): Promise<TranslationFile[]> {
    return Array.from(this.translationFiles.values())
      .filter(file => file.projectId === projectId);
  }
  
  async getTranslationFile(id: number): Promise<TranslationFile | undefined> {
    return this.translationFiles.get(id);
  }
  
  async createTranslationFile(file: InsertTranslationFile): Promise<TranslationFile> {
    const id = this.currentId.translationFiles++;
    const now = new Date();
    const newFile: TranslationFile = { ...file, id, createdAt: now };
    this.translationFiles.set(id, newFile);
    return newFile;
  }
  
  async updateTranslationFile(id: number, data: Partial<TranslationFile>): Promise<TranslationFile | undefined> {
    const file = await this.getTranslationFile(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...data, updatedAt: new Date() };
    this.translationFiles.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteTranslationFile(id: number): Promise<boolean> {
    return this.translationFiles.delete(id);
  }
  
  // Translation key operations
  async getTranslationKeys(projectId: number): Promise<TranslationKey[]> {
    return Array.from(this.translationKeys.values())
      .filter(key => key.projectId === projectId);
  }
  
  async getTranslationKey(id: number): Promise<TranslationKey | undefined> {
    return this.translationKeys.get(id);
  }
  
  async getTranslationKeyByKey(projectId: number, key: string): Promise<TranslationKey | undefined> {
    return Array.from(this.translationKeys.values())
      .find(k => k.projectId === projectId && k.key === key);
  }
  
  async createTranslationKey(key: InsertTranslationKey): Promise<TranslationKey> {
    const id = this.currentId.translationKeys++;
    const now = new Date();
    const newKey: TranslationKey = { ...key, id, createdAt: now, updatedAt: now };
    this.translationKeys.set(id, newKey);
    return newKey;
  }
  
  async updateTranslationKey(id: number, data: Partial<TranslationKey>): Promise<TranslationKey | undefined> {
    const key = await this.getTranslationKey(id);
    if (!key) return undefined;
    
    const updatedKey = { ...key, ...data, updatedAt: new Date() };
    this.translationKeys.set(id, updatedKey);
    return updatedKey;
  }
  
  async deleteTranslationKey(id: number): Promise<boolean> {
    return this.translationKeys.delete(id);
  }
  
  // Translation operations
  async getTranslations(keyId: number): Promise<Translation[]> {
    return Array.from(this.translations.values())
      .filter(translation => translation.keyId === keyId);
  }
  
  async getTranslation(id: number): Promise<Translation | undefined> {
    return this.translations.get(id);
  }
  
  async getTranslationByLanguage(keyId: number, languageId: number): Promise<Translation | undefined> {
    return Array.from(this.translations.values())
      .find(t => t.keyId === keyId && t.languageId === languageId);
  }
  
  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const id = this.currentId.translations++;
    const now = new Date();
    const newTranslation: Translation = { ...translation, id, createdAt: now, updatedAt: now };
    this.translations.set(id, newTranslation);
    return newTranslation;
  }
  
  async updateTranslation(id: number, data: Partial<Translation>): Promise<Translation | undefined> {
    const translation = await this.getTranslation(id);
    if (!translation) return undefined;
    
    const updatedTranslation = { ...translation, ...data, updatedAt: new Date() };
    this.translations.set(id, updatedTranslation);
    return updatedTranslation;
  }
  
  // Translation memory operations
  async addTranslationMemoryEntry(entry: InsertTranslationMemoryEntry): Promise<TranslationMemoryEntry> {
    const id = this.currentId.translationMemory++;
    const now = new Date();
    const newEntry: TranslationMemoryEntry = { ...entry, id, createdAt: now };
    this.translationMemory.set(id, newEntry);
    return newEntry;
  }
  
  async findSimilarTranslations(projectId: number, sourceLanguage: string, targetLanguage: string, sourceText: string): Promise<TranslationMemoryEntry[]> {
    // Simple implementation: exact match or source text contains
    return Array.from(this.translationMemory.values())
      .filter(entry => 
        entry.projectId === projectId && 
        entry.sourceLanguage === sourceLanguage &&
        entry.targetLanguage === targetLanguage &&
        (entry.sourceText === sourceText || entry.sourceText.includes(sourceText) || sourceText.includes(entry.sourceText))
      );
  }
  
  // Project settings operations
  async getProjectSettings(projectId: number): Promise<ProjectSettings | undefined> {
    return Array.from(this.projectSettings.values())
      .find(settings => settings.projectId === projectId);
  }
  
  async createOrUpdateProjectSettings(settings: InsertProjectSettings | (Partial<ProjectSettings> & { projectId: number })): Promise<ProjectSettings> {
    const existing = await this.getProjectSettings(settings.projectId);
    
    if (existing) {
      const updated = { ...existing, ...settings, updatedAt: new Date() };
      this.projectSettings.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentId.projectSettings++;
      const newSettings = { ...settings, id, updatedAt: new Date() } as ProjectSettings;
      this.projectSettings.set(id, newSettings);
      return newSettings;
    }
  }
  
  // API key operations
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.userId === userId);
  }
  
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const id = this.currentId.apiKeys++;
    const now = new Date();
    const newApiKey: ApiKey = { ...apiKey, id, createdAt: now };
    this.apiKeys.set(id, newApiKey);
    return newApiKey;
  }
  
  async deleteApiKey(id: number): Promise<boolean> {
    return this.apiKeys.delete(id);
  }
  
  // Activity log operations
  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId.activityLogs++;
    const now = new Date();
    const newLog: ActivityLog = { ...log, id, createdAt: now };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
  
  async getActivityLogs(projectId: number, limit: number = 20): Promise<(ActivityLog & { user?: User })[]> {
    const logs = Array.from(this.activityLogs.values())
      .filter(log => log.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return logs.map(log => {
      const user = log.userId ? this.users.get(log.userId) : undefined;
      return user ? { ...log, user } : log;
    });
  }
  
  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.currentId.payments++;
    const now = new Date();
    const newPayment: Payment = { ...payment, id, createdAt: now };
    this.payments.set(id, newPayment);
    return newPayment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getPaymentsByProviderPaymentId(provider: string, providerPaymentId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => 
        payment.provider === provider && 
        payment.providerPaymentId === providerPaymentId
      );
  }
  
  async updatePaymentStatus(id: number, status: string, providerPaymentId?: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      status, 
      ...(providerPaymentId ? { providerPaymentId } : {}) 
    };
    
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
}

export const storage = new MemStorage();
