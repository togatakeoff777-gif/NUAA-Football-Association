import type { Metadata } from "next";

import { DouyinQrCard } from "@/components/media/douyin-qr-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SectionContactCard } from "@/components/ui/section-contact-card";
import { publicSectionContacts } from "@/data/contacts";
import { bilibiliPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/media" },
  title: "影像资料",
  description: "南京航空航天大学天目湖足球协会官方抖音二维码与南航校园足球共享视频平台入口。",
  openGraph: {
    title: "影像资料｜南京航空航天大学天目湖足球协会",
    description: "查看南航足协官方媒体账号与校园足球影像资料。",
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
            <p className="detail-lead">汇集天目湖足球协会官方媒体账号与校园足球影像资料。</p>
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
            <SectionContactCard contact={publicSectionContacts.media} note="影像投稿与内容纠错" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
