import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const globalForPrisma = globalThis as unknown as { refereePrisma?: PrismaClient };

export const prisma =
  globalForPrisma.refereePrisma ??
  new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.refereePrisma = prisma;
