"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppointmentPositionKey } from "@/generated/prisma/browser";

type RefereeOption = { id: string; label: string; elevenASide: boolean; futsal: boolean };
type ApplicationRow = {
  id: string; referee: string; match: string; competition: string; status: string;
  preferred: string; note: string | null; createdAt: string;
};
type MatchEditor = {
  id: string; label: string; status: string; publicationNote: string; format: "ELEVEN_A_SIDE" | "FUTSAL";
  template: { key: AppointmentPositionKey; label: string }[];
  positions: { key: AppointmentPositionKey; refereeId: string | null }[];
};
type HistoryRow = { id: string; match: string; competition: string; status: string; updatedAt: string };

function ApplicationReview({ item }: { item: ApplicationRow }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/referees/admin/applications/${item.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: form.get("status"), reviewNote: form.get("reviewNote") }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "审核结果已保存。" : result.error ?? "保存失败。" );
    if (response.ok) router.refresh();
  }
  return (
    <article className="referee-admin-card">
      <header><div><span>{item.competition}</span><h3>{item.match}</h3></div><strong data-state={item.status}>{item.status}</strong></header>
      <dl><div><dt>裁判员</dt><dd>{item.referee}</dd></div><div><dt>意向岗位</dt><dd>{item.preferred}</dd></div><div><dt>提交时间</dt><dd>{item.createdAt}</dd></div><div><dt>补充说明</dt><dd>{item.note || "—"}</dd></div></dl>
      <form onSubmit={submit}>
        <select defaultValue={item.status === "已通过" ? "APPROVED" : item.status === "未通过" ? "REJECTED" : "PENDING"} name="status">
          <option value="PENDING">待审核</option><option value="APPROVED">通过</option><option value="REJECTED">不通过</option>
        </select>
        <input maxLength={240} name="reviewNote" placeholder="审核备注（选填）" />
        <button type="submit">保存审核</button>
      </form>
      <p aria-live="polite">{message}</p>
    </article>
  );
}

function AppointmentEditor({ match, referees }: { match: MatchEditor; referees: RefereeOption[] }) {
  const router = useRouter();
  const initial = new Map(match.positions.map((item) => [item.key, item.refereeId]));
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(match.template.map((item) => [item.key, initial.has(item.key)])));
  const [assigned, setAssigned] = useState<Record<string, string>>(() => Object.fromEntries(match.template.map((item) => [item.key, initial.get(item.key) ?? ""])));
  const [message, setMessage] = useState("");
  const eligibleReferees = referees.filter((referee) => match.format === "ELEVEN_A_SIDE" ? referee.elevenASide : referee.futsal);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const positions = match.template.filter((item) => enabled[item.key]).map((item) => ({ key: item.key, refereeId: assigned[item.key] || null }));
    const response = await fetch(`/api/referees/admin/appointments/${match.id}`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ positions, publicationNote: form.get("publicationNote") }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "选派草稿已写入数据库。" : result.error ?? "保存失败。" );
    if (response.ok) router.refresh();
  }

  async function action(actionName: "publish" | "withdraw") {
    const response = await fetch(`/api/referees/admin/appointments/${match.id}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: actionName }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? (actionName === "publish" ? "选派已发布。" : "公开选派已撤回，历史记录仍保留。") : result.error ?? "操作失败。" );
    if (response.ok) router.refresh();
  }

  return (
    <article className="referee-appointment-editor">
      <header><h3>{match.label}</h3><strong data-state={match.status}>{match.status}</strong></header>
      <form onSubmit={save}>
        <div className="referee-position-editor">
          {match.template.map((position) => (
            <div key={position.key}>
              <label><input checked={enabled[position.key]} onChange={(event) => setEnabled((current) => ({ ...current, [position.key]: event.target.checked }))} type="checkbox" /><span>{position.label}</span></label>
              <select disabled={!enabled[position.key]} onChange={(event) => setAssigned((current) => ({ ...current, [position.key]: event.target.value }))} value={assigned[position.key]}>
                <option value="">待分配</option>{eligibleReferees.map((referee) => <option key={referee.id} value={referee.id}>{referee.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <input defaultValue={match.publicationNote} maxLength={240} name="publicationNote" placeholder="公示备注（选填）" />
        <div className="referee-admin-actions"><button type="submit">保存草稿</button><button onClick={() => action("publish")} type="button">发布选派</button><button className="referee-danger-button" onClick={() => action("withdraw")} type="button">撤回发布</button></div>
      </form>
      <p aria-live="polite">{message}</p>
    </article>
  );
}

export function AdminRefereePanel({ applications, matches, referees, history }: { applications: ApplicationRow[]; matches: MatchEditor[]; referees: RefereeOption[]; history: HistoryRow[] }) {
  const router = useRouter();
  async function logout() { await fetch("/api/referees/admin/logout", { method: "POST" }); router.replace("/referees/admin/login"); router.refresh(); }
  return (
    <>
      <div className="referee-admin-toolbar"><p>所有写操作均由服务端再次校验并持久化到 SQLite。</p><button onClick={logout} type="button">退出后台</button></div>
      <section className="referee-admin-section" id="applications"><h2>报名意向</h2>{applications.length ? <div className="referee-admin-list">{applications.map((item) => <ApplicationReview item={item} key={item.id} />)}</div> : <div className="functional-empty"><strong>当前筛选条件下没有报名记录</strong><p>可调整赛事、比赛或状态筛选条件。</p></div>}</section>
      <section className="referee-admin-section" id="appointments"><h2>组建裁判组与发布</h2><div className="referee-admin-list">{matches.map((match) => <AppointmentEditor key={match.id} match={match} referees={referees} />)}</div></section>
      <section className="referee-admin-section" id="history"><h2>选派操作历史</h2><div className="referee-admin-history">{history.map((item) => <article key={item.id}><div><span>{item.competition}</span><strong>{item.match}</strong></div><b data-state={item.status}>{item.status}</b><time>{item.updatedAt}</time></article>)}</div></section>
    </>
  );
}
