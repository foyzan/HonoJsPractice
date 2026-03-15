import { Hono } from "hono";
// 1. Import from your custom generated path
import { PrismaClient } from "./generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

const app = new Hono<{
  Bindings: { DATABASE_URL: string; JWT_SECRET: string };
}>();

app.use("/api/v1/blog/*", async (c, next) => {
  const header = c.req.header("authorization") || "";

  if (!header) {
    c.status(403);

    return c.json({
      msg: "auth error",
    });
  }

  const response = await verify(header, c.env.JWT_SECRET, "HS256");

  if (!response.id) {
    c.status(403);

    return c.json({
      msg: "auth error",
    });
  }

  return await next();
});

app.get("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const users = await prisma.user.findMany();
  return c.json(users);
});

app.post("/api/v1/signup", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ token });
  } catch (error) {
    console.log(error)
    c.status(400)
    return c.text('bad request')
  }
});
app.post("/api/v1/signin", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || user.password !== body.password) {
      return c.json({ msg: "invalid credential" });
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");

    return c.json({ token });
  } catch (error) {

    c.status(404)
    
    c.text('Internal error')
  }
});

app.get("/api/v1/blogs", async (c) => {});
app.get("/api/v1/blogs/:id", async (c) => {});

app.post("/api/v1/blog", async (c) => {});
app.put("/api/v1/blog/:id", async (c) => {});

export default app;
