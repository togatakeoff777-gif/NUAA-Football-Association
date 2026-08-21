export type SortableAffiliationOption = {
  name: string;
  type: "COLLEGE" | "SHUYUAN";
  prefixes?: readonly string[];
};

const shuyuanOrder = ["致慧书院", "致元书院", "致微书院", "致和书院"] as const;

function normalizedPrefixes(prefixes: readonly string[] = []) {
  return [...new Set(prefixes.map((prefix) => prefix.trim().toUpperCase()).filter(Boolean))]
    .sort((left, right) => {
      const leftNumber = /^\d+$/.test(left) ? Number(left) : Number.POSITIVE_INFINITY;
      const rightNumber = /^\d+$/.test(right) ? Number(right) : Number.POSITIVE_INFINITY;
      return leftNumber - rightNumber || left.localeCompare(right, "zh-CN");
    });
}

function collegeSortKey(option: SortableAffiliationOption) {
  const prefix = normalizedPrefixes(option.prefixes)[0];
  if (!prefix) return `2-${option.name}`;
  return /^\d+$/.test(prefix)
    ? `0-${String(Number(prefix)).padStart(4, "0")}`
    : `1-${prefix}`;
}

export function compareAffiliationOptions(
  left: SortableAffiliationOption,
  right: SortableAffiliationOption,
) {
  if (left.type !== right.type) return left.type === "COLLEGE" ? -1 : 1;
  if (left.type === "COLLEGE") {
    return collegeSortKey(left).localeCompare(collegeSortKey(right), "zh-CN")
      || left.name.localeCompare(right.name, "zh-CN");
  }
  const leftIndex = shuyuanOrder.indexOf(left.name as (typeof shuyuanOrder)[number]);
  const rightIndex = shuyuanOrder.indexOf(right.name as (typeof shuyuanOrder)[number]);
  const leftRank = leftIndex === -1 ? Number.POSITIVE_INFINITY : leftIndex;
  const rightRank = rightIndex === -1 ? Number.POSITIVE_INFINITY : rightIndex;
  return leftRank - rightRank || left.name.localeCompare(right.name, "zh-CN");
}

export function sortAffiliationOptions<T extends SortableAffiliationOption>(options: readonly T[]) {
  return [...options].sort(compareAffiliationOptions);
}

export function affiliationOptionLabel(option: SortableAffiliationOption) {
  if (option.type === "SHUYUAN") return option.name;
  const prefixes = normalizedPrefixes(option.prefixes);
  return prefixes.length ? `${prefixes.join("/")} ${option.name}` : option.name;
}
