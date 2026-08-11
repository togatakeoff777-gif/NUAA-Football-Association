import { FOOTBALL_CHINA_URL } from "@/data/platforms";
import type { ParticipationEntry } from "@/types";

export const participationStatement =
  "球员注册、球队组建、赛事报名及相关参赛资格管理统一通过足球中国平台完成。";

export const participationEntries = [
  {
    id: "football-china-registration",
    title: "足球中国注册报名",
    description: "前往足球中国平台完成球员注册、球队组建与赛事报名。",
    href: FOOTBALL_CHINA_URL,
    external: true,
    target: "_blank",
    rel: "noopener noreferrer",
    status: "available-external-entry",
    badge: "外部平台",
  },
  {
    id: "competition-registration-guide",
    title: "赛事报名指南",
    description: "查看赛事报名步骤、资料准备与平台操作说明。",
    href: "/participation/event-guide",
    external: false,
    status: "placeholder",
    badge: "参赛指南",
  },
  {
    id: "team-manager-guide",
    title: "球队负责人指南",
    description: "查看球队组建、名单维护与参赛沟通说明。",
    href: "/participation/team-manager-guide",
    external: false,
    status: "placeholder",
    badge: "参赛指南",
  },
] as const satisfies readonly ParticipationEntry[];

export const participationDataPolicy = {
  mode: "information-only",
  statement:
    "参赛报名与材料提交请按赛事通知及足球中国平台要求办理。",
  prohibitedFields: ["身份证号", "学号", "手机号"],
  collectedFields: [],
} as const;

export const freshmanParticipationPath = [
  { id: "team", title: "关注学院组队信息", description: "通过学院通知、球队信息页和赛事公告确认组队安排。" },
  { id: "register", title: "完成足球中国注册", description: "按平台要求完成球员注册，并核对个人参赛信息。" },
  { id: "materials", title: "按赛事要求提交球队材料", description: "材料清单与提交方式待正式竞赛规程和报名通知发布。" },
  { id: "review", title: "等待资格审核", description: "参赛资格以赛事组委会最终审核结果为准。" },
  { id: "schedule", title: "查看赛程与赛事通知", description: "持续关注官网、协会官方平台及赛事组委会正式通知。" },
] as const;

export const freshmanParticipationFaq = [
  {
    question: "球员需要提前准备什么？",
    answer: "可先完成足球中国账号与个人注册信息核对；本届赛事所需材料、资格条件和提交方式待正式通知。",
  },
  {
    question: "球队负责人需要核对哪些事项？",
    answer: "重点核对球队名称、球员名单、注册状态、材料版本和通知接收渠道，具体要求以正式竞赛规程为准。",
  },
  {
    question: "当前报名是否已经开放？",
    answer: "尚未开放，报名时间与入口待正式通知。",
  },
  {
    question: "尚未找到学院球队怎么办？",
    answer: "请先关注学院组队信息与球队信息页。当前暂无经协会确认可公开的 2026 新生杯组队联系人。",
  },
  {
    question: "联系方式尚未正式公开时，如何获取后续信息？",
    answer: "请关注官网新闻公告、球队信息页和协会官方平台，公开联系渠道将在确认后更新。",
  },
  {
    question: "网站指南与正式竞赛规程不一致怎么办？",
    answer: "以赛事组委会最终发布的正式文件为准。",
  },
] as const;
