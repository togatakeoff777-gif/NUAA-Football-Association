"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { matchStatusLabels } from "@/components/referees/admin/admin-ui";

export type PositionDefinition = { key: string; label: string };
export type CompetitionOption = {
  id: string;
  name: string;
  format: "ELEVEN_A_SIDE" | "FUTSAL";
  teams: Array<{ id: string; name: string }>;
  positions: PositionDefinition[];
};
export type AdminMatchRecord = {
  id: string; slug: string; competitionId: string; stage: string; kickoff: string; endAt: string;
  venue: string; round: string; source: string; externalMatchId: string; homeTeamId: string; awayTeamId: string;
  status: string; applicationWindowStatus: string; applicationDeadline: string; publicNote: string;
  internalNote: string; cancellationReason: string; positionCounts: Record<string, number>;
};

function formText(form: FormData, name: string) { return String(form.get(name) ?? ""); }

function payload(form: FormData, definitions: PositionDefinition[]) {
  return {
    slug: formText(form, "slug"), competitionId: formText(form, "competitionId"), stage: formText(form, "stage"),
    kickoff: formText(form, "kickoff"), endAt: formText(form, "endAt"), venue: formText(form, "venue"),
    round: formText(form, "round"), source: formText(form, "source") || "MANUAL", externalMatchId: formText(form, "externalMatchId"),
    homeTeamId: formText(form, "homeTeamId"), awayTeamId: formText(form, "awayTeamId"), status: formText(form, "status"),
    applicationWindowStatus: formText(form, "applicationWindowStatus"), applicationDeadline: formText(form, "applicationDeadline"),
    publicNote: formText(form, "publicNote"), internalNote: formText(form, "internalNote"), cancellationReason: formText(form, "cancellationReason"),
    positionCounts: Object.fromEntries(definitions.map((position) => [position.key, Number(form.get(`position-${position.key}`) ?? 0)])),
  };
}

function PositionCounts({ definitions, defaults = {} }: { definitions: PositionDefinition[]; defaults?: Record<string, number> }) {
  return <div className="admin-position-count-grid">{definitions.map((position) => <label key={position.key}><span>{position.label}</span><input defaultValue={defaults[position.key] ?? 0} max={5} min={0} name={`position-${position.key}`} type="number" /></label>)}</div>;
}

