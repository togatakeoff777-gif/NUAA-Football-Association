import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import type { NoticeItem } from "@/types";

const sharedMetadata = {
  campus: "tianmuhu",
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
} as const;

export type DisciplineDecision = NoticeItem & {
  fileType: "PDF";
  version: string;
  scope: string;
  source: string;
};

export const disciplineDecisions = [
  {
    ...sharedMetadata,
    id: "discipline-bai-yile",
    category: "纪律决定",
    dateLabel: "2026.06.22",
    title: "关于球员拜宜乐违规违纪的处罚决定",
    summary: "协会公开纪律决定原件，具体事实、依据与处理内容以 PDF 文件为准。",
    href: "/documents/competitions/discipline/2026/bai-yile-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "公开原件",
    fileType: "PDF",
    version: "公开决定",
    scope: "相关校园足球赛事",
    source: "南京航空航天大学天目湖学生足球协会",
  },
  {
    ...sharedMetadata,
    id: "discipline-meng-lingxue",
    category: "纪律决定",
    dateLabel: "2026.06.15",
    title: "关于球员孟令学违规违纪的处罚决定",
    summary: "协会公开纪律决定原件，具体事实、依据与处理内容以 PDF 文件为准。",
    href: "/documents/competitions/discipline/2026/meng-lingxue-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "公开原件",
    fileType: "PDF",
    version: "公开决定",
    scope: "相关校园足球赛事",
    source: "南京航空航天大学天目湖学生足球协会",
  },
  {
    ...sharedMetadata,
    id: "discipline-chen-feiyu",
    category: "纪律决定",
    dateLabel: "2026.06.15",
    title: "关于球员陈飞宇违规违纪的处罚决定",
    summary: "协会公开纪律决定原件，具体事实、依据与处理内容以 PDF 文件为准。",
    href: "/documents/competitions/discipline/2026/chen-feiyu-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "公开原件",
    fileType: "PDF",
    version: "公开决定",
    scope: "相关校园足球赛事",
    source: "南京航空航天大学天目湖学生足球协会",
  },
  {
    ...sharedMetadata,
    id: "discipline-wei-yuxuan",
    category: "纪律决定",
    dateLabel: "2026.06.15",
    title: "关于裁判员魏宇轩违规违纪的处罚决定",
    summary: "协会公开纪律决定原件，具体事实、依据与处理内容以 PDF 文件为准。",
    href: "/documents/competitions/discipline/2026/wei-yuxuan-referee-decision.pdf",
    publicationStatus: "最新",
    dataStatus: "confirmed",
    badge: "公开原件",
    fileType: "PDF",
    version: "公开决定",
    scope: "相关校园足球赛事",
    source: "南京航空航天大学天目湖学生足球协会",
  },
] as const satisfies readonly DisciplineDecision[];

export const homepageDisciplineDecisions = disciplineDecisions.slice(0, 3);
