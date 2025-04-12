import { users, type User, type InsertUser } from "@shared/schema";
import bcrypt from "bcryptjs";
import { User as DbUser, Project, ProjectMember, RoleType } from "@shared/schema"; // Assuming schema types are exported

const saltRounds = 10;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUser(email: string, username: string, password: string, role: RoleType): Promise<DbUser>;
  validatePassword(user: DbUser, password: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<DbUser | null>;
  getUserById(id: number): Promise<DbUser | null>;
  createProject(name: string, ownerId: number, isPaid: boolean): Promise<Project>;
  getProjectMember(projectId: number, userId: number): Promise<ProjectMember | null>;
  updateProjectMemberRole(projectId: number, userId: number, role: RoleType): Promise<void>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  getFreeProjectCount(userId: number): Promise<number>;

}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Added authentication methods (incomplete - requires database connection)
  async createUser(email: string, username: string, password: string, role: RoleType): Promise<DbUser> {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    //  Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async validatePassword(user: DbUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async getUserById(id: number): Promise<DbUser | null> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async createProject(name: string, ownerId: number, isPaid = false): Promise<Project> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async getProjectMember(projectId: number, userId: number): Promise<ProjectMember | null> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async updateProjectMemberRole(projectId: number, userId: number, role: RoleType): Promise<void> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }

  async getFreeProjectCount(userId: number): Promise<number> {
    // Database interaction needed here. Replace with your actual database query.
    throw new Error("Database interaction not implemented");
  }
}

export const storage = new MemStorage();
export const subscriptionPlans = {
  free: {
    name: "free",
    price: 0,
    features: [
      "Up to 3 languages",
      "Basic translation management",
      "Source code key extraction",
      "JSON file support",
      "Community support"
    ],
    limits: {
      languages: 3,
      aiTranslations: 0,
      teamMembers: 1,
      historyRetention: 30
    }
  },
  pro: {
    name: "pro",
    price: 15,
    features: [
      "Unlimited languages",
      "AI-powered translations",
      "Language auto-detection",
      "Advanced file formats",
      "Translation history",
      "Email support"
    ],
    limits: {
      languages: "unlimited",
      aiTranslations: 1000,
      teamMembers: 1,
      historyRetention: 90
    }
  },
  team: {
    name: "team",
    price: 49,
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Usage analytics",
      "Priority support",
      "Advanced security"
    ],
    limits: {
      languages: "unlimited",
      aiTranslations: 5000,
      teamMembers: 10,
      historyRetention: 365
    }
  },
  enterprise: {
    name: "enterprise",
    price: 0, // Custom pricing
    features: [
      "Custom integrations",
      "Dedicated support",
      "SLA guarantees",
      "Advanced security",
      "Custom limits"
    ],
    limits: {
      languages: "unlimited",
      aiTranslations: "unlimited",
      teamMembers: "unlimited",
      historyRetention: "unlimited"
    }
  }
};