import Link from "next/link";
import { RefereeApplicationDemo } from "@/components/referees/referee-application-demo";
import {
  formatLabels,
  openRefereeMatches,
  refereeApplicationStatement,
  refereeDemoNotice,
} from "@/data/referees";

export function OpenRefereeMatches() {
  return (
    <main className="detail-page" id="main-content">
      <section className="detail-hero">
        <div className="detail-shell detail-hero-grid">
          <div className="detail-hero-copy">
            <p className="detail-eyebrow">OPEN APPOINTMENTS</p>
            <h1 className="detail-title">开放执裁场次</h1>
            <p className="detail-lede">
              供已被协会确认的裁判员查看演示场次并表达执裁意向。
            </p>
            <div className="detail-actions">
              <Link
                className="detail-button detail-button-secondary"
                href="/referees"
              >
                返回裁判与规则
              </Link>
              <Link className="detail-button" href="/referees/assignments">
                查看选派公示
              </Link>
            </div>
          </div>
          <div className="detail-hero-panel">
            <span className="detail-badge">{refereeDemoNotice}</span>
            <strong>报名不等于正式获得任务</strong>
            <p>{refereeApplicationStatement}</p>
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="open-matches-title">
        <div className="detail-shell">
          <div className="detail-section-head">
            <div>
              <p className="detail-kicker">演示场次 / DEMO FIXTURES</p>
              <h2 className="detail-section-title" id="open-matches-title">
                当前开放场次列表
              </h2>
            </div>
            <p className="detail-section-copy">
              以下日期、场地、对阵和截止时间均为界面演示，不代表真实赛程或报名安排。
            </p>
          </div>

          <div className="detail-stack">
            {openRefereeMatches.map((match) => (
              <article className="detail-card detail-match-card" key={match.id}>
                <div className="detail-card-head">
                  <div>
                    <span className="detail-badge">演示数据</span>
                    <h3 className="detail-card-title">{match.competition}</h3>
                  </div>
                  <span className="detail-status detail-status-open">开放演示</span>
                </div>
                <dl className="detail-meta-grid">
                  <div className="detail-meta-item">
                    <dt>日期</dt>
                    <dd>{match.date}</dd>
                  </div>
                  <div className="detail-meta-item">
                    <dt>赛制</dt>
                    <dd>{formatLabels[match.format]}</dd>
                  </div>
                  <div className="detail-meta-item">
                    <dt>场地</dt>
                    <dd>{match.venue}</dd>
                  </div>
                  <div className="detail-meta-item">
                    <dt>对阵</dt>
                    <dd>
                      {match.homeTeam} vs {match.awayTeam}
                    </dd>
                  </div>
                  <div className="detail-meta-item">
                    <dt>报名截止</dt>
                    <dd>{match.applicationDeadline}</dd>
                  </div>
                </dl>
                <RefereeApplicationDemo matchId={match.id} />
              </article>
            ))}
          </div>

          <aside className="detail-note detail-note-prominent">
            <strong>报名说明</strong>
            <p>{refereeApplicationStatement}</p>
            <p>{refereeDemoNotice}，不会创建账号、保存个人信息或写入数据库。</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
