export type CampusScope = "tianmuhu" | "jiangjunlu" | "cross-campus";
export type DataSource = "local" | "football-china";

export type ContentOwnership = {
  campus: CampusScope;
  organizationId: string;
  contentOwner: string;
  dataSource: DataSource;
  externalId?: string;
};

export type CompetitionStatus = "preparing" | "registration" | "ongoing" | "completed";
export type CompetitionFormat = "eleven-a-side" | "futsal";

export type CompetitionDisplayStatus = {
  key: CompetitionStatus;
  label: "筹备中" | "报名中" | "进行中" | "已结束";
  dataStatus: "demo";
  badge: string;
};

export type Competition = ContentOwnership & {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  semester: "first" | "second";
  semesterLabel: "上半学年" | "下半学年";
  format: CompetitionFormat;
  formatLabel: "十一人制" | "五人制";
  teamFormation: "院系组队" | "自由组队";
  group?: "男子组" | "女子组";
  eventType: "天目湖赛事" | "跨校区赛事";
  organizerNote: string;
  tags: readonly string[];
  recordStatus: "confirmed";
  displayStatus: CompetitionDisplayStatus;
};

export type DemoMatch = ContentOwnership & {
  id: string;
  competitionId: string;
  competitionName: string;
  dateLabel: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: "completed" | "upcoming";
  statusLabel: string;
  dataStatus: "demo";
  badge: string;
};

export type DemoStanding = {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDifference: number;
  points: number;
  dataStatus: "demo";
  badge: string;
};

export type DemoScorer = {
  position: number;
  player: string;
  team: string;
  goals: number;
  dataStatus: "demo";
  badge: string;
};

export type NewsCategory = "比赛战报" | "协会动态" | "人物专访" | "校园足球文化" | "裁判内容";
export type NoticeCategory = "报名通知" | "赛程调整" | "竞赛规程" | "招募通知" | "赛事纪律通知";

export type NewsItem = ContentOwnership & {
  id: string;
  category: NewsCategory;
  dateLabel: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  href: string;
  dataStatus: "demo";
  badge: string;
};

export type NoticeItem = ContentOwnership & {
  id: string;
  category: NoticeCategory;
  dateLabel: string;
  title: string;
  summary: string;
  href: string;
  dataStatus: "demo";
  badge: string;
};

export type TeamShowcaseItem = ContentOwnership & {
  id: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  imageAlt: string;
  dataStatus: "demo";
  badge: string;
  competitiveDataAvailable: boolean;
};

export type PlatformItem = {
  id: "wechat" | "bilibili" | "football-china" | "email";
  kind: "wechat" | "bilibili" | "football-china" | "email";
  name: string;
  label: string;
  description: string;
  href?: string;
  external: boolean;
  linkLabel?: string;
  qrImage?: string;
  qrAlt?: string;
  interactionLabel?: string;
  scopeNotice?: string;
  securityNotice?: string;
  target?: "_blank";
  rel?: "noopener noreferrer";
  uses?: readonly string[];
};

export type ParticipationEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  target?: "_blank";
  rel?: "noopener noreferrer";
  status: "available-external-entry" | "placeholder";
  badge: string;
};

export type AssignmentStatus =
  | "not-open"
  | "open"
  | "closed"
  | "assigning"
  | "awaiting-confirmation"
  | "published"
  | "adjusted"
  | "completed"
  | "cancelled";

export type ElevenRoleKey =
  | "referee"
  | "assistant-referee-1"
  | "assistant-referee-2"
  | "fourth-official"
  | "reserve-assistant-referee";

export type FutsalRoleKey =
  | "referee"
  | "second-referee"
  | "third-referee"
  | "timekeeper"
  | "fourth-referee";

export type RefereeRoleKey = ElevenRoleKey | FutsalRoleKey;
export type RolePublicationStatus = "assigned" | "pending" | "not-set" | "adjusting";

export type RefereeRoleDefinition = {
  key: RefereeRoleKey;
  label: string;
  format: CompetitionFormat;
  order: number;
};

export type OpenRefereeMatch = ContentOwnership & {
  id: string;
  competition: string;
  date: string;
  format: CompetitionFormat;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  applicationDeadline: string;
  assignmentStatus: AssignmentStatus;
  demo: true;
};

export type RoleAssignment = {
  roleKey: RefereeRoleKey;
  enabled: boolean;
  status: RolePublicationStatus;
  assignee?: string;
};

export type RefereeAssignmentPublication = ContentOwnership & {
  id: string;
  competition: string;
  date: string;
  venue: string;
  matchup: string;
  format: CompetitionFormat;
  assignmentStatus: AssignmentStatus;
  roles: RoleAssignment[];
  demo: true;
};

export type ContactCardData = {
  role: string;
  name: string;
  responsibilities: string[];
  email: string;
};
