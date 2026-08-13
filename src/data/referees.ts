import type {
  CompetitionFormat,
  OpenRefereeMatch,
  RefereeAssignmentPublication,
  RefereeRoleDefinition,
  RolePublicationStatus,
} from "@/types";

const tianmuhuOwnership = {
  campus: "tianmuhu" as const,
  organizationId: "nuaa-tianmuhu-fa",
  contentOwner: "南京航空航天大学天目湖足球协会",
  dataSource: "local" as const,
};

const crossCampusOwnership = {
  campus: "cross-campus" as const,
  organizationId: "nuaa-tianmuhu-fa",
  contentOwner: "相关赛事组织方",
  dataSource: "local" as const,
};

export const refereeApplicationStatement =
  "报名仅代表裁判员愿意承担该场比赛任务，具体岗位及最终选派结果以裁判管理人员确认和官网公示为准。";

export const refereeDemoNotice = "演示功能，不会真实提交";

export const formatLabels: Record<CompetitionFormat, string> = {
  "eleven-a-side": "十一人制",
  futsal: "五人制",
};

export const rolePublicationLabels: Record<RolePublicationStatus, string> = {
  assigned: "已选派",
  pending: "待选派",
  "not-set": "本场未设置",
  adjusting: "调整中",
};

export const refereeRoleDefinitions: readonly RefereeRoleDefinition[] = [
  {
    key: "referee",
    label: "裁判员",
    format: "eleven-a-side",
    order: 1,
  },
  {
    key: "assistant-referee-1",
    label: "第一助理裁判员",
    format: "eleven-a-side",
    order: 2,
  },
  {
    key: "assistant-referee-2",
    label: "第二助理裁判员",
    format: "eleven-a-side",
    order: 3,
  },
  {
    key: "fourth-official",
    label: "第四官员",
    format: "eleven-a-side",
    order: 4,
  },
  {
    key: "reserve-assistant-referee",
    label: "候补助理裁判员",
    format: "eleven-a-side",
    order: 5,
  },
  {
    key: "referee",
    label: "裁判员",
    format: "futsal",
    order: 1,
  },
  {
    key: "second-referee",
    label: "第二裁判员",
    format: "futsal",
    order: 2,
  },
  {
    key: "third-referee",
    label: "第三裁判员",
    format: "futsal",
    order: 3,
  },
  {
    key: "timekeeper",
    label: "计时员",
    format: "futsal",
    order: 4,
  },
  {
    key: "fourth-referee",
    label: "第四裁判员",
    format: "futsal",
    order: 5,
  },
];

export const refereeRoleTemplateNotes: Record<
  CompetitionFormat,
  readonly string[]
> = {
  "eleven-a-side": [
    "常规比赛通常不选派候补助理裁判员。",
    "开幕式、决赛等重要场次可启用完整团队。",
    "第四官员及其他岗位由管理人员按场次设置。",
  ],
  futsal: [
    "常规比赛通常不选派计时员和第四裁判员。",
    "开幕式、决赛等重要场次可启用完整团队。",
  ],
};

export const openRefereeMatches: readonly OpenRefereeMatch[] = [
  {
    ...crossCampusOwnership,
    id: "demo-open-eleven-01",
    competition: "南京航空航天大学新生杯足球赛事",
    date: "演示日期 · 10 月 18 日 14:00",
    format: "eleven-a-side",
    venue: "演示场地 · 天目湖校区足球场",
    homeTeam: "演示队 A",
    awayTeam: "演示队 B",
    applicationDeadline: "演示截止 · 10 月 16 日 20:00",
    assignmentStatus: "open",
    demo: true,
  },
  {
    ...tianmuhuOwnership,
    id: "demo-open-futsal-01",
    competition: "南京航空航天大学天目湖五人制联赛",
    date: "演示日期 · 10 月 20 日 18:30",
    format: "futsal",
    venue: "演示场地 · 天目湖校区五人制球场",
    homeTeam: "演示队 C",
    awayTeam: "演示队 D",
    applicationDeadline: "演示截止 · 10 月 18 日 20:00",
    assignmentStatus: "open",
    demo: true,
  },
];

