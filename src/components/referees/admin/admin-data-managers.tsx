"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { adminRoleLabels, conflictStatusLabels } from "@/components/referees/admin/admin-ui";

async function api(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "操作失败。");
}

function useOperation() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function run(operation: () => Promise<void>, success = "操作已保存。") {
    setMessage("");
    try { await operation(); setMessage(success); router.refresh(); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失败。"); return false; }
  }
  return { message, run };
}

export function AvailabilityManager({
  records,
  referees,
}: {
  records: Array<{ id: string; refereeId: string; referee: string; kind: string; startAt: string; endAt: string; note: string }>;
  referees: Array<{ id: string; label: string }>;
}) {
  const { message, run } = useOperation();
  const [open, setOpen] = useState(false);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const ok = await run(() => api("/api/referees/admin/availability", "POST", { refereeId: form.get("refereeId"), startAt: form.get("startAt"), endAt: form.get("endAt"), kind: form.get("kind"), note: form.get("note") }), "可执裁时间已代录。");
    if (ok) setOpen(false);
  }
  return <>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>裁判员</th><th>类型</th><th>开始</th><th>结束</th><th>说明</th><th>操作</th></tr></thead><tbody>{records.map((item) => <tr key={item.id}><td><strong>{item.referee}</strong></td><td><span className="admin-status-badge" data-status={item.kind}>{item.kind === "AVAILABLE" ? "可执裁" : "不可执裁"}</span></td><td>{item.startAt}</td><td>{item.endAt}</td><td>{item.note || "—"}</td><td><div className="admin-table-actions"><button onClick={() => run(() => api("/api/referees/admin/availability", "DELETE", { id: item.id, refereeId: item.refereeId }), "记录已删除。")} type="button">删除</button></div></td></tr>)}</tbody></table></div>
    <button className="admin-floating-create" onClick={() => setOpen(true)} type="button">+ 代录时间</button>
    {open ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal"><header><div><span>AVAILABILITY</span><h2>管理员代录可执裁时间</h2></div><button aria-label="关闭" onClick={() => setOpen(false)} type="button">×</button></header><form className="admin-form" onSubmit={create}><div className="admin-form-grid"><label><span>裁判员</span><select name="refereeId" required>{referees.map((referee) => <option key={referee.id} value={referee.id}>{referee.label}</option>)}</select></label><label><span>类型</span><select name="kind"><option value="AVAILABLE">可执裁</option><option value="UNAVAILABLE">不可执裁</option></select></label><label><span>开始</span><input name="startAt" required type="datetime-local" /></label><label><span>结束</span><input name="endAt" required type="datetime-local" /></label></div><label><span>说明</span><input maxLength={240} name="note" /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setOpen(false)} type="button">取消</button><button className="admin-button" type="submit">保存记录</button></footer></form></div></div> : null}
  </>;
}

