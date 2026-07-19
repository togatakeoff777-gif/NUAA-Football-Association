import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { demoAnnouncements } from "@/data/content";

const quickLinks = [
  { title: "赛程与赛果", meta: "比赛日信息", href: "/competitions/schedule", index: "01" },
  { title: "赛事文件", meta: "规程与文件入口", href: "/competitions#competition-files", index: "02" },
  { title: "裁判中心", meta: "招募、规则与选派", href: "/referees", index: "03" },
  { title: "参赛指南", meta: "报名与球队说明", href: "/participation", index: "04" },
] as const;

export function NoticeQuickLinks() {
  return (
    <section className="home-notice-links" aria-labelledby="home-notice-title">
      <div className="page-shell notice-links-grid">
        <div className="priority-notices">
          <div className="home-section-bar home-section-bar-compact">
            <div><p>OFFICIAL UPDATE / 重要公告</p><h2 id="home-notice-title">需要优先关注的信息</h2></div>
            <Link className="text-link" href="/news#notices">查看全部公告 →</Link>
          </div>
          <div className="priority-notice-list">
            {demoAnnouncements.slice(0, 3).map((notice) => (
              <Link href={notice.href} key={notice.id}>
                <time>{notice.dateLabel}</time>
                <div><span>{notice.category}</span><h3>{notice.title}</h3></div>
                <StatusBadge tone={notice.publicationStatus === "置顶" ? "warning" : "neutral"}>{notice.publicationStatus} · 演示</StatusBadge>
              </Link>
            ))}
          </div>
        </div>
        <aside className="quick-entry-panel" aria-labelledby="quick-entry-title">
          <div><p>QUICK ACCESS</p><h2 id="quick-entry-title">快捷入口</h2></div>
          <div className="quick-entry-grid">
            {quickLinks.map((item) => (
              <Link href={item.href} key={item.title}>
                <span>{item.index}</span><div><strong>{item.title}</strong><small>{item.meta}</small></div><b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
