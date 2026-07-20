import Link from "next/link";

import { associationIdentity, associationScope, associationStats } from "@/data/association";

export function AssociationSummary() {
  return (
    <div className="home-association-summary">
      <div className="page-shell association-summary-grid">
        <div className="association-summary-copy" data-home-reveal data-home-delay="0">
          <p>ABOUT THE ASSOCIATION / 关于协会</p>
          <h2 id="home-association-title">扎根天目湖，服务校园足球</h2>
          <span>{associationScope.summary} 协会以赛事组织、裁判发展、规则传播与校园影像连接每一位参与者。</span>
          <Link className="button button-secondary" href="/association">了解协会 <b aria-hidden="true">→</b></Link>
        </div>
        <dl className="association-summary-stats" data-home-reveal data-home-delay="1">
          {associationStats.slice(0, 3).map((stat) => <div key={stat.id}><dt>{stat.value}</dt><dd>{stat.label}</dd><small>{stat.note}</small></div>)}
        </dl>
        <div className="association-summary-id"><span>{associationIdentity.establishedLabel}</span><small>{associationIdentity.englishName}</small></div>
      </div>
    </div>
  );
}
