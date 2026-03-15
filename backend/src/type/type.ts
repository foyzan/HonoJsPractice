// src/types.ts
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate'

// This helps capture the specific type of the extended Prisma client
export type PrismaConfig = ReturnType<typeof getPrismaClient>;

function getPrismaClient(url: string) {
  return new PrismaClient({
    accelerateUrl: url,
  }).$extends(withAccelerate());
}

export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    prisma: PrismaConfig;
    userId: string; // If you store the user ID after JWT verification
  };
};