import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import type { TeamShowcaseItem } from "@/types";

export const teamDemoNotice =
  "以下球队名称、简介和编号均为演示数据，仅用于展示球队卡片布局，不代表真实天目湖参赛球队。真实球队资料待协会确认后更新。";

export const demoTeams = [
  {
    id: "demo-team-a",
    name: "演示球队 A",
    shortName: "A",
    campus: "tianmuhu",
    organizationId: ASSOCIATION_ORGANIZATION_ID,
    contentOwner: ASSOCIATION_CONTENT_OWNER,
    dataSource: "local",
    externalId: undefined,
    description: "用于展示球队卡片排版的演示信息，不对应任何真实队伍。",
    image: "/images/hero-football.jpg",
    imageAlt: "足球鞋与足球的通用球队展示图",
    dataStatus: "demo",
    badge: "演示球队",
    competitiveDataAvailable: false,
  },
  {
    id: "demo-team-b",
    name: "演示球队 B",
    shortName: "B",
    campus: "tianmuhu",
    organizationId: ASSOCIATION_ORGANIZATION_ID,
    contentOwner: ASSOCIATION_CONTENT_OWNER,
    dataSource: "local",
    externalId: undefined,
    description: "用于展示球队卡片排版的演示信息，不对应任何真实队伍。",
    image: "/images/training.jpg",
    imageAlt: "校园足球训练场景的球队展示图",
    dataStatus: "demo",
    badge: "演示球队",
    competitiveDataAvailable: false,
  },
  {
    id: "demo-team-c",
    name: "演示球队 C",
    shortName: "C",
    campus: "tianmuhu",
    organizationId: ASSOCIATION_ORGANIZATION_ID,
    contentOwner: ASSOCIATION_CONTENT_OWNER,
    dataSource: "local",
    externalId: undefined,
    description: "用于展示球队卡片排版的演示信息，不对应任何真实队伍。",
    image: "/images/news-match.jpg",
    imageAlt: "足球比赛场景的球队展示图",
    dataStatus: "demo",
    badge: "演示球队",
    competitiveDataAvailable: false,
  },
] as const satisfies readonly TeamShowcaseItem[];
