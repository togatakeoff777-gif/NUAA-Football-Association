import type { CompetitionFormat, CompetitionStatus } from "@/generated/prisma-v29/client";
import { isRecord, readEnum, readShortText } from "@/lib/referee-validation";

export function readCompetitionInput(value: unknown): {
  name: string;
  year?: number;
  format: CompetitionFormat;
  status: CompetitionStatus;
} {
  if (!isRecord(value)) throw new Error("赛事内容格式不正确。");
  let year: number | undefined;
  if (value.year !== undefined && value.year !== null && value.year !== "") {
    if (typeof value.year !== "number" || !Number.isInteger(value.year) || value.year < 1900 || value.year > 2200) {
      throw new Error("赛季年份须为 1900 至 2200 之间的整数。");
    }
    year = value.year;
  }
  return {
    name: readShortText(value.name, "赛事名称", 120),
    year,
    format: readEnum(value.format, ["ELEVEN_A_SIDE", "FUTSAL"] as const, "比赛制式"),
    status: readEnum(
      value.status,
      ["PREPARING", "REGISTRATION", "ONGOING", "COMPLETED"] as const,
      "赛事状态",
    ),
  };
}
