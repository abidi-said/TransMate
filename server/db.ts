import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import 'dotenv/config';

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