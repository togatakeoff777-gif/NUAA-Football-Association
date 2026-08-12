import Link from "next/link";
import { annualCompetitions } from "@/data/competitions";
import { SectionHeading } from "@/components/ui/section-heading";

export function AnnualCompetitions() {
  return (
    <section className="section competitions-section" id="competitions" aria-labelledby="competitions-title">
      <div className="page-shell">
        <SectionHeading
          eyebrow="SEASON FLIGHT PLAN / 年度赛事体系"
          title="四项赛事，两段赛季航程"
          description="围绕天目湖校园足球建立清晰的年度赛事节奏；赛事状态以协会已公开信息为准。"
          id="competitions-title"
          action={<Link className="text-link" href="/competitions">查看赛事入口 <span aria-hidden="true">→</span></Link>}
        />
        <div className="semester-axis" aria-hidden="true"><span>01</span><i /><span>02</span></div>
        <div className="competitions-grid">
          {annualCompetitions.map((competition, index) => (
            <article className="competition-card" key={competition.id}>
              <div className="competition-card-top">
                <span className="competition-index">0{index + 1}</span>
                <div><span>{competition.semesterLabel}</span><small>{competition.eventType}</small></div>
                <span className={`competition-status status-${competition.displayStatus.key}`}>{competition.displayStatus.label} · 演示</span>
              </div>
              <h3>{competition.name}</h3>
              <p>{competition.organizerNote}</p>
              <div className="competition-tags">
                {competition.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <Link href="/competitions" aria-label={`查看${competition.name}介绍`}>
                赛事介绍 <span aria-hidden="true">↗</span>
              </Link>
              <div className="competition-route" aria-hidden="true"><i /><i /><i /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
