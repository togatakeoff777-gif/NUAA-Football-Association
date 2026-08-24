import Link from "next/link";

import { AdminMatchNavigation } from "@/components/referees/admin/admin-match-navigation";
import {
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  competitionFormatLabels,
  competitionStatusLabels,
  dataSourceLabels,
} from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { getUnifiedAdminActor, hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";

export default async function AdminCompetitionsPage() {
  const [actor, competitions] = await Promise.all([getUnifiedAdminActor(), prisma.competition.findMany({
    select: {
      id: true,
      name: true,
      year: true,
      format: true,
      status: true,
      source: true,
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  })]);
  const canWrite = Boolean(actor && hasUnifiedAdminPermission(actor.roles, "competitions:write"));
  return <>
    <AdminPageHeader
      eyebrow="COMPETITIONS"
      title="赛事管理"
      description="先建立赛事，再在赛事范围内维护参赛球队、具体比赛与裁判选派。"
      actions={canWrite ? <><Link className="admin-button admin-button-secondary" href="/admin/competitions/import">批量导入</Link><Link className="admin-button" href="/referees/admin/matches/competitions/new">+ 新建赛事</Link></> : <span className="admin-status-badge">只读权限</span>}
    />
    <AdminMatchNavigation active="competitions" />
    <AdminPanel title={`赛事列表 · ${competitions.length}`} description="Competition 是球队与比赛的上级对象；R1 支持手工维护，保留未来官方数据同步字段。">
      {competitions.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>赛事名称</th><th>比赛制式</th><th>状态</th><th>比赛</th><th>球队</th><th>数据来源</th><th>操作</th></tr></thead><tbody>{competitions.map((competition) => <tr key={competition.id}>
        <td><strong>{competition.name}</strong><small>{competition.year ?? "赛季未填写"}</small></td>
        <td>{competitionFormatLabels[competition.format]}</td>
        <td><AdminStatusBadge status={competition.status} label={competitionStatusLabels[competition.status]} /></td>
        <td>{competition._count.matches}</td>
        <td>{competition._count.teams}</td>
        <td>{dataSourceLabels[competition.source]}</td>
        <td><div className="admin-table-actions">{canWrite ? <><Link href={`/referees/admin/matches/new?competition=${competition.id}`}>新建比赛</Link><Link href={`/referees/admin/affiliations?tab=teams&competition=${competition.id}`}>管理球队</Link><Link href={`/referees/admin/matches/competitions/${competition.id}/edit`}>编辑</Link></> : <span>查看</span>}</div></td>
      </tr>)}</tbody></table></div> : <div className="admin-empty-state"><strong>当前尚未创建赛事</strong><p>{canWrite ? "请先创建赛事，再继续建立球队和比赛。" : "当前没有可查看的赛事。"}</p>{canWrite ? <Link className="admin-button" href="/referees/admin/matches/competitions/new">新建赛事</Link> : null}</div>}
    </AdminPanel>
  </>;
}
