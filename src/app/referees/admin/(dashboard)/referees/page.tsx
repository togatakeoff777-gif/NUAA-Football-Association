import Link from "next/link";

import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatusBadge, assignmentEligibilityLabels, refereeStatusLabels, trainingStatusLabels } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { affiliationOptionLabel, sortAffiliationOptions } from "@/lib/referee-affiliation-options";

export default async function AdminRefereesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const collegeId = typeof query.college === "string" ? query.college : "";
  const rawStatus = typeof query.status === "string" ? query.status : "";
  const status = ["PENDING_ACTIVATION", "ACTIVE", "INACTIVE", "ARCHIVED"].includes(rawStatus) ? rawStatus : "";
  const rawFormat = typeof query.format === "string" ? query.format : "";
  const format = ["ELEVEN_A_SIDE", "FUTSAL"].includes(rawFormat) ? rawFormat : "";
  const [colleges, referees] = await Promise.all([
    prisma.college.findMany({ select: { id: true, name: true, codeMappings: { select: { prefix: true } } } }),
    prisma.referee.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q } }, { publicCode: { contains: q } }, { studentId: { contains: q } }] } : {}),
        ...(collegeId ? { collegeId } : {}),
        ...(status ? { status: status as "PENDING_ACTIVATION" | "ACTIVE" | "INACTIVE" | "ARCHIVED" } : {}),
        ...(format ? { capabilities: { some: { format: format as "ELEVEN_A_SIDE" | "FUTSAL", status: { not: "NOT_ASSIGNED" } } } } : {}),
      },
      select: { id: true, name: true, publicCode: true, studentId: true, refereeLevel: true, status: true, trainingStatus: true, assignmentEligibility: true, college: { select: { name: true } }, capabilities: { where: { status: { not: "NOT_ASSIGNED" } }, select: { format: true } } },
      orderBy: { publicCode: "asc" }, take: 300,
    }),
  ]);
  const collegeOptions = sortAffiliationOptions(colleges.map((college) => ({ ...college, type: "COLLEGE" as const, prefixes: college.codeMappings.map((mapping) => mapping.prefix) })));
  return <>
    <AdminPageHeader eyebrow="REFEREES" title="裁判员管理" description="名录优先展示；敏感联系方式只在个人详情中查看。" actions={<Link className="admin-button" href="/referees/admin/referees/new">+ 新建裁判员</Link>} />
    <form className="admin-filter-bar">
      <label className="admin-filter-search"><span>搜索</span><input defaultValue={q} name="q" placeholder="姓名 / 编号 / 学号" /></label>
      <label><span>学院</span><select defaultValue={collegeId} name="college"><option value="">全部学院</option>{collegeOptions.map((item) => <option key={item.id} value={item.id}>{affiliationOptionLabel(item)}</option>)}</select></label>
      <label><span>账号状态</span><select defaultValue={status} name="status"><option value="">全部状态</option>{Object.entries(refereeStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>岗位制式</span><select defaultValue={format} name="format"><option value="">全部制式</option><option value="ELEVEN_A_SIDE">十一人制</option><option value="FUTSAL">五人制</option></select></label>
      <button className="admin-button admin-button-secondary" type="submit">筛选</button><Link className="admin-filter-reset" href="/referees/admin/referees">清除</Link>
    </form>
    <AdminPanel title={`裁判员名录 · ${referees.length}`} description="列表不展示手机、QQ 和内部备注。">
      {referees.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>姓名</th><th>裁判员编号</th><th>学院</th><th>培养状态</th><th>正式选派</th><th>十一人制</th><th>五人制</th><th>账号状态</th><th>操作</th></tr></thead><tbody>{referees.map((referee) => {
        const formats = new Set(referee.capabilities.map((item) => item.format));
        return <tr key={referee.id}><td><strong>{referee.name}</strong><small>{referee.studentId || "未登记学号"}</small></td><td>{referee.publicCode}</td><td>{referee.college?.name ?? "待确认"}</td><td>{trainingStatusLabels[referee.trainingStatus]}</td><td><AdminStatusBadge status={referee.assignmentEligibility} label={assignmentEligibilityLabels[referee.assignmentEligibility]} /></td><td>{formats.has("ELEVEN_A_SIDE") ? "具备" : "—"}</td><td>{formats.has("FUTSAL") ? "具备" : "—"}</td><td><AdminStatusBadge status={referee.status} label={refereeStatusLabels[referee.status]} /></td><td><div className="admin-table-actions"><Link href={`/referees/admin/referees/${referee.id}`}>查看</Link><Link href={`/referees/admin/referees/${referee.id}#profile`}>编辑</Link></div></td></tr>;
      })}</tbody></table></div> : <AdminEmptyState title="没有符合条件的裁判员" description="调整筛选条件，或新建裁判员账号。" />}
    </AdminPanel>
  </>;
}
