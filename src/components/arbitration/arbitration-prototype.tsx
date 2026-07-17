import Link from "next/link";
import {
  arbitrationPrototypeNotice,
  arbitrationSections,
} from "@/data/arbitration";

export function ArbitrationPrototype() {
  return (
    <main className="detail-page" id="main-content">
      <section className="detail-hero">
        <div className="detail-shell detail-hero-grid">
          <div className="detail-hero-copy">
            <p className="detail-eyebrow">ARBITRATION &amp; APPEALS</p>
            <h1 className="detail-title">仲裁与申诉</h1>
            <p className="detail-lede">
              赛事治理体系下的独立入口，用于说明申请条件、时限、流程、纪律规则与决定公示。
            </p>
            <div className="detail-actions">
              <Link className="detail-button" href="/competitions">
                返回天目湖赛事
              </Link>
              <Link
                className="detail-button detail-button-secondary"
                href="/referees"
              >
                前往裁判与规则
              </Link>
            </div>
          </div>
          <div className="detail-hero-panel">
            <span className="detail-badge">静态页面原型</span>
            <strong>本轮不开放正式在线提交</strong>
            <p>{arbitrationPrototypeNotice}</p>
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="arbitration-sections-title">
        <div className="detail-shell">
          <div className="detail-section-head">
            <div>
              <p className="detail-kicker">原型结构 / PROTOTYPE STRUCTURE</p>
              <h2 className="detail-section-title" id="arbitration-sections-title">
                仲裁与申诉信息结构
              </h2>
            </div>
            <p className="detail-section-copy">
              以下内容仅建立未来信息架构；不含账号、认证、数据库、真实表单或敏感个人信息收集。
            </p>
          </div>

          <div className="detail-grid detail-grid-three">
            {arbitrationSections.map((section, index) => (
              <article className="detail-card" key={section.id}>
                <div className="detail-card-head">
                  <span className="detail-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="detail-badge">{section.statusLabel}</span>
                </div>
                <h3 className="detail-card-title">{section.title}</h3>
                <p className="detail-card-copy">{section.description}</p>
              </article>
            ))}
          </div>

          <aside className="detail-note detail-note-prominent">
            <strong>原型边界</strong>
            <p>{arbitrationPrototypeNotice}</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
