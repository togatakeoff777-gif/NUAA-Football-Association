import type { ContentOwnership } from "@/types";

const arbitrationOwnership = {
  campus: "tianmuhu" as const,
  organizationId: "nuaa-tianmuhu-fa",
  contentOwner: "南京航空航天大学天目湖足球协会",
  dataSource: "local" as const,
};

export const arbitrationPrototypeNotice =
  "本页为静态页面原型与演示数据结构，不受理正式在线提交。具体规则、时限和材料以赛事组织方最终确认的信息为准。";

export const arbitrationSections = [
  {
    ...arbitrationOwnership,
    id: "overview",
    title: "仲裁与申诉说明",
    description:
      "说明赛事治理中仲裁与申诉的适用范围，并与一般规则咨询、裁判执裁报名明确区分。",
    statusLabel: "结构已建立",
  },
  {
    ...arbitrationOwnership,
    id: "committees",
    title: "各赛事仲裁委员会",
    description: "委员会组成及联系方式等待各项赛事组织方确认后公布。",
    statusLabel: "真实资料待确认",
  },
  {
    ...arbitrationOwnership,
    id: "eligibility",
    title: "申请条件",
    description: "展示申请主体、适用事项与不予受理情形的预留位置。",
    statusLabel: "规则待确认",
  },
  {
    ...arbitrationOwnership,
    id: "deadline",
    title: "申请时限",
    description: "正式时限将依据各赛事竞赛规程和纪律规则发布。",
    statusLabel: "规则待确认",
  },
  {
    ...arbitrationOwnership,
    id: "process",
    title: "申请流程",
    description: "预留提出申请、材料核验、受理审查、审议与决定公示等步骤。",
    statusLabel: "静态流程原型",
  },
  {
    ...arbitrationOwnership,
    id: "materials",
    title: "申请材料下载",
    description: "正式模板尚未提供，本轮不生成具有业务效力的申请文件。",
    statusLabel: "文件待提供",
  },
  {
    ...arbitrationOwnership,
    id: "submission",
    title: "申请提交",
    description: "本轮不提供在线表单、账号认证或真实提交能力。",
    statusLabel: "本轮不开放",
  },
  {
    ...arbitrationOwnership,
    id: "decisions",
    title: "仲裁决定公示",
    description: "待产生经审核且可公开的正式决定后再发布，当前不虚构历史记录。",
    statusLabel: "暂无真实资料",
  },
  {
    ...arbitrationOwnership,
    id: "discipline",
    title: "各赛事纪律规则",
    description: "红黄牌、停赛、纪律与申诉规则归赛事治理栏目集中管理。",
    statusLabel: "文件待确认",
  },
] as const satisfies readonly (ContentOwnership & {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
})[];
