import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { FOOTBALL_CHINA_URL } from "@/data/platforms";

export const metadata: Metadata = {
  title: "球队负责人指南",
  description: "天目湖校园足球球队负责人参赛事务说明原型。",
};

const items = [
  {
    title: "确认对应赛事要求",
    description:
      "不同赛事的参赛范围、组队方式和赛制不同，负责人应先阅读对应赛事正式竞赛规程。",
    meta: "赛前准备",
    status: "资料待更新",
  },
  {
    title: "完成球队组建与报名",
    description:
      "球队组建、球员注册和赛事报名通过足球中国平台办理，具体操作步骤等待正式资料。",
    meta: "平台操作",
    status: "指南原型",
    href: FOOTBALL_CHINA_URL,
    external: true,
    openInNewTab: true,
    actionLabel: "打开足球中国",
  },
  {
    title: "关注赛程与赛事通知",
    description:
      "报名完成后仍需留意赛程、纪律与临时调整，最终信息以赛事组织方确认内容为准。",
    meta: "赛事联络",
    status: "以正式通知为准",
  },
];

export default function TeamManagerGuidePage() {
  return (
    <SectionIndexPage
      eyebrow="TEAM MANAGER GUIDE"
      title="球队负责人指南"
      description="为球队负责人提供赛事资料核对、平台报名与赛期联络的基础说明。"
      sectionTitle="负责人工作提示"
      sectionDescription="本轮只建立信息结构，不创建球队账号或保存球员资料。"
      notice="正式职责、材料清单和截止时间须以对应赛事规程及组织方通知为准。"
      statusLabel="指南原型 · 具体资料待更新"
      items={items}
    />
  );
}
