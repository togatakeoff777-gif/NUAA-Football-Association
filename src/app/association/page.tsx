import Link from "next/link";
import type { Metadata } from "next";

import { ArchivePageLayout } from "@/components/templates/archive-page-layout";
import { BrandMark } from "@/components/ui/brand-mark";
import {
  associationDataGovernance,
  associationDevelopmentFacts,
  associationIdentity,
  associationRoleFramework,
  associationScope,
  associationTimeline,
  associationTerms,
  currentAssociationTeam,
} from "@/data/association";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareActions } from "@/components/share/share-actions";
import { organizationJsonLd } from "@/lib/structured-data";
import { ASSOCIATION_EMAIL, bilibiliPlatform, douyinPlatform, wechatPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/association" },
  title: "协会",
  description: "南京航空航天大学天目湖足球协会公开档案。",
  openGraph: {
    title: "关于南京航空航天大学天目湖足球协会",
    description: "协会身份、现任足协成员、历届成员、服务范围与公开联系方式。",
    url: "/association",
  },
};

export default function AssociationPage() {
  const identity = (
    <div className="association-identity-aside">
      <div className="archive-identity-card"><BrandMark /><div><span>公开档案编号</span><strong>NUAA-TMH-FA / 2022</strong><small>南京航空航天大学天目湖足球协会</small></div></div>
      <Link className="association-join-button" href="/join">加入我们 <span aria-hidden="true">→</span></Link>
    </div>
  );
  return (
    <ArchivePageLayout eyebrow="ASSOCIATION ARCHIVE" title={<><span className="association-title-line">南京航空航天大学</span><span className="association-title-line">天目湖足球协会</span></>} description="因热爱，奔赴绿茵。了解协会身份、工作范围与发展记录。" identity={identity}>
      <div className="archive-overview-grid">
        <section className="archive-profile" aria-labelledby="archive-profile-title"><p>BASIC PROFILE</p><h2 id="archive-profile-title">基本信息</h2><dl><div><dt>正式名称</dt><dd>{associationIdentity.formalName}</dd></div><div><dt>英文名称</dt><dd>{associationIdentity.englishName}</dd></div><div><dt>成立年份</dt><dd>{associationIdentity.establishedYear}</dd></div><div><dt>服务范围</dt><dd>{associationScope.representedCampus}</dd></div><div><dt>公开邮箱</dt><dd><a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a></dd></div></dl></section>
        <section className="archive-stats" aria-labelledby="archive-stats-title"><p>ASSOCIATION DATA</p><h2 id="archive-stats-title">协会概况</h2><div>{associationDevelopmentFacts.map((fact) => <article key={fact.id}><strong>{fact.value}</strong><span>{fact.label}</span><small>{fact.note}</small></article>)}</div></section>
      </div>
      <section className="archive-timeline" aria-labelledby="archive-timeline-title"><div><p>TIMELINE</p><h2 id="archive-timeline-title">发展记录</h2><span>记录协会组织建设与校园足球赛事体系的发展历程。</span></div><ol>{associationTimeline.map((entry) => <li key={entry.period}><time>{entry.period}</time><section><span>发展阶段</span><h3>{entry.label}</h3><p>{entry.description}</p></section></li>)}</ol></section>
      <JsonLd data={organizationJsonLd()} />
      <ShareActions title="南京航空航天大学天目湖足球协会" />
      <section className="association-current-team" aria-labelledby="association-current-team-title">
        <div><p>CURRENT TEAM</p><h2 id="association-current-team-title">现任足协成员</h2><span>{currentAssociationTeam.termNote}</span></div>
        <dl>
          {currentAssociationTeam.positions.map((item, index) => (
            <div key={`${item.role}-${item.name}-${index}`}><dt>{item.role}</dt><dd>{item.name}</dd></div>
          ))}
        </dl>
        <small>{currentAssociationTeam.note}</small>
      </section>
      <section className="association-structure" aria-labelledby="association-structure-title">
        <div><p>ORGANIZATION</p><h2 id="association-structure-title">组织架构与历届成员</h2><span>查看协会岗位框架与历届成员记录。</span></div>
        <div className="association-role-strip" aria-label="协会岗位框架">{associationRoleFramework.map((role) => <span key={role}>{role}</span>)}</div>
        <div className="association-term-list">
          {associationTerms.map((term) => <article key={term.term}><header><span>{term.term}</span><time>{term.academicYear}</time></header>{term.positions.length ? <dl>{term.positions.map((item) => <div key={item.role}><dt>{item.role}</dt><dd>{item.name}</dd></div>)}</dl> : null}{term.unassignedMembers.length ? <><p><strong>岗位信息待补充成员</strong></p><ul>{term.unassignedMembers.map((member) => <li key={member}>{member}</li>)}</ul></> : null}<small>{term.roleNote}</small></article>)}
        </div>
      </section>
      <section className="association-governance" aria-labelledby="association-governance-title">
        <article><p>COMPETITION SERVICES</p><h2 id="association-governance-title">赛事服务</h2><ul>{associationDataGovernance.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>
      <section className="association-contact-section" aria-labelledby="association-contact-title">
        <div><p>CONTACT US</p><h2 id="association-contact-title">联系我们</h2><span>赛事、裁判、媒体合作与内容纠错可通过以下公开渠道联系。</span></div>
        <dl>
          <div><dt>协会名称</dt><dd>{associationIdentity.formalName}</dd></div>
          <div><dt>服务范围</dt><dd>{associationScope.representedCampus}</dd></div>
          <div><dt>公开邮箱</dt><dd><a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a></dd></div>
          <div><dt>微信公众号</dt><dd>{wechatPlatform.name}</dd></div>
          <div><dt>哔哩哔哩</dt><dd><a href={bilibiliPlatform.href} rel="noopener noreferrer" target="_blank">{bilibiliPlatform.name}</a></dd></div>
          <div><dt>抖音</dt><dd>{douyinPlatform.name} · {douyinPlatform.label}</dd></div>
          <div><dt>招新 QQ 群</dt><dd>招新群待创建</dd></div>
          <div><dt>裁判事务</dt><dd><Link href="/referees#referee-contact">进入裁判中心联系区</Link></dd></div>
          <div><dt>赛事事务</dt><dd><Link href="/competitions">进入赛事中心</Link></dd></div>
          <div><dt>新闻投稿与纠错</dt><dd><a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a></dd></div>
        </dl>
      </section>
      <section className="archive-scope-record" aria-labelledby="archive-scope-title"><div><p>PUBLIC SCOPE</p><h2 id="archive-scope-title">公开范围记录</h2></div><div><strong>{associationScope.summary}</strong><ul>{associationScope.permittedContent.map((item) => <li key={item}>{item}</li>)}</ul></div></section>
    </ArchivePageLayout>
  );
}
