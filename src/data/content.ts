import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import { BILIBILI_PROFILE_URL } from "@/data/platforms";
import { officialMensCupNews } from "@/data/mens-intercollege-cup-2026";
import { officialWomensCupNews } from "@/data/womens-intercollege-cup-2026";
import { disciplineDecisions } from "@/data/public-information";
import type { NewsCategory, NewsItem, NoticeCategory, NoticeItem } from "@/types";

const sharedMetadata = {
  campus: "tianmuhu",
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
} as const;

export const newsCategoryOptions = [
  "比赛战报",
  "协会动态",
  "人物专访",
  "校园足球文化",
  "裁判内容",
] as const satisfies readonly NewsCategory[];

export const announcementCategoryOptions = [
  "报名通知",
  "赛程调整",
  "竞赛规程",
  "招募通知",
  "赛事纪律通知",
] as const satisfies readonly NoticeCategory[];

export const contentDemoNotice =
  "以下新闻与公告均为演示内容，仅用于展示信息架构，不代表协会已经发布相关消息。";

export const demoNews = [
  {
    ...sharedMetadata,
    id: "demo-news-match-report",
    category: "比赛战报",
    dateLabel: "演示发布日期",
    title: "【演示内容】比赛战报卡片示例",
    summary: "用于展示比赛战报在首页中的标题、摘要和图片排版，不对应真实比赛。",
    image: "/images/news-match.jpg",
    imageAlt: "足球比赛场景展示图",
    href: "/news/demo-detail",
    dataStatus: "demo",
    badge: "演示内容",
  },
  {
    ...sharedMetadata,
    id: "demo-news-association",
    category: "协会动态",
    dateLabel: "演示发布日期",
    title: "【演示内容】协会动态卡片示例",
    summary: "用于展示天目湖足协活动信息的内容结构，真实资料仍待协会确认。",
    image: "/images/hero-football.jpg",
    imageAlt: "足球鞋与足球的通用展示图",
    href: "/news",
    dataStatus: "demo",
    badge: "演示内容",
  },
  {
    ...sharedMetadata,
    id: "demo-news-referee",
    category: "裁判内容",
    dateLabel: "演示发布日期",
    title: "【演示内容】裁判培训内容卡片示例",
    summary: "用于展示裁判培训与规则学习内容，当前不代表真实培训安排。",
    image: "/images/training.jpg",
    imageAlt: "校园足球训练场景展示图",
    href: "/referees",
    dataStatus: "demo",
    badge: "演示内容",
  },
] as const satisfies readonly NewsItem[];

export const publishedNews = [...officialMensCupNews, ...officialWomensCupNews].sort((left, right) =>
  right.dateLabel.localeCompare(left.dateLabel),
);

export const newsFeed = publishedNews;

function requirePublishedNews(id: string) {
  const item = publishedNews.find((story) => story.id === id);
  if (!item) throw new Error(`Missing published news item: ${id}`);
  return item;
}

export const homeNews = [
  requirePublishedNews("2026-mens-cup-final-report"),
  requirePublishedNews("2026-mens-cup-closing"),
  requirePublishedNews("2026-mens-cup-final-preview"),
] as const;

export const demoAnnouncements = [
  {
    ...sharedMetadata,
    id: "demo-announcement-registration",
    category: "报名通知",
    dateLabel: "演示发布日期",
    title: "【演示公告】赛事报名通知版式示例",
    summary: "仅展示公告层级；正式报名信息以协会确认后发布的通知为准。",
    href: "/news",
    publicationStatus: "置顶",
    dataStatus: "demo",
    badge: "演示公告",
  },
  {
    ...sharedMetadata,
    id: "demo-announcement-regulations",
    category: "竞赛规程",
    dateLabel: "演示发布日期",
    title: "【演示公告】竞赛规程发布版式示例",
    summary: "仅展示规程公告入口，当前不提供任何未经确认的正式规则文件。",
    href: "/news",
    publicationStatus: "最新",
    dataStatus: "demo",
    badge: "演示公告",
  },
  {
    ...sharedMetadata,
    id: "demo-announcement-recruitment",
    category: "招募通知",
    dateLabel: "演示发布日期",
    title: "【演示公告】协会招募通知版式示例",
    summary: "仅展示招募类公告结构，真实岗位与时间安排仍待协会更新。",
    href: "/news",
    publicationStatus: "最新",
    dataStatus: "demo",
    badge: "演示公告",
  },
] as const satisfies readonly NoticeItem[];

export const demoNotices = demoAnnouncements;

export const publicAnnouncements = disciplineDecisions;

export const featuredVideoNotice =
  "精选视频资料仍待确认；当前卡片仅链接至南航校园足球共享视频平台主页。";

export const featuredVideos = [
  {
    ...sharedMetadata,
    id: "video-pending-highlights",
    category: "比赛集锦",
    title: "比赛集锦资料待更新",
    description: "待协会确认具体视频后更新，不虚构视频标题或比赛信息。",
    platformName: "南航大足球协会",
    platformScope: "南航校园足球共享视频平台",
    href: BILIBILI_PROFILE_URL,
    external: true,
    target: "_blank",
    rel: "noopener noreferrer",
    image: "/images/news-match.jpg",
    imageAlt: "足球比赛场景展示图，视频资料待更新",
    dataStatus: "pending-source",
    badge: "资料待更新",
  },
  {
    ...sharedMetadata,
    id: "video-pending-full-match",
    category: "全场录像",
    title: "全场录像资料待更新",
    description: "待协会确认具体视频后更新，不虚构比赛或参赛球队。",
    platformName: "南航大足球协会",
    platformScope: "南航校园足球共享视频平台",
    href: BILIBILI_PROFILE_URL,
    external: true,
    target: "_blank",
    rel: "noopener noreferrer",
    image: "/images/hero-football.jpg",
    imageAlt: "绿茵场比赛展示图，视频资料待更新",
    dataStatus: "pending-source",
    badge: "资料待更新",
  },
] as const;
