import Link from "next/link";

import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { hasUnifiedAdminPermission, requireUnifiedAdminActor } from "@/lib/unified-admin-rbac";

export default async function UnifiedAdminDashboardPage() {
  const actor = await requireUnifiedAdminActor("dashboard:read");
  const canReadContent = hasUnifiedAdminPermission(actor.roles, "content:read");
  const canReadCompetitions = hasUnifiedAdminPermission(actor.roles, "competitions:read");
  const canReadReferees = hasUnifiedAdminPermission(actor.roles, "referees:read");
  const [drafts, published, competitions, activeReferees] = await Promise.all([
    canReadContent ? prisma.contentPost.count({ where: { status: "DRAFT" } }) : Promise.resolve(null),
    canReadContent ? prisma.contentPost.count({ where: { status: "PUBLISHED" } }) : Promise.resolve(null),
    canReadCompetitions ? prisma.competition.count() : Promise.resolve(null),
    canReadReferees ? prisma.referee.count({ where: { status: "ACTIVE" } }) : Promise.resolve(null),
  ]);
  const cards = [
    drafts === null ? null : { label: "内容草稿", value: drafts, hint: "尚未公开" },
    published === null ? null : { label: "已发布内容", value: published, hint: "数据库内容" },
    competitions === null ? null : { label: "赛事", value: competitions, hint: "No-API First" },
    activeReferees === null ? null : { label: "启用裁判员", value: activeReferees, hint: "沿用现有业务" },
  ].filter((item): item is { label: string; value: number; hint: string } => Boolean(item));

  return (
    <>
      <AdminPageHeader eyebrow="UNIFIED ADMIN" title="统一管理后台" description="内容、赛事与裁判业务共用一个安全的管理入口。" />
      <section className="admin-kpi-grid" aria-label="授权模块摘要">
        {cards.map((card) => <article className="admin-kpi-card" key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.hint}</small></article>)}
      </section>
      <AdminPanel title="授权模块" description="页面、接口和服务均按当前账号权限执行服务端校验。">
        <div className="admin-task-list">
          {canReadContent ? <article className="admin-task-item"><i /><div><strong>新闻公告与媒体</strong><p>数据库草稿、发布、归档、分页及 PUBLIC/PRIVATE 媒体。</p></div><Link href="/admin/content/news">进入内容运营</Link></article> : null}
          {canReadReferees ? <article className="admin-task-item"><i /><div><strong>裁判中心</strong><p>直接复用已验收裁判页面，不复制业务 Service 或 DTO。</p></div><Link href="/admin/referees">查看裁判员</Link></article> : null}
          {canReadCompetitions ? <article className="admin-task-item"><i /><div><strong>赛事中心</strong><p>Competition、Team 与 Match 继续使用既有实现。</p></div><Link href="/admin/competitions">进入赛事管理</Link></article> : null}
        </div>
      </AdminPanel>
    </>
  );
}
