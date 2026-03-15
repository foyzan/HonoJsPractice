import { Hono } from "hono";
// 1. Import from your custom generated path
import { PrismaClient } from "./generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { authRouter } from "./routes/auth";
import { blogsRouter } from "./routes/blogs";

const app = new Hono<{
  Bindings: { DATABASE_URL: string; JWT_SECRET: string };
}>();


app.route('/api/v1/auth', authRouter);
app.route('/api/v1/blogs', blogsRouter);



app.get("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const users = await prisma.user.findMany();
  return c.json(users);
});





export default app;
