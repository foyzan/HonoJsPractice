import { Hono } from 'hono'
// 1. Import from your custom generated path
import { PrismaClient } from './generated/prisma/client' 
import { withAccelerate } from '@prisma/extension-accelerate'

const app = new Hono<{ Bindings: { DATABASE_URL: string } }>()

app.get('/', async (c) => {
  // 2. Use accelerateUrl for Prisma 7 with Accelerate
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL, 
  }).$extends(withAccelerate())

  const users = await prisma.user.findMany()
  return c.json(users)
})

export default app
