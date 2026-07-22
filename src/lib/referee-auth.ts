import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "nuaa_referee_admin";
const sessionDurationMs = 12 * 60 * 60 * 1000;

function getSessionSecret() {
  const secret = process.env.REFEREE_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function hashToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

function safeEqual(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  const size = Math.max(left.length, right.length, 1);
  const paddedLeft = Buffer.alloc(size);
  const paddedRight = Buffer.alloc(size);
  left.copy(paddedLeft);
  right.copy(paddedRight);
  return timingSafeEqual(paddedLeft, paddedRight) && left.length === right.length;
}

export function getAdminConfigurationIssue() {
  if (!process.env.REFEREE_ADMIN_PASSWORD) return "管理员密码尚未配置。";
  if (!getSessionSecret()) return "Session secret 尚未配置或长度不足 32 个字符。";
  return null;
}

export async function createAdminSession(password: string) {
  const expectedPassword = process.env.REFEREE_ADMIN_PASSWORD;
  const secret = getSessionSecret();
  if (!expectedPassword || !secret || !safeEqual(password, expectedPassword)) return false;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.adminSession.create({ data: { tokenHash: hashToken(token, secret), expiresAt } });

  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  return true;
}

export async function getAdminSession() {
  const secret = getSessionSecret();
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!secret || !token) return null;
  const session = await prisma.adminSession.findUnique({ where: { tokenHash: hashToken(token, secret) } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }
  return session;
}

export async function destroyAdminSession() {
  const secret = getSessionSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (secret && token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token, secret) } });
  }
  cookieStore.delete(sessionCookieName);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  return origin === new URL(request.url).origin;
}
