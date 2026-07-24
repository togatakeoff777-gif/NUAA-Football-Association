import type { AppointmentPositionKey } from "@/generated/prisma/client";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readShortText(value: unknown, label: string, maxLength: number, required = true) {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new Error(`${label}格式不正确。`);
  }
  const text = value.trim();
  if (required && !text) throw new Error(`请填写${label}。`);
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字符。`);
  return text;
}

export function readEnum<T extends string>(value: unknown, allowed: readonly T[], label: string) {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label}不在允许范围内。`);
  }
  return value as T;
}

export const positionKeys = [
  "REFEREE", "ASSISTANT_REFEREE_1", "ASSISTANT_REFEREE_2", "FOURTH_OFFICIAL",
  "RESERVE_ASSISTANT_REFEREE", "SECOND_REFEREE", "THIRD_REFEREE", "TIMEKEEPER", "FOURTH_REFEREE",
] as const satisfies readonly AppointmentPositionKey[];

export function readPositionAssignments(value: unknown) {
  if (!Array.isArray(value) || value.length > 5) throw new Error("岗位配置格式不正确。");
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("岗位配置格式不正确。");
    return {
      key: readEnum(item.key, positionKeys, "岗位"),
      refereeId: readShortText(item.refereeId, "裁判员", 64, false) || null,
    };
  });
}
