export const ASSOCIATION_ORGANIZATION_ID = "nuaa-tianmuhu-fa";

export const ASSOCIATION_CONTENT_OWNER =
  "南京航空航天大学天目湖足球协会";

export const associationIdentity = {
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
  campus: "tianmuhu",
  formalName: "南京航空航天大学天目湖足球协会",
  shortName: "南京航空航天大学天目湖足球协会",
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
    "南京航空航天大学天目湖足球协会立足天目湖校区，服务校园足球。",
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
    label: "学期赛事阶段",
    note: "上半学期 / 下半学期",
  },
  {
    id: "formats",
    value: "11 + 5",
    label: "两类核心赛制",
    note: "十一人制 / 五人制",
  },
] as const;

export const associationStats = associationDevelopmentFacts;

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

export const currentAssociationTeam = {
  label: "现任足协成员",
  termNote: "第五届南京航空航天大学天目湖足球协会 · 任期：2026—2027",
  positions: [
    { role: "主席", name: "胡兵" },
    { role: "副主席（主管财务）", name: "马俊" },
    { role: "副主席", name: "吴佳宇" },
    { role: "副主席", name: "郭原序" },
    { role: "竞赛部部长", name: "颜铭宣" },
    { role: "后勤部部长", name: "陈梓豪" },
    { role: "宣传部部长", name: "高羽建" },
    { role: "宣传部副部长", name: "魏宇轩" },
    { role: "外联部部长", name: "涂文乐" },
  ],
  note: "第五届南京航空航天大学天目湖足球协会成员名单。",
} as const;

export const associationTerms = [
  {
    term: "第一届",
    academicYear: "2021-2022",
    positions: [{ role: "主席", name: "尹键峰" }],
    unassignedMembers: [],
    roleNote: "现有档案仅记录主席信息。",
  },
  {
    term: "第二届",
    academicYear: "2022-2023",
    positions: [],
    unassignedMembers: ["程涛", "米尔", "阿里木", "周浩楠", "朱润涛"],
    roleNote: "现有档案未记录成员与具体岗位的对应关系。",
  },
  {
    term: "第三届",
    academicYear: "2023-2024",
    positions: [
      { role: "主席", name: "邓宇凌" },
      { role: "副主席（社团财务负责人）", name: "王相翰" },
      { role: "竞赛部部长", name: "沈嫁祥" },
      { role: "后勤部部长", name: "陈泓霖" },
      { role: "外联部部长", name: "刘昕宇" },
      { role: "宣传部部长", name: "努尔江·阿依肯" },
    ],
    unassignedMembers: [],
    roleNote: "第三届成员与岗位记录。",
  },
  {
    term: "第四届",
    academicYear: "2024-2025",
    positions: [
      { role: "主席", name: "王相翰" },
      { role: "副主席（社团财务负责人）", name: "吴作昊" },
      { role: "竞赛部部长", name: "郭原序" },
      { role: "后勤部部长", name: "陈飞宇" },
      { role: "外联部部长", name: "王睿阳" },
      { role: "宣传部部长", name: "刘晋毅" },
      { role: "宣传部副部长", name: "陈昊" },
      { role: "竞赛部副部长", name: "黄泽鑫" },
    ],
    unassignedMembers: [],
    roleNote: "第四届成员与岗位记录，两名副部长一并列入。",
  },
] as const;

export const associationDataGovernance = [
  "球员注册、球队组建与赛事报名通过足球中国平台完成。",
  "比赛信息、裁判选派与赛事文件以协会正式发布内容为准。",
  "参赛队伍应按赛事通知准备并提交报名材料。",
  "赛事咨询可通过协会公开邮箱联系。",
] as const;
