import Link from "next/link";

import { RefereeContactCard } from "@/components/referees/referee-contact-card";
import {
  refereePrimaryEntries,
  refereeSecondaryEntries,
  rulesResourceEntries,
} from "@/data/referees";

export function RefereeHub() {
  return (
    <main className="functional-page referee-center" id="main-content">
      <section className="functional-hero referee-center-hero">
        <div className="detail-shell">
          <p>REFEREE CENTER</p>
          <h1>裁判中心</h1>
          <p>
            公开裁判名录、场次、选派与历史记录；已登记裁判员和管理员分别进入受保护的工作入口。
          </p>
          <div className="referee-hero-actions">
            <Link href="/referees/login">裁判员登录</Link>
            <Link href="/referees/admin/login">管理员登录</Link>
          </div>
        </div>
      </section>

      <section className="functional-section referee-contact-section referee-contact-section-early">
        <div className="detail-shell referee-contact-layout">
          <div className="functional-section-head">
            <div>
              <span>CONTACT</span>
              <h2>联系裁判负责人</h2>
            </div>
            <p>
              负责人姓名尚未确认，不公开私人手机号或微信号；赛事、规则与执裁事务统一使用协会公开邮箱。
            </p>
          </div>
          <RefereeContactCard />
        </div>
      </section>

      <section className="functional-section functional-section-tint">
        <div className="detail-shell">
          <div className="referee-center-intro">
            <div>
              <span>PUBLIC INFORMATION</span>
              <h2>公开信息对所有访客开放</h2>
              <p>
                公开名录只展示经确认可公开的信息；开放场次可直接浏览。正式提交执裁意向、查看个人审核状态与任务，需要裁判员登录。
              </p>
            </div>
            <Link href="/referees/open-matches">查看公开场次 →</Link>
          </div>
          <div className="referee-affairs-grid referee-affairs-grid-primary">
            {refereePrimaryEntries.map((entry, index) => (
              <Link href={entry.href} id={`referee-affair-${entry.id}`} key={entry.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                </div>
                <strong>进入 →</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="functional-section">
        <div className="detail-shell">
          <div className="functional-section-head">
            <div>
              <span>RESOURCES & RECORDS</span>
              <h2>资料与历史</h2>
            </div>
            <p>第二层入口承载规则学习、历史公示与经授权的人物内容，不与比赛申请入口重复。</p>
          </div>
          <div className="referee-secondary-directory">
            {refereeSecondaryEntries.map((entry, index) => {
              const content = (
                <>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{entry.title}</h3>
                    <p>{entry.description}</p>
                  </div>
                  <strong>{"badge" in entry ? entry.badge : "进入 →"}</strong>
                </>
              );
              return "href" in entry ? (
                <Link href={entry.href} key={entry.id}>{content}</Link>
              ) : (
                <article key={entry.id}>{content}</article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="functional-section functional-section-tint" id="referee-rules">
        <div className="detail-shell">
          <div className="functional-section-head">
            <div>
              <span>LAWS & RESOURCES</span>
              <h2>规则与资料</h2>
            </div>
            <p>按足球规则、五人制规则、规则更新和裁判工作资料四类组织，不生成无真实来源的下载链接。</p>
          </div>
          <div className="referee-rule-directory">
            {rulesResourceEntries.map((entry, index) => {
              const content = (
                <>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{entry.title}</h3>
                    <p>{entry.description}</p>
                  </div>
                  <strong>{entry.badge}</strong>
                </>
              );
              return <Link href={entry.href} key={entry.id}>{content}</Link>;
            })}
          </div>
        </div>
      </section>

      <section className="functional-section functional-section-tint">
        <div className="detail-shell referee-secure-access">
          <div>
            <span>SECURE WORK AREAS</span>
            <h2>受保护的工作入口</h2>
            <p>
              裁判员可提交执裁意向并查看个人申请、正式任务和培训状态；管理员保留审核、选派、发布与撤回的完整持久化闭环。
            </p>
          </div>
          <div>
            <Link href="/referees/login">裁判员登录</Link>
            <Link href="/referees/admin/login">管理员登录</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
