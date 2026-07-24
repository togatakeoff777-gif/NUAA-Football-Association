import Link from "next/link";

export type PublicAppointment = {
  id: string; competition: string; match: string; stage: string; kickoff: string; venue: string;
  publishedAt: string; note: string | null; positions: { key: string; label: string; referee: string }[];
};

export function PublicAppointmentList({ items, emptyTitle }: { items: PublicAppointment[]; emptyTitle: string }) {
  if (!items.length) return <div className="functional-empty"><strong>{emptyTitle}</strong><p>只有已发布且未撤回的选派会出现在公开页面。</p></div>;
  return <div className="referee-publication-list">{items.map((item) => <article key={item.id}><header><div><span>{item.competition} · {item.stage}</span><h2>{item.match}</h2></div><strong>已发布</strong></header><dl><div><dt>开球时间</dt><dd>{item.kickoff}</dd></div><div><dt>比赛场地</dt><dd>{item.venue}</dd></div><div><dt>发布时间</dt><dd>{item.publishedAt}</dd></div></dl><div className="referee-position-list">{item.positions.map((position) => <div key={position.key}><span>{position.label}</span><strong>{position.referee}</strong></div>)}</div>{item.note ? <p>{item.note}</p> : null}</article>)}</div>;
}

export function RefereeSubnav() {
  return <nav aria-label="裁判中心功能导航" className="referee-subnav"><Link href="/referees">裁判中心</Link><Link href="/referees/directory">公开名录</Link><Link href="/referees/open-matches">公开场次</Link><Link href="/referees/assignments">选派公告</Link><Link href="/referees/history">历史记录</Link><Link href="/referees/workspace">个人工作区</Link></nav>;
}
