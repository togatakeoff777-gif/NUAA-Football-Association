import "server-only";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export function revalidatePublicCompetitionPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/competitions");
  if (slug) revalidatePath(`/competitions/${slug}`);
}

export async function revalidatePublicCompetitionById(competitionId: string) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { slug: true },
  });
  revalidatePublicCompetitionPaths(competition?.slug);
}
