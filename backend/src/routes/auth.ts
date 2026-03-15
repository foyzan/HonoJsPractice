import { Hono } from "hono";

import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
export const authRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string,
        JWT_SECRET: string
    }
}>()

authRouter.post("/signup", async (c) => {
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
authRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || user.password !== body.password) {
      c.status(403)
      return c.json({ msg: "invalid credential" });
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");

    return c.json({ token });
  } catch (error) {

    c.status(404)
    
    c.text('Internal error')
  }
});