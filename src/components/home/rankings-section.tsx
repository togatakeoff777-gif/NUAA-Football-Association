import Link from "next/link";
import { demoScorers, demoStandings } from "@/data/competitions";
import { DemoLabel } from "@/components/ui/demo-label";
import { SectionHeading } from "@/components/ui/section-heading";

function StandingsTable() {
  return (
    <div className="ranking-panel ranking-panel-wide">
      <div className="ranking-panel-head"><div><small>DEMO TABLE</small><h3>积分榜</h3></div><DemoLabel /></div>
      <div className="table-scroll" tabIndex={0} aria-label="积分榜，可横向滚动">
        <table>
          <caption className="sr-only">演示积分榜，不代表真实赛事记录</caption>
          <thead><tr><th scope="col">排名</th><th scope="col">球队</th><th scope="col">赛</th><th scope="col">胜</th><th scope="col">平</th><th scope="col">负</th><th scope="col">净胜球</th><th scope="col">积分</th></tr></thead>
          <tbody>
            {demoStandings.map((row) => (
              <tr key={row.team}>
                <td><span className="rank-number">{String(row.position).padStart(2, "0")}</span></td><td><strong>{row.team}</strong></td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><b>{row.points}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">演示球队与统计仅用于展示榜单信息层级。</p>
    </div>
  );
}

function ScorersTable() {
  return (
    <div className="ranking-panel">
      <div className="ranking-panel-head"><div><small>DEMO SCORERS</small><h3>射手榜</h3></div><DemoLabel /></div>
      <div className="scorers-list">
        {demoScorers.map((row) => (
          <div className="scorer-row" key={row.player}>
            <span className="rank-number">{String(row.position).padStart(2, "0")}</span>
            <div><strong>{row.player}</strong><small>{row.team}</small></div>
            <p><b>{row.goals}</b><span>进球</span></p>
          </div>
        ))}
      </div>
      <p className="table-note">演示球员姓名为占位符，不对应真实个人。</p>
    </div>
  );
}

export function RankingsSection() {
  return (
    <section className="section section-space section-grid rankings-section" aria-labelledby="rankings-title">
      <div className="page-shell">
        <SectionHeading
          eyebrow="DATA CONTROL / 赛事数据中心"
          title="积分与射手，一屏掌握"
          description="本轮仅展示数据结构和界面能力；正式榜单须待赛事确认并接入真实数据后发布。"
          id="rankings-title"
          inverted
          action={<Link className="text-link rankings-link" href="/competitions">前往赛事中心 <span aria-hidden="true">↗</span></Link>}
        />
        <div className="rankings-grid"><StandingsTable /><ScorersTable /></div>
      </div>
    </section>
  );
}
