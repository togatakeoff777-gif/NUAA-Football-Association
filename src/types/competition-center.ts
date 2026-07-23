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
};
