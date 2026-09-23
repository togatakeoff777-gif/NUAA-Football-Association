"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Settings = {
  activeCompetitionId: string | null;
  directoryPublished: boolean;
  contactName: string | null;
  contactTitle: string | null;
  contactQQ: string | null;
  contactEmail: string | null;
};
type Team = {
  id: string; name: string; publicStatus: string | null; publicContactName: string | null;
  publicContactRole: string | null; publicContactQQ: string | null; publicContactEmail: string | null;
  publicDirectoryNote: string | null; directoryIsPublic: boolean; directoryPublicOrder: number;
};

async function save(url: string, body: unknown) {
  const response = await fetch(url, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "保存失败。");
}

export function TeamDirectoryManager({ settings, competitions, selectedId, teams, canWrite }: {
  settings: Settings | null;
  competitions: Array<{ id: string; name: string; year: number | null; publicPublished: boolean }>;
  selectedId: string | null;
  teams: Team[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Team | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const activeCompetitionId = String(form.get("activeCompetitionId") || "");
    setBusy(true); setMessage("");
    try {
      await save("/api/admin/team-directory", {
        activeCompetitionId: activeCompetitionId || null,
        directoryPublished: form.get("directoryPublished") === "on",
        contactName: String(form.get("contactName") || ""),
        contactTitle: String(form.get("contactTitle") || ""),
        contactQQ: String(form.get("contactQQ") || ""),
        contactEmail: String(form.get("contactEmail") || ""),
      });
      setMessage("页面设置已保存，下一次公开请求即可看到更新。");
      router.push(activeCompetitionId ? `/admin/team-directory?competition=${encodeURIComponent(activeCompetitionId)}` : "/admin/team-directory");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败。"); }
    finally { setBusy(false); }
  }

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !selectedId) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      await save(`/api/admin/team-directory/teams/${encodeURIComponent(editing.id)}`, {
        competitionId: selectedId,
        publicStatus: String(form.get("publicStatus") || ""),
        publicContactName: String(form.get("publicContactName") || ""),
        publicContactRole: String(form.get("publicContactRole") || ""),
        publicContactQQ: String(form.get("publicContactQQ") || ""),
        publicContactEmail: String(form.get("publicContactEmail") || ""),
        publicDirectoryNote: String(form.get("publicDirectoryNote") || ""),
        directoryIsPublic: form.get("directoryIsPublic") === "on",
        directoryPublicOrder: Number(form.get("directoryPublicOrder")),
      });
      setMessage("球队公开信息已保存。");
      setEditing(null);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败。"); }
    finally { setBusy(false); }
  }

  return <>
    <section className="admin-panel">
      <header className="admin-panel-header"><div><h2>球队信息页设置</h2><p>选择当前公开赛事，并维护协会层面的球队信息联系人。测试赛事不会出现在候选列表。</p></div></header>
      <div className="admin-panel-body">
        <form className="admin-form" onSubmit={submitSettings}>
          <div className="admin-form-grid">
            <label><span>当前展示目录</span><select defaultValue={settings?.activeCompetitionId ?? ""} disabled={!canWrite} name="activeCompetitionId"><option value="">暂不选择赛事</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.year && !competition.name.includes(String(competition.year)) ? `${competition.year} ` : ""}{competition.name}{competition.publicPublished ? "" : " · 赛事详情未公开"}</option>)}</select></label>
            <label><span>是否公开当前目录</span><span><input defaultChecked={settings?.directoryPublished ?? false} disabled={!canWrite} name="directoryPublished" type="checkbox" /> 在官网显示当前赛事的已公开球队</span></label>
            <label><span>球队信息负责人</span><input defaultValue={settings?.contactName ?? ""} disabled={!canWrite} maxLength={80} name="contactName" /></label>
            <label><span>职务</span><input defaultValue={settings?.contactTitle ?? ""} disabled={!canWrite} maxLength={80} name="contactTitle" /></label>
            <label><span>咨询 QQ</span><input defaultValue={settings?.contactQQ ?? ""} disabled={!canWrite} maxLength={40} name="contactQQ" /></label>
            <label><span>联系邮箱</span><input defaultValue={settings?.contactEmail ?? ""} disabled={!canWrite} maxLength={254} name="contactEmail" type="email" /></label>
          </div>
          {canWrite ? <footer><button className="admin-button" disabled={busy} type="submit">保存页面设置</button></footer> : null}
        </form>
      </div>
    </section>
    <section className="admin-panel">
      <header className="admin-panel-header"><div><h2>赛事球队目录</h2><p>仅维护现有赛事球队的公开信息；请勿录入私人联系方式或内部备注。</p></div></header>
      <div className="admin-panel-body admin-form"><label className="admin-field-label" htmlFor="directory-competition">查看赛事球队</label><select id="directory-competition" onChange={(event) => router.push(`/admin/team-directory?competition=${encodeURIComponent(event.target.value)}`)} value={selectedId ?? ""}><option value="">选择赛事</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.year && !competition.name.includes(String(competition.year)) ? `${competition.year} ` : ""}{competition.name}</option>)}</select></div>
      <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>球队</th><th>组队状态</th><th>负责人</th><th>公开联系方式</th><th>官网公开</th><th>排序</th><th>操作</th></tr></thead><tbody>{teams.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.publicStatus ?? "—"}</td><td>{team.publicContactName ?? "—"}</td><td>{[team.publicContactQQ, team.publicContactEmail].filter(Boolean).join(" / ") || "—"}</td><td>{team.directoryIsPublic ? "是" : "否"}</td><td>{team.directoryPublicOrder}</td><td className="admin-table-actions">{canWrite ? <button onClick={() => setEditing(team)} type="button">编辑</button> : "—"}</td></tr>)}</tbody></table>{teams.length === 0 ? <p className="admin-panel-body">该赛事尚无球队；请到“组织与球队”创建或关联球队。</p> : null}</div>
    </section>
    {editing ? <section className="admin-panel" aria-labelledby="directory-editor-title">
      <header className="admin-panel-header"><div><h2 id="directory-editor-title">编辑 {editing.name} 的官网公开信息</h2><p>下列内容会显示在公开网站。请仅填写负责人已同意公开的 QQ、邮箱与说明。</p></div></header>
      <div className="admin-panel-body"><form className="admin-form" key={editing.id} onSubmit={submitTeam}>
        <div className="admin-form-grid">
          <label><span>组队状态</span><input defaultValue={editing.publicStatus ?? ""} list="directory-statuses" maxLength={80} name="publicStatus" /><datalist id="directory-statuses"><option value="筹备中" /><option value="招募中" /><option value="已组队" /><option value="已确认参赛" /><option value="招募结束" /></datalist></label>
          <label><span>负责人姓名</span><input defaultValue={editing.publicContactName ?? ""} maxLength={80} name="publicContactName" /></label>
          <label><span>负责人身份 / 备注</span><input defaultValue={editing.publicContactRole ?? ""} maxLength={80} name="publicContactRole" /></label>
          <label><span>公开 QQ</span><input defaultValue={editing.publicContactQQ ?? ""} maxLength={40} name="publicContactQQ" /></label>
          <label><span>公开邮箱</span><input defaultValue={editing.publicContactEmail ?? ""} maxLength={254} name="publicContactEmail" type="email" /></label>
          <label><span>公开排序</span><input defaultValue={editing.directoryPublicOrder} max={100000} min={0} name="directoryPublicOrder" required type="number" /></label>
        </div>
        <label><span>公开说明</span><textarea defaultValue={editing.publicDirectoryNote ?? ""} maxLength={1000} name="publicDirectoryNote" /></label>
        <label><span><input defaultChecked={editing.directoryIsPublic} name="directoryIsPublic" type="checkbox" /> 在官网显示此球队</span><small>关闭后此球队不会出现在公开组队目录。</small></label>
        <footer><button className="admin-button admin-button-secondary" onClick={() => setEditing(null)} type="button">取消</button><button className="admin-button" disabled={busy} type="submit">保存球队公开信息</button></footer>
      </form></div>
    </section> : null}
    <p aria-live="polite" className="admin-form-message">{message}</p>
  </>;
}
