export const ASSOCIATION_ORGANIZATION_ID = "nuaa-tianmuhu-fa";

export const ASSOCIATION_CONTENT_OWNER =
  "南京航空航天大学天目湖足球协会";

export const associationIdentity = {
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
  campus: "tianmuhu",
  formalName: "南京航空航天大学天目湖足球协会",
  shortName: "南航天目湖足协",
  englishName: "NUAA Tianmuhu Football Association",
  wechatBrandName: "湖区FA",
  establishedYear: 2021,
  establishedLabel: "EST. 2021",
  slogan: "因热爱，奔赴绿茵",
} as const;

export const associationScope = {
  representedCampus: "南京航空航天大学天目湖校区",
  supportedCampusValues: ["tianmuhu", "cross-campus"],
  summary:
    "本网站仅代表南京航空航天大学天目湖足球协会，服务天目湖校区校园足球。",
  permittedContent: [
    "天目湖校区赛事与球队",
    "天目湖足协新闻、公告、裁判、规则、招新和协会历史",
    "经相关组织确认的跨校区赛事",
    "不同校区相关足球组织共同使用的视频平台内容",
  ],
  excludedContent: ["将军路体系内部赛事与组织信息"],
} as const;

export const associationDevelopmentFacts = [
  {
    id: "established",
    value: "2021",
    label: "协会成立",
    note: "已确认资料",
  },
  {
    id: "core-competitions",
    value: "4",
    label: "年度核心赛事",
    note: "已确认赛事体系",
  },
  {
    id: "academic-terms",
    value: "2",
    label: "学年赛事阶段",
    note: "上半学年 / 下半学年",
  },
  {
    id: "formats",
    value: "11 + 5",
    label: "两类核心赛制",
    note: "十一人制 / 五人制",
  },
] as const;

export const associationStats = associationDevelopmentFacts;

export const footerScopeStatements = [
  "本网站由南京航空航天大学天目湖足球协会建设与维护，主要发布天目湖校区足球赛事、协会活动及相关信息。部分赛事由不同校区相关足球组织共同举办，涉及跨校区赛事的内容以赛事组织方最终确认的信息为准。",
  "“南航大足球协会”哔哩哔哩账号为校区共享视频平台。",
  "球员注册、球队组建、赛事报名及相关竞赛管理统一通过足球中国平台完成。",
] as const;
