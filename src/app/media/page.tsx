import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "影像",
  description: "南航校园足球影像与共享视频平台入口。",
};

const items = [
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
      "后续整理经授权的天目湖赛事照片与视频；本轮不发布未经授权的人物影像。",
    meta: "影像资料",
    status: "资料待更新",
  },
  {
    title: "影像投稿与纠错",
    description:
      "未来提供投稿规范、授权说明和内容纠错方式，本轮不开放文件上传或个人资料收集。",
    meta: "内容协作",
    status: "功能未开放",
  },
];

export default function MediaPage() {
  return (
    <SectionIndexPage
      eyebrow="MEDIA"
      title="影像"
      description="连接天目湖校园足球影像档案与南航校园足球共享视频平台。"
      sectionTitle="影像入口"
      sectionDescription="影像发布须经过内容确认与授权，不使用未经授权的人物照片。"
      notice="“南航大足球协会”哔哩哔哩账号为校区共享视频平台，不是天目湖足协独立账号。"
      items={items}
    />
  );
}
