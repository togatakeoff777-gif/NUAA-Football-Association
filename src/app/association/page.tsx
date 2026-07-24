import Link from "next/link";
import type { Metadata } from "next";

import { ArchivePageLayout } from "@/components/templates/archive-page-layout";
import { BrandMark } from "@/components/ui/brand-mark";
import {
  associationCampusRelationship,
  associationDataGovernance,
  associationDevelopmentFacts,
  associationIdentity,
  associationRoleFramework,
  associationScope,
  associationTerms,
} from "@/data/association";
import { ASSOCIATION_EMAIL, bilibiliPlatform, douyinPlatform, wechatPlatform } from "@/data/platforms";

export const metadata: Metadata = { title: "协会", description: "南京航空航天大学天目湖足球协会公开档案。" };

export default function AssociationPage() {
  const identity = (
    <div className="association-identity-aside">
      <div className="archive-identity-card"><BrandMark /><div><span>公开档案编号</span><strong>NUAA-TMH-FA / 2021</strong><small>南京航空航天大学天目湖足球协会</small></div></div>
      <Link className="association-join-button" href="/join">加入我们 <span aria-hidden="true">→</span></Link>
    </div>
  );
  return (
    <ArchivePageLayout eyebrow="ASSOCIATION ARCHIVE" title={<><span className="association-title-line">南京航空航天大学</span><span className="association-title-line">天目湖足球协会</span></>} description="因热爱，奔赴绿茵。以档案式结构呈现协会身份、工作范围与经核验的发展记录。" identity={identity}>
      <div className="archive-overview-grid">
        <section className="archive-profile" aria-labelledby="archive-profile-title"><p>BASIC PROFILE</p><h2 id="archive-profile-title">基本信息</h2><dl><div><dt>正式名称</dt><dd>{associationIdentity.formalName}</dd></div><div><dt>英文名称</dt><dd>{associationIdentity.englishName}</dd></div><div><dt>成立年份</dt><dd>{associationIdentity.establishedYear}</dd></div><div><dt>服务范围</dt><dd>{associationScope.representedCampus}</dd></div><div><dt>公开邮箱</dt><dd><a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a></dd></div></dl></section>
        <section className="archive-stats" aria-labelledby="archive-stats-title"><p>VERIFIED DATA</p><h2 id="archive-stats-title">已确认数据</h2><div>{associationDevelopmentFacts.map((fact) => <article key={fact.id}><strong>{fact.value}</strong><span>{fact.label}</span><small>{fact.note}</small></article>)}</div></section>
      </div>
      <section className="archive-timeline" aria-labelledby="archive-timeline-title"><div><p>TIMELINE</p><h2 id="archive-timeline-title">发展记录</h2><span>只记录经协会核验的事实，不补写未经确认的年份和事件。</span></div><ol><li><time>2021</time><section><span>协会成立</span><h3>南京航空航天大学天目湖足球协会成立</h3><p>成立年份已确认，进一步历史资料将在完成档案核验后补充。</p></section></li><li className="archive-timeline-pending"><time>持续更新</time><section><span>资料整理中</span><h3>岗位对应与详细发展记录待核验</h3><p>任务包提供的历届成员已列于下方；没有明确来源的具体岗位不会推测，也不会公开报名字段中的个人敏感信息。</p></section></li></ol></section>
      <section className="association-structure" aria-labelledby="association-structure-title">
        <div><p>ORGANIZATION</p><h2 id="association-structure-title">组织架构与历届成员</h2><span>岗位框架与成员名单分开呈现；没有来源的岗位对应关系不会推测。</span></div>
        <div className="association-role-strip" aria-label="协会岗位框架">{associationRoleFramework.map((role) => <span key={role}>{role}</span>)}</div>
        <div className="association-term-list">
          {associationTerms.map((term) => <article key={term.term}><header><span>{term.term}</span><time>{term.academicYear}</time></header>{term.positions.length ? <dl>{term.positions.map((item) => <div key={item.role}><dt>{item.role}</dt><dd>{item.name}</dd></div>)}</dl> : null}{term.unassignedMembers.length ? <><p><strong>岗位待核验成员</strong></p><ul>{term.unassignedMembers.map((member) => <li key={member}>{member}</li>)}</ul></> : null}<small>{term.roleNote}</small></article>)}
        </div>
      </section>
      <section className="association-governance" aria-labelledby="association-governance-title">
        <article><p>CAMPUS RELATIONSHIP</p><h2 id="association-governance-title">{associationCampusRelationship.title}</h2><strong>{associationCampusRelationship.description}</strong><p>{associationCampusRelationship.sharedPlatform}</p><p>{associationCampusRelationship.separatePlatform}</p></article>
        <article><p>DATA GOVERNANCE</p><h2>赛事数据治理</h2><ul>{associationDataGovernance.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>
      <section className="association-contact-section" aria-labelledby="association-contact-title">
        <div><p>CONTACT US</p><h2 id="association-contact-title">联系我们</h2><span>赛事、裁判、媒体与内容纠错均使用公开渠道，不展示未经同意的私人联系方式。</span></div>
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
      <section className="archive-scope-record" aria-labelledby="archive-scope-title"><div><p>PUBLIC SCOPE</p><h2 id="archive-scope-title">公开范围记录</h2></div><div><strong>{associationScope.summary}</strong><ul>{associationScope.permittedContent.map((item) => <li key={item}>{item}</li>)}</ul><p>不包含：{associationScope.excludedContent.join("、")}。</p><Link href="/competitions/freshman-cup">查看新生杯跨校区内容边界 →</Link></div></section>
    </ArchivePageLayout>
  );
}
