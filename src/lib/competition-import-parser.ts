import { createHash } from "node:crypto";

import readXlsxFile from "read-excel-file/node";

import {
  COMPETITION_IMPORT_MAX_FILE_BYTES,
  COMPETITION_IMPORT_MAX_ROWS,
  type CompetitionImportCell,
  type CompetitionImportInput,
  type CompetitionImportInputMethod,
  type CompetitionImportParsedRow,
  type CompetitionImportType,
} from "@/lib/competition-import-types";

const multipartAllowanceBytes = 256 * 1024;

const headerAliases: Record<CompetitionImportType, Record<string, readonly string[]>> = {
  TEAM: {
    name: ["name", "team name", "team_name", "球队名称", "球队"],
    teamType: ["teamtype", "team type", "team_type", "球队类型"],
    externalTeamId: ["externalteamid", "external team id", "external_team_id", "外部球队id", "外部球队 ID"],
  },
  MATCH: {
    homeTeam: ["hometeam", "home team", "home_team", "主队"],
    awayTeam: ["awayteam", "away team", "away_team", "客队"],
    kickoff: ["kickoff", "开球时间", "比赛时间"],
    endAt: ["endat", "end at", "end_at", "结束时间"],
    venue: ["venue", "场地", "比赛场地"],
    stage: ["stage", "阶段", "比赛阶段"],
    round: ["round", "轮次"],
    externalMatchId: ["externalmatchid", "external match id", "external_match_id", "外部比赛id", "外部比赛 ID"],
  },
};

const requiredHeaders: Record<CompetitionImportType, readonly string[]> = {
  TEAM: ["name"],
  MATCH: ["homeTeam", "awayTeam", "kickoff", "venue", "stage"],
};

export class CompetitionImportParseError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415 = 400,
  ) {
    super(message);
    this.name = "CompetitionImportParseError";
  }
}

function normalizedHeader(value: CompetitionImportCell | undefined) {
  return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

function canonicalHeader(importType: CompetitionImportType, value: CompetitionImportCell | undefined) {
  const normalized = normalizedHeader(value);
  for (const [canonical, aliases] of Object.entries(headerAliases[importType])) {
    if (aliases.some((alias) => alias.toLocaleLowerCase("zh-CN") === normalized)) return canonical;
  }
  return null;
}

function rowIsEmpty(row: readonly CompetitionImportCell[]) {
  return row.every((cell) => cell === null || String(cell).trim() === "");
}

function parseDelimitedRows(text: string, delimiter: "," | "\t") {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  const source = text.replace(/^\uFEFF/, "");

  const finishField = () => {
    row.push(field);
    field = "";
    afterQuote = false;
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        afterQuote = true;
      } else if (character === "\r" && source[index + 1] === "\n") {
        field += "\n";
        index += 1;
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote) {
      if (character === delimiter) {
        finishField();
      } else if (character === "\n") {
        finishRow();
      } else if (character === "\r") {
        if (source[index + 1] === "\n") index += 1;
        finishRow();
      } else if (!/\s/.test(character)) {
        throw new CompetitionImportParseError("分隔文件的引号后存在无效字符。");
      }
      continue;
    }

    if (character === '"') {
      if (field.length) throw new CompetitionImportParseError("分隔文件的字段引号格式不正确。");
      quoted = true;
    } else if (character === delimiter) {
      finishField();
    } else if (character === "\n") {
      finishRow();
    } else if (character === "\r") {
      if (source[index + 1] === "\n") index += 1;
      finishRow();
    } else {
      field += character;
    }
  }

  if (quoted) throw new CompetitionImportParseError("分隔文件存在未闭合的引号。");
  if (field.length || row.length || afterQuote) finishRow();
  return rows;
}

