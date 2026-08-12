export type RefereeTrainingResource = {
  id: string;
  order: string;
  level: "基础" | "专项" | "进阶";
  title: string;
  description: string;
  tags: readonly string[];
  fileType: "PPTX" | "PDF";
  fileHref: string;
  previewHref?: string;
  versionNote?: string;
};

export const refereeTrainingResources: readonly RefereeTrainingResource[] = [
  {
    id: "referee-foundation",
    order: "01",
    level: "基础",
    title: "南京航空航天大学天目湖足球协会裁判员基础培训",
    description: "面向协会裁判员的基础培训资料，涵盖裁判员定位与职责、执裁纪律、比赛官员职责、助理裁判员与第四官员工作、裁判团队协作等内容，适合作为新裁判入门及日常业务学习资料。",
    tags: ["入门学习", "协会培训"],
    fileType: "PPTX",
    fileHref: "/documents/referees/training/nuaafa-referee-foundation-training.pptx",
  },
  {
    id: "futsal-referee-training",
    order: "02",
    level: "专项",
    title: "五人制足球裁判员培训",
    description: "针对五人制足球执裁工作的专项培训资料，涵盖比赛场地、队员与替换程序、五人制特有规则、累计犯规、裁判团队职责及纪律处罚等内容。",
    tags: ["专项学习", "五人制"],
    fileType: "PPTX",
    fileHref: "/documents/referees/training/futsal-referee-training.pptx",
  },
  {
    id: "fourth-official-practice",
    order: "03",
    level: "专项",
    title: "第四官员职责与工作实务",
    description: "第四官员专项学习资料，涵盖赛前准备、技术区域管理、替换程序、纪律协助、补时时间展示以及与裁判团队配合等比赛日工作内容。",
    tags: ["专项学习", "第四官员"],
    fileType: "PDF",
    fileHref: "/documents/referees/training/fourth-official-practice.pdf",
    previewHref: "/documents/referees/training/fourth-official-practice.pdf",
  },
  {
    id: "afc-match-analysis-reporting",
    order: "04",
    level: "进阶",
    title: "亚足联裁判指南：比赛分析与报告（2020/21）",
    description: "亚足联裁判指南资料，主要用于学习比赛事件分析、判罚因素以及裁判员报告书写方法，可作为裁判员进阶业务学习和赛后分析参考。",
    tags: ["进阶学习", "AFC", "2020/21"],
    fileType: "PDF",
    fileHref: "/documents/referees/training/afc-referee-guide-match-analysis-reporting-2020-21.pdf",
    previewHref: "/documents/referees/training/afc-referee-guide-match-analysis-reporting-2020-21.pdf",
    versionNote: "本指南为2020/21版本，适用于比赛分析与裁判报告学习；涉及具体竞赛规则的内容，应以当前有效版本的《足球竞赛规则》为准。",
  },
];
