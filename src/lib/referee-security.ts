import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const maximumFailures = 5;
const lockDurationMs = 15 * 60 * 1000;

export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 256) {
    throw new Error("密码须为 12 至 256 个字符。");
  }
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, passwordKeyLength)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltText, hashText] = storedHash.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  try {
    const expected = Buffer.from(hashText, "base64url");
    const actual = (await scrypt(
      password,
      Buffer.from(saltText, "base64url"),
      expected.length,
    )) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function isSessionFresh(expiresAt: Date, now = new Date()) {
  return expiresAt > now;
}

export function getLoginKey(request: Request, identifier = "anonymous") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "local";
  return createHash("sha256")
    .update(`${address}:${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export async function assertLoginAllowed(scope: "admin" | "referee", keyHash: string) {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { scope_keyHash: { scope, keyHash } },
  });
  if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
    throw new Error("登录尝试过于频繁，请稍后再试。");
  }
}

export async function recordLoginFailure(scope: "admin" | "referee", keyHash: string) {
  const current = await prisma.loginAttempt.upsert({
    where: { scope_keyHash: { scope, keyHash } },
    create: { scope, keyHash, failures: 1 },
    update: { failures: { increment: 1 } },
  });
  if (current.failures >= maximumFailures) {
    await prisma.loginAttempt.update({
      where: { id: current.id },
      data: { blockedUntil: new Date(Date.now() + lockDurationMs) },
    });
  }
  await new Promise((resolve) => setTimeout(resolve, Math.min(250 * current.failures, 1_250)));
}

export async function clearLoginFailures(scope: "admin" | "referee", keyHash: string) {
  await prisma.loginAttempt.deleteMany({ where: { scope, keyHash } });
}
