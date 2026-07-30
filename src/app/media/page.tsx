import type { Metadata } from "next";

import { DouyinQrCard } from "@/components/media/douyin-qr-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { bilibiliPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/media" },
  title: "影像资料",
  description: "南航天目湖足协官方抖音二维码与南航校园足球共享视频平台入口。",
  openGraph: {
    title: "影像资料｜南航天目湖足协",
    description: "查看南航足协抖音官方二维码与共享视频平台边界说明。",
    url: "/media",
  },
};

export default function MediaPage() {
  return (
    <>
      <SiteHeader />
      <main className="detail-page media-index-page" id="main-content">
        <section className="detail-hero">
          <div className="page-shell detail-hero-inner">
            <p className="detail-eyebrow">MEDIA</p>
            <h1>影像资料</h1>
            <p className="detail-lead">连接天目湖足球协会独立官方抖音账号与经确认的校园足球影像入口。</p>
            <span className="detail-status">官方平台与影像档案</span>
          </div>
        </section>
        <section className="media-platform-section">
          <div className="page-shell">
            <DouyinQrCard />
            <article className="media-shared-platform">
              <span>BILIBILI / 共享视频平台</span>
              <h2>{bilibiliPlatform.name}</h2>
              <p>{bilibiliPlatform.description}</p>
              <a href={bilibiliPlatform.href} rel="noopener noreferrer" target="_blank">
                前往哔哩哔哩主页 ↗
              </a>
            </article>
            <article className="media-archive-note">
              <h2>影像档案与内容协作</h2>
              <p>逐步整理经授权的天目湖赛事照片与视频，仅发布完成来源与授权核验的内容。影像投稿与纠错请通过协会公开邮箱联系。</p>
              <a href="mailto:nuaafootball@163.com">nuaafootball@163.com</a>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
