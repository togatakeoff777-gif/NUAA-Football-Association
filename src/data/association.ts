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

export const associationCampusRelationship = {
  title: "校区足球组织关系",
  description:
    "天目湖校区与将军路校区足球协会分别独立开展工作；两校区在新生杯淘汰赛阶段进行跨校区主客场比赛。",
  sharedPlatform: "“南航大足球协会”哔哩哔哩账号为校区共享视频平台。",
  separatePlatform: "天目湖与将军路相关微信公众号分别运营。",
} as const;

export const associationRoleFramework = [
  "主席",
  "副主席",
  "竞赛负责人",
  "后勤负责人",
  "外联负责人",
  "宣传负责人",
] as const;

export const associationTerms = [
  {
    term: "第一届",
    academicYear: "2021-2022",
    confirmedChair: "尹键峰",
    members: ["尹键峰"],
    roleNote: "除主席外的成员资料尚未提供。",
  },
  {
    term: "第二届",
    academicYear: "2022-2023",
    confirmedChair: null,
    members: ["程涛", "米尔", "阿里木", "周浩楠", "朱润涛"],
    roleNote: "任务包未明确成员与具体岗位的对应关系。",
  },
  {
    term: "第三届",
    academicYear: "2023-2024",
    confirmedChair: null,
    members: ["邓宇凌", "王相翰", "沈嫁祥", "陈泓霖", "刘昕宇", "努尔江"],
    roleNote: "任务包未明确成员与具体岗位的对应关系。",
  },
  {
    term: "第四届",
    academicYear: "2024-2025",
    confirmedChair: null,
    members: ["王相翰", "吴作昊", "郭原序", "陈飞宇", "王睿阳", "刘晋毅"],
    deputies: [
      { role: "宣传副负责人", name: "陈昊" },
      { role: "竞赛副负责人", name: "黄泽鑫" },
    ],
    roleNote: "除两项副负责人外，任务包未明确成员与具体岗位的对应关系。",
  },
] as const;

export const associationDataGovernance = [
  "球员注册、球队组建与赛事报名通过足球中国平台完成。",
  "比赛数据与裁判选派可依据足球中国平台记录整理后公开。",
  "本站不宣称与足球中国存在实时 API 同步，公开信息需经过人工核验。",
  "身份证号、手机号、学号等报名字段不进入公开网站。",
] as const;
