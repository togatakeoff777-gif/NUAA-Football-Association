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
    badge: "说明页原型",
  },
  {
    id: "team-manager-guide",
    title: "球队负责人指南",
    description: "查看球队组建、名单维护与参赛沟通说明。",
    href: "/participation/team-manager-guide",
    external: false,
    status: "placeholder",
    badge: "说明页原型",
  },
] as const satisfies readonly ParticipationEntry[];

export const participationDataPolicy = {
  mode: "information-only",
  statement:
    "本轮仅提供说明卡片和占位入口，不在本站收集或提交个人报名资料。",
  prohibitedFields: ["身份证号", "学号", "手机号"],
  collectedFields: [],
} as const;