export const refereeAssignmentPublications: readonly RefereeAssignmentPublication[] = [
  {
    ...crossCampusOwnership,
    id: "demo-assignment-eleven-01",
    competition: "南京航空航天大学新生杯足球赛事",
    date: "演示日期 · 10 月 18 日 14:00",
    venue: "演示场地 · 天目湖校区足球场",
    matchup: "演示队 A vs 演示队 B",
    format: "eleven-a-side",
    assignmentStatus: "assigning",
    roles: [
      {
        roleKey: "referee",
        enabled: true,
        status: "assigned",
        assignee: "演示裁判员 A",
      },
      {
        roleKey: "assistant-referee-1",
        enabled: true,
        status: "pending",
      },
      {
        roleKey: "assistant-referee-2",
        enabled: true,
        status: "adjusting",
      },
      {
        roleKey: "fourth-official",
        enabled: true,
        status: "pending",
      },
      {
        roleKey: "reserve-assistant-referee",
        enabled: false,
        status: "not-set",
      },
    ],
    demo: true,
  },
  {
    ...tianmuhuOwnership,
    id: "demo-assignment-futsal-01",
    competition: "南京航空航天大学天目湖五人制联赛",
    date: "演示日期 · 10 月 20 日 18:30",
    venue: "演示场地 · 天目湖校区五人制球场",
    matchup: "演示队 C vs 演示队 D",
    format: "futsal",
    assignmentStatus: "published",
    roles: [
      {
        roleKey: "referee",
        enabled: true,
        status: "assigned",
        assignee: "演示裁判员 B",
      },
      {
        roleKey: "second-referee",
        enabled: true,
        status: "assigned",
        assignee: "演示裁判员 C",
      },
      {
        roleKey: "third-referee",
        enabled: true,
        status: "pending",
      },
      {
        roleKey: "timekeeper",
        enabled: false,
        status: "not-set",
      },
      {
        roleKey: "fourth-referee",
        enabled: false,
        status: "not-set",
      },
    ],
    demo: true,
  },
];

export const refereePrimaryEntries = [
  {
    id: "join",
    title: "加入裁判队伍",
    description: "查看裁判招募方式、参与条件与后续培训安排。",
    href: "/referees/recruitment",
  },
  {
    id: "directory",
    title: "裁判员名录",
    description: "查看允许公开展示的已登记裁判员信息。",
    href: "/referees/directory",
  },
  {
    id: "assignments",
    title: "裁判选派公示",
    description: "查看当前已公开发布且未撤回的比赛裁判组选派。",
    href: "/referees/assignments",
  },
] as const;

export const refereeSecondaryEntries = [
  {
    id: "history",
    title: "历史选派记录",
    description: "按比赛回看已经公开归档的裁判组与岗位记录。",
    href: "/referees/history",
  },
  {
    id: "stories",
    title: "裁判员风采",
    description: "记录校园足球裁判员的执裁经历、学习成长与团队风貌。",
    badge: "暂无公开内容",
  },
] as const;

export const refereeLearningEntries = [
  {
    id: "competition-rules",
    title: "竞赛规则",
    description: "集中查阅十一人制、五人制足球竞赛规则及现有规则变更说明。",
    href: "/referees/resources/competition-rules",
    badge: "规则文件",
  },
  {
    id: "training",
    title: "培训资料",
    description: "汇集协会裁判培训、业务学习与执裁能力提升资料。",
    href: "/referees/resources/training",
    badge: "培训资料",
  },
  {
    id: "referee-downloads",
    title: "工作资料",
    description: "下载比赛成绩报告单、裁判报告模板与现有正式工作文件。",
    href: "/referees/resources/work-files",
    badge: "工作文件",
  },
] as const;

export const refereeFootballLawFiles = [
  {
    id: "football-laws-2025-26",
    title: "2025/2026足球竞赛规则（中文）",
    description: "足球竞赛规则中文文件。",
    href: "/documents/rules/football/2025-26-laws-of-the-game-zh.pdf",
  },
  {
    id: "football-laws-2026-27-changes",
    title: "2026/2027足球竞赛规则修改说明（中文）",
    description: "现有足球竞赛规则重点变化说明。",
    href: "/documents/rules/football/2026-27-changes-explained-zh.pdf",
  },
] as const;

export const refereeWorkFiles = [
  {
    id: "eleven-match-report",
    title: "十一人制比赛成绩报告单",
    fileType: "PDF",
    version: "2026",
    publishedAt: "发布日期待确认",
    scope: "十一人制比赛裁判组 / 比赛官员",
    source: "协会提供的原始工作文件",
    href: "/documents/templates/eleven-a-side-match-report.pdf",
  },
  {
    id: "womens-match-report",
    title: "女子足球院际杯比赛成绩报告单",
    fileType: "PDF",
    version: "2026",
    publishedAt: "发布日期待确认",
    scope: "女子足球院际杯裁判组 / 比赛官员",
    source: "协会提供的原始工作文件",
    href: "/documents/templates/womens-intercollege-cup-match-report.pdf",
  },
  {
    id: "futsal-referee-report",
    title: "五人制联赛裁判报告模板",
    fileType: "DOCX",
    version: "2025",
    publishedAt: "发布日期待确认",
    scope: "五人制比赛裁判组 / 比赛官员",
    source: "协会提供的原始工作文件",
    href: "/documents/templates/futsal-referee-report.docx",
  },
] as const;
