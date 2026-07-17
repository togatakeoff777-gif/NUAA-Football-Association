import Link from "next/link";
import { participationDataPolicy, participationEntries, participationStatement } from "@/data/participation";

export function ParticipationGuide() {
  const [platformEntry, ...guideEntries] = participationEntries;
  return (
    <section className="participation-section" id="participation" aria-labelledby="participation-title">
      <div className="participation-grid" aria-hidden="true" />
      <div className="page-shell participation-inner">
        <div className="participation-copy">
          <p className="section-eyebrow">JOIN THE GAME / 参赛与报名</p>
          <h2 id="participation-title">从注册到上场，入口清晰可见</h2>
          <p>{participationStatement}</p>
          <a className="button button-light" href={platformEntry.href} target="_blank" rel="noopener noreferrer" aria-label="前往足球中国注册报名，将在新标签页打开">前往足球中国注册报名 <span aria-hidden="true">↗</span></a>
          <small>{participationDataPolicy.statement} 不收集身份证号、学号、手机号等敏感信息。</small>
        </div>
        <div className="participation-links">
          {guideEntries.map((entry, index) => (
            <Link href={entry.href} key={entry.id}><span>0{index + 1}</span><div><small>{entry.badge}</small><strong>{entry.title}</strong><p>{entry.description}</p></div><b aria-hidden="true">→</b></Link>
          ))}
        </div>
      </div>
    </section>
  );
}
