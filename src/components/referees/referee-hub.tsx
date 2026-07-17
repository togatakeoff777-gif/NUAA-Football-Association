import Link from "next/link";
import {
  refereeAffairsEntries,
  rulesResourceEntries,
} from "@/data/referees";
import { RefereeContactCard } from "@/components/referees/referee-contact-card";

function EntryCard({
  entry,
}: {
  entry: (typeof refereeAffairsEntries)[number];
}) {
  const content = (
    <>
      <div className="detail-card-head">
        <h3 className="detail-card-title">{entry.title}</h3>
        {"badge" in entry ? (
          <span className="detail-badge">{entry.badge}</span>
        ) : null}
      </div>
      <p className="detail-card-copy">{entry.description}</p>
      {"href" in entry ? (
        <span className="detail-card-action" aria-hidden="true">
          查看入口 →
        </span>
      ) : null}
    </>
  );

  if ("href" in entry && entry.href) {
    return (
      <Link className="detail-card detail-card-link" href={entry.href}>
        {content}
      </Link>
    );
  }

  return <article className="detail-card">{content}</article>;
}

export function RefereeHub() {
  return (
    <main className="detail-page" id="main-content">
      <section className="detail-hero">
        <div className="detail-shell detail-hero-grid">
          <div className="detail-hero-copy">
            <p className="detail-eyebrow">REFEREES &amp; LAWS</p>
            <h1 className="detail-title">裁判与规则</h1>
            <p className="detail-lede">
              汇集天目湖校园足球裁判招募、培训、执裁报名、选派公示与竞赛规则资料。
            </p>
            <div className="detail-actions">
              <Link className="detail-button" href="/referees/open-matches">
                查看开放执裁场次
              </Link>
              <Link
                className="detail-button detail-button-secondary"
                href="/referees/assignments"
              >
                查看选派公示
              </Link>
            </div>
          </div>
          <div className="detail-hero-panel">
            <span className="detail-badge">静态原型</span>
            <strong>裁判事务与规则资料集中入口</strong>
            <p>
              本轮不接入账号、数据库或真实报名；正式任务以裁判管理人员确认和官网公示为准。
            </p>
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="referee-affairs-title">
        <div className="detail-shell">
          <div className="detail-section-head">
            <div>
              <p className="detail-kicker">裁判事务 / REFEREE AFFAIRS</p>
              <h2 className="detail-section-title" id="referee-affairs-title">
                从加入队伍到比赛选派
              </h2>
            </div>
            <p className="detail-section-copy">
              “加入裁判队伍”面向新成员；“比赛执裁报名”仅面向已被协会确认的裁判员，两者并不相同。
            </p>
          </div>
          <div className="detail-grid detail-grid-three">
            {refereeAffairsEntries.map((entry) => (
              <EntryCard entry={entry} key={entry.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="detail-section detail-section-muted" aria-labelledby="rules-title">
        <div className="detail-shell">
          <div className="detail-section-head">
            <div>
              <p className="detail-kicker">规则与资料 / LAWS &amp; RESOURCES</p>
              <h2 className="detail-section-title" id="rules-title">
                竞赛规则与裁判学习资料
              </h2>
            </div>
            <p className="detail-section-copy">
              正式文件将在来源、版本和公开权限确认后上线；仲裁、申诉与纪律流程归赛事治理栏目管理。
            </p>
          </div>
          <div className="detail-grid detail-grid-three">
            {rulesResourceEntries.map((entry) => (
              <article className="detail-card" key={entry.id}>
                <span className="detail-badge">资料待更新</span>
                <h3 className="detail-card-title">{entry.title}</h3>
                <p className="detail-card-copy">{entry.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-shell detail-grid detail-grid-two">
          <RefereeContactCard />
          <article className="detail-card detail-card-featured">
            <p className="detail-kicker">资料治理 / CONTENT POLICY</p>
            <h2 className="detail-section-title">规则资料需经版本核验</h2>
            <p className="detail-card-copy">
              规则文件、裁判工作表单和培训资料将在来源、适用范围、版本与公开权限确认后发布，避免使用失效或来源不明的文件。
            </p>
            <Link className="detail-link" href="/referees/open-matches">
              查看开放执裁场次 →
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
