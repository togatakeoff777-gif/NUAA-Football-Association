export const refereeGrades = ["大一", "大二", "大三", "大四", "已毕业"] as const;

export type RefereeGrade = (typeof refereeGrades)[number];

export function isRefereeGrade(value: string): value is RefereeGrade {
  return refereeGrades.includes(value as RefereeGrade);
}

export type RefereeCapabilityStatus = "NOT_ASSIGNED" | "TRAINING" | "READY";

export function applyCapabilityBatch(
  values: Record<string, RefereeCapabilityStatus>,
  format: "ELEVEN_A_SIDE" | "FUTSAL",
  positionKeys: readonly string[],
  status: RefereeCapabilityStatus,
) {
  const next = { ...values };
  for (const positionKey of positionKeys) next[`${format}:${positionKey}`] = status;
  return next;
}
