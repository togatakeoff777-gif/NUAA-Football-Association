import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StructuredContentView } from "@/components/structured-content-view";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { getAdminContentPost } from "@/lib/admin-content-service";
import { requireUnifiedAdminActor } from "@/lib/unified-admin-rbac";

export const metadata: Metadata = { title: "内容安全预览", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function AdminContentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireUnifiedAdminActor("content:read");
  const { id } = await params;
  const post = await getAdminContentPost(id, actor);
  if (!post) notFound();
  return <>
    <AdminPageHeader description="该地址要求管理员 content:read 权限，并明确禁止搜索引擎索引；预览不会改变发布状态。" eyebrow="SECURE PREVIEW" title={post.title} />
    <AdminPanel description={`${post.type} · ${post.status} · /news/${post.slug}`} title="后台预览">
      <article className="detail-prose admin-preview-prose"><p className="detail-article-lead">{post.summary}</p><StructuredContentView value={post.content} /></article>
    </AdminPanel>
  </>;
}
