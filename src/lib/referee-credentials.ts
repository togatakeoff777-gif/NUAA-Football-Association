import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/referee-security";

export async function verifyAdminCredentials(password: string) {
  const passwordHash = process.env.REFEREE_ADMIN_PASSWORD_HASH;
  return Boolean(passwordHash && await verifyPassword(password, passwordHash));
}

export async function authenticateAdminCredentials(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) return null;
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
  if (!account?.isActive || !(await verifyPassword(password, account.passwordHash))) return null;
  return account;
}

export async function authenticateRefereeCredentials(
  publicCode: string,
  password: string,
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
  if (
    !referee ||
    referee.status !== "ACTIVE" ||
    !referee.passwordHash ||
    !(await verifyPassword(password, referee.passwordHash))
  ) return null;
  return referee;
}
