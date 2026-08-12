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
  establishedYear: 2022,
  establishedLabel: "EST. 2022",
  slogan: "因热爱，奔赴绿茵",
} as const;

export const associationScope = {
  representedCampus: "南京航空航天大学天目湖校区",
  supportedCampusValues: ["tianmuhu"],
  summary:
    "南京航空航天大学天目湖足球协会立足天目湖校区，服务校园足球。",
  permittedContent: [
    "天目湖校区赛事与球队",
    "天目湖足协新闻、公告、裁判、规则、招新和协会历史",
    "不同校区相关足球组织共同使用的视频平台内容",
  ],
  excludedContent: ["将军路体系内部赛事与组织信息"],
} as const;

export const associationDevelopmentFacts = [
  {
    id: "established",
    value: "2022",
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

export const associationTimeline = [
  {
    period: "2022年",
    label: "协会成立",
    description: "天目湖学生足球协会正式成立，校园足球组织建设由此起步。",
  },
  {
    period: "2022-2023",
    label: "初步建设",
    description: "第一届、第二届成员逐步完善协会组织架构与日常运行机制，为后续赛事组织和协会发展打下基础。",
  },
  {
    period: "2023-2024",
    label: "赛事体系逐步成形",
    description: "校园足球赛事组织逐渐稳定，持续开展新生杯、五人制联赛等赛事，协会赛事运行经验不断积累。",
  },
  {
    period: "2024-2025",
    label: "组织与赛事进一步拓展",
    description: "首次成功举办天目湖女足比赛，进一步丰富校园足球赛事类型；同年宣传部正式设立，协会宣传体系得到完善。",
  },
  {
    period: "2025-2026",
    label: "赛事规模继续扩大",
    description: "首次承担新生杯主要组织工作，五人制联赛增设女子组，并首次举办男子、女子足球院际杯，赛事体系进一步完善。",
  },
] as const;

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
    positions: [
      { role: "主席", name: "程涛" },
      { role: "副主席", name: "米尔" },
      { role: "竞赛部部长", name: "阿里木" },
      { role: "后勤部部长", name: "周浩楠" },
      { role: "外联部部长", name: "朱润涛" },
    ],
    unassignedMembers: [],
    roleNote: "第二届成员与岗位记录。",
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
