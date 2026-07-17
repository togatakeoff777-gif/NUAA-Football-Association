export const mainNavigation = [
  { label: "首页", href: "/" },
  { label: "天目湖赛事", href: "/competitions" },
  { label: "球队", href: "/teams" },
  { label: "新闻与公告", href: "/news" },
  { label: "裁判与规则", href: "/referees" },
  { label: "影像", href: "/media" },
  { label: "协会", href: "/association" },
] as const;

export const navigationItems = mainNavigation;

export const registrationCta = {
  label: "参赛与报名",
  href: "/participation",
} as const;

export const competitionNavigation = [
  { label: "当前赛事", href: "/competitions/current" },
  { label: "赛程与赛果", href: "/competitions/schedule" },
  { label: "积分榜", href: "/competitions/standings" },
  { label: "射手榜", href: "/competitions/scorers" },
  { label: "历届赛事", href: "/competitions/history" },
  { label: "跨校区赛事", href: "/competitions/cross-campus" },
  { label: "仲裁与申诉", href: "/competitions/arbitration" },
] as const;

export const footerNavigation = [
  {
    label: "赛事服务",
    items: [
      { label: "天目湖赛事", href: "/competitions" },
      { label: "仲裁与申诉", href: "/competitions/arbitration" },
      { label: "参赛与报名", href: "/participation" },
    ],
  },
  {
    label: "协会信息",
    items: [
      { label: "新闻与公告", href: "/news" },
      { label: "裁判与规则", href: "/referees" },
      { label: "关于协会", href: "/association" },
    ],
  },
] as const;
