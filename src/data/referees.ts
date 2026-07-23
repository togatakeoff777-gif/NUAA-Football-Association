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
  contentOwner: "经确认的跨校区赛事组织方",
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

export const refereeAffairsEntries = [
  {
    id: "introduction",
    title: "裁判工作介绍",
    description: "了解天目湖校园赛事裁判工作的职责、协作方式与基本要求。",
  },
  {
    id: "join",
    title: "加入裁判队伍",
    description:
      "面向希望成为裁判员的新生，以及已有证书、希望加入天目湖裁判团队的人员。",
    href: "/referees/recruitment",
  },
  {
    id: "directory",
    title: "注册裁判员名录",
    description: "查看可公开的裁判员编号、姓名与已登记赛制。",
    href: "/referees/directory",
  },
  {
    id: "open-matches",
    title: "开放执裁场次",
    description: "查看当前开放表达执裁意向的比赛与报名截止时间。",
    href: "/referees/open-matches",
  },
  {
    id: "application",
    title: "比赛执裁报名",
    description:
      "面向已被协会确认的裁判员；报名只表达执裁意向，不等于正式获得任务。",
    href: "/referees/open-matches",
  },
  {
    id: "assignments",
    title: "裁判员选派公示",
    description: "按场次查看管理员已发布且未撤回的裁判组选派结果。",
    href: "/referees/assignments",
  },
  {
    id: "history",
    title: "历史选派记录",
    description: "按比赛回看已经公开归档的裁判组与岗位记录。",
    href: "/referees/history",
  },
  {
    id: "my-tasks",
    title: "我的报名与执裁任务",
    description: "当前没有裁判员个人账号，暂不展示个人报名与执裁任务。",
    badge: "功能规划中",
  },
  {
    id: "training",
    title: "裁判培训与发展",
    description: "培训安排、能力发展路径与学习资料将在资料确认后更新。",
    badge: "资料待更新",
  },
  {
    id: "stories",
    title: "裁判员风采",
    description: "仅在获得授权后发布裁判员故事与人物影像。",
    badge: "内容待更新",
  },
  {
    id: "contact",
    title: "联系裁判负责人",
    description: "咨询招募、培训、报名、选派、临时改派与规则问题。",
    href: "#referee-contact",
  },
  {
    id: "admin",
    title: "管理入口",
    description: "供授权管理人员审核报名、配置岗位、保存草稿并发布或撤回选派。",
    href: "/referees/admin/login",
  },
] as const;

export const rulesResourceEntries = [
  {
    id: "laws-football",
    title: "足球竞赛规则",
    description: "2025/2026足球竞赛规则中文文件。",
    href: "/documents/rules/football/2025-26-laws-of-the-game-zh.pdf",
    badge: "真实文件",
  },
  {
    id: "laws-futsal",
    title: "五人制足球竞赛规则",
    description: "2025/2026五人制足球竞赛规则中文文件。",
    href: "/documents/rules/futsal/2025-26-fifa-futsal-laws-zh.pdf",
    badge: "真实文件",
  },
  {
    id: "local-regulations",
    title: "校内赛事特别规定",
    description: "各赛事经确认的补充规定将在此集中展示。",
    badge: "暂无公开文件",
  },
  {
    id: "rule-updates",
    title: "规则更新",
    description: "追踪适用于校园赛事的规则版本和重点变化。",
    href: "/documents/rules/football/2026-27-changes-explained-zh.pdf",
    badge: "真实文件",
  },
  {
    id: "case-studies",
    title: "常见判例分析",
    description: "通过典型比赛情境辅助理解判罚原则。",
    badge: "内容待确认",
  },
  {
    id: "referee-downloads",
    title: "裁判工作资料下载",
    description: "集中下载比赛成绩报告单与裁判报告模板。",
    href: "#referee-downloads",
    badge: "3份真实文件",
  },
  {
    id: "rule-downloads",
    title: "规则文件下载",
    description: "按赛制与版本下载已经接入的正式规则文件。",
    href: "#referee-rules",
    badge: "3份真实文件",
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
    href: "/documents/templates/eleven-a-side-match-report.pdf",
  },
  {
    id: "womens-match-report",
    title: "女子足球院际杯比赛成绩报告单",
    fileType: "PDF",
    version: "2026",
    publishedAt: "发布日期待确认",
    scope: "女子足球院际杯裁判组 / 比赛官员",
    href: "/documents/templates/womens-intercollege-cup-match-report.pdf",
  },
  {
    id: "futsal-referee-report",
    title: "五人制联赛裁判报告模板",
    fileType: "DOCX",
    version: "2025",
    publishedAt: "发布日期待确认",
    scope: "五人制比赛裁判组 / 比赛官员",
    href: "/documents/templates/futsal-referee-report.docx",
  },
] as const;
