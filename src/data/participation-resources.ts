export const participationPdfResources = {
  footballChinaOperations: {
    id: "football-china-operations",
    title: "足球中国赛事操作说明2025",
    fileLabel: "足球中国赛事操作说明2025.pdf",
    href: "/documents/participation/football-china-competition-operations-2025.pdf",
  },
  teamRegistration: {
    id: "team-registration",
    title: "球队报名与组建",
    fileLabel: "球队报名.pdf",
    href: "/documents/participation/football-china-team-registration.pdf",
  },
  matchdayRoster: {
    id: "matchday-roster",
    title: "比赛日名单提交",
    fileLabel: "球队比赛日操作——设置比赛名单.pdf",
    href: "/documents/participation/football-china-matchday-roster.pdf",
  },
} as const;

export const individualPlayerGuideSteps = [
  {
    id: "notice",
    title: "查看赛事通知与竞赛规程",
    description: "确认参赛范围、资格条件、报名时间与对应赛事入口。",
  },
  {
    id: "platform",
    title: "完成足球中国相关操作",
    description: "按赛事通知和球队负责人安排完成账号、个人信息及报名事项。",
  },
  {
    id: "confirmation",
    title: "等待资格确认",
    description: "平台操作不代表参赛资格自动确认，最终结果以赛事组织方审核与通知为准。",
  },
] as const;

export const teamRegistrationSteps = [
  "在应用商店下载“足球中国”。",
  "注册登录后搜索“南京航空航天大学”。",
  "在学校栏找到南京航空航天大学足球协会。",
  "选择当前开放报名赛事。",
  "点击“立即报名”，创建球队并填写基本信息。",
  "进入“报名状态”，完善球衣颜色、球队官员等资料。",
  "将球员信息入口分享到球队群，由队员自行填写。",
] as const;

export const teamRegistrationScreenshots = [
  {
    src: "/images/participation/guides/team-search-school.webp",
    alt: "足球中国应用中搜索南京航空航天大学并进入学校足球协会的操作界面",
    caption: "搜索学校并进入学校足球协会。来源：《球队报名》 第 3 页。",
    width: 943,
    height: 574,
  },
  {
    src: "/images/participation/guides/team-registration-status.webp",
    alt: "足球中国应用中球队报名状态、球队资料和球员信息入口界面",
    caption: "在报名状态中完善球队资料并分享球员信息入口。来源：《球队报名》 第 9 页。",
    width: 943,
    height: 1622,
  },
] as const;

export const matchdayRosterSteps = [
  "进入“生涯”，选择“近期比赛”。",
  "找到当天对应比赛并进入。",
  "提交首发名单，设置首发、替补和不上场队员。",
  "设置队长。",
  "设置球队官员；未在该页面上报的官员不允许位于替补席。",
  "签名确认并提交。",
  "返回主界面查看已提交的比赛名单。",
] as const;

export const matchdayRosterScreenshots = [
  {
    src: "/images/participation/guides/matchday-lineup-setting.webp",
    alt: "足球中国应用中设置比赛首发、替补和不上场球员的界面",
    caption: "设置首发、替补与不上场球员。来源：《球队比赛日操作——设置比赛名单》 第 6 页。",
    width: 908,
    height: 726,
  },
  {
    src: "/images/participation/guides/matchday-signature-submit.webp",
    alt: "足球中国应用中比赛名单签名确认界面",
    caption: "核对比赛名单后签名确认并提交。来源：《球队比赛日操作——设置比赛名单》 第 11 页。",
    width: 943,
    height: 510,
  },
] as const;

export const footballChinaOperationAreas = [
  {
    id: "access",
    title: "登录与权限",
    audience: "赛事组织方 / 管理员",
    steps: [
      "协会账号使用账号、密码、绑定手机号与验证码登录；部门与赛事管理员使用绑定手机号和验证码登录。",
      "协会可创建部门并配置权限；部门需要赛事列表权限方可开展赛事工作。",
      "部门和赛事均可配置多名管理员。",
    ],
  },
  {
    id: "registration-management",
    title: "赛事设置与报名管理",
    audience: "赛事组织方 / 管理员",
    steps: [
      "进入赛事管理与赛事列表，设置赛事信息、报名信息与竞赛规则后发起报名。",
      "在报名管理中审核待审核信息，并查看球队报名进度与状态。",
      "确认报名工作完成后结束报名；结束后不能继续报名或删除球队。",
    ],
  },
  {
    id: "competition-operations",
    title: "赛程与比赛运行",
    audience: "赛事组织方 / 管理员",
    steps: [
      "设置赛事阶段、顺序与阶段规则，并按赛制完成抽签和必要调整。",
      "在赛程的比赛安排中设置比赛时间、场地与比赛官员。比赛官员需先在工作管理中添加。",
      "比赛监督通过实名账号上传比赛报告、填写比赛数据并签名确认；完成成绩确认后可完结赛事。",
    ],
  },
  {
    id: "team-permissions",
    title: "球队比赛日操作",
    audience: "球队主教练 / 助理教练 / 领队",
    steps: [
      "双方教练使用足球中国 APP 实名账号提交比赛首发名单。",
      "报名时登记的主教练、助理教练和领队账号具有提交权限，账号须为本人实际使用。",
      "名单签名后不能直接编辑；如需修改，应先由后台删除签名，再重新提交。",
    ],
  },
] as const;

export const footballChinaOperationScreenshots = [
  {
    src: "/images/participation/guides/operations-login-permissions.webp",
    alt: "足球中国赛事管理平台不同角色的登录方式说明",
    caption: "协会、社会机构、部门及赛事管理员的登录方式。来源：《足球中国赛事操作说明2025》 第 3 页。",
    width: 1600,
    height: 858,
  },
  {
    src: "/images/participation/guides/operations-registration-settings.webp",
    alt: "足球中国赛事管理平台的赛事报名信息设置界面",
    caption: "设置赛事报名信息。来源：《足球中国赛事操作说明2025》 第 9 页。",
    width: 1600,
    height: 864,
  },
  {
    src: "/images/participation/guides/operations-match-arrangement.webp",
    alt: "足球中国赛事管理平台的比赛时间、场地和官员安排界面",
    caption: "在赛程中安排比赛时间、场地与比赛官员。来源：《足球中国赛事操作说明2025》 第 20 页。",
    width: 1600,
    height: 864,
  },
] as const;
