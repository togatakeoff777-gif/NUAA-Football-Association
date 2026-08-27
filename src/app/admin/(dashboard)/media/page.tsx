import Link from "next/link";

import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { getAdminMediaPage } from "@/lib/admin-media-service";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";
import { hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";

function formatBytes(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await guardUnifiedAdminPage("media:read", "media");
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number(params.page) : 1;
  const visibility = params.visibility === "PUBLIC" || params.visibility === "PRIVATE" ? params.visibility : undefined;
  const result = await getAdminMediaPage({ actor, page: Number.isSafeInteger(page) ? page : 1, visibility });
  const canUpload = hasUnifiedAdminPermission(actor.roles, "media:write");
  return (
    <>
      <AdminPageHeader eyebrow="MEDIA ASSETS" title="媒体与附件" description="真实文件保存到 NUAAFA_UPLOAD_DIR；SQLite 只保存元数据和权限。" />
      {canUpload ? <AdminPanel title="上传文件" description="服务端校验扩展名、MIME、signature、大小和 storage key。"><div className="admin-panel-body"><MediaUploadForm /></div></AdminPanel> : null}
      <form className="admin-filter-bar">
        <label><span>可见性</span><select defaultValue={visibility ?? ""} name="visibility"><option value="">全部</option><option value="PUBLIC">PUBLIC</option><option value="PRIVATE">PRIVATE</option></select></label>
        <button className="admin-button admin-button-secondary" type="submit">筛选</button>
        <Link className="admin-filter-reset" href="/admin/media">清除</Link>
      </form>
      <AdminPanel title={`媒体列表 · ${result.total}`} description={`数据库分页：每页 ${result.pageSize} 条，第 ${result.page} / ${result.totalPages} 页。`}>
        {result.items.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>文件名</th><th>权限</th><th>类型</th><th>大小</th><th>说明</th><th>上传者</th><th>时间</th><th>访问</th></tr></thead><tbody>{result.items.map((asset) => <tr key={asset.id}><td><strong>{asset.originalFilename}</strong>{asset.fileStatus === "MISSING" ? <small className="admin-file-missing">文件缺失</small> : null}</td><td><span className="admin-media-visibility" data-visibility={asset.visibility}>{asset.visibility}</span></td><td>{asset.mimeType}</td><td>{formatBytes(asset.size)}</td><td>{asset.altText || "—"}</td><td>{asset.uploadedByAdmin?.displayName ?? "兼容管理员"}</td><td>{formatRefereeDateTime(asset.createdAt)}</td><td><div className="admin-table-actions">{asset.fileStatus === "AVAILABLE" ? <a href={`/media/${asset.id}`} rel="noreferrer" target="_blank">打开</a> : <span>不可用</span>}</div></td></tr>)}</tbody></table></div> : <AdminEmptyState title="媒体库为空" description="上传图片或 PDF 后会显示在这里。" />}
        <nav aria-label="媒体分页" className="admin-pagination">
          {result.page > 1 ? <Link href={`/admin/media?page=${result.page - 1}${visibility ? `&visibility=${visibility}` : ""}`}>上一页</Link> : <span>上一页</span>}
          <span>{result.page} / {result.totalPages}</span>
          {result.page < result.totalPages ? <Link href={`/admin/media?page=${result.page + 1}${visibility ? `&visibility=${visibility}` : ""}`}>下一页</Link> : <span>下一页</span>}
        </nav>
      </AdminPanel>
    </>
  );
}
