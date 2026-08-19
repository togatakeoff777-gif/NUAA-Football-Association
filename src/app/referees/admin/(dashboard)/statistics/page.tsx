import Link from "next/link";

import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { positionTemplates } from "@/lib/referee-roles";
import { getCompletedRefereeStatistics } from "@/lib/referee-r1-service";

const positionLabels = Object.fromEntries(Object.values(positionTemplates).flat().map((item) => [item.key, item.label]));

export default async function AdminStatisticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = typeof query.referee === "string" ? query.referee.trim() : "";
  const competition = typeof query.competition === "string" ? query.competition : "";
  const position = typeof query.position === "string" ? query.position : "";
  const all = await getCompletedRefereeStatistics();
  const competitionNames = [...new Set(all.flatMap((item) => item.competitions.map((entry) => entry.name)))].sort();
  const rows = all.filter((item) => (!q || `${item.publicCode} ${item.name}`.toLowerCase().includes(q.toLowerCase())) && (!competition || item.competitions.some((entry) => entry.name === competition)) && (!position || (item.positions[position] ?? 0) > 0));
  const total = rows.reduce((sum, item) => sum + item.totalMatches, 0);
  return <>
    <AdminPageHeader eyebrow="STATISTICS" title="执裁统计" description="统计仅包含已完成的正式选派，数据从选派记录动态汇总。" />
    <form className="admin-filter-bar"><label className="admin-filter-search"><span>裁判员</span><input defaultValue={q} name="referee" placeholder="姓名 / 编号" /></label><label><span>赛事</span><select defaultValue={competition} name="competition"><option value="">全部赛事</option>{competitionNames.map((name) => <option key={name}>{name}</option>)}</select></label><label><span>岗位</span><select defaultValue={position} name="position"><option value="">全部岗位</option>{Object.entries(positionLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="admin-button admin-button-secondary" type="submit">筛选</button><Link className="admin-filter-reset" href="/referees/admin/statistics">清除</Link></form>
    <section className="admin-kpi-grid admin-kpi-grid-compact"><article className="admin-kpi-card"><span>裁判员</span><strong>{rows.length}</strong><small>有已完成记录</small></article><article className="admin-kpi-card"><span>总执裁场次</span><strong>{total}</strong><small>当前筛选合计</small></article><article className="admin-kpi-card"><span>赛事</span><strong>{competitionNames.length}</strong><small>已产生完成记录</small></article></section>
    <AdminPanel title="裁判员统计" description="岗位计数与赛事分布均来自已完成的正式选派。">{rows.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>裁判员</th><th>总场次</th><th>岗位分布</th><th>赛事分布</th><th>最近执裁</th></tr></thead><tbody>{rows.map((item) => <tr key={item.refereeId}><td><strong>{item.name}</strong><small>{item.publicCode}</small></td><td><b className="admin-stat-number">{item.totalMatches}</b></td><td>{Object.entries(item.positions).map(([key,count]) => `${positionLabels[key] ?? key} ${count}`).join(" · ") || "—"}</td><td>{item.competitions.map((entry) => `${entry.name} ${entry.count}`).join(" · ") || "—"}</td><td>{item.recent[0] ? <><strong>{item.recent[0].matchup}</strong><small>{item.recent[0].position} · {formatRefereeDateTime(item.recent[0].kickoff)}</small></> : "—"}</td></tr>)}</tbody></table></div> : <AdminEmptyState title="没有符合条件的统计" description="调整筛选条件，或在选派完成后查看。" />}</AdminPanel>
  </>;
}
