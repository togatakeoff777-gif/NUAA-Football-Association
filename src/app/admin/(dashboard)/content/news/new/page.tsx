import { redirect } from "next/navigation";

import { createEmptyStructuredContent } from "@/lib/admin-content-input";
import { ContentPostForm } from "@/components/admin/content-post-form";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function NewContentPostPage() {
  try {
    await requireUnifiedAdminActor("content:write");
  } catch (error) {
    if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=content");
    throw error;
  }
  const [imageMedia, pdfMedia, competitions] = await Promise.all([
    prisma.mediaAsset.findMany({ where: { visibility: "PUBLIC", mimeType: { startsWith: "image/" } }, select: { id: true, originalFilename: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.mediaAsset.findMany({ where: { visibility: "PUBLIC", mimeType: "application/pdf" }, select: { id: true, originalFilename: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: [{ year: "desc" }, { name: "asc" }], take: 200 }),
  ]);
  return <><AdminPageHeader eyebrow="CONTENT OPERATIONS" title="新建内容" description="先保存草稿，确认关联媒体满足公开条件后再发布。" /><ContentPostForm competitions={competitions} imageMedia={imageMedia} initialValue={{ type: "NEWS", slug: "", title: "", summary: "", contentJson: JSON.stringify(createEmptyStructuredContent(), null, 2), source: "", coverMediaId: "", pinned: false, featured: false, discipline: { competitionId: "", officialMediaId: "", versionLabel: "", scopeLabel: "" } }} pdfMedia={pdfMedia} /></>;
}
