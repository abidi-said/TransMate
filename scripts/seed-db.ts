
import { db } from "../server/db";
import { users, projects, projectMembers } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log('Checking existing users...');
  
  // Check if admin user exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  
  if (existingAdmin.length === 0) {
    console.log('Creating admin user...');
    await db.insert(users).values({
      username: 'admin',
      email: 'admin@transmate.dev',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'active',
      lastLoginAt: null
    });
  }

  // Check if client user exists
  const existingClient = await db.select().from(users).where(eq(users.username, 'client')).limit(1);
  
  if (existingClient.length === 0) {
    console.log('Creating client user...');
    await db.insert(users).values({
      username: 'client',
      email: 'client@transmate.dev',
      password: await bcrypt.hash('client123', 10),
      fullName: 'Client User',
      role: 'translator',
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'active',
      lastLoginAt: null
    });
  }

  console.log('Database seeding completed!');
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