export function AffiliationsManager({
  colleges,
  teams,
}: {
  colleges: Array<{ id: string; name: string; mappings: Array<{ id: string; prefix: string; note: string }> }>;
  teams: Array<{ id: string; name: string; competition: string; collegeIds: string[] }>;
}) {
  const { message, run } = useOperation();
  const [tab, setTab] = useState<"colleges" | "mappings" | "teams">("colleges");
  const [modal, setModal] = useState<"college" | "mapping" | null>(null);
  async function createCollege(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/colleges", "POST", { action: "create-college", name: form.get("name") }), "学院已创建。"); if (ok) setModal(null); }
  async function createMapping(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/colleges", "POST", { action: "upsert-mapping", prefix: form.get("prefix"), collegeId: form.get("collegeId"), note: form.get("note") }), "学号前缀映射已保存。"); if (ok) setModal(null); }
  return <>
    <nav className="admin-tabs" role="tablist"><button aria-selected={tab === "colleges"} onClick={() => setTab("colleges")} role="tab" type="button">学院</button><button aria-selected={tab === "mappings"} onClick={() => setTab("mappings")} role="tab" type="button">学号代码映射</button><button aria-selected={tab === "teams"} onClick={() => setTab("teams")} role="tab" type="button">球队学院关联</button></nav>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    {tab === "colleges" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>学院</h2><p>标准化学院档案。</p></div><button className="admin-button" onClick={() => setModal("college")} type="button">+ 新增学院</button></header><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>学院名称</th><th>代码映射数</th><th>关联球队数</th></tr></thead><tbody>{colleges.map((college) => <tr key={college.id}><td><strong>{college.name}</strong></td><td>{college.mappings.length}</td><td>{teams.filter((team) => team.collegeIds.includes(college.id)).length}</td></tr>)}</tbody></table></div></section> : null}
    {tab === "mappings" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>学号代码映射</h2><p>学号前两位仅提供学院建议，最终以裁判员档案为准。</p></div><button className="admin-button" onClick={() => setModal("mapping")} type="button">+ 保存映射</button></header><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>前缀</th><th>建议学院</th><th>说明</th></tr></thead><tbody>{colleges.flatMap((college) => college.mappings.map((mapping) => <tr key={mapping.id}><td><strong>{mapping.prefix}</strong></td><td>{college.name}</td><td>{mapping.note || "—"}</td></tr>))}</tbody></table></div></section> : null}
    {tab === "teams" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>球队学院关联</h2><p>一支球队可关联多个学院，不通过球队名称推断。</p></div></header><div className="admin-affiliation-list">{teams.map((team) => <form className="admin-affiliation-row" key={team.id} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/team-affiliations", "PUT", { teamId: team.id, collegeIds: form.getAll("collegeIds") }), "球队学院关联已保存。"); }}><div><strong>{team.name}</strong><span>{team.competition}</span></div><select defaultValue={team.collegeIds} multiple name="collegeIds">{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select><button className="admin-button admin-button-secondary" type="submit">保存</button></form>)}</div></section> : null}
    {modal ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal admin-modal-compact"><header><div><span>COLLEGE DATA</span><h2>{modal === "college" ? "新增学院" : "保存学号代码映射"}</h2></div><button aria-label="关闭" onClick={() => setModal(null)} type="button">×</button></header>{modal === "college" ? <form className="admin-form" onSubmit={createCollege}><label><span>学院名称</span><input maxLength={80} name="name" required /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" type="submit">创建学院</button></footer></form> : <form className="admin-form" onSubmit={createMapping}><label><span>两位数字前缀</span><input inputMode="numeric" maxLength={2} minLength={2} name="prefix" required /></label><label><span>建议学院</span><select name="collegeId" required>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select></label><label><span>说明</span><input name="note" /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" type="submit">保存映射</button></footer></form>}</div></div> : null}
  </>;
}

export function ConflictReportsManager({ reports }: { reports: Array<{ id: string; referee: string; match: string; position: string; reason: string; reportedAt: string; status: string; resolutionNote: string }> }) {
  const { message, run } = useOperation();
  const [active, setActive] = useState<(typeof reports)[number] | null>(null);
  async function resolve(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!active) return; const form = new FormData(event.currentTarget); const ok = await run(() => api(`/api/referees/admin/conflict-reports/${active.id}`, "PATCH", { status: form.get("status"), resolutionNote: form.get("resolutionNote") }), "冲突报告已处理。"); if (ok) setActive(null); }
  return <><p aria-live="polite" className="admin-form-message">{message}</p><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>裁判员</th><th>比赛</th><th>岗位</th><th>报告原因</th><th>报告时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><strong>{report.referee}</strong></td><td>{report.match}</td><td>{report.position || "—"}</td><td>{report.reason}</td><td>{report.reportedAt}</td><td><span className="admin-status-badge" data-status={report.status}>{conflictStatusLabels[report.status] ?? report.status}</span></td><td><div className="admin-table-actions"><button onClick={() => setActive(report)} type="button">{report.status === "PENDING" ? "处理" : "查看"}</button></div></td></tr>)}</tbody></table></div>{active ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal admin-modal-compact"><header><div><span>CONFLICT REPORT</span><h2>冲突报告详情</h2></div><button aria-label="关闭" onClick={() => setActive(null)} type="button">×</button></header><form className="admin-form" onSubmit={resolve}><div className="admin-report-summary"><strong>{active.referee}</strong><span>{active.match} · {active.position || "岗位未识别"}</span><p>{active.reason}</p></div>{active.status === "PENDING" ? <><label><span>处理结果</span><select name="status"><option value="RESOLVED">已处理</option><option value="DISMISSED">驳回</option></select></label><label><span>处理说明</span><textarea maxLength={500} name="resolutionNote" required /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setActive(null)} type="button">取消</button><button className="admin-button" type="submit">保存处理结果</button></footer></> : <div className="admin-report-resolution"><span>处理说明</span><p>{active.resolutionNote || "—"}</p></div>}</form></div></div> : null}</>;
}

export function AdminAccountsManager({ accounts }: { accounts: Array<{ id: string; username: string; displayName: string; role: string; isActive: boolean; lastLoginAt: string }> }) {
  const { message, run } = useOperation();
  const [open, setOpen] = useState(false);
  async function create(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/admin-accounts", "POST", { username: form.get("username"), displayName: form.get("displayName"), password: form.get("password"), role: form.get("role") }), "管理员账号已创建。"); if (ok) setOpen(false); }
  return <><p aria-live="polite" className="admin-form-message">{message}</p><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>姓名</th><th>账号</th><th>角色</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><strong>{account.displayName}</strong></td><td>{account.username}</td><td>{adminRoleLabels[account.role] ?? account.role}</td><td><span className="admin-status-badge" data-status={account.isActive ? "ACTIVE" : "INACTIVE"}>{account.isActive ? "已启用" : "已停用"}</span></td><td>{account.lastLoginAt || "从未登录"}</td><td><div className="admin-table-actions"><button onClick={() => run(() => api("/api/referees/admin/admin-accounts", "PATCH", { id: account.id, isActive: !account.isActive }), account.isActive ? "管理员账号已停用。" : "管理员账号已启用。")} type="button">{account.isActive ? "停用" : "启用"}</button></div></td></tr>)}</tbody></table></div><button className="admin-floating-create" onClick={() => setOpen(true)} type="button">+ 新建管理员</button>{open ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal admin-modal-compact"><header><div><span>ADMIN ACCOUNT</span><h2>新建管理员</h2></div><button aria-label="关闭" onClick={() => setOpen(false)} type="button">×</button></header><form className="admin-form" onSubmit={create}><label><span>姓名</span><input maxLength={80} name="displayName" required /></label><label><span>账号</span><input maxLength={64} name="username" required /></label><label><span>初始密码</span><input minLength={12} name="password" required type="password" /></label><label><span>角色</span><select name="role"><option value="REFEREE_MANAGER">裁判事务管理员</option><option value="SUPER_ADMIN">裁判中心最高管理员</option></select></label><footer><button className="admin-button admin-button-secondary" onClick={() => setOpen(false)} type="button">取消</button><button className="admin-button" type="submit">创建管理员</button></footer></form></div></div> : null}</>;
}