function mapTabularRows(
  data: CompetitionImportCell[][],
  importType: CompetitionImportType,
  initialWarnings: string[] = [],
) {
  const firstNonEmptyIndex = data.findIndex((row) => !rowIsEmpty(row));
  if (firstNonEmptyIndex < 0) throw new CompetitionImportParseError("导入内容为空。");
  const headerRow = data[firstNonEmptyIndex];
  const canonicalByIndex = headerRow.map((value) => canonicalHeader(importType, value));
  const canonicalHeaders = canonicalByIndex.filter((value): value is string => Boolean(value));
  const duplicates = canonicalHeaders.filter((value, index) => canonicalHeaders.indexOf(value) !== index);
  if (duplicates.length) {
    throw new CompetitionImportParseError(`导入表头重复：${[...new Set(duplicates)].join("、")}。`);
  }
  const missing = requiredHeaders[importType].filter((header) => !canonicalHeaders.includes(header));
  if (missing.length) throw new CompetitionImportParseError(`缺少必填表头：${missing.join("、")}。`);

  const unknownHeaders = headerRow
    .map((value, index) => ({ value: String(value ?? "").trim(), canonical: canonicalByIndex[index] }))
    .filter((item) => item.value && !item.canonical)
    .map((item) => item.value);
  const inputWarnings = [...initialWarnings];
  if (unknownHeaders.length) inputWarnings.push(`已忽略未知表头：${unknownHeaders.join("、")}。`);

  const rows: CompetitionImportParsedRow[] = [];
  for (let index = firstNonEmptyIndex + 1; index < data.length; index += 1) {
    const row = data[index];
    if (rowIsEmpty(row)) continue;
    const values: Record<string, CompetitionImportCell> = {};
    for (let column = 0; column < canonicalByIndex.length; column += 1) {
      const canonical = canonicalByIndex[column];
      if (canonical) values[canonical] = row[column] ?? null;
    }
    rows.push({ rowNumber: index + 1, values });
    if (rows.length > COMPETITION_IMPORT_MAX_ROWS) {
      throw new CompetitionImportParseError(`导入行数不能超过 ${COMPETITION_IMPORT_MAX_ROWS} 行。`, 413);
    }
  }
  if (!rows.length) throw new CompetitionImportParseError("没有可导入的数据行。");
  return { rows, inputWarnings };
}

export function parseCompetitionImportCsv(text: string, importType: CompetitionImportType) {
  return mapTabularRows(parseDelimitedRows(text, ","), importType);
}

