import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { ASSOCIATION_EMAIL, DOUYIN_ID } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/media" },
  title: "影像资料",
  description: "南航校园足球影像资料与共享视频平台入口。",
};

const items = [
  {
    title: "南航足协 · 抖音",
    description: `抖音号 ${DOUYIN_ID}，南京航空航天大学天目湖足球协会独立官方账号。官方二维码原图尚待协会提供。`,
    meta: "天目湖足协独立官方账号",
    status: "二维码待协会提供",
  },
  {
    title: "南航大足球协会 · 哔哩哔哩",
    description:
      "观看南航校园足球比赛集锦、全场录像、赛事回顾和人物影像。该账号由相关校区足球组织共同使用。",
    meta: "南航校园足球共享视频平台",
    status: "外部平台",
    href: "https://space.bilibili.com/1030999538?spm_id_from=333.337.0.0",
    external: true,
    openInNewTab: true,
    actionLabel: "前往哔哩哔哩",
  },
  {
    title: "天目湖影像档案",
    description:
      "逐步整理经授权的天目湖赛事照片与视频，仅发布完成来源与授权核验的内容。",
    meta: "影像资料",
    status: "资料待更新",
  },
  {
    title: "影像投稿与纠错",
    description:
      `不建设上传表单或后台。宣传部负责人联系方式待协会确认，可先通过 ${ASSOCIATION_EMAIL} 联系。`,
    meta: "内容协作",
    status: "联系人待确认",
    href: `mailto:${ASSOCIATION_EMAIL}`,
    actionLabel: "邮件联系",
  },
];

export default function MediaPage() {
  return (
    <SectionIndexPage
      pageClassName="media-index-page"
      eyebrow="MEDIA"
      title="影像资料"
      description="连接天目湖校园足球影像资料档案与南航校园足球共享视频平台。"
      sectionTitle="影像资料入口"
      sectionDescription="影像发布须经过内容确认与授权，不使用未经授权的人物照片。"
      notice="抖音“南航足协”（nuaafa）为天目湖足协独立官方账号；“南航大足球协会”哔哩哔哩账号为校区共享视频平台。"
      statusLabel="官方平台与影像档案"
      items={items}
    />
  );
}
