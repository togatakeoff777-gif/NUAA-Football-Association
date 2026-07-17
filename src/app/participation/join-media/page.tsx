import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "加入摄影与宣传团队",
  description: "天目湖足协摄影与宣传团队加入说明原型。",
};

const items = [
  {
    title: "摄影与视频",
    description:
      "围绕经确认的天目湖赛事与协会活动开展影像记录，发布前需完成授权和内容核验。",
    meta: "影像方向",
    status: "招募资料待更新",
  },
  {
    title: "编辑与宣传",
    description:
      "参与比赛战报、通知公告、赛事视觉与校园足球文化内容的策划和制作。",
    meta: "内容方向",
    status: "招募资料待更新",
  },
  {
    title: "联系协会",
    description:
      "岗位、作品要求和协作方式尚待更新，可通过协会公开邮箱咨询。",
    meta: "nuaafootball@163.com",
    status: "公开邮箱",
    href: "mailto:nuaafootball@163.com",
    external: true,
    actionLabel: "发送邮件",
  },
];

export default function JoinMediaPage() {
  return (
    <SectionIndexPage
      eyebrow="JOIN THE MEDIA TEAM"
      title="加入摄影与宣传团队"
      description="共同记录天目湖校园足球，但不在资料未确认时冒用人物影像或赛事档案。"
      sectionTitle="团队方向"
      sectionDescription="本轮仅展示说明结构，不开放文件上传、作品提交或在线招募。"
      notice="正式招募岗位、授权要求与提交方式将在协会确认后发布。"
      statusLabel="说明原型 · 招募资料待更新"
      items={items}
    />
  );
}
