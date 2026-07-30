"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";

type PositionDefinition = { key: string; label: string };
type CompetitionOption = {
  id: string;
  name: string;
  format: "ELEVEN_A_SIDE" | "FUTSAL";
  teams: { id: string; name: string }[];
  positions: PositionDefinition[];
};
type AccountRow = {
  id: string;
  publicCode: string;
  name: string;
  status: string;
  elevenASide: boolean;
  futsal: boolean;
  certificateNote: string;
  trainingStatus: string;
  publicDirectoryEnabled: boolean;
  publicBio: string;
  internalNote: string;
  mustChangePassword: boolean;
};
type MatchRow = {
  id: string;
  slug: string;
  competitionId: string;
  stage: string;
  kickoff: string;
  venue: string;
  homeTeamId: string;
  awayTeamId: string;
  status: string;
  applicationWindowStatus: string;
  applicationDeadline: string;
  publicNote: string;
  internalNote: string;
  cancellationReason: string;
  positionCounts: Record<string, number>;
};
type AuditRow = {
  id: string;
  action: string;
  summary: string;
  createdAt: string;
};

function formText(form: FormData, name: string) {
  return String(form.get(name) ?? "");
}

function accountPayload(form: FormData) {
  return {
    publicCode: formText(form, "publicCode"),
    name: formText(form, "name"),
    initialPassword: formText(form, "initialPassword"),
    status: formText(form, "status"),
    elevenASide: form.get("elevenASide") === "on",
    futsal: form.get("futsal") === "on",
    certificateNote: formText(form, "certificateNote"),
    trainingStatus: formText(form, "trainingStatus"),
    publicDirectoryEnabled: form.get("publicDirectoryEnabled") === "on",
    publicBio: formText(form, "publicBio"),
    internalNote: formText(form, "internalNote"),
  };
}

function AccountCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/referees/admin/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(accountPayload(new FormData(form))),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "裁判员账号已创建，首次登录必须修改密码。" : result.error ?? "创建失败。");
    if (response.ok) {
      form.reset();
      router.refresh();
    }
  }
  return (
    <form className="referee-operations-form" onSubmit={submit}>
      <h3>创建裁判员账号</h3>
      <div className="referee-form-grid">
        <label><span>裁判员编号</span><input name="publicCode" required /></label>
        <label><span>姓名</span><input name="name" required /></label>
        <label><span>初始密码</span><input minLength={12} name="initialPassword" required type="password" /></label>
        <label><span>账号状态</span><select defaultValue="PENDING" name="status"><option value="PENDING">待启用</option><option value="ACTIVE">已启用</option><option value="INACTIVE">停用</option><option value="ARCHIVED">归档</option></select></label>
        <label><span>培训状态</span><select defaultValue="NOT_STARTED" name="trainingStatus"><option value="NOT_STARTED">未开始</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option></select></label>
        <label><span>证书或登记说明</span><input name="certificateNote" /></label>
      </div>
      <div className="referee-checkbox-row">
        <label><input name="elevenASide" type="checkbox" />十一人制</label>
        <label><input name="futsal" type="checkbox" />五人制</label>
        <label><input name="publicDirectoryEnabled" type="checkbox" />允许进入公开名录</label>
      </div>
      <label><span>公开简介（选填）</span><textarea maxLength={300} name="publicBio" /></label>
      <label><span>内部备注（仅管理员）</span><textarea maxLength={500} name="internalNote" /></label>
      <button type="submit">创建账号</button>
      <p aria-live="polite">{message}</p>
    </form>
  );
}

