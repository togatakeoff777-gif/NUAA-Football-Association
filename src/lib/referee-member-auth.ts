import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "nuaa_referee_member";
const sessionDurationMs = 12 * 60 * 60 * 1000;

type RefereeAccessCodes = Record<string, string>;

function getSessionSecret() {
  const secret = process.env.REFEREE_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function getAccessCodes(): RefereeAccessCodes | null {
  const source = process.env.REFEREE_MEMBER_ACCESS_CODES;
  if (!source) return null;
  try {
    const value: unknown = JSON.parse(source);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const entries = Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" &&
        entry[0].trim().length > 0 &&
        typeof entry[1] === "string" &&
        entry[1].length >= 8,
    );
    return entries.length ? Object.fromEntries(entries) : null;
  } catch {
    return null;
  }
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

export function getRefereeMemberConfigurationIssue() {
  if (!getSessionSecret()) return "裁判员会话密钥尚未配置或长度不足 32 个字符。";
  if (!getAccessCodes()) return "裁判员访问码尚未配置。请联系协会管理员开通。";
  return null;
}

export async function createRefereeMemberSession(publicCode: string, accessCode: string) {
  const secret = getSessionSecret();
  const accessCodes = getAccessCodes();
  const expectedCode = accessCodes?.[publicCode];
  if (!secret || !expectedCode || !safeEqual(accessCode, expectedCode)) return null;

  const referee = await prisma.referee.findUnique({
    where: { publicCode },
    select: { id: true, publicCode: true, name: true, status: true },
  });
  if (!referee || referee.status !== "ACTIVE") return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await prisma.refereeSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.refereeSession.create({
    data: { refereeId: referee.id, tokenHash: hashToken(token, secret), expiresAt },
  });

  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  return referee;
}

export async function getRefereeMemberSession() {
  const secret = getSessionSecret();
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!secret || !token) return null;

  const session = await prisma.refereeSession.findUnique({
    where: { tokenHash: hashToken(token, secret) },
    include: {
      referee: {
        select: {
          id: true,
          publicCode: true,
          name: true,
          status: true,
          elevenASide: true,
          futsal: true,
        },
      },
    },
  });
  if (!session || session.expiresAt <= new Date() || session.referee.status !== "ACTIVE") {
    if (session) await prisma.refereeSession.delete({ where: { id: session.id } });
    return null;
  }
  return session;
}

export async function destroyRefereeMemberSession() {
  const secret = getSessionSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (secret && token) {
    await prisma.refereeSession.deleteMany({ where: { tokenHash: hashToken(token, secret) } });
  }
  cookieStore.delete(sessionCookieName);
}
