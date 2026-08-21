"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminAffiliationOptionGroups } from "@/components/referees/admin/admin-affiliation-options";
import { adminRoleLabels, conflictStatusLabels } from "@/components/referees/admin/admin-ui";
import { parsePastedTeamNames, parseTeamCsv } from "@/lib/referee-team-import";

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

function MissingCompetitionState() {
  return <div className="admin-empty-state">
    <strong>请先创建赛事后再创建参赛球队</strong>
    <p>赛事是球队与比赛的上级对象。</p>
    <Link className="admin-button" href="/referees/admin/matches/competitions/new">新建赛事</Link>
  </div>;
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
  units,
  teams,
  competitions,
  initialTab = "colleges",
  initialCompetitionId = "",
}: {
  units: Array<{ id: string; name: string; label: string; type: "COLLEGE" | "SHUYUAN"; childIds: string[]; mappings: Array<{ id: string; prefix: string; note: string }> }>;
  teams: Array<{ id: string; name: string; competitionId: string; competition: string; teamType: "ORGANIZATION" | "JOINT" | "FREEFORM"; unitIds: string[] }>;
  competitions: Array<{ id: string; name: string }>;
  initialTab?: "colleges" | "shuyuan" | "mappings" | "relations" | "teams";
  initialCompetitionId?: string;
}) {
  const { message, run } = useOperation();
  const [tab, setTab] = useState<"colleges" | "shuyuan" | "mappings" | "relations" | "teams">(initialTab);
  const [modal, setModal] = useState<"unit" | "mapping" | "bulk" | "from-units" | "joint" | null>(null);
  const [unitType, setUnitType] = useState<"COLLEGE" | "SHUYUAN">("COLLEGE");
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"paste" | "csv">("paste");
  const [importCompetitionId, setImportCompetitionId] = useState(
    competitions.some((item) => item.id === initialCompetitionId)
      ? initialCompetitionId
      : competitions[0]?.id ?? "",
  );
  const colleges = units.filter((unit) => unit.type === "COLLEGE");
  const shuyuan = units.filter((unit) => unit.type === "SHUYUAN");
  const preview = importFormat === "csv"
    ? parseTeamCsv(importText, teams.filter((team) => team.competitionId === importCompetitionId).map((team) => team.name))
    : parsePastedTeamNames(importText, teams.filter((team) => team.competitionId === importCompetitionId).map((team) => team.name));
  async function createUnit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/affiliation-units", "POST", { action: "create", name: form.get("name"), type: unitType }), unitType === "COLLEGE" ? "学院已创建。" : "书院已创建。"); if (ok) setModal(null); }
  async function createMapping(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/colleges", "POST", { action: "upsert-mapping", prefix: form.get("prefix"), collegeId: form.get("collegeId"), note: form.get("note") }), "学号前缀映射已保存。"); if (ok) setModal(null); }
  async function saveRelation(event: React.FormEvent<HTMLFormElement>, parentUnitId: string) { event.preventDefault(); const form = new FormData(event.currentTarget); await run(() => api("/api/referees/admin/affiliation-units", "POST", { action: "set-children", parentUnitId, childUnitIds: form.getAll("childUnitIds") }), "书院组成关系已保存。"); }
  async function confirmBulk() { const ok = await run(() => api("/api/referees/admin/teams", "POST", { action: "bulk", competitionId: importCompetitionId, names: preview.names }), `已创建 ${preview.names.length} 支自由组队球队。`); if (ok) { setModal(null); setImportText(""); } }
  async function fromUnits(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/teams", "POST", { action: "from-units", competitionId: form.get("competitionId"), unitIds: form.getAll("unitIds") }), "组织代表队已批量创建。"); if (ok) setModal(null); }
  async function jointTeam(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await run(() => api("/api/referees/admin/teams", "POST", { action: "joint", competitionId: form.get("competitionId"), name: form.get("name"), unitIds: form.getAll("unitIds") }), "联合队已创建。"); if (ok) setModal(null); }
  return <>
    <nav className="admin-tabs" role="tablist"><button aria-selected={tab === "colleges"} onClick={() => setTab("colleges")} role="tab" type="button">学院</button><button aria-selected={tab === "shuyuan"} onClick={() => setTab("shuyuan")} role="tab" type="button">书院</button><button aria-selected={tab === "mappings"} onClick={() => setTab("mappings")} role="tab" type="button">学号前缀映射</button><button aria-selected={tab === "relations"} onClick={() => setTab("relations")} role="tab" type="button">组织关系</button><button aria-selected={tab === "teams"} onClick={() => setTab("teams")} role="tab" type="button">球队关联</button></nav>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    {tab === "colleges" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>学院</h2><p>标准化学院组织单位，按已确认学号前缀排序，不包含书院。</p></div><button className="admin-button" onClick={() => { setUnitType("COLLEGE"); setModal("unit"); }} type="button">+ 新增学院</button></header><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>学院名称</th><th>代码映射数</th><th>关联球队数</th></tr></thead><tbody>{colleges.map((college) => <tr key={college.id}><td><strong>{college.label}</strong></td><td>{college.mappings.length}</td><td>{teams.filter((team) => team.unitIds.includes(college.id)).length}</td></tr>)}</tbody></table></div></section> : null}
    {tab === "shuyuan" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>书院</h2><p>书院是独立组织单位，裁判直接归属须单独登记。</p></div><button className="admin-button" onClick={() => { setUnitType("SHUYUAN"); setModal("unit"); }} type="button">+ 新增书院</button></header><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>书院名称</th><th>已确认组成学院</th><th>关联球队数</th></tr></thead><tbody>{shuyuan.map((unit) => <tr key={unit.id}><td><strong>{unit.name}</strong></td><td>{unit.childIds.length ? unit.childIds.map((id) => colleges.find((college) => college.id === id)?.name).filter(Boolean).join("、") : "待补充"}</td><td>{teams.filter((team) => team.unitIds.includes(unit.id)).length}</td></tr>)}</tbody></table></div></section> : null}
    {tab === "mappings" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>学号代码映射</h2><p>学号前两位仅提供学院建议，最终以裁判员档案为准。</p></div><button className="admin-button" onClick={() => setModal("mapping")} type="button">+ 保存映射</button></header><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>前缀</th><th>建议学院</th><th>说明</th></tr></thead><tbody>{colleges.flatMap((college) => college.mappings.map((mapping) => <tr key={mapping.id}><td><strong>{mapping.prefix}</strong></td><td>{college.name}</td><td>{mapping.note || "—"}</td></tr>))}</tbody></table></div></section> : null}
    {tab === "relations" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>书院组成关系</h2><p>只记录已由管理员确认的组成学院，不由系统推断个人书院归属。</p></div></header><div className="admin-affiliation-list">{shuyuan.map((unit) => <form className="admin-affiliation-row" key={unit.id} onSubmit={(event) => void saveRelation(event, unit.id)}><div><strong>{unit.name}</strong><span>{unit.childIds.length ? `${unit.childIds.length} 个组成学院` : "组成关系待补充"}</span></div><select defaultValue={unit.childIds} multiple name="childUnitIds">{colleges.map((college) => <option key={college.id} value={college.id}>{college.label}</option>)}</select><button className="admin-button admin-button-secondary" type="submit">保存关系</button></form>)}</div></section> : null}
    {tab === "teams" ? <section className="admin-panel"><header className="admin-panel-header"><div><h2>参赛球队与组织关联</h2><p>管理参赛球队与学院、书院之间的组织关系，用于裁判选派时判断组织关联。普通学院/书院代表队可在创建比赛时按需自动建立。</p></div><div className="admin-page-actions"><button className="admin-button admin-button-secondary" onClick={() => setModal("from-units")} type="button">从组织创建</button><button className="admin-button admin-button-secondary" onClick={() => setModal("joint")} type="button">+ 联合队</button><button className="admin-button" onClick={() => setModal("bulk")} type="button">批量导入球队</button></div></header>{!competitions.length ? <div className="admin-empty-state"><strong>请先创建赛事后再创建参赛球队</strong><p>赛事是球队与比赛的上级对象。</p><Link className="admin-button" href="/referees/admin/matches/competitions/new">前往赛事管理</Link></div> : <div className="admin-affiliation-list">{teams.map((team) => <form className="admin-affiliation-row admin-team-affiliation-row" key={team.id} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/team-affiliations", "PUT", { teamId: team.id, teamType: form.get("teamType"), unitIds: form.getAll("unitIds") }), "球队组织关联已保存。"); }}><div><strong>{team.name}</strong><span>{team.competition}</span></div><select defaultValue={team.teamType} name="teamType"><option value="ORGANIZATION">固定组织代表队</option><option value="JOINT">联合队</option><option value="FREEFORM">自由组队</option></select><select defaultValue={team.unitIds} multiple name="unitIds"><AdminAffiliationOptionGroups options={units} /></select><button className="admin-button admin-button-secondary" type="submit">保存</button></form>)}</div>}</section> : null}
    {modal ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal"><header><div><span>ORGANIZATION & TEAMS</span><h2>{{ unit: unitType === "COLLEGE" ? "新增学院" : "新增书院", mapping: "保存学号前缀映射", bulk: "批量导入自由组队", "from-units": "从组织单位创建代表队", joint: "新建联合队" }[modal]}</h2></div><button aria-label="关闭" onClick={() => setModal(null)} type="button">×</button></header>
      {modal === "unit" ? <form className="admin-form" onSubmit={createUnit}><label><span>{unitType === "COLLEGE" ? "学院" : "书院"}名称</span><input maxLength={80} name="name" required /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" type="submit">创建</button></footer></form> : null}
      {modal === "mapping" ? <form className="admin-form" onSubmit={createMapping}><label><span>两位学号前缀</span><input autoCapitalize="characters" maxLength={2} minLength={2} name="prefix" placeholder="01 / CG" required /></label><label><span>建议学院</span><select name="collegeId" required>{colleges.map((college) => <option key={college.id} value={college.id}>{college.label}</option>)}</select></label><label><span>说明</span><input name="note" /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" type="submit">保存映射</button></footer></form> : null}
      {modal === "bulk" ? competitions.length ? <div className="admin-form"><div className="admin-form-grid"><label><span>赛事</span><select onChange={(event) => setImportCompetitionId(event.target.value)} value={importCompetitionId}>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label><label><span>导入方式</span><select onChange={(event) => setImportFormat(event.target.value as "paste" | "csv")} value={importFormat}><option value="paste">粘贴球队名单</option><option value="csv">CSV 文件 / 文本</option></select></label></div>{importFormat === "csv" ? <label><span>选择 CSV</span><input accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then(setImportText); }} type="file" /></label> : null}<label><span>{importFormat === "csv" ? "CSV 内容（须含 name 或 球队名称列）" : "每行一支球队"}</span><textarea onChange={(event) => setImportText(event.target.value)} placeholder={importFormat === "csv" ? "球队名称\n丁丁历险记\n海底小纵队" : "丁丁历险记\n海底小纵队\nBGV"} rows={10} value={importText} /></label><div className="admin-import-preview"><strong>导入预览：可创建 {preview.names.length} 支</strong>{preview.duplicates.length ? <p>已去除重复：{preview.duplicates.join("、")}</p> : null}{preview.existing.length ? <p>赛事中已存在：{preview.existing.join("、")}</p> : null}{preview.errors.map((error) => <p className="admin-import-error" key={error}>{error}</p>)}{preview.names.length ? <ol>{preview.names.map((name) => <li key={name}>{name}</li>)}</ol> : <p>输入名单后在此确认。</p>}</div><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" disabled={!preview.names.length || preview.errors.length > 0} onClick={() => void confirmBulk()} type="button">确认批量创建</button></footer></div> : <MissingCompetitionState /> : null}
      {modal === "from-units" ? competitions.length ? <form className="admin-form" onSubmit={fromUnits}><label><span>赛事</span><select name="competitionId" required>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label><label><span>组织单位（可多选）</span><select multiple name="unitIds" required size={10}><AdminAffiliationOptionGroups options={units} /></select></label><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" type="submit">批量创建代表队</button></footer></form> : <MissingCompetitionState /> : null}
      {modal === "joint" ? competitions.length ? <form className="admin-form" onSubmit={jointTeam}><label><span>赛事</span><select name="competitionId" required>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label><label><span>联合队名称</span><input maxLength={80} name="name" required /></label><label><span>关联组织单位（至少两个）</span><select multiple name="unitIds" required size={10}><AdminAffiliationOptionGroups options={units} /></select></label><footer><button className="admin-button admin-button-secondary" onClick={() => setModal(null)} type="button">取消</button><button className="admin-button" type="submit">创建联合队</button></footer></form> : <MissingCompetitionState /> : null}
    </div></div> : null}
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
