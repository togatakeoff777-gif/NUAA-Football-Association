import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import type { NewsItem, NoticeItem } from "@/types";

const shared = {
  campus: "cross-campus",
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
  dataStatus: "confirmed",
  source: ASSOCIATION_CONTENT_OWNER,
} as const;

export const freshmanCupPreparationNews = {
  ...shared,
  id: "2026-freshman-cup-preparation-started",
  category: "赛事新闻",
  dateLabel: "2026.07.30",
  publishedAt: "2026-07-30T09:00:00+08:00",
  updatedAt: "2026-07-30T09:00:00+08:00",
  title: "新赛季启幕在即｜2026南京航空航天大学新生杯足球赛事筹备启动",
  summary:
    "2026南京航空航天大学新生杯足球赛事筹备工作现已启动。竞赛规程、报名安排、资格审核、赛程与场地信息将在确认后通过官网及协会官方平台陆续发布。",
  image: "/brand/nuaa-fa-logo.jpg",
  imageAlt: "南京航空航天大学天目湖足球协会正式标识",
  href: "/news/2026-freshman-cup-preparation-started",
  badge: "筹备启动",
} as const satisfies NewsItem;

export const freshmanCupPreparationNotice = {
  ...shared,
  id: "2026-freshman-cup-preparation-notice",
  category: "通知公告",
  dateLabel: "2026.07.30",
  publishedAt: "2026-07-30T08:30:00+08:00",
  updatedAt: "2026-07-30T08:30:00+08:00",
  title: "关于启动2026南京航空航天大学新生杯足球赛事筹备工作的公告",
  summary:
    "2026新生杯足球赛事筹备工作已经启动，报名时间、比赛日期、比赛场地、参赛资格及竞赛规程将在确认后另行公告。",
  href: "/news/2026-freshman-cup-preparation-notice",
  publicationStatus: "置顶",
  badge: "筹备公告",
} as const satisfies NoticeItem;

export type FreshmanCupArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: readonly string[] };

const articles = {
  "2026-freshman-cup-preparation-started": {
    kind: "news",
    blocks: [
      {
        type: "paragraph",
        text: "盛夏渐远，新的校园生活即将开启，属于新生的绿茵故事也正蓄势待发。2026南京航空航天大学新生杯足球赛事筹备工作现已启动，赛事组织、参赛报名、资格审核、竞赛安排与裁判保障等工作将按计划推进。",
      },
      {
        type: "paragraph",
        text: "新生杯是面向新生开展的院系足球赛事，也是同学们走进校园足球、认识队友、代表集体并感受竞技魅力的重要平台。赛事采用十一人制，由各院系组织队伍参赛。天目湖校区与将军路校区相关足球组织分别开展前期赛事工作，淘汰赛阶段的跨校区主客场安排以赛事组织方最终通知为准。",
      },
      {
        type: "paragraph",
        text: "目前，具体报名时间、比赛日期、比赛场地、参赛资格和竞赛规程尚在确认中。相关信息正式发布后，可通过南京航空航天大学天目湖足球协会官网、微信公众号“湖区FA”及官方媒体平台查看。球员注册、球队组建与赛事报名的具体操作要求，以后续正式赛事通知和足球中国平台安排为准。",
      },
      {
        type: "paragraph",
        text: "无论你是经验丰富的球员，还是第一次踏上正式赛场的新生，都可以关注所在学院的组队与招募信息，提前做好参赛准备。因热爱，奔赴绿茵。新赛季，我们球场见。",
      },
      { type: "heading", text: "赛事信息提示" },
      {
        type: "list",
        items: [
          "赛事名称：2026南京航空航天大学新生杯足球赛事",
          "当前状态：筹备工作已启动",
          "赛制：十一人制",
          "报名及赛程：待正式通知确认",
          "信息渠道：官网、微信公众号“湖区FA”、抖音“南航足协”",
        ],
      },
    ],
  },
  "2026-freshman-cup-preparation-notice": {
    kind: "notice",
    blocks: [
      {
        type: "paragraph",
        text: "为做好2026南京航空航天大学新生杯足球赛事组织工作，保障赛事报名、资格审核、竞赛编排、裁判选派及赛场运行有序开展，现已启动本届赛事筹备工作。",
      },
      { type: "heading", text: "一、赛事定位" },
      {
        type: "paragraph",
        text: "本赛事为面向新生开展的院系十一人制足球赛事。天目湖校区与将军路校区相关足球组织分别开展前期赛事工作，涉及跨校区阶段的具体安排以赛事组织方最终通知为准。",
      },
      { type: "heading", text: "二、当前筹备事项" },
      {
        type: "paragraph",
        text: "现阶段将重点推进竞赛规程确认、参赛队伍组织、球员资格审核、报名流程、领队沟通、赛程编排、场地协调、裁判保障和赛事宣传等工作。",
      },
      { type: "heading", text: "三、后续发布内容" },
      {
        type: "paragraph",
        text: "报名时间、比赛日期、比赛场地、参赛资格、竞赛规程、领队会议及赛程安排尚未正式发布。相关信息完成确认后，将通过协会官网及官方媒体平台另行公告。未经正式发布的信息不作为参赛依据。",
      },
      { type: "heading", text: "四、信息获取与咨询" },
      {
        type: "paragraph",
        text: "请参赛队伍、球员及相关同学持续关注南京航空航天大学天目湖足球协会官网、微信公众号“湖区FA”及抖音“南航足协”。赛事与报名咨询可通过协会公开邮箱 nuaafootball@163.com 联系。",
      },
      { type: "paragraph", text: "特此公告。" },
      {
        type: "paragraph",
        text: "南京航空航天大学天目湖足球协会\n2026年7月30日",
      },
    ],
  },
} as const satisfies Record<
  string,
  { kind: "news" | "notice"; blocks: readonly FreshmanCupArticleBlock[] }
>;

export function getFreshmanCupContentItem(slug: string) {
  if (slug === freshmanCupPreparationNews.id) return freshmanCupPreparationNews;
  if (slug === freshmanCupPreparationNotice.id) return freshmanCupPreparationNotice;
  return undefined;
}

export function getFreshmanCupArticle(slug: string) {
  return articles[slug as keyof typeof articles];
}

export const freshmanCupReports = [
  freshmanCupPreparationNews,
  freshmanCupPreparationNotice,
] as const;
