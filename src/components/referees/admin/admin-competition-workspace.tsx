"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { parsePastedTeamNames, parseTeamCsv, type TeamImportPreview } from "@/lib/referee-team-import";

export type CompetitionWorkspaceUnit = {
  id: string;
  name: string;
  label: string;
  type: "COLLEGE" | "SHUYUAN";
};

export type CompetitionWorkspaceTeam = {
  id: string;
  name: string;
  teamType: "ORGANIZATION" | "JOINT" | "FREEFORM";
  unitIds: string[];
  matchCount: number;
};

const teamTypeLabels = { ORGANIZATION: "固定组织代表队", JOINT: "联合队", FREEFORM: "自由组队" } as const;

async function teamApi(body: unknown) {
  const response = await fetch("/api/referees/admin/teams", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, result: (await response.json()) as { error?: string } };
}

export function AdminCompetitionWorkspace({
  competition,
  units,
  teams,
  matches,
  canWrite,
}: {
  competition: { id: string; name: string; formatLabel: string; statusLabel: string; year: number | null; slug: string };
  units: CompetitionWorkspaceUnit[];
  teams: CompetitionWorkspaceTeam[];
  matches: Array<{ id: string; matchup: string; kickoff: string; venue: string; status: string }>;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<"overview" | "teams" | "matches">("overview");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [jointSelected, setJointSelected] = useState<string[]>([]);
  const [jointName, setJointName] = useState("");
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<TeamImportPreview>(() => parsePastedTeamNames("", teams.map((team) => team.name)));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const existingUnitIds = useMemo(() => new Set(teams.filter((team) => team.teamType === "ORGANIZATION").flatMap((team) => team.unitIds)), [teams]);
  const visibleUnits = units.filter((unit) => `${unit.label} ${unit.name}`.toLocaleLowerCase("zh-CN").includes(search.trim().toLocaleLowerCase("zh-CN")));
  const creatableVisible = visibleUnits.filter((unit) => !existingUnitIds.has(unit.id));

  function toggle(list: string[], setter: (value: string[]) => void, id: string) {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function createOrganizationTeams() {
    if (!selected.length) { setMessage("请至少选择一个尚未创建的组织单位。"); return; }
    setSubmitting(true);
    const { response, result } = await teamApi({ action: "from-units", competitionId: competition.id, unitIds: selected });
    setSubmitting(false);
    setMessage(response.ok ? `已完成批量创建请求（${selected.length} 个组织）。` : result.error ?? "代表队创建失败。");
    if (response.ok) { setSelected([]); router.refresh(); }
  }

  async function createJoint() {
    if (jointSelected.length < 2) { setMessage("联合队须选择至少两个组织单位。"); return; }
    setSubmitting(true);
    const { response, result } = await teamApi({ action: "joint", competitionId: competition.id, name: jointName, unitIds: jointSelected });
    setSubmitting(false);
    setMessage(response.ok ? `联合队“${jointName}”已创建。` : result.error ?? "联合队创建失败。");
    if (response.ok) { setJointName(""); setJointSelected([]); router.refresh(); }
  }

  function previewImport(value: string, csv = false) {
    setImportText(value);
    setImportPreview(csv ? parseTeamCsv(value, teams.map((team) => team.name)) : parsePastedTeamNames(value, teams.map((team) => team.name)));
  }

  async function createFreeformTeams() {
    if (!importPreview.names.length || importPreview.errors.length) { setMessage(importPreview.errors[0] ?? "没有可导入的新球队。"); return; }
    setSubmitting(true);
    const { response, result } = await teamApi({ action: "bulk", competitionId: competition.id, names: importPreview.names });
    setSubmitting(false);
    setMessage(response.ok ? `已导入 ${importPreview.names.length} 支自由组队球队。` : result.error ?? "球队导入失败。");
    if (response.ok) { previewImport(""); router.refresh(); }
  }

  async function deleteTeam(team: CompetitionWorkspaceTeam) {
    if (!window.confirm(`确认删除当前赛事中的球队“${team.name}”？\n\n已有比赛或正式历史引用时，服务端会拒绝删除。`)) return;
    const response = await fetch(`/api/referees/admin/teams/${team.id}`, { method: "DELETE" });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? `球队“${team.name}”已删除。` : result.error ?? "球队删除失败。");
    if (response.ok) router.refresh();
  }

  return <>
    <nav aria-label="赛事工作台分区" className="admin-tabs admin-workspace-tabs" role="tablist">
      <button aria-selected={section === "overview"} onClick={() => setSection("overview")} role="tab" type="button">赛事资料</button>
      <button aria-selected={section === "teams"} onClick={() => setSection("teams")} role="tab" type="button">参赛球队（{teams.length}）</button>
      <button aria-selected={section === "matches"} onClick={() => setSection("matches")} role="tab" type="button">比赛 / 赛程（{matches.length}）</button>
    </nav>

    <section className="admin-panel" hidden={section !== "overview"}>
      <header className="admin-panel-header"><div><h2>赛事资料</h2><p>当前赛事上下文贯穿球队与赛程操作；公开发布开关不在本工作台中自动变更。</p></div>{canWrite ? <Link className="admin-button" href={`/admin/competitions/${competition.id}/edit`}>编辑赛事资料</Link> : null}</header>
      <dl className="admin-detail-meta"><div><dt>赛事名称</dt><dd>{competition.name}</dd></div><div><dt>比赛制式</dt><dd>{competition.formatLabel}</dd></div><div><dt>状态</dt><dd>{competition.statusLabel}</dd></div><div><dt>年份</dt><dd>{competition.year ?? "未设置"}</dd></div><div><dt>页面标识</dt><dd>{competition.slug}</dd></div></dl>
    </section>

    <section className="admin-panel admin-workspace-team-panel" hidden={section !== "teams"}>
      <header className="admin-panel-header"><div><h2>参赛球队</h2><p>这里只管理“{competition.name}”的参赛球队，不会引入其他赛事的球队。</p></div></header>
      {teams.length ? <div className="admin-team-cards">{teams.map((team) => <article className="admin-team-card" key={team.id}><div><strong>{team.name}</strong><span>{teamTypeLabels[team.teamType]} · {team.matchCount ? `已关联 ${team.matchCount} 场比赛` : "尚无比赛引用"}</span></div>{canWrite ? <button className="admin-button admin-button-danger admin-button-quiet" onClick={() => void deleteTeam(team)} type="button">删除球队</button> : null}</article>)}</div> : <div className="admin-empty-state"><strong>当前赛事尚无参赛球队</strong><p>先从组织单位创建代表队、创建联合队，或导入自由组队球队。</p></div>}
      {canWrite ? <div className="admin-workspace-operations">
        <details open><summary>添加组织代表队</summary><div className="admin-operation-body">
          <div className="admin-selection-toolbar"><input aria-label="搜索组织" onChange={(event) => setSearch(event.target.value)} placeholder="搜索组织…" value={search} /><button onClick={() => setSelected([...new Set([...selected, ...creatableVisible.map((unit) => unit.id)])])} type="button">全选当前结果</button><button onClick={() => setSelected([])} type="button">清空</button><strong>已选择 {selected.length} 个</strong></div>
          <div className="admin-checkbox-list admin-unit-picker">{visibleUnits.map((unit) => { const existing = existingUnitIds.has(unit.id); return <label data-existing={existing} data-selected={selected.includes(unit.id)} key={unit.id}><input checked={existing || selected.includes(unit.id)} disabled={existing} onChange={() => toggle(selected, setSelected, unit.id)} type="checkbox" /> <span>{unit.label}</span>{existing ? <small>已存在于当前赛事</small> : null}</label>; })}</div>
          <button className="admin-button" disabled={submitting || !selected.length} onClick={() => void createOrganizationTeams()} type="button">批量创建代表队</button>
        </div></details>
        <details><summary>创建联合队</summary><div className="admin-operation-body"><label><span>联合队名称</span><input maxLength={80} onChange={(event) => setJointName(event.target.value)} value={jointName} /></label><div className="admin-selection-toolbar"><button onClick={() => setJointSelected(units.map((unit) => unit.id))} type="button">全选</button><button onClick={() => setJointSelected([])} type="button">清空</button><strong>已选择 {jointSelected.length} 个</strong></div><div className="admin-checkbox-list admin-unit-picker">{units.map((unit) => <label data-selected={jointSelected.includes(unit.id)} key={unit.id}><input checked={jointSelected.includes(unit.id)} onChange={() => toggle(jointSelected, setJointSelected, unit.id)} type="checkbox" /> <span>{unit.label}</span></label>)}</div><button className="admin-button" disabled={submitting || !jointName.trim() || jointSelected.length < 2} onClick={() => void createJoint()} type="button">创建联合队</button></div></details>
        <details><summary>批量导入自由组队球队</summary><div className="admin-operation-body"><label><span>每行一个球队名称</span><textarea onChange={(event) => previewImport(event.target.value)} rows={7} value={importText} /></label><label className="admin-file-input"><span>或读取 CSV（name / 球队名称列）</span><input accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then((value) => previewImport(value, true)); }} type="file" /></label><p>可创建 {importPreview.names.length} 支；当前赛事已存在 {importPreview.existing.length} 支；输入内重复 {importPreview.duplicates.length} 项。</p>{importPreview.errors.map((error) => <p className="admin-form-message" key={error}>{error}</p>)}<button className="admin-button" disabled={submitting || !importPreview.names.length || Boolean(importPreview.errors.length)} onClick={() => void createFreeformTeams()} type="button">批量导入球队</button></div></details>
      </div> : null}
      <p aria-live="polite" className="admin-form-message">{message}</p>
    </section>

    <section className="admin-panel" hidden={section !== "matches"}>
      <header className="admin-panel-header"><div><h2>比赛 / 赛程</h2><p>新建比赛时赛事固定为当前上下文，主客队仅来自本赛事参赛球队。</p></div>{canWrite && teams.length ? <Link className="admin-button" href={`/admin/matches/new?competition=${competition.id}&from=workspace`}>+ 新建比赛</Link> : null}</header>
      {!teams.length ? <div className="admin-empty-state"><strong>当前赛事尚无参赛球队。</strong><p>请先添加参赛球队，再创建比赛。</p><button className="admin-button" onClick={() => setSection("teams")} type="button">前往添加球队</button></div> : matches.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>比赛</th><th>时间</th><th>场地</th><th>状态</th><th>操作</th></tr></thead><tbody>{matches.map((match) => <tr key={match.id}><td><strong>{match.matchup}</strong></td><td>{match.kickoff}</td><td>{match.venue}</td><td>{match.status}</td><td><Link href={`/admin/matches/${match.id}`}>进入比赛</Link></td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><strong>当前赛事尚无比赛</strong><p>参赛球队已就绪，可以创建第一场比赛。</p></div>}
    </section>
  </>;
}
