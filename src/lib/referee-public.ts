import { prisma } from "@/lib/prisma";

export async function getPublicRefereeDirectory() {
  return prisma.referee.findMany({
    where: { status: "ACTIVE", publicDirectoryEnabled: true },
    select: {
      id: true,
      publicCode: true,
      name: true,
      elevenASide: true,
      futsal: true,
      publicBio: true,
      updatedAt: true,
    },
    orderBy: { publicCode: "asc" },
  });
}
