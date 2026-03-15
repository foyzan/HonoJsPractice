import { Hono } from "hono";

import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";


export const blogsRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string,
        JWT_SECRET: string
    }
}>()



blogsRouter.get("/", async (c) => {
   const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
});

blogsRouter.post("/", async (c) => {});
blogsRouter.get("/:id", async (c) => {});
blogsRouter.put("/:id", async (c) => {});
