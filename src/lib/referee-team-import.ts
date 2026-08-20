export type TeamImportPreview = {
  names: string[];
  duplicates: string[];
  existing: string[];
  errors: string[];
};

function comparisonKey(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

export function previewTeamNames(values: string[], existingNames: string[] = []): TeamImportPreview {
  const names: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  const existingKeys = new Set(existingNames.map(comparisonKey));
  const existing: string[] = [];

  for (const raw of values) {
    const name = raw.trim();
    if (!name) continue;
    if (name.length > 80) continue;
    const key = comparisonKey(name);
    if (seen.has(key)) {
      if (!duplicates.includes(name)) duplicates.push(name);
      continue;
    }
    seen.add(key);
    if (existingKeys.has(key)) {
      existing.push(name);
      continue;
    }
    names.push(name);
  }

  const tooLong = values.filter((value) => value.trim().length > 80);
  return {
    names,
    duplicates,
    existing,
    errors: tooLong.length ? [`${tooLong.length} 个球队名称超过 80 个字符。`] : [],
  };
}

export function parsePastedTeamNames(text: string, existingNames: string[] = []) {
  return previewTeamNames(text.replace(/^\uFEFF/, "").split(/\r?\n/), existingNames);
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("CSV 存在未闭合的引号。");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

export function parseTeamCsv(text: string, existingNames: string[] = []) {
  let rows: string[][];
  try {
    rows = parseCsvRows(text);
  } catch (error) {
    return { names: [], duplicates: [], existing: [], errors: [error instanceof Error ? error.message : "CSV 格式不正确。"] };
  }
  if (!rows.length) return { names: [], duplicates: [], existing: [], errors: ["CSV 文件为空。"] };
  const headers = rows[0].map((item) => comparisonKey(item));
  const nameIndex = headers.findIndex((header) => ["name", "team name", "team_name", "球队名称", "球队", "名称"].includes(header));
  if (nameIndex < 0) {
    return { names: [], duplicates: [], existing: [], errors: ["CSV 缺少球队名称列（支持 name 或 球队名称）。"] };
  }
  const missingRows: number[] = [];
  const values = rows.slice(1).map((row, index) => {
    const value = row[nameIndex]?.trim() ?? "";
    if (!value && row.some((cell) => cell.trim())) missingRows.push(index + 2);
    return value;
  });
  const preview = previewTeamNames(values, existingNames);
  if (missingRows.length) preview.errors.push(`第 ${missingRows.join("、")} 行缺少球队名称。`);
  return preview;
}