function AccountEditor({ account }: { account: AccountRow }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = accountPayload(new FormData(event.currentTarget));
    const response = await fetch(`/api/referees/admin/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "账号档案已更新。" : result.error ?? "更新失败。");
    if (response.ok) router.refresh();
  }
  async function resetPassword(form: HTMLFormElement) {
    const password = form.elements.namedItem("resetPassword");
    if (!(password instanceof HTMLInputElement)) return;
    const response = await fetch(`/api/referees/admin/accounts/${account.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initialPassword: password.value }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "密码已重置，原有会话已失效。" : result.error ?? "重置失败。");
    if (response.ok) password.value = "";
  }
  return (
    <details className="referee-account-editor">
      <summary><strong>{account.publicCode} · {account.name}</strong><span>{account.status}{account.mustChangePassword ? " · 待改密" : ""}</span></summary>
      <form onSubmit={update}>
        <input name="initialPassword" type="hidden" value="" />
        <div className="referee-form-grid">
          <label><span>裁判员编号</span><input defaultValue={account.publicCode} name="publicCode" required /></label>
          <label><span>姓名</span><input defaultValue={account.name} name="name" required /></label>
          <label><span>账号状态</span><select defaultValue={account.status} name="status"><option value="PENDING">待启用</option><option value="ACTIVE">已启用</option><option value="INACTIVE">停用</option><option value="ARCHIVED">归档</option></select></label>
          <label><span>培训状态</span><select defaultValue={account.trainingStatus} name="trainingStatus"><option value="NOT_STARTED">未开始</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option></select></label>
          <label><span>证书或登记说明</span><input defaultValue={account.certificateNote} name="certificateNote" /></label>
        </div>
        <div className="referee-checkbox-row">
          <label><input defaultChecked={account.elevenASide} name="elevenASide" type="checkbox" />十一人制</label>
          <label><input defaultChecked={account.futsal} name="futsal" type="checkbox" />五人制</label>
          <label><input defaultChecked={account.publicDirectoryEnabled} name="publicDirectoryEnabled" type="checkbox" />允许进入公开名录</label>
        </div>
        <label><span>公开简介</span><textarea defaultValue={account.publicBio} name="publicBio" /></label>
        <label><span>内部备注</span><textarea defaultValue={account.internalNote} name="internalNote" /></label>
        <button type="submit">保存档案</button>
        <div className="referee-password-reset">
          <input minLength={12} name="resetPassword" placeholder="输入新的初始密码" type="password" />
          <button onClick={(event) => resetPassword(event.currentTarget.form!)} type="button">重置密码</button>
        </div>
        <p aria-live="polite">{message}</p>
      </form>
    </details>
  );
}

function PositionCountFields({
  definitions,
  defaults = {},
}: {
  definitions: PositionDefinition[];
  defaults?: Record<string, number>;
}) {
  return (
    <fieldset className="referee-position-counts">
      <legend>岗位人数（0—5）</legend>
      {definitions.map((position) => (
        <label key={position.key}>
          <span>{position.label}</span>
          <input defaultValue={defaults[position.key] ?? 0} max={5} min={0} name={`position-${position.key}`} type="number" />
        </label>
      ))}
    </fieldset>
  );
}

function matchPayload(form: FormData, definitions: PositionDefinition[]) {
  return {
    slug: formText(form, "slug"),
    competitionId: formText(form, "competitionId"),
    stage: formText(form, "stage"),
    kickoff: formText(form, "kickoff"),
    venue: formText(form, "venue"),
    homeTeamId: formText(form, "homeTeamId"),
    awayTeamId: formText(form, "awayTeamId"),
    status: formText(form, "status"),
    applicationWindowStatus: formText(form, "applicationWindowStatus"),
    applicationDeadline: formText(form, "applicationDeadline"),
    publicNote: formText(form, "publicNote"),
    internalNote: formText(form, "internalNote"),
    cancellationReason: formText(form, "cancellationReason"),
    positionCounts: Object.fromEntries(
      definitions.map((position) => [
        position.key,
        Number(form.get(`position-${position.key}`) ?? 0),
      ]),
    ),
  };
}

