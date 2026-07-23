const arbitrationOwnership = {
  campus: "tianmuhu" as const,
  organizationId: "nuaa-tianmuhu-fa",
  contentOwner: "南京航空航天大学天目湖足球协会",
  dataSource: "local" as const,
};

export const arbitrationPublicNotice =
  "本页公开赛事仲裁与申诉的信息结构，不开放在线提交。具体受理范围、时限与提交方式以对应赛事规程和赛事组织方最终通知为准。";

export const arbitrationGuide = {
  ...arbitrationOwnership,
  scope: [
    "对赛事组织程序、参赛资格、纪律决定或竞赛规程适用产生的正式异议。",
    "对应赛事规程明确允许提出仲裁或申诉的其他事项。",
  ],
  notAccepted: [
    "仅对裁判员在比赛事实认定上的技术判断提出异议。",
    "匿名、缺少明确请求或无法说明事实依据的材料。",
    "超过赛事规程规定时限且未说明正当理由的申请。",
  ],
  applicants: ["参赛球队领队或赛事报名记录中的授权负责人", "纪律决定直接涉及的参赛人员或其所属球队"],
  deadline: "任务包未提供统一时限。请以对应赛事竞赛规程、纪律决定或赛事通知为准。",
  materials: [
    "申请事项、事实经过与明确请求",
    "对应比赛、队伍、人员与时间信息",
    "能够支持申请的原始材料或公开记录",
    "申请主体的赛事身份说明",
  ],
  process: [
    { id: "prepare", title: "准备材料", description: "核对适用范围、申请主体、时限与必要材料。" },
    { id: "submit", title: "按通知提交", description: "按赛事通知指定方式提交，官网不提供虚假联系人或在线表单。" },
    { id: "review", title: "材料核验", description: "赛事组织方核验申请主体、时限、事项与材料完整性。" },
    { id: "hearing", title: "审议处理", description: "由对应赛事仲裁机构依竞赛规程和纪律规则处理。" },
    { id: "publish", title: "决定公示", description: "仅公开经审核且适合公开的正式决定。" },
  ],
  submission: {
    status: "按赛事通知指定方式提交",
    contact: "具体渠道以对应赛事通知为准；官网不收集申诉材料。",
  },
} as const;

export const arbitrationResources = [
  {
    title: "仲裁 / 申诉申请模板",
    status: "暂无公开文件",
    description: "任务包未提供正式申请模板，因此不生成无业务效力的文件。",
  },
  {
    title: "赛事纪律决定",
    status: "4份公开原件",
    description: "查看本轮提供的球员与裁判员纪律决定原文件。",
    href: "/competitions/files#discipline",
  },
  {
    title: "竞赛规则与工作资料",
    status: "真实文件已接入",
    description: "竞赛规则位于赛事文件中心，裁判组工作表单位于裁判中心。",
    href: "/referees#referee-downloads",
  },
] as const;
