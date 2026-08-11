export type PublicCompetitionStatus =
  | "preparing"
  | "registration"
  | "ongoing"
  | "completed"
  | "pending-confirmation";

export type PublicCompetitionRecord = {
  id: string;
  slug: string;
  name: string;
  year: number | null;
  season: string;
  campus: string;
  type: string;
  format: "eleven-a-side" | "futsal";
  formatLabel: string;
  status: PublicCompetitionStatus;
  statusLabel: string;
  registrationWindow: string;
  matchWindow: string;
  venue: string;
  host: string;
  organizer: string;
  scale: string;
  summary: string;
  requirements: readonly string[];
  filesHref: string;
  notice: string;
  detailHref: string;
};

export type CoreCompetitionLinkSet = {
  overview: string;
  schedule: string;
  results: string;
  standings: string;
  knockout: string;
  teams: string;
  referees: string;
  files: string;
  news: string;
};

export type CoreCompetitionDirectoryEntry = {
  id: string;
  currentEditionId: string;
  slug: string;
  name: string;
  shortName: string;
  currentEdition: string;
  year: number;
  season: string;
  semester: "first" | "second";
  semesterLabel: "上半学期" | "下半学期";
  campus: "天目湖校区" | "天目湖校区 / 将军路校区";
  eventType: "天目湖赛事" | "跨校区赛事";
  format: "eleven-a-side" | "futsal";
  formatLabel: "十一人制" | "五人制";
  teamFormation: "院系组队" | "自由组队";
  status: PublicCompetitionStatus;
  statusLabel: string;
  dataStatus: "confirmed";
  badge: string;
  stageLabel: string;
  registrationWindow: string;
  matchWindow: string;
  venue: string;
  host: string;
  organizer: string;
  scale: string;
  summary: string;
  requirements: readonly string[];
  notice: string;
  detailHref: string;
  filesHref: string;
  links: CoreCompetitionLinkSet;
};

export type PublicMatchRecord = {
  id: string;
  competitionId: string;
  competitionName: string;
  competitionHref: string;
  stage: string;
  teamIds: readonly string[];
  dateTime: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  penaltyScore?: string;
  status: "completed" | "scheduled";
  statusLabel: string;
  detailHref: string;
  refereeHref?: string;
};

export type PublicFileCategory =
  | "regulations"
  | "guidebooks"
  | "schedules"
  | "appointments"
  | "discipline"
  | "notices"
  | "forms";

export type PublicCompetitionFile = {
  id: string;
  title: string;
  category: PublicFileCategory;
  categoryLabel: string;
  fileType: "PDF" | "DOCX";
  version: string;
  publishedAt: string;
  scope: string;
  href: string;
  source: string;
  versionStatus: "current" | "latest" | "changes" | "historical";
  versionStatusLabel: "当前适用" | "最新版本" | "变更说明" | "历史参考";
  versionNote: string;
};
