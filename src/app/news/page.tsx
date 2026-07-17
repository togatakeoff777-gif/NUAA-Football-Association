import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "新闻与公告",
  description: "南航天目湖足协新闻与通知公告入口。",
};

const items = [
  {
    title: "新闻",
    description:
      "用于发布比赛战报、协会动态、人物专访、校园足球文化与裁判内容，正式稿件等待核验与授权。",
    meta: "内容栏目",
    status: "演示内容",
  },
  {
    title: "通知公告",
    description:
      "用于发布报名通知、赛程调整、竞赛规程、招募通知与赛事纪律通知，与新闻内容分开管理。",
    meta: "信息发布",
    status: "演示内容",
  },
  {
    title: "内容归档",
    description:
      "后续支持按赛事、内容类型与时间检索；当前未接入内容管理系统或数据库。",
    meta: "维护预留",
    status: "功能未开放",
  },
];

export default function NewsPage() {
  return (
    <SectionIndexPage
      eyebrow="NEWS & NOTICES"
      title="新闻与公告"
      description="记录南航天目湖足协赛事、协会活动和校园足球文化，并将新闻与通知公告清晰分栏。"
      sectionTitle="内容栏目"
      sectionDescription="所有演示标题与摘要均需明确标识，不作为真实赛事或协会档案。"
      notice="正式内容将由南京航空航天大学天目湖足球协会核验后发布。"
      items={items}
    />
  );
}
