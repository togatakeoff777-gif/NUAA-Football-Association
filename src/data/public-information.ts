import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import type { NoticeItem } from "@/types";

const sharedMetadata = {
  campus: "tianmuhu",
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
} as const;

export type DisciplineDecision = NoticeItem & {
  fileType: "PDF";
  version: string;
  scope: string;
  source: string;
  pdfHref: string;
};

export type DisciplineDecisionArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: readonly string[] };

export const disciplineDecisions = [
  {
    ...sharedMetadata,
    id: "discipline-bai-yile",
    category: "纪律决定",
    dateLabel: "2026.06.22",
    publishedAt: "2026-06-22T12:00:00+08:00",
    updatedAt: "2026-06-22T12:00:00+08:00",
    title: "关于球员拜宜乐违规违纪的处罚决定",
    summary: "关于球员拜宜乐在2026年天目湖七人制联赛半决赛中违规违纪的公开纪律决定。",
    href: "/news/discipline-bai-yile",
    pdfHref: "/documents/competitions/discipline/2026/bai-yile-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "纪律决定",
    fileType: "PDF",
    version: "正式决定",
    scope: "2026年天目湖七人制联赛",
    source: ASSOCIATION_CONTENT_OWNER,
  },
  {
    ...sharedMetadata,
    id: "discipline-meng-lingxue",
    category: "纪律决定",
    dateLabel: "2026.06.15",
    publishedAt: "2026-06-15T12:00:00+08:00",
    updatedAt: "2026-06-15T12:00:00+08:00",
    title: "关于球员孟令学违规违纪的处罚决定",
    summary: "关于球员孟令学在2026年天目湖七人制联赛半决赛中违规违纪的公开纪律决定。",
    href: "/news/discipline-meng-lingxue",
    pdfHref: "/documents/competitions/discipline/2026/meng-lingxue-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "纪律决定",
    fileType: "PDF",
    version: "正式决定",
    scope: "2026年天目湖七人制联赛",
    source: ASSOCIATION_CONTENT_OWNER,
  },
  {
    ...sharedMetadata,
    id: "discipline-chen-feiyu",
    category: "纪律决定",
    dateLabel: "2026.06.15",
    publishedAt: "2026-06-15T12:00:00+08:00",
    updatedAt: "2026-06-15T12:00:00+08:00",
    title: "关于球员陈飞宇违规违纪的处罚决定",
    summary: "关于球员陈飞宇在2026年天目湖七人制联赛半决赛中违规违纪的公开纪律决定。",
    href: "/news/discipline-chen-feiyu",
    pdfHref: "/documents/competitions/discipline/2026/chen-feiyu-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "纪律决定",
    fileType: "PDF",
    version: "正式决定",
    scope: "2026年天目湖七人制联赛",
    source: ASSOCIATION_CONTENT_OWNER,
  },
  {
    ...sharedMetadata,
    id: "discipline-wei-yuxuan",
    category: "纪律决定",
    dateLabel: "2026.06.15",
    publishedAt: "2026-06-15T12:00:00+08:00",
    updatedAt: "2026-06-15T12:00:00+08:00",
    title: "关于裁判员魏宇轩违规违纪的处罚决定",
    summary: "关于裁判员魏宇轩在2026年天目湖七人制联赛半决赛中违规违纪的公开纪律决定。",
    href: "/news/discipline-wei-yuxuan",
    pdfHref: "/documents/competitions/discipline/2026/wei-yuxuan-referee-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "纪律决定",
    fileType: "PDF",
    version: "正式决定",
    scope: "2026年天目湖七人制联赛",
    source: ASSOCIATION_CONTENT_OWNER,
  },
] as const satisfies readonly DisciplineDecision[];

const playerRuleBasis =
  "依据《秩序册》第十二章第1节中“球员应当尊重赛事相关团队及组织，严格遵守竞赛规则和赛事秩序册各项规定。”相关规定，经南京航空航天大学天目湖足球协会研究，现作出如下处理决定：";

