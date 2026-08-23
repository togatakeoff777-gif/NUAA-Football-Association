"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ContentType = "NEWS" | "ANNOUNCEMENT" | "DISCIPLINE";

type ContentPostFormValue = {
  id?: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  contentJson: string;
  source: string;
  coverMediaId: string;
  pinned: boolean;
  featured: boolean;
  discipline: {
    competitionId: string;
    officialMediaId: string;
    versionLabel: string;
    scopeLabel: string;
  };
};

export function ContentPostForm({
  initialValue,
  imageMedia,
  pdfMedia,
  competitions,
}: {
  initialValue: ContentPostFormValue;
  imageMedia: Array<{ id: string; originalFilename: string }>;
  pdfMedia: Array<{ id: string; originalFilename: string }>;
  competitions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [type, setType] = useState<ContentType>(initialValue.type);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value ?? "DRAFT";
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(
        initialValue.id ? `/api/admin/content/posts/${initialValue.id}` : "/api/admin/content/posts",
        {
          method: initialValue.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type,
            slug: form.get("slug"),
            title: form.get("title"),
            summary: form.get("summary"),
            content: form.get("content"),
            source: form.get("source"),
            coverMediaId: form.get("coverMediaId"),
            pinned: form.get("pinned") === "on",
            featured: form.get("featured") === "on",
            status,
            discipline: type === "DISCIPLINE" ? {
              competitionId: form.get("competitionId"),
              officialMediaId: form.get("officialMediaId"),
              versionLabel: form.get("versionLabel"),
              scopeLabel: form.get("scopeLabel"),
            } : null,
          }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败。");
      const success = status === "PUBLISHED" ? "内容已发布" : status === "ARCHIVED" ? "内容已归档" : "草稿已保存";
      router.replace(`/admin/content/news?message=${encodeURIComponent(success)}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <section className="admin-form-section">
        <header><h2>基础信息</h2><p>Slug 是公开 URL 的稳定标识；发布状态由服务端统一校验。</p></header>
        <div className="admin-form-grid">
          <label><span>内容类型</span><select name="type" onChange={(event) => setType(event.target.value as ContentType)} value={type}><option value="NEWS">新闻</option><option value="ANNOUNCEMENT">公告</option><option value="DISCIPLINE">纪律处罚</option></select></label>
          <label><span>Slug</span><input defaultValue={initialValue.slug} maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          <label className="admin-form-span-2"><span>标题</span><input defaultValue={initialValue.title} maxLength={160} name="title" required /></label>
          <label className="admin-form-span-2"><span>摘要</span><textarea defaultValue={initialValue.summary} maxLength={500} name="summary" required rows={4} /></label>
          <label><span>来源 / 发布部门</span><input defaultValue={initialValue.source} maxLength={120} name="source" /></label>
          <label><span>PUBLIC 封面图片</span><select defaultValue={initialValue.coverMediaId} name="coverMediaId"><option value="">暂不设置</option>{imageMedia.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalFilename}</option>)}</select></label>
        </div>
      </section>
      {type === "DISCIPLINE" ? <section className="admin-form-section">
        <header><h2>纪律处罚信息</h2><p>仅保存已确认的赛事、正式 PDF、版本和适用范围。</p></header>
        <div className="admin-form-grid">
          <label><span>关联赛事</span><select defaultValue={initialValue.discipline.competitionId} name="competitionId"><option value="">暂不关联</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label>
          <label><span>PUBLIC 正式 PDF</span><select defaultValue={initialValue.discipline.officialMediaId} name="officialMediaId"><option value="">草稿暂不设置</option>{pdfMedia.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalFilename}</option>)}</select></label>
          <label><span>版本标签</span><input defaultValue={initialValue.discipline.versionLabel} maxLength={80} name="versionLabel" /></label>
          <label><span>适用范围</span><input defaultValue={initialValue.discipline.scopeLabel} maxLength={160} name="scopeLabel" /></label>
        </div>
      </section> : null}
      <section className="admin-form-section">
        <header><h2>结构化正文 JSON</h2><p>R1-1 使用受控 JSON 输入验证正式 schema；本阶段不集成 TipTap，也不接受任意 HTML。</p></header>
        <label><span>Content JSON</span><textarea defaultValue={initialValue.contentJson} maxLength={100000} name="content" required rows={18} spellCheck={false} /></label>
      </section>
      <section className="admin-form-section">
        <header><h2>展示设置</h2><p>公开 Service 只返回已发布且发布时间不晚于当前时间的内容。</p></header>
        <div className="admin-inline-checks">
          <label><input defaultChecked={initialValue.pinned} name="pinned" type="checkbox" /><span>置顶标记</span></label>
          <label><input defaultChecked={initialValue.featured} name="featured" type="checkbox" /><span>首页推荐</span></label>
        </div>
      </section>
      <p aria-live="polite" className="admin-form-message">{message}</p>
      <footer className="admin-form-savebar">
        <span>请选择保存草稿、发布或归档；服务端会再次验证权限和关联媒体。</span>
        <div>
          <Link className="admin-button admin-button-secondary" href="/admin/content/news">取消</Link>
          <button className="admin-button admin-button-secondary" disabled={submitting} name="status" type="submit" value="DRAFT">保存草稿</button>
          {initialValue.id ? <button className="admin-button admin-button-danger" disabled={submitting} name="status" type="submit" value="ARCHIVED">归档</button> : null}
          <button className="admin-button" disabled={submitting} name="status" type="submit" value="PUBLISHED">发布</button>
        </div>
      </footer>
    </form>
  );
}
