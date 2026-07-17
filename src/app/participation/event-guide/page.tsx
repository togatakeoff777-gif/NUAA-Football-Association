import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { FOOTBALL_CHINA_URL } from "@/data/platforms";

export const metadata: Metadata = {
  title: "赛事报名指南",
  description: "天目湖校园足球赛事报名说明原型。",
};

const items = [
  {
    title: "查看赛事通知与竞赛规程",
    description:
      "报名时间、参赛范围、赛制和资格要求须以对应赛事正式通知与最新竞赛规程为准。",
    meta: "第一步",
    status: "资料待更新",
  },
  {
    title: "在足球中国完成相关操作",
    description:
      "球员注册、球队组建、赛事报名及相关竞赛管理统一通过足球中国平台完成。",
    meta: "第二步",
    status: "外部平台办理",
    href: FOOTBALL_CHINA_URL,
    external: true,
    openInNewTab: true,
    actionLabel: "打开足球中国",
  },
  {
    title: "等待赛事组织方确认",
    description:
      "平台操作不代表参赛资格自动确认，最终结果以赛事组织方审核与通知为准。",
    meta: "第三步",
    status: "以正式通知为准",
  },
];

export default function EventGuidePage() {
  return (
    <SectionIndexPage
      eyebrow="PARTICIPATION GUIDE"
      title="赛事报名指南"
      description="说明天目湖校园足球赛事报名的一般入口与核验原则。"
      sectionTitle="报名流程原型"
      sectionDescription="具体时间、材料和资格要求将在赛事资料确认后更新。"
      notice="本页不会提交报名，也不会要求填写身份证、学号或手机号。"
      statusLabel="指南原型 · 具体资料待更新"
      items={items}
    />
  );
}