const disciplineDecisionArticles = {
  "discipline-bai-yile": {
    blocks: [
      { type: "paragraph", text: "各参赛队：" },
      { type: "paragraph", text: "在2026年6月14日晚进行的2026年南京航空航天大学天目湖七人制联赛半决赛不队对阵cfy 一打十一迫于赛制只能一打七队的比赛（场序15）中，不队球员拜宜乐击打他人，严重犯规。" },
      { type: "paragraph", text: "拜宜乐同学的上述行为破坏了南京航空航天大学足球运动的良好氛围与竞赛秩序。" },
      { type: "paragraph", text: playerRuleBasis },
      { type: "list", items: ["对拜宜乐同学追加红牌一张。", "对拜宜乐同学予以禁赛一场的处罚。"] },
      { type: "paragraph", text: "特此通知。" },
      { type: "paragraph", text: "南京航空航天大学天目湖足球协会" },
      { type: "paragraph", text: "2026年6月22日" },
    ],
  },
  "discipline-meng-lingxue": {
    blocks: [
      { type: "paragraph", text: "各参赛队：" },
      { type: "paragraph", text: "在2026年6月14日晚进行的2026年南京航空航天大学天目湖七人制联赛半决赛不队对阵cfy 一打十一迫于赛制只能一打七队的比赛（场序15）中，替补队员孟令学进入比赛场地，冲撞当值第二助理裁判员魏宇轩。" },
      { type: "paragraph", text: "孟令学同学的上述行为破坏了南京航空航天大学足球运动的良好氛围与竞赛秩序。" },
      { type: "paragraph", text: playerRuleBasis },
      { type: "list", items: ["对孟令学同学追加红牌一张。", "对孟令学同学予以禁赛一学年的处罚，禁止参加2026—2027学年南京航空航天大学各项足球活动。"] },
      { type: "paragraph", text: "特此通知。" },
      { type: "paragraph", text: "南京航空航天大学天目湖足球协会" },
      { type: "paragraph", text: "2026年6月15日" },
    ],
  },
  "discipline-chen-feiyu": {
    blocks: [
      { type: "paragraph", text: "各参赛队：" },
      { type: "paragraph", text: "在2026年6月14日晚进行的2026年南京航空航天大学天目湖七人制联赛半决赛不队对阵cfy 一打十一迫于赛制只能一打七队的比赛（场序15）中，场下队员陈飞宇进入比赛场地，以侮辱性语言持续攻击当值主裁判。" },
      { type: "paragraph", text: "陈飞宇同学的上述行为破坏了南京航空航天大学足球运动的良好氛围与竞赛秩序。" },
      { type: "paragraph", text: playerRuleBasis },
      { type: "list", items: ["对陈飞宇同学予以禁赛一学年的处罚，禁止参加2026—2027学年南京航空航天大学各项足球活动。"] },
      { type: "paragraph", text: "特此通知。" },
      { type: "paragraph", text: "南京航空航天大学天目湖足球协会" },
      { type: "paragraph", text: "2026年6月15日" },
    ],
  },
  "discipline-wei-yuxuan": {
    blocks: [
      { type: "paragraph", text: "各参赛队，各裁判员：" },
      { type: "paragraph", text: "在2026年6月14日晚进行的2026年南京航空航天大学天目湖七人制联赛半决赛不队对阵cfy 一打十一迫于赛制只能一打七队的比赛（场序15）中，当值第二助理裁判员魏宇轩与球员在赛后发生推搡与冲突。" },
      { type: "paragraph", text: "魏宇轩同学的上述行为破坏了南京航空航天大学足球运动的良好氛围与竞赛秩序。" },
      { type: "paragraph", text: "依据《秩序册》第十五章第3节中第3条相关规定，经南京航空航天大学天目湖足球协会研究，现作出如下处理决定：" },
      { type: "list", items: ["对魏宇轩同学予以禁哨一学期的处罚，禁止作为裁判员参加2026—2027学年第一学期南京航空航天大学各项足球活动。"] },
      { type: "paragraph", text: "特此通知。" },
      { type: "paragraph", text: "南京航空航天大学天目湖足球协会" },
      { type: "paragraph", text: "2026年6月15日" },
    ],
  },
} as const satisfies Record<
  string,
  { blocks: readonly DisciplineDecisionArticleBlock[] }
>;

export function getDisciplineDecision(slug: string) {
  return disciplineDecisions.find((decision) => decision.id === slug);
}

export function getDisciplineDecisionArticle(slug: string) {
  return disciplineDecisionArticles[slug as keyof typeof disciplineDecisionArticles];
}

export const homepageDisciplineDecisions = disciplineDecisions.slice(0, 3);
