import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { publicAnnouncements } from "@/data/content";

export function NoticeQuickLinks() {
  return (
    <section className="home-notice-links home-screen" data-home-screen="notices" id="home-notices" aria-labelledby="home-notice-title">
      <div className="page-shell home-notice-shell">
        <div className="priority-notices">
          <div className="home-section-bar home-section-bar-compact" data-home-reveal data-home-delay="0">
            <div><p>OFFICIAL UPDATE / 重要公告</p><h2 id="home-notice-title">需要优先关注的信息</h2></div>
            <Link className="text-link" href="/news#notices">查看全部公告 →</Link>
          </div>
          <div className="priority-notice-list">
            {publicAnnouncements.slice(0, 3).map((notice) => (
              <Link href={notice.href} key={notice.id} data-home-reveal data-home-delay="1">
                <time>{notice.dateLabel}</time>
                <div><span>{notice.category}</span><h3>{notice.title}</h3></div>
                <StatusBadge tone="neutral">{notice.category}</StatusBadge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
