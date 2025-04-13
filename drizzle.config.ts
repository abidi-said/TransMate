import type { Config } from "drizzle-kit";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL, ensure the database is provisioned", process.env.DATABASE_URL);
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default {
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;