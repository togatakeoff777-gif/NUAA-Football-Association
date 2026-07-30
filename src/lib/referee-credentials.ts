import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/referee-security";

export async function verifyAdminCredentials(password: string) {
  const passwordHash = process.env.REFEREE_ADMIN_PASSWORD_HASH;
  return Boolean(passwordHash && await verifyPassword(password, passwordHash));
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
