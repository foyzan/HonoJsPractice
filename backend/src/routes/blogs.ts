import { Hono } from "hono";

import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { verify } from "hono/jwt";
import { AppEnv } from "../type/type";

export const blogsRouter = new Hono<AppEnv>();

blogsRouter.get("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  
  // 1. Extract and Sanitize Queries
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 10;
  const searchQuery = c.req.query("search") || "";

  // Ensure sortType is specifically 'asc' or 'desc'
  const rawSort = c.req.query("sort_type");
  const sortType: "asc" | "desc" =
    rawSort === "asc" || rawSort === "desc" ? rawSort : "desc";

  try {
    // 2. Execute Prisma Query
    const blogs = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { content: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      orderBy: {
        createdAt: sortType, // TypeScript is happy now!
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            name: true, // Usually, you want the author's name in the feed
          },
        },
      },
    });

    return c.json({ data: blogs, page, limit });
  } catch (error) {

    c.status(500)
    return c.json({
        message: "Internal server error",
    })
  }
});

blogsRouter.use("/*", async (c, next) => {
  const authToken = c.req.header("Authorization") || "";

  if (!authToken) {
    c.status(403);
    return c.json({
      message: "unauthorized",
    });
  }

  try {
    const user = await verify(authToken, c.env.JWT_SECRET, "HS256");

    if (!user) {
      c.status(403);
      return c.json({
        message: "unauthorized",
      });
    }

    c.set("userId", user.id as string);
    await next()
  } catch (error) {
    c.status(403);
    return c.json({
      message: "unauthorized",
    });
  }
});

blogsRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const title = body.title || "";
  const content = body.content || "";
  const authorId = c.get("userId");

  try {
    const blog = await prisma.post.create({
      data: { title, content, authorId },
    });

    c.status(202);
    return c.json({
      data: blog,
    });
  } catch (error) {
    c.status(500);
    return c.json({
      message: "Internal server error",
    });
  }
});
blogsRouter.get("/:id", async (c) => {
    const id = c.req.param("id");
    console.log(id)
    const prisma = c.get("prisma");

    try {
        const blog = await prisma.post.findUniqueOrThrow({
            where: { id },
            include: {
                author: {
                    select: { name: true }
                }
            }
        });
        return c.json({ blog });
    } catch (e) {
        console.log(e)
        return c.json({ message: "Post not found" }, 404);
    }
});
blogsRouter.put("/:id", async (c) => {
    const body = await c.req.json();
    const id = c.req.param("id");
    const title = body.title || "";
    const content = body.content || "";
    const prisma = c.get('prisma')

    const data = {title, content}
    if(!title){
        delete data.title
    }

    if(!content){
        delete data.content
    }
   

    try {
        const updatedBlog = await prisma.post.update({
            where : {id},
            data : data
        })  
        return c.json({ updatedBlog });  
    } catch (error) {
       return c.json({ message: "Post not found" }, 404);
    }
});