function MatchCreateForm({ competitions }: { competitions: CompetitionOption[] }) {
  const router = useRouter();
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const competition = competitions.find((item) => item.id === competitionId);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!competition) return;
    const form = event.currentTarget;
    const response = await fetch("/api/referees/admin/matches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(matchPayload(new FormData(form), competition.positions)),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "场次已创建。" : result.error ?? "创建失败。");
    if (response.ok) {
      form.reset();
      router.refresh();
    }
  }
  return (
    <form className="referee-operations-form" onSubmit={submit}>
      <h3>新建开放场次</h3>
      <div className="referee-form-grid">
        <label><span>赛事</span><select name="competitionId" onChange={(event) => setCompetitionId(event.target.value)} value={competitionId}>{competitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>页面标识</span><input name="slug" required /></label>
        <label><span>比赛名称 / 轮次</span><input name="stage" required /></label>
        <label><span>比赛时间</span><input name="kickoff" required type="datetime-local" /></label>
        <label><span>比赛场地</span><input name="venue" required /></label>
        <label><span>报名截止</span><input name="applicationDeadline" type="datetime-local" /></label>
        <label><span>主队</span><select name="homeTeamId" required><option value="">请选择</option>{competition?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label><span>客队</span><select name="awayTeamId" required><option value="">请选择</option>{competition?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label><span>比赛状态</span><select defaultValue="SCHEDULED" name="status"><option value="SCHEDULED">已安排</option><option value="COMPLETED">已完成</option><option value="CANCELLED">已取消</option></select></label>
        <label><span>报名窗口</span><select defaultValue="CLOSED" name="applicationWindowStatus"><option value="CLOSED">关闭</option><option value="OPEN">发布开放</option></select></label>
      </div>
      {competition ? <PositionCountFields definitions={competition.positions} /> : null}
      <label><span>公开说明</span><textarea name="publicNote" /></label>
      <label><span>内部备注</span><textarea name="internalNote" /></label>
      <input name="cancellationReason" type="hidden" value="" />
      <button type="submit">创建场次</button>
      <p aria-live="polite">{message}</p>
    </form>
  );
}

function MatchManager({ match, competitions }: { match: MatchRow; competitions: CompetitionOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const competition = competitions.find((item) => item.id === match.competitionId)!;
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/referees/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(matchPayload(new FormData(event.currentTarget), competition.positions)),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "场次已更新。" : result.error ?? "更新失败。");
    if (response.ok) router.refresh();
  }
  async function copy(form: HTMLFormElement) {
    const values = new FormData(form);
    const response = await fetch(`/api/referees/admin/matches/${match.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "copy",
        slug: formText(values, "copySlug"),
        stage: formText(values, "copyStage"),
        kickoff: formText(values, "copyKickoff"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "场次副本已创建并保持关闭状态。" : result.error ?? "复制失败。");
    if (response.ok) router.refresh();
  }
  return (
    <details className="referee-match-manager">
      <summary><strong>{competition.name} · {match.stage}</strong><span>{match.status} / {match.applicationWindowStatus}</span></summary>
      <form onSubmit={update}>
        <input name="competitionId" type="hidden" value={match.competitionId} />
        <div className="referee-form-grid">
          <label><span>页面标识</span><input defaultValue={match.slug} name="slug" required /></label>
          <label><span>比赛名称 / 轮次</span><input defaultValue={match.stage} name="stage" required /></label>
          <label><span>比赛时间</span><input defaultValue={match.kickoff} name="kickoff" required type="datetime-local" /></label>
          <label><span>比赛场地</span><input defaultValue={match.venue} name="venue" required /></label>
          <label><span>报名截止</span><input defaultValue={match.applicationDeadline} name="applicationDeadline" type="datetime-local" /></label>
          <label><span>主队</span><select defaultValue={match.homeTeamId} name="homeTeamId">{competition.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          <label><span>客队</span><select defaultValue={match.awayTeamId} name="awayTeamId">{competition.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          <label><span>比赛状态</span><select defaultValue={match.status} name="status"><option value="SCHEDULED">已安排</option><option value="COMPLETED">已完成</option><option value="CANCELLED">已取消</option></select></label>
          <label><span>报名窗口</span><select defaultValue={match.applicationWindowStatus} name="applicationWindowStatus"><option value="CLOSED">关闭</option><option value="OPEN">发布开放</option></select></label>
        </div>
        <PositionCountFields defaults={match.positionCounts} definitions={competition.positions} />
        <label><span>公开说明</span><textarea defaultValue={match.publicNote} name="publicNote" /></label>
        <label><span>内部备注</span><textarea defaultValue={match.internalNote} name="internalNote" /></label>
        <label><span>取消原因</span><input defaultValue={match.cancellationReason} name="cancellationReason" /></label>
        <button type="submit">保存场次</button>
        <fieldset className="referee-copy-fields">
          <legend>复制为新场次（默认关闭报名）</legend>
          <input name="copySlug" placeholder="新页面标识" />
          <input name="copyStage" placeholder="新比赛名称 / 轮次" />
          <input name="copyKickoff" type="datetime-local" />
          <button onClick={(event) => copy(event.currentTarget.form!)} type="button">复制场次</button>
        </fieldset>
        <p aria-live="polite">{message}</p>
      </form>
    </details>
  );
}

export function AdminOperationsPanel({
  accounts,
  competitions,
  matches,
  audit,
}: {
  accounts: AccountRow[];
  competitions: CompetitionOption[];
  matches: MatchRow[];
  audit: AuditRow[];
}) {
  const auditItems = useMemo(() => audit.slice(0, 50), [audit]);
  return (
    <>
      <section className="referee-admin-section" id="accounts">
        <header className="referee-admin-section-title"><h2>裁判员账号与档案</h2><Link href="/api/referees/admin/exports/referees">导出名录 CSV</Link></header>
        <AccountCreateForm />
        <div className="referee-admin-list">{accounts.map((account) => <AccountEditor account={account} key={account.id} />)}</div>
      </section>
      <section className="referee-admin-section" id="matches">
        <h2>开放场次管理</h2>
        <MatchCreateForm competitions={competitions} />
        <div className="referee-admin-list">{matches.map((match) => <MatchManager competitions={competitions} key={match.id} match={match} />)}</div>
      </section>
      <section className="referee-admin-section" id="audit">
        <h2>管理员操作日志</h2>
        {auditItems.length ? <div className="referee-admin-history">{auditItems.map((item) => <article key={item.id}><div><span>{item.action}</span><strong>{item.summary}</strong></div><time>{item.createdAt}</time></article>)}</div> : <div className="functional-empty functional-empty-compact"><strong>暂无操作日志</strong><p>账号、场次、审核和选派操作将在这里留痕。</p></div>}
      </section>
    </>
  );
}
