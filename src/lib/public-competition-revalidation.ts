import "server-only";

import { revalidatePath } from "next/cache";

export function revalidatePublicCompetitionPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/competitions");
  if (slug) revalidatePath(`/competitions/${slug}`);
}
