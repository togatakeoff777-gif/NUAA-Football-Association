import type { ContactCardData, PublicSectionContact } from "@/types";
import { ASSOCIATION_EMAIL } from "@/data/platforms";

const competitionLead = {
  name: "胡兵",
  role: "会长",
  qq: "1663690353",
  email: ASSOCIATION_EMAIL,
} as const;

export const publicSectionContacts = {
  competitions: {
    label: "赛事中心负责人",
    ...competitionLead,
  },
  arbitration: {
    label: "仲裁与申诉负责人",
    ...competitionLead,
  },
  teams: {
    label: "球队信息负责人",
    name: "马俊",
    role: "主管财务副主席",
    qq: "1529427657",
    email: ASSOCIATION_EMAIL,
  },
  news: {
    label: "新闻公告负责人",
    name: "吴佳宇",
    role: "副会长",
    qq: "3383306493",
    email: ASSOCIATION_EMAIL,
  },
  media: {
    label: "影像资料负责人",
    name: "高羽建",
    role: "宣传部部长",
    qq: "904439972",
    email: ASSOCIATION_EMAIL,
  },
  referees: {
    label: "裁判负责人",
    name: "颜铭宣",
    role: "竞赛部部长",
    qq: "482178395",
    email: ASSOCIATION_EMAIL,
  },
} as const satisfies Record<string, PublicSectionContact>;

export const refereeContact: ContactCardData = {
  ...publicSectionContacts.referees,
  responsibilities: [
    "裁判招募",
    "裁判培训",
    "裁判选派",
    "规则咨询",
  ],
};
