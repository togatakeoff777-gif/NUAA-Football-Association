import Link from "next/link";
import type { Metadata } from "next";

import { ArchivePageLayout } from "@/components/templates/archive-page-layout";
import { BrandMark } from "@/components/ui/brand-mark";
import { associationDevelopmentFacts, associationIdentity, associationScope } from "@/data/association";
import { ASSOCIATION_EMAIL } from "@/data/platforms";

export const metadata: Metadata = { title: "协会", description: "南京航空航天大学天目湖足球协会公开档案。" };

export default function AssociationPage() {
  const identity = <div className="archive-identity-card"><BrandMark /><div><span>公开档案编号</span><strong>NUAA-TMH-FA / 2021</strong><small>南京航空航天大学天目湖足球协会</small></div></div>;
  return (
    <ArchivePageLayout eyebrow="ASSOCIATION ARCHIVE" title="南京航空航天大学天目湖足球协会" description="因热爱，奔赴绿茵。以档案式结构呈现协会身份、工作范围与经核验的发展记录。" identity={identity}>
      <div className="archive-overview-grid">
        <section className="archive-profile" aria-labelledby="archive-profile-title"><p>BASIC PROFILE</p><h2 id="archive-profile-title">基本信息</h2><dl><div><dt>正式名称</dt><dd>{associationIdentity.formalName}</dd></div><div><dt>英文名称</dt><dd>{associationIdentity.englishName}</dd></div><div><dt>成立年份</dt><dd>{associationIdentity.establishedYear}</dd></div><div><dt>服务范围</dt><dd>{associationScope.representedCampus}</dd></div><div><dt>公开邮箱</dt><dd><a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a></dd></div></dl></section>
        <section className="archive-stats" aria-labelledby="archive-stats-title"><p>VERIFIED DATA</p><h2 id="archive-stats-title">已确认数据</h2><div>{associationDevelopmentFacts.map((fact) => <article key={fact.id}><strong>{fact.value}</strong><span>{fact.label}</span><small>{fact.note}</small></article>)}</div></section>
      </div>
      <section className="archive-timeline" aria-labelledby="archive-timeline-title"><div><p>TIMELINE</p><h2 id="archive-timeline-title">发展记录</h2><span>只记录经协会核验的事实，不补写未经确认的年份和事件。</span></div><ol><li><time>2021</time><section><span>协会成立</span><h3>南京航空航天大学天目湖足球协会成立</h3><p>成立年份已确认，进一步历史资料将在完成档案核验后补充。</p></section></li><li className="archive-timeline-pending"><time>持续更新</time><section><span>资料整理中</span><h3>赛事、组织与成员档案待核验</h3><p>详细发展历程、组织架构和历届成员不在首页展开，也不会使用未经授权的个人资料。</p></section></li></ol></section>
      <section className="archive-scope-record" aria-labelledby="archive-scope-title"><div><p>PUBLIC SCOPE</p><h2 id="archive-scope-title">公开范围记录</h2></div><div><strong>{associationScope.summary}</strong><ul>{associationScope.permittedContent.map((item) => <li key={item}>{item}</li>)}</ul><p>不包含：{associationScope.excludedContent.join("、")}。</p><Link href="/competitions/cross-campus">查看跨校区内容边界 →</Link></div></section>
    </ArchivePageLayout>
  );
}
