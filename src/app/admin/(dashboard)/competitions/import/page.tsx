import Link from "next/link";

import { CompetitionImportManager } from "@/components/admin/competition-import-manager";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedCompetitionImportPage() {
  await guardUnifiedAdminPage("competitions:write", "competition-import");
  const competitions = await prisma.competition.findMany({
    select: { id: true, name: true, year: true },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
  return <>
    <AdminPageHeader
      eyebrow="COMPETITION IMPORT"
      title="赛事批量导入"
      description="对已有赛事执行球队或赛程导入：解析、逐行校验、reconciliation、Preview，再原子提交。"
      actions={<><Link className="admin-button admin-button-secondary" href="/admin/competitions">返回赛事管理</Link><Link className="admin-button admin-button-secondary" href="/admin/matches">手动维护比赛</Link></>}
    />
    {!competitions.length ? <section className="admin-panel"><div className="admin-empty-state"><strong>请先创建赛事</strong><p>R1-3B 不批量创建 Competition；请先使用现有赛事创建流程。</p><Link className="admin-button" href="/referees/admin/matches/competitions/new">手动创建赛事</Link></div></section> : <CompetitionImportManager competitions={competitions} />}
  </>;
}
