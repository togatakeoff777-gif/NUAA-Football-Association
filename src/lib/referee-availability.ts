export type MatchAvailabilityState = "AVAILABLE" | "UNAVAILABLE" | "UNSET";

export type AvailabilityWindow = {
  kind: "AVAILABLE" | "UNAVAILABLE";
  startAt: Date;
  endAt: Date;
};

const beijingDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getBeijingDayBounds(value: Date) {
  const parts = Object.fromEntries(
    beijingDateFormatter.formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const start = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, -8));
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function resolveMatchAvailability(
  records: AvailabilityWindow[],
  matchStart: Date,
  matchEnd: Date,
): MatchAvailabilityState {
  const overlapsMatch = (record: AvailabilityWindow) => record.startAt < matchEnd && record.endAt > matchStart;
  if (records.some((record) => record.kind === "UNAVAILABLE" && overlapsMatch(record))) return "UNAVAILABLE";
  if (records.some((record) => record.kind === "AVAILABLE" && record.startAt <= matchStart && record.endAt >= matchEnd)) return "AVAILABLE";
  if (records.some((record) => record.kind === "AVAILABLE")) return "UNAVAILABLE";
  return "UNSET";
}
