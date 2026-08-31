import { prisma } from "@/lib/prisma";
import {
  DUMMY_PASSWORD_HASH,
  isUsablePasswordHash,
  verifyPassword,
} from "@/lib/referee-security";

export type PasswordVerifier = (password: string, storedHash: string) => Promise<boolean>;

async function verifyCredentialPassword(
  password: string,
  storedHash: string | null | undefined,
  eligible: boolean,
  verifier: PasswordVerifier,
) {
  const useRealHash = eligible && isUsablePasswordHash(storedHash);
  const verified = await verifier(password, useRealHash ? storedHash! : DUMMY_PASSWORD_HASH);
  return Boolean(useRealHash && verified);
}

export async function verifyAdminCredentials(
  password: string,
  verifier: PasswordVerifier = verifyPassword,
) {
  const passwordHash = process.env.REFEREE_ADMIN_PASSWORD_HASH;
  return verifyCredentialPassword(password, passwordHash, true, verifier);
}

export async function authenticateAdminCredentials(
  username: string,
  password: string,
  verifier: PasswordVerifier = verifyPassword,
) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    await verifyCredentialPassword(password, null, false, verifier);
    return null;
  }
  const account = await prisma.adminAccount.findUnique({
    where: { username: normalizedUsername },
    select: {
      id: true,
      username: true,
      displayName: true,
      passwordHash: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      unifiedRoles: { select: { role: true }, orderBy: { role: "asc" } },
    },
  });
  const passwordMatches = await verifyCredentialPassword(
    password,
    account?.passwordHash,
    Boolean(account?.isActive),
    verifier,
  );
  if (!account?.isActive || !passwordMatches) return null;
  return account;
}

export async function authenticateRefereeCredentials(
  publicCode: string,
  password: string,
  verifier: PasswordVerifier = verifyPassword,
) {
  const referee = await prisma.referee.findUnique({
    where: { publicCode },
    select: {
      id: true,
      publicCode: true,
      name: true,
      status: true,
      passwordHash: true,
      mustChangePassword: true,
    },
  });
  const passwordMatches = await verifyCredentialPassword(
    password,
    referee?.passwordHash,
    referee?.status === "ACTIVE",
    verifier,
  );
  if (
    !referee ||
    referee.status !== "ACTIVE" ||
    !passwordMatches
  ) return null;
  return referee;
}
