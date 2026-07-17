import Image from "next/image";
import Link from "next/link";
import { associationIdentity, associationScope, associationStats } from "@/data/association";
import { SectionHeading } from "@/components/ui/section-heading";

export function AssociationOverview() {
  return (
    <section className="section association-v2-section" id="association" aria-labelledby="association-title">
      <div className="page-shell">
        <SectionHeading eyebrow="ABOUT THE ASSOCIATION / 关于协会" title="扎根天目湖，建设校园足球共同体" description="网站只代表南京航空航天大学天目湖足球协会；跨校区内容以相关赛事组织方最终确认的信息为准。" id="association-title" />
        <div className="association-v2-layout">
          <div className="association-v2-story">
            <div className="association-v2-id"><span>{associationIdentity.establishedLabel}</span><small>{associationIdentity.englishName}</small></div>
            <h3>{associationIdentity.slogan}</h3>
            <p>{associationScope.summary} 我们围绕赛事组织、裁判发展、规则传播、校园影像与参赛服务，搭建清晰、可靠的足球信息入口。</p>
            <p>本网站不代表明故宫、将军路和天目湖三个校区的统一足球组织，也不发布或管理将军路体系内部事务。</p>
            <Link className="button button-secondary" href="/association">了解协会与范围 <span aria-hidden="true">→</span></Link>
          </div>
          <div className="association-v2-data">
            <div className="association-emblem-card">
              <Image src="/images/nuaa-emblem.jpg" alt="南京航空航天大学校徽，作为学校归属标识" width={110} height={110} />
              <div><span>学校归属标识</span><strong>南京航空航天大学</strong><p>校徽不替代天目湖足协 FA 盾牌占位标识。</p></div>
            </div>
            <div className="association-stats">
              {associationStats.map((stat) => (
                <div key={stat.id}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.note}</small></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
