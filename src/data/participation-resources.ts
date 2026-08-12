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

export const matchdayRosterSteps = [
  "进入“生涯”，选择“近期比赛”。",
  "找到当天对应比赛并进入。",
  "提交首发名单，设置首发、替补和不上场队员。",
  "设置队长。",
  "设置球队官员；未在该页面上报的官员不允许位于替补席。",
  "签名确认并提交。",
  "返回主界面查看已提交的比赛名单。",
] as const;

export const footballChinaOperationAreas = [
  "登录与权限",
  "报名信息设置与发起报名",
  "报名审核与报名状态",
  "结束报名",
  "赛程设置与比赛安排",
  "比赛官员",
  "比赛名单提交",
  "比赛报告与数据",
  "成绩确认及完结赛事",
] as const;
