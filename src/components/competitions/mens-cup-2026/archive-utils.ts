import type { MensCupMatch } from "@/data/mens-intercollege-cup-2026";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Shanghai",
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Shanghai",
});

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Shanghai",
});

export function formatMatchDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatArchiveDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+08:00`));
}

export function formatMatchTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export function formatMatchStage(match: MensCupMatch) {
  return match.stage === "group" ? `${match.group}组 · ${match.round}` : match.round;
}

export function formatMatchScore(match: MensCupMatch) {
  const regular = `${match.homeScore}:${match.awayScore}`;
  if (typeof match.homePenaltyScore !== "number" || typeof match.awayPenaltyScore !== "number") {
    return regular;
  }
  return `${regular}（点球 ${match.homePenaltyScore}:${match.awayPenaltyScore}）`;
}
