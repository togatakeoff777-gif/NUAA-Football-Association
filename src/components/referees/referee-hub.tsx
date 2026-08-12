import Link from "next/link";

import { RefereeContactCard } from "@/components/referees/referee-contact-card";
import {
  refereeLearningEntries,
  refereePrimaryEntries,
  refereeSecondaryEntries,
} from "@/data/referees";

export function RefereeHub() {
  return (
    <main className="functional-page referee-center" id="main-content">
      <section className="functional-hero referee-center-hero">
        <div className="detail-shell referee-hero-layout">
          <p className="referee-hero-kicker">REFEREE CENTER</p>
          <h1>裁判中心</h1>
          <p className="referee-hero-summary">
            提供裁判招募、公开名录、场次、选派、竞赛规则与历史档案等校园足球裁判服务。
          </p>
          <div className="referee-hero-actions" aria-label="裁判中心主要入口">
            <Link className="referee-hero-primary-action" href="/referees/recruitment">加入裁判队伍</Link>
            <Link className="referee-hero-secondary-action" href="/referees/open-matches">查看公开场次</Link>
          </div>
          <Link className="referee-hero-login" href="/referees/login">
            <span>裁判员登录</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="functional-section referee-contact-section referee-contact-section-early">
        <div className="detail-shell referee-contact-layout">
          <div className="functional-section-head">
            <div>
              <span>CONTACT</span>
              <h2>裁判负责人</h2>
            </div>
            <p>
              裁判招募、培训、选派及规则咨询，可通过协会公开邮箱或咨询 QQ 联系裁判事务负责人。
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
              <h2>公开信息</h2>
              <p>
                提供裁判招募、公开名录、裁判选派等信息查询服务。涉及个人任务与内部管理的功能需通过裁判员工作区登录后使用。
              </p>
            </div>
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

      <section className="functional-section" id="referee-resources">
        <div className="detail-shell">
          <div className="functional-section-head">
            <div>
              <span>LEARNING & RESOURCES</span>
              <h2>学习与资料</h2>
            </div>
            <p>集中提供足球竞赛规则、五人制足球竞赛规则、培训资料与裁判工作文件。</p>
          </div>
          <div className="referee-rule-directory referee-learning-directory">
            {refereeLearningEntries.map((entry, index) => (
              <Link href={entry.href} key={entry.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                </div>
                <strong>{entry.badge}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="functional-section functional-section-tint">
        <div className="detail-shell">
          <div className="functional-section-head">
            <div>
              <span>REFEREE ARCHIVE</span>
              <h2>裁判档案</h2>
            </div>
            <p>回顾已结束比赛的公开选派记录，并记录校园足球裁判员的专业成长。</p>
          </div>
          <div className="referee-secondary-directory referee-archive-directory">
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

      <section className="functional-section">
        <div className="detail-shell referee-secure-access">
          <div>
            <span>REFEREE WORKSPACE</span>
            <h2>裁判员工作区</h2>
            <p>
              裁判员账号将按申请与审核流程启用，工作区启用安排以协会通知为准。
            </p>
            <ol className="referee-account-path" aria-label="未来裁判员账号启用流程">
              <li><span>01</span>裁判员自主申请注册</li>
              <li><span>02</span>协会后台审核</li>
              <li><span>03</span>审核通过后启用账号</li>
              <li><span>04</span>管理员配置相应权限</li>
            </ol>
          </div>
          <div>
            <Link href="/referees/login">裁判员登录</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
