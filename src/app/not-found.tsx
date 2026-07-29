import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "页面未找到",
  description: "请求的页面不存在或已调整，请返回首页或赛事中心继续浏览。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>404 / PAGE NOT FOUND</p>
            <h1>页面未找到</h1>
            <p>请求的页面不存在、地址有误，或相关内容尚未正式发布。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell functional-empty">
            <strong>请选择其他公开入口</strong>
            <p>你可以返回网站首页，或前往赛事中心查看已发布内容。</p>
            <div className="functional-empty-actions">
              <Link href="/">返回首页</Link>
              <Link href="/competitions">前往赛事中心</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
