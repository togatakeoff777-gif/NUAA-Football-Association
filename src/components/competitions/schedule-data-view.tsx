import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DemoMatch } from "@/types";

function Score({ match }: { match: DemoMatch }) {
  return match.status === "completed" ? <strong>{match.homeScore} : {match.awayScore}</strong> : <strong>VS</strong>;
}

export function ScheduleDataView({ matches }: { matches: readonly DemoMatch[] }) {
  if (!matches.length) return <EmptyState title="当前暂无已公布赛程" description="请关注赛事公告。" href="/news" actionLabel="查看公告" />;
  return (
    <>
      <div className="data-table-wrap">
        <table className="schedule-table">
          <caption className="sr-only">演示赛程与赛果，不代表真实赛事记录</caption>
          <thead><tr><th scope="col">日期</th><th scope="col">赛事 / 阶段</th><th scope="col">对阵</th><th scope="col">场地</th><th scope="col">状态</th><th scope="col">详情</th></tr></thead>
          <tbody>{matches.map((match) => <tr id={match.id} key={match.id}><td>{match.dateLabel}</td><td><strong>{match.competitionName}</strong><small>{match.stageLabel} · {match.roundLabel}</small></td><td><div className="schedule-matchup"><span>{match.homeTeam}</span><Score match={match} /><span>{match.awayTeam}</span></div></td><td>{match.venue}</td><td><StatusBadge tone={match.status === "completed" ? "neutral" : "warning"}>{match.statusLabel} · 演示</StatusBadge></td><td><Link href={match.detailHref}>查看 →</Link></td></tr>)}</tbody>
        </table>
      </div>
      <div className="schedule-mobile-list">
        {matches.map((match) => <article id={`mobile-${match.id}`} key={match.id}><div><span>{match.competitionName}</span><StatusBadge tone={match.status === "completed" ? "neutral" : "warning"}>{match.statusLabel} · 演示</StatusBadge></div><p>{match.dateLabel} · {match.venue}</p><div className="schedule-mobile-matchup"><strong>{match.homeTeam}</strong><Score match={match} /><strong>{match.awayTeam}</strong></div><footer><span>{match.stageLabel} · {match.roundLabel}</span><Link href={match.detailHref}>详情 →</Link></footer></article>)}
      </div>
    </>
  );
}
