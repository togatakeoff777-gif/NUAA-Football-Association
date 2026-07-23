import Link from "next/link";

import { RefereeContactCard } from "@/components/referees/referee-contact-card";
import {
  refereeAffairsEntries,
  refereeRoleDefinitions,
  refereeRoleTemplateNotes,
  refereeWorkFiles,
  rulesResourceEntries,
} from "@/data/referees";

const workflow = ["了解", "加入", "报名", "选派", "公示", "归档", "学习"] as const;

function AffairEntry({ entry, index }: { entry: (typeof refereeAffairsEntries)[number]; index: number }) {
  const content = <><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{entry.title}</h3><p>{entry.description}</p></div><strong>{"badge" in entry ? entry.badge : "进入 →"}</strong></>;
  return "href" in entry ? <Link href={entry.href} id={`referee-affair-${entry.id}`}>{content}</Link> : <article id={`referee-affair-${entry.id}`}>{content}</article>;
}

export function RefereeHub() {
  const elevenRoles = refereeRoleDefinitions.filter((role) => role.format === "eleven-a-side");
  const futsalRoles = refereeRoleDefinitions.filter((role) => role.format === "futsal");

  return (
    <main className="functional-page referee-center" id="main-content">
      <section className="functional-hero"><div className="detail-shell"><p>REFEREE OPERATIONS</p><h1>裁判中心</h1><p>建立“了解—加入—报名—选派—公示—归档—学习”的完整入口，并保留注册名录、执裁意向、审核与选派的持久化工作闭环。</p></div></section>

      <section className="referee-workflow" aria-label="裁判工作流程"><div className="detail-shell">{workflow.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}</div></section>

      <section className="functional-section"><div className="detail-shell">
        <div className="functional-section-head"><div><span>REFEREE AFFAIRS</span><h2>裁判事务</h2></div><p>公开服务与管理入口使用同一套 Prisma + SQLite 数据；个人账号尚未建设的功能会明确标注。</p></div>
        <div className="referee-affairs-grid">{refereeAffairsEntries.map((entry, index) => <AffairEntry entry={entry} index={index} key={entry.id} />)}</div>
      </div></section>

      <section className="functional-section functional-section-tint" id="referee-rules"><div className="detail-shell">
        <div className="functional-section-head"><div><span>LAWS & RESOURCES</span><h2>规则与资料</h2></div><p>规则文件保持原始版本；没有真实文件或内容来源的栏目保留正式状态，不生成空下载链接。</p></div>
        <div className="referee-rule-directory">{rulesResourceEntries.map((entry, index) => {
          const content = <><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{entry.title}</h3><p>{entry.description}</p></div><strong>{entry.badge}</strong></>;
          return "href" in entry ? <Link href={entry.href} key={entry.id}>{content}</Link> : <article key={entry.id}>{content}</article>;
        })}</div>
      </div></section>

      <section className="functional-section" id="referee-downloads"><div className="detail-shell">
        <div className="functional-section-head"><div><span>OFFICIALS&apos; WORK FILES</span><h2>裁判工作资料下载</h2></div><p>以下文件已从赛事文件中心归入裁判中心，仅用于裁判组或比赛官员工作。</p></div>
        <div className="referee-work-file-list">{refereeWorkFiles.map((file) => <article key={file.id}><span>{file.fileType}</span><div><h3>{file.title}</h3><p>{file.scope}</p></div><dl><div><dt>版本</dt><dd>{file.version}</dd></div><div><dt>发布日期</dt><dd>{file.publishedAt}</dd></div></dl><a download href={file.href}>下载原文件</a></article>)}</div>
      </div></section>

      <section className="functional-section functional-section-tint" id="referee-learning"><div className="detail-shell">
        <div className="functional-section-head"><div><span>ROLE TEMPLATES & DEVELOPMENT</span><h2>岗位模板与学习发展</h2></div><p>管理员可按赛制切换完整岗位模板，并按场次启用或停用可选岗位。</p></div>
        <div className="referee-template-grid">
          <article><header><span>ELEVEN-A-SIDE</span><h3>十一人制岗位</h3></header><ol>{elevenRoles.map((role) => <li key={role.key}><b>{String(role.order).padStart(2, "0")}</b>{role.label}</li>)}</ol><ul>{refereeRoleTemplateNotes["eleven-a-side"].map((note) => <li key={note}>{note}</li>)}</ul></article>
          <article><header><span>FUTSAL</span><h3>五人制岗位</h3></header><ol>{futsalRoles.map((role) => <li key={role.key}><b>{String(role.order).padStart(2, "0")}</b>{role.label}</li>)}</ol><ul>{refereeRoleTemplateNotes.futsal.map((note) => <li key={note}>{note}</li>)}</ul></article>
          <aside><span>TRAINING & CASES</span><h3>培训、发展与判例</h3><p>培训安排、能力发展路径、常见判例分析与裁判员风采将在取得可公开资料后发布。</p><strong>内容待协会确认</strong></aside>
        </div>
      </div></section>

      <section className="functional-section referee-contact-section"><div className="detail-shell"><div className="functional-section-head"><div><span>CONTACT</span><h2>联系裁判负责人</h2></div><p>负责人姓名未确认，不公开私人手机号或微信号；赛事与规则咨询使用协会公开邮箱。</p></div><RefereeContactCard /></div></section>
    </main>
  );
}
