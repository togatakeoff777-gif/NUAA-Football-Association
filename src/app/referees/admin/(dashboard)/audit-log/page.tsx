import Link from "next/link";

import { auditActionLabels } from "@/components/referees/admin/admin-presenters";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const actorType = typeof query.actorType === "string" ? query.actorType : "";
  const action = typeof query.action === "string" ? query.action : "";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const [logs, admins, referees, actions] = await Promise.all([
    prisma.auditLog.findMany({ where: { ...(actorType ? { actorType } : {}), ...(action ? { action } : {}), ...(q ? { OR: [{ summary: { contains: q } }, { entityType: { contains: q } }, { entityId: { contains: q } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.adminAccount.findMany({ select: { id: true, displayName: true, username: true } }),
    prisma.referee.findMany({ select: { id: true, name: true, publicCode: true } }),
    prisma.auditLog.findMany({ select: { action: true }, distinct: ["action"], orderBy: { action: "asc" } }),
  ]);
  const actors = new Map<string,string>([...admins.map((item) => [item.id, `${item.displayName} (${item.username})`] as const), ...referees.map((item) => [item.id, `${item.publicCode} · ${item.name}`] as const)]);
  return <>
    <AdminPageHeader eyebrow="SYSTEM · AUDIT LOG" title="操作日志" description="按操作者类型、操作和对象摘要检索业务留痕。" />
    <form className="admin-filter-bar"><label className="admin-filter-search"><span>摘要 / 对象</span><input defaultValue={q} name="q" placeholder="输入关键词" /></label><label><span>操作者类型</span><select defaultValue={actorType} name="actorType"><option value="">全部</option><option value="ADMIN">管理员</option><option value="REFEREE">裁判员</option><option value="SYSTEM">系统</option></select></label><label><span>操作类型</span><select defaultValue={action} name="action"><option value="">全部操作</option>{actions.map((item) => <option key={item.action} value={item.action}>{auditActionLabels[item.action] ?? item.action}</option>)}</select></label><button className="admin-button admin-button-secondary" type="submit">筛选</button><Link className="admin-filter-reset" href="/admin/system/audit">清除</Link></form>
    <AdminPanel title={`操作记录 · ${logs.length}`} description="默认显示最新 500 条。">{logs.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>时间</th><th>操作人</th><th>操作类型</th><th>操作对象</th><th>结果 / 摘要</th></tr></thead><tbody>{logs.map((item) => <tr key={item.id}><td>{formatRefereeDateTime(item.createdAt)}</td><td><strong>{actors.get(item.actorId ?? "") ?? (item.actorType === "ADMIN" ? "兼容管理员" : item.actorType === "SYSTEM" ? "系统" : "未记录")}</strong><small>{item.actorType === "ADMIN" ? "管理员" : item.actorType === "REFEREE" ? "裁判员" : "系统"}</small></td><td>{auditActionLabels[item.action] ?? item.action}</td><td>{item.entityType}{item.entityId ? <small>{item.entityId}</small> : null}</td><td>{item.summary}</td></tr>)}</tbody></table></div> : <AdminEmptyState title="没有符合条件的操作记录" description="调整筛选条件后重试。" />}</AdminPanel>
  </>;
}
