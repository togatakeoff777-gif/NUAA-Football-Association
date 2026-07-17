import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "裁判员注册指南",
  description: "天目湖足协裁判员加入与注册说明原型。",
};

const items = [
  {
    title: "加入裁判队伍",
    description:
      "面向希望成为裁判员的新成员，以及已有证书、希望加入天目湖裁判团队的人员。",
    meta: "团队加入",
    status: "招募资料待更新",
  },
  {
    title: "裁判员注册",
    description:
      "注册条件、所需资料与平台操作将在负责人确认后发布；本页不收集证件或个人信息。",
    meta: "注册说明",
    status: "指南原型",
  },
  {
    title: "比赛执裁报名",
    description:
      "仅面向已被协会确认的裁判员。表达执裁意向不等于正式获得任务，最终结果以选派公示为准。",
    meta: "后续流程",
    status: "以公示为准",
  },
];

export default function RefereeGuidePage() {
  return (
    <SectionIndexPage
      eyebrow="REFEREE REGISTRATION GUIDE"
      title="裁判员注册指南"
      description="区分加入裁判队伍、裁判员注册与比赛执裁报名三个不同环节。"
      sectionTitle="裁判员参与路径"
      sectionDescription="具体岗位与最终选派结果以裁判管理人员确认和官网公示为准。"
      notice="本页为静态说明原型，不进行身份认证、真实注册或执裁报名。"
      statusLabel="指南原型 · 不会真实提交"
      items={items}
    />
  );
}
