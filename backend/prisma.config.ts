import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // In Prisma 7, 'url' in this config replaces the schema's connection string
    url: env("DATABASE_URL"), 
  },
  migrations: {
    path: "prisma/migrations",
  }
});