export function parseCompetitionImportPaste(text: string, importType: CompetitionImportType) {
  const source = text.replace(/^\uFEFF/, "");
  const firstNonEmptyLine = source.split(/\r?\n/).find((line) => line.trim()) ?? "";
  if (!firstNonEmptyLine.includes("\t") && !/[,"]/.test(firstNonEmptyLine)) {
    if (importType === "TEAM" && canonicalHeader("TEAM", firstNonEmptyLine) !== "name") {
      const names = source.split(/\r?\n/).filter((line) => line.trim());
      return mapTabularRows([["name"], ...names.map((name) => [name])], importType);
    }
    return mapTabularRows(source.split(/\r?\n/).map((line) => [line]), importType);
  }
  const delimiter = firstNonEmptyLine.includes("\t") ? "\t" : ",";
  return mapTabularRows(parseDelimitedRows(source, delimiter), importType);
}

export async function parseCompetitionImportXlsx(buffer: Buffer, importType: CompetitionImportType) {
  let sheets: Awaited<ReturnType<typeof readXlsxFile>>;
  try {
    sheets = await readXlsxFile(buffer);
  } catch {
    throw new CompetitionImportParseError("Excel 文件无法解析，请确认文件是有效的 .xlsx 工作簿。");
  }
  if (!sheets.length) throw new CompetitionImportParseError("Excel 工作簿不包含工作表。");
  const warnings = sheets.length > 1
    ? [`工作簿包含多个工作表，仅导入第一个工作表“${sheets[0].sheet}”。`]
    : [];
  return mapTabularRows(sheets[0].data as CompetitionImportCell[][], importType, warnings);
}

function readFormString(form: FormData, name: string) {
  const value = form.get(name);
  if (typeof value !== "string" || !value.trim()) {
    throw new CompetitionImportParseError(`缺少导入参数：${name}。`);
  }
  return value.trim();
}

function readImportType(value: string): CompetitionImportType {
  if (value === "TEAM" || value === "MATCH") return value;
  throw new CompetitionImportParseError("导入类型无效。");
}

function readInputMethod(value: string): CompetitionImportInputMethod {
  if (value === "CSV" || value === "XLSX" || value === "PASTE") return value;
  throw new CompetitionImportParseError("输入方式无效。");
}

function fingerprint(input: {
  competitionId: string;
  importType: CompetitionImportType;
  inputMethod: CompetitionImportInputMethod;
  bytes: Uint8Array;
}) {
  return createHash("sha256")
    .update(`${input.competitionId}\0${input.importType}\0${input.inputMethod}\0`)
    .update(input.bytes)
    .digest("hex");
}

export async function readCompetitionImportRequest(request: Request): Promise<CompetitionImportInput> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > COMPETITION_IMPORT_MAX_FILE_BYTES + multipartAllowanceBytes) {
    throw new CompetitionImportParseError("导入文件不能超过 5 MB。", 413);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    throw new CompetitionImportParseError("导入请求必须使用 multipart/form-data。", 415);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new CompetitionImportParseError("导入请求格式不正确。");
  }
  const competitionId = readFormString(form, "competitionId");
  if (competitionId.length > 64) throw new CompetitionImportParseError("赛事参数无效。");
  const importType = readImportType(readFormString(form, "importType"));
  const inputMethod = readInputMethod(readFormString(form, "inputMethod"));

  let bytes: Uint8Array;
  let parsed: { rows: CompetitionImportParsedRow[]; inputWarnings: string[] };
  if (inputMethod === "PASTE") {
    const content = readFormString(form, "content");
    bytes = new TextEncoder().encode(content);
    if (bytes.byteLength > COMPETITION_IMPORT_MAX_FILE_BYTES) {
      throw new CompetitionImportParseError("粘贴内容不能超过 5 MB。", 413);
    }
    parsed = parseCompetitionImportPaste(content, importType);
  } else {
    const file = form.get("file");
    if (!(file instanceof File)) throw new CompetitionImportParseError("请选择导入文件。");
    if (file.size > COMPETITION_IMPORT_MAX_FILE_BYTES) {
      throw new CompetitionImportParseError("导入文件不能超过 5 MB。", 413);
    }
    const expectedExtension = inputMethod === "CSV" ? ".csv" : ".xlsx";
    if (!file.name.toLocaleLowerCase("en-US").endsWith(expectedExtension)) {
      throw new CompetitionImportParseError(`请选择 ${expectedExtension} 文件。`, 415);
    }
    bytes = new Uint8Array(await file.arrayBuffer());
    if (inputMethod === "CSV") {
      let content: string;
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new CompetitionImportParseError("CSV 文件必须使用 UTF-8 编码。", 415);
      }
      parsed = parseCompetitionImportCsv(content, importType);
    } else {
      parsed = await parseCompetitionImportXlsx(Buffer.from(bytes), importType);
    }
  }

  return {
    competitionId,
    importType,
    inputMethod,
    inputHash: fingerprint({ competitionId, importType, inputMethod, bytes }),
    rows: parsed.rows,
    inputWarnings: parsed.inputWarnings,
  };
}

export function competitionImportTemplate(importType: CompetitionImportType) {
  if (importType === "TEAM") {
    return "\uFEFFname,teamType,externalTeamId\r\n示例球队,FREEFORM,\r\n";
  }
  return "\uFEFFhomeTeam,awayTeam,kickoff,endAt,venue,stage,round,externalMatchId\r\n示例主队,示例客队,2026-10-15 18:30,,天目湖校区足球场,小组赛,第1轮,\r\n";
}
