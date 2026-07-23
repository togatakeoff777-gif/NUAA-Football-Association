import type { PublicCompetitionFile, PublicFileCategory } from "@/types/competition-center";

const categoryOrder: readonly { key: PublicFileCategory; label: string; description: string }[] = [
  { key: "regulations", label: "规则与版本", description: "国际足联、中国足协审定或发布的竞赛规则与版本说明。" },
  { key: "guidebooks", label: "秩序册与赛事指南", description: "经协会确认可以公开的赛事组织文件。" },
  { key: "schedules", label: "赛程文件", description: "可下载赛程文件尚未单独提供。" },
  { key: "appointments", label: "裁判选派", description: "裁判选派以官网已发布公示为准。" },
  { key: "discipline", label: "纪律决定", description: "协会提供的公开处罚决定原件。" },
  { key: "notices", label: "赛事通知", description: "可下载通知文件尚未单独提供。" },
];

export function CompetitionFileCenter({ files }: { files: readonly PublicCompetitionFile[] }) {
  return (
    <div className="functional-file-groups">
      {categoryOrder.map((category) => {
        const categoryFiles = files.filter((file) => file.category === category.key);
        return (
          <section id={category.key} key={category.key}>
            <header><div><span>{category.label}</span><h2>{category.label}</h2></div><p>{category.description}</p></header>
            {categoryFiles.length ? (
              <div className="functional-file-list">
                {categoryFiles.map((file) => (
                  <article key={file.id}>
                    <div><span>{file.fileType}</span><strong>{file.title}</strong><small>{file.scope} · {file.source}</small></div>
                    <dl><div><dt>版本</dt><dd>{file.version}</dd></div><div><dt>发布日期</dt><dd>{file.publishedAt}</dd></div></dl>
                    <a href={file.href} download>下载原文件</a>
                  </article>
                ))}
              </div>
            ) : <div className="functional-empty functional-empty-compact"><strong>暂无公开文件</strong><p>不会创建无来源的下载链接。</p></div>}
          </section>
        );
      })}
    </div>
  );
}
