import { redirect } from "next/navigation";

import { getSafeUnifiedAdminNext } from "@/lib/unified-admin-routing";

export const dynamic = "force-dynamic";

export default async function LegacyRefereeAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = getSafeUnifiedAdminNext((await searchParams).next);
  redirect(next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
}
