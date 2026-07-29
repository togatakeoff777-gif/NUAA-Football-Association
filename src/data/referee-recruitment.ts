import { ASSOCIATION_EMAIL } from "@/data/platforms";
import type { RefereeRecruitmentConfig } from "@/types";

export const refereeRecruitment: RefereeRecruitmentConfig = {
  groupName: "南航天目湖足协裁判员招新群",
  academicYear: "2026—2027 学年",
  validUntil: "开放时间待正式公告",
  status: "not-open",
  statusLabel: "尚未开放",
  qrImage: undefined,
  qrAlt: "裁判员招新群二维码尚未开放",
  fallbackContact: ASSOCIATION_EMAIL,
  notice: "当前招新群尚未开放。官方群二维码发布后将在此更新；请勿向非官方入口提交个人信息。",
  steps: [
    { id: "join-group", title: "扫码进入招新群", description: "招募开放后，通过本页公布的官方群二维码加入招新群。" },
    { id: "submit-form", title: "查看要求并提交报名表", description: "在群内阅读招募要求，并按正式通知提供报名表；本站不收集报名信息。" },
    { id: "review", title: "等待资格审核", description: "协会根据正式招募要求完成资格确认，并在群内通知后续安排。" },
    { id: "training", title: "参加裁判培训", description: "通过审核后参加规则学习、实践培训与后续能力发展活动。" },
  ],
};
