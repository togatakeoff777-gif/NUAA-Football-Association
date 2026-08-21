import { notFound } from "next/navigation";

import { AdminCompetitionForm, type AdminCompetitionRecord } from "@/components/referees/admin/admin-competition-form";
import { AdminMatchNavigation } from "@/components/referees/admin/admin-match-navigation";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { formatRefereeDateTime } from "@/lib/referee-presenters";

export default async function EditAdminCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await prisma.competition.findUnique({ where: { id } });
  if (!competition) notFound();
  const record: AdminCompetitionRecord = {
    id: competition.id,
    name: competition.name,
    year: competition.year,
    format: competition.format,
    status: competition.status,
    source: competition.source,
    externalCompetitionId: competition.externalCompetitionId ?? "",
    lastSyncedAt: competition.lastSyncedAt ? formatRefereeDateTime(competition.lastSyncedAt) : "",
  };
  return <>
    <AdminPageHeader eyebrow="EDIT COMPETITION" title="编辑赛事" description="维护赛事基础资料；既有球队、比赛和选派关系保持不变。" />
    <AdminMatchNavigation active="competitions" />
    <AdminPanel title="赛事资料"><AdminCompetitionForm competition={record} /></AdminPanel>
  </>;
}
