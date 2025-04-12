import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon to use WebSockets in a Node.js environment
neonConfig.webSocketConstructor = ws;

// Validate database connection URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create PostgreSQL connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle ORM instance with our schema
export const db = drizzle({ client: pool, schema });