export function AdminMatchForm({ competitions, match }: { competitions: CompetitionOption[]; match?: AdminMatchRecord }) {
  const router = useRouter();
  const [competitionId, setCompetitionId] = useState(match?.competitionId ?? competitions[0]?.id ?? "");
  const [tab, setTab] = useState<"basic" | "assignment" | "notes">("basic");
  const [message, setMessage] = useState("");
  const competition = competitions.find((item) => item.id === competitionId);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!competition) return;
    const response = await fetch(match ? `/api/referees/admin/matches/${match.id}` : "/api/referees/admin/matches", {
      method: match ? "PATCH" : "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload(new FormData(event.currentTarget), competition.positions)),
    });
    const result = (await response.json()) as { error?: string; id?: string; matchId?: string };
    if (!response.ok) { setMessage(result.error ?? "保存失败。"); return; }
    const id = match?.id ?? result.matchId ?? result.id;
    router.push(id ? `/referees/admin/matches/${id}` : "/referees/admin/matches");
    router.refresh();
  }
  async function copy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!match) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/referees/admin/matches/${match.id}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "copy", slug: form.get("copySlug"), stage: form.get("copyStage"), kickoff: form.get("copyKickoff") }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "场次副本已创建并保持关闭报名。" : result.error ?? "复制失败。");
    if (response.ok) router.push("/referees/admin/matches");
  }
  return <>
    <form className="admin-form" onSubmit={submit}>
      <nav aria-label="比赛表单分区" className="admin-tabs"><button aria-selected={tab === "basic"} onClick={() => setTab("basic")} role="tab" type="button">比赛信息</button><button aria-selected={tab === "assignment"} onClick={() => setTab("assignment")} role="tab" type="button">报名与岗位</button><button aria-selected={tab === "notes"} onClick={() => setTab("notes")} role="tab" type="button">说明与来源</button></nav>
      <section className="admin-form-section" hidden={tab !== "basic"}><header><h2>比赛信息</h2><p>维护赛程、双方、场地与当前比赛状态。</p></header><div className="admin-form-grid admin-form-grid-3">
        <label><span>赛事</span><select disabled={Boolean(match)} name="competitionId" onChange={(event) => setCompetitionId(event.target.value)} value={competitionId}>{competitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{match ? <input name="competitionId" type="hidden" value={competitionId} /> : null}</label>
        <label><span>页面标识</span><input defaultValue={match?.slug} name="slug" required /></label>
        <label><span>阶段</span><input defaultValue={match?.stage} name="stage" required /></label>
        <label><span>标准轮次</span><input defaultValue={match?.round} name="round" /></label>
        <label><span>开球时间</span><input defaultValue={match?.kickoff} name="kickoff" required type="datetime-local" /></label>
        <label><span>预计结束</span><input defaultValue={match?.endAt} name="endAt" type="datetime-local" /></label>
        <label><span>比赛场地</span><input defaultValue={match?.venue} name="venue" required /></label>
        <label><span>主队</span><select defaultValue={match?.homeTeamId} name="homeTeamId" required><option value="">请选择</option>{competition?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label><span>客队</span><select defaultValue={match?.awayTeamId} name="awayTeamId" required><option value="">请选择</option>{competition?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label><span>比赛状态</span><select defaultValue={match?.status ?? "SCHEDULED"} name="status">{Object.entries(matchStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>取消原因</span><input defaultValue={match?.cancellationReason} name="cancellationReason" /></label>
      </div></section>
      <section className="admin-form-section" hidden={tab !== "assignment"}><header><h2>报名与岗位</h2><p>岗位名称由当前比赛制式模板集中维护。</p></header><div className="admin-form-grid">
        <label><span>报名窗口</span><select defaultValue={match?.applicationWindowStatus ?? "CLOSED"} name="applicationWindowStatus"><option value="CLOSED">关闭</option><option value="OPEN">开放</option></select></label>
        <label><span>报名截止</span><input defaultValue={match?.applicationDeadline} name="applicationDeadline" type="datetime-local" /></label>
      </div>{competition ? <PositionCounts defaults={match?.positionCounts} definitions={competition.positions} /> : null}</section>
      <section className="admin-form-section" hidden={tab !== "notes"}><header><h2>说明与来源</h2><p>保留同步预留字段，不在 R1 调用足球中国 API。</p></header><div className="admin-form-grid">
        <label><span>数据来源</span><select defaultValue={match?.source ?? "MANUAL"} name="source"><option value="MANUAL">手工维护</option><option value="FOOTBALL_CHINA">足球中国</option></select></label>
        <label><span>外部比赛 ID</span><input defaultValue={match?.externalMatchId} name="externalMatchId" placeholder="当前不自行生成" /></label>
      </div><label><span>公开说明</span><textarea defaultValue={match?.publicNote} name="publicNote" /></label><label><span>内部备注</span><textarea defaultValue={match?.internalNote} name="internalNote" /></label></section>
      <p aria-live="polite" className="admin-form-message">{message}</p>
      <footer><button className="admin-button admin-button-secondary" onClick={() => router.back()} type="button">取消</button><button className="admin-button" type="submit">{match ? "保存比赛" : "创建比赛"}</button></footer>
    </form>
    {match ? <form className="admin-copy-form" onSubmit={copy}><header><strong>复制为新场次</strong><span>副本默认关闭报名。</span></header><input name="copySlug" placeholder="新页面标识" required /><input name="copyStage" placeholder="新阶段" required /><input name="copyKickoff" required type="datetime-local" /><button className="admin-button admin-button-secondary" type="submit">复制比赛</button></form> : null}
  </>;
}
