const arbitrationOwnership = {
  campus: "tianmuhu" as const,
  organizationId: "nuaa-tianmuhu-fa",
  contentOwner: "南京航空航天大学天目湖足球协会",
  dataSource: "local" as const,
};

export const arbitrationPublicNotice =
  "申诉应在比赛结束后48小时内提出；足协确认受理后，将在48小时内召开听证会。提交渠道、材料要求和受理主体以对应赛事规程、纪律决定或赛事通知为准。";

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
  deadline: "比赛结束后48小时内提出；足协确认受理后48小时内召开听证会。",
  materials: [
    "申请事项、事实经过与明确请求",
    "对应比赛、队伍、人员与时间信息",
    "能够支持申请的原始材料或公开记录",
    "申请主体的赛事身份说明",
  ],
  process: [
    { id: "prepare", title: "准备材料", description: "比赛结束后48小时内，核对适用范围、申请主体与必要材料。" },
    { id: "submit", title: "按通知提交", description: "按赛事规程、纪律决定或赛事通知指定渠道提交。" },
    { id: "review", title: "确认受理", description: "赛事组织方核验申请主体、时限、事项与材料完整性，并确认是否受理。" },
    { id: "hearing", title: "召开听证会", description: "足协确认受理后48小时内召开听证会，依对应规则审议处理。" },
    { id: "publish", title: "决定公示", description: "处理完成后按赛事规定发布正式决定。" },
  ],
  submission: {
    status: "按赛事通知指定方式提交",
    contact: "提交渠道、材料要求和受理主体以对应赛事规程、纪律决定或赛事通知为准。",
  },
} as const;

export const arbitrationResources = [
  {
    title: "仲裁 / 申诉申请模板",
    status: "暂无公开文件",
    description: "正式申请模板尚未发布，具体材料要求以对应赛事通知为准。",
  },
  {
    title: "赛事纪律决定",
    status: "4份公开原件",
    description: "查看球员与裁判员纪律决定网页及 PDF 原件。",
    href: "/competitions/files#discipline",
  },
  {
    title: "竞赛规则与工作资料",
    status: "文件中心",
    description: "竞赛规则位于赛事文件中心，裁判组工作表单位于裁判中心。",
    href: "/referees#referee-downloads",
  },
] as const;
