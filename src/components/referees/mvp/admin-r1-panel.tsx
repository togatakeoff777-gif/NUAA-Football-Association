"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type College = { id: string; name: string; mappings: Array<{ id: string; prefix: string }> };
type Team = { id: string; name: string; competition: string; collegeIds: string[] };
type Referee = { id: string; label: string; availability: Array<{ id: string; kind: string; startAt: string; endAt: string; note: string }> };
type ConflictReport = { id: string; referee: string; match: string; reason: string; reportedAt: string; status: string; resolutionNote: string };
type Statistic = { refereeId: string; publicCode: string; name: string; totalMatches: number; positions: Record<string, number>; competitions: Array<{ name: string; count: number }> };
type Version = { id: string; appointment: string; revision: number; status: string; reason: string; overrideReason: string; actor: string; createdAt: string };
type AdminAccount = { id: string; username: string; displayName: string; role: string; isActive: boolean; lastLoginAt: string };

async function api(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "操作失败。");
}

export function AdminR1Panel({
  overview,
  colleges,
  teams,
  referees,
  conflictReports,
  statistics,
  versions,
  adminAccounts,
  actorRole,
  actorName,
  isLegacy,
  mustChangePassword,
}: {
  overview: { todayMatches: number; awaitingAssignment: number; published: number; pendingReports: number };
  colleges: College[];
  teams: Team[];
  referees: Referee[];
  conflictReports: ConflictReport[];
  statistics: Statistic[];
  versions: Version[];
  adminAccounts: AdminAccount[];
  actorRole: string;
  actorName: string;
  isLegacy: boolean;
  mustChangePassword: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function run(operation: () => Promise<void>) {
    setMessage("");
    try {
      await operation();
      setMessage("操作已保存。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败。");
    }
  }

  return (
    <section className="referee-admin-section referee-r1-admin" id="r1-overview">
      <header className="referee-admin-section-title">
        <div><p>V2.9 R1</p><h2>裁判中心后台概览</h2></div>
        <span>{actorName} · {actorRole}{isLegacy ? " · 兼容登录" : ""}</span>
      </header>
      <p aria-live="polite" className="referee-form-message">{message}</p>
      {!isLegacy ? <details open={mustChangePassword}><summary><strong>管理员密码</strong></summary>
        {mustChangePassword ? <p className="referee-warning-copy">当前账号须完成首次密码修改。</p> : null}
        <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const newPassword = String(form.get("newPassword") ?? ""); const confirmation = String(form.get("confirmation") ?? ""); if (newPassword !== confirmation) { setMessage("两次输入的新密码不一致。"); return; } void run(() => api("/api/referees/admin/account/password", "POST", { currentPassword: form.get("currentPassword"), newPassword })); }}><input autoComplete="current-password" name="currentPassword" placeholder="当前密码" required type="password" /><input autoComplete="new-password" minLength={12} name="newPassword" placeholder="新密码（至少 12 位）" required type="password" /><input autoComplete="new-password" minLength={12} name="confirmation" placeholder="再次输入新密码" required type="password" /><button type="submit">修改个人密码</button></form>
      </details> : null}
      <div className="referee-r1-metrics">
        <article><span>今日比赛</span><strong>{overview.todayMatches}</strong></article>
        <article><span>待选派</span><strong>{overview.awaitingAssignment}</strong></article>
        <article><span>已发布</span><strong>{overview.published}</strong></article>
        <article><span>待处理冲突报告</span><strong>{overview.pendingReports}</strong></article>
      </div>

      <details open><summary><strong>学院与球队</strong></summary>
        <div className="referee-r1-grid">
          <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/colleges", "POST", { action: "create-college", name: form.get("name") })); }}>
            <h3>新增学院</h3><input maxLength={80} name="name" required /><button type="submit">新增学院</button>
          </form>
          <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/colleges", "POST", { action: "upsert-mapping", prefix: form.get("prefix"), collegeId: form.get("collegeId"), note: form.get("note") })); }}>
            <h3>学号前缀映射</h3><input maxLength={2} minLength={2} name="prefix" required /><select name="collegeId" required>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select><input name="note" /><button type="submit">保存映射</button>
          </form>
        </div>
        <p>当前映射：{colleges.flatMap((college) => college.mappings.map((mapping) => `${mapping.prefix} → ${college.name}`)).join("；") || "无"}</p>
        <div className="referee-admin-list">{teams.map((team) => <form key={team.id} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/team-affiliations", "PUT", { teamId: team.id, collegeIds: form.getAll("collegeIds") })); }}><strong>{team.competition} · {team.name}</strong><select defaultValue={team.collegeIds} multiple name="collegeIds">{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select><button type="submit">保存球队学院</button></form>)}</div>
      </details>

      <details><summary><strong>管理员代维护可执裁时间</strong></summary>
        <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/availability", "POST", { refereeId: form.get("refereeId"), startAt: form.get("startAt"), endAt: form.get("endAt"), kind: form.get("kind"), note: form.get("note") })); }}>
          <select name="refereeId" required>{referees.map((referee) => <option key={referee.id} value={referee.id}>{referee.label}</option>)}</select><input name="startAt" required type="datetime-local" /><input name="endAt" required type="datetime-local" /><select name="kind"><option value="AVAILABLE">可执裁</option><option value="UNAVAILABLE">不可执裁</option></select><input name="note" placeholder="说明" /><button type="submit">新增</button>
        </form>
        <div className="referee-admin-list">{referees.flatMap((referee) => referee.availability.map((item) => <article key={item.id}><strong>{referee.label} · {item.kind}</strong><p>{item.startAt} — {item.endAt} {item.note}</p><button onClick={() => run(() => api("/api/referees/admin/availability", "DELETE", { id: item.id, refereeId: referee.id }))} type="button">删除</button></article>))}</div>
      </details>

      <details open={conflictReports.some((item) => item.status === "PENDING")}><summary><strong>裁判冲突报告</strong></summary>
        <div className="referee-admin-list">{conflictReports.map((report) => <article key={report.id}><strong>{report.referee} · {report.match}</strong><p>{report.reason}</p><span>{report.status} · {report.reportedAt}</span>{report.resolutionNote ? <p>{report.resolutionNote}</p> : null}{report.status === "PENDING" ? <div><button onClick={() => { const note = window.prompt("处理说明"); if (note) void run(() => api(`/api/referees/admin/conflict-reports/${report.id}`, "PATCH", { status: "RESOLVED", resolutionNote: note })); }} type="button">标记已处理</button><button onClick={() => { const note = window.prompt("驳回说明"); if (note) void run(() => api(`/api/referees/admin/conflict-reports/${report.id}`, "PATCH", { status: "DISMISSED", resolutionNote: note })); }} type="button">驳回</button></div> : null}</article>)}</div>
      </details>

      <details><summary><strong>执裁统计（仅 COMPLETED）</strong></summary>
        <div className="referee-admin-list">{statistics.map((item) => <article key={item.refereeId}><strong>{item.publicCode} · {item.name} · {item.totalMatches} 场</strong><p>{Object.entries(item.positions).map(([key, count]) => `${key}: ${count}`).join("；") || "暂无岗位统计"}</p><p>{item.competitions.map((competition) => `${competition.name}: ${competition.count}`).join("；")}</p></article>)}</div>
      </details>

      <details><summary><strong>选派版本历史</strong></summary>
        <div className="referee-admin-history">{versions.map((version) => <article key={version.id}><div><span>v{version.revision} · {version.status}</span><strong>{version.appointment}</strong><p>{version.reason || "无修改原因"}{version.overrideReason ? ` · 覆盖：${version.overrideReason}` : ""}</p></div><b>{version.actor}</b><time>{version.createdAt}</time></article>)}</div>
      </details>

      <details><summary><strong>管理员账号</strong></summary>
        {actorRole === "SUPER_ADMIN" ? <><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(() => api("/api/referees/admin/admin-accounts", "POST", { username: form.get("username"), displayName: form.get("displayName"), password: form.get("password"), role: form.get("role") })); }}><input name="username" placeholder="账号" required /><input name="displayName" placeholder="姓名" required /><input minLength={12} name="password" placeholder="初始密码" required type="password" /><select name="role"><option value="REFEREE_MANAGER">裁判管理员</option><option value="SUPER_ADMIN">最高权限管理员</option></select><button type="submit">创建管理员</button></form><div className="referee-admin-list">{adminAccounts.map((account) => <article key={account.id}><strong>{account.username} · {account.displayName}</strong><p>{account.role} · {account.isActive ? "启用" : "停用"} · 最近登录 {account.lastLoginAt || "—"}</p><button onClick={() => run(() => api("/api/referees/admin/admin-accounts", "PATCH", { id: account.id, isActive: !account.isActive }))} type="button">{account.isActive ? "停用" : "启用"}</button></article>)}</div></> : <p>只有最高权限管理员可以查看和管理账号。</p>}
      </details>
    </section>
  );
}
