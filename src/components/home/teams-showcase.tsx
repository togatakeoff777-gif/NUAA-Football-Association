import Link from "next/link";
import { demoTeams, teamDemoNotice } from "@/data/teams";
import { DemoLabel } from "@/components/ui/demo-label";
import { SectionHeading } from "@/components/ui/section-heading";

export function TeamsShowcase() {
  return (
    <section className="section section-ice teams-v2-section" id="teams" aria-labelledby="teams-title">
      <div className="page-shell">
        <SectionHeading
          eyebrow="TIANMUHU SQUADS / 天目湖球队"
          title="球队资料，等待真实赛季更新"
          description="本轮不使用未经确认的球队名称、队员信息或人物照片；以下卡片仅展示未来球队数据入口。"
          id="teams-title"
          action={<Link className="text-link" href="/teams">进入球队栏目 <span aria-hidden="true">→</span></Link>}
        />
        <div className="team-demo-notice"><DemoLabel>演示球队</DemoLabel><p>{teamDemoNotice}</p></div>
        <div className="teams-v2-grid">
          {demoTeams.map((team, index) => (
            <article className="team-v2-card" key={team.id}>
              <div className="team-v2-visual" aria-hidden="true">
                <span className="team-v2-shield">{team.shortName}</span>
                <div className="team-tactical-route"><i /><i /><i /></div>
                <b>0{index + 1}</b>
              </div>
              <div className="team-v2-copy"><DemoLabel>{team.badge}</DemoLabel><h3>{team.name}</h3><p>{team.description}</p><span>真实球队资料待协会确认</span></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
