import type { AppointmentPositionKey } from "@/generated/prisma-v29/client";

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

export function readBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") throw new Error(`${label}格式不正确。`);
  return value;
}

export function readInteger(value: unknown, label: string, minimum: number, maximum: number) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) throw new Error(`${label}须为 ${minimum} 至 ${maximum} 之间的整数。`);
  return value;
}

export function readDate(value: unknown, label: string, required = true) {
  if (typeof value !== "string" || !value.trim()) {
    if (!required) return undefined;
    throw new Error(`请填写${label}。`);
  }
  const text = value.trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00+08:00`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(text)
      ? `${text}+08:00`
      : text;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error(`${label}格式不正确。`);
  return date;
}

export const positionKeys = [
  "REFEREE", "ASSISTANT_REFEREE_1", "ASSISTANT_REFEREE_2", "FOURTH_OFFICIAL",
  "RESERVE_ASSISTANT_REFEREE", "SECOND_REFEREE", "THIRD_REFEREE", "TIMEKEEPER", "FOURTH_REFEREE",
] as const satisfies readonly AppointmentPositionKey[];

export function readPositionAssignments(value: unknown) {
  if (!Array.isArray(value) || value.length > 25) throw new Error("岗位配置格式不正确。");
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("岗位配置格式不正确。");
    return {
      key: readEnum(item.key, positionKeys, "岗位"),
      slot: readInteger(item.slot ?? 1, "岗位序号", 1, 5),
      refereeId: readShortText(item.refereeId, "裁判员", 64, false) || null,
    };
  });
}

export function readCapabilities(value: unknown) {
  if (!Array.isArray(value) || value.length > 20) {
    throw new Error("岗位能力格式不正确。");
  }
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("岗位能力格式不正确。");
    return {
      format: readEnum(item.format, ["ELEVEN_A_SIDE", "FUTSAL"] as const, "比赛制式"),
      positionKey: readEnum(item.positionKey, positionKeys, "岗位能力"),
    };
  });
}
