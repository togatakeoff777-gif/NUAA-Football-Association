import { notFound, redirect } from "next/navigation";

import { ContentPostForm } from "@/components/admin/content-post-form";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { getAdminContentPost } from "@/lib/admin-content-service";
import { prisma } from "@/lib/prisma";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function EditContentPostPage({ params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireUnifiedAdminActor("content:write");
  } catch (error) {
    if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=content");
    throw error;
  }
  const { id } = await params;
  const [post, imageMedia, pdfMedia, competitions] = await Promise.all([
    getAdminContentPost(id, actor),
    prisma.mediaAsset.findMany({ where: { visibility: "PUBLIC", mimeType: { startsWith: "image/" } }, select: { id: true, originalFilename: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.mediaAsset.findMany({ where: { visibility: "PUBLIC", mimeType: "application/pdf" }, select: { id: true, originalFilename: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: [{ year: "desc" }, { name: "asc" }], take: 200 }),
  ]);
  if (!post) notFound();
  return <><AdminPageHeader eyebrow="CONTENT OPERATIONS" title="编辑内容" description={`当前状态：${post.status}`} /><ContentPostForm competitions={competitions} imageMedia={imageMedia} initialValue={{ id: post.id, type: post.type, slug: post.slug, title: post.title, summary: post.summary, contentJson: JSON.stringify(post.content, null, 2), source: post.source ?? "", coverMediaId: post.coverMedia?.id ?? "", pinned: post.pinned, featured: post.featured, discipline: { competitionId: post.discipline?.competitionId ?? "", officialMediaId: post.discipline?.officialMediaId ?? "", versionLabel: post.discipline?.versionLabel ?? "", scopeLabel: post.discipline?.scopeLabel ?? "" } }} pdfMedia={pdfMedia} /></>;
}
