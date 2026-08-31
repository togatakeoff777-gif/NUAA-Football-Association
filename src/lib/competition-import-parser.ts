import { createHash } from "node:crypto";

import readXlsxFile from "read-excel-file/node";

import {
  COMPETITION_IMPORT_MAX_CELL_CHARACTERS,
  COMPETITION_IMPORT_MAX_COLUMNS,
  COMPETITION_IMPORT_MAX_FILE_BYTES,
  COMPETITION_IMPORT_MAX_ROWS,
  type CompetitionImportCell,
  type CompetitionImportInput,
  type CompetitionImportInputMethod,
  type CompetitionImportParsedRow,
  type CompetitionImportType,
} from "@/lib/competition-import-types";
import {
  CompetitionImportXlsxPreflightError,
  inspectCompetitionImportXlsx,
} from "@/lib/competition-import-xlsx-security";

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
    readonly status: 400 | 411 | 413 | 415 = 400,
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

function assertRowResourceBudget(row: readonly CompetitionImportCell[]) {
  if (row.length > COMPETITION_IMPORT_MAX_COLUMNS) {
    throw new CompetitionImportParseError(`导入列数不能超过 ${COMPETITION_IMPORT_MAX_COLUMNS} 列。`, 413);
  }
  if (row.some((cell) => String(cell ?? "").length > COMPETITION_IMPORT_MAX_CELL_CHARACTERS)) {
    throw new CompetitionImportParseError(`单个导入单元格不能超过 ${COMPETITION_IMPORT_MAX_CELL_CHARACTERS} 个字符。`, 413);
  }
}

function forEachDelimitedRow(
  text: string,
  delimiter: "," | "\t",
  onRow: (row: string[], recordIndex: number) => void,
) {
  let row: string[] = [];
  let fieldParts: string[] = [];
  let fieldStart = 0;
  let quoted = false;
  let afterQuote = false;
  let recordIndex = 0;
  const source = text.startsWith("\uFEFF") ? text.slice(1) : text;

  const appendSegment = (end: number) => {
    if (end > fieldStart) fieldParts.push(source.slice(fieldStart, end));
  };
  const finishField = (end: number, includeOpenSegment: boolean) => {
    if (includeOpenSegment) appendSegment(end);
    const field = fieldParts.length === 0 ? "" : fieldParts.length === 1 ? fieldParts[0] : fieldParts.join("");
    if (field.length > COMPETITION_IMPORT_MAX_CELL_CHARACTERS) {
      throw new CompetitionImportParseError(`单个导入单元格不能超过 ${COMPETITION_IMPORT_MAX_CELL_CHARACTERS} 个字符。`, 413);
    }
    row.push(field);
    if (row.length > COMPETITION_IMPORT_MAX_COLUMNS) {
      throw new CompetitionImportParseError(`导入列数不能超过 ${COMPETITION_IMPORT_MAX_COLUMNS} 列。`, 413);
    }
    fieldParts = [];
    afterQuote = false;
  };
  const finishRow = (end: number, includeOpenSegment: boolean) => {
    finishField(end, includeOpenSegment);
    onRow(row, recordIndex);
    recordIndex += 1;
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        appendSegment(index);
        fieldParts.push('"');
        index += 1;
        fieldStart = index + 1;
      } else if (character === '"') {
        appendSegment(index);
        quoted = false;
        afterQuote = true;
        fieldStart = index + 1;
      } else if (character === "\r" && source[index + 1] === "\n") {
        appendSegment(index);
        fieldParts.push("\n");
        index += 1;
        fieldStart = index + 1;
      }
      continue;
    }

    if (afterQuote) {
      if (character === delimiter) {
        finishField(index, false);
        fieldStart = index + 1;
      } else if (character === "\n") {
        finishRow(index, false);
        fieldStart = index + 1;
      } else if (character === "\r") {
        const end = index;
        if (source[index + 1] === "\n") index += 1;
        finishRow(end, false);
        fieldStart = index + 1;
      } else if (!/\s/.test(character)) {
        throw new CompetitionImportParseError("分隔文件的引号后存在无效字符。");
      }
      continue;
    }

    if (character === '"') {
      if (fieldParts.length || index > fieldStart) throw new CompetitionImportParseError("分隔文件的字段引号格式不正确。");
      quoted = true;
      fieldStart = index + 1;
    } else if (character === delimiter) {
      finishField(index, true);
      fieldStart = index + 1;
    } else if (character === "\n") {
      finishRow(index, true);
      fieldStart = index + 1;
    } else if (character === "\r") {
      const end = index;
      if (source[index + 1] === "\n") index += 1;
      finishRow(end, true);
      fieldStart = index + 1;
    }
  }

  if (quoted) throw new CompetitionImportParseError("分隔文件存在未闭合的引号。");
  if (fieldParts.length || fieldStart < source.length || row.length || afterQuote) {
    finishRow(source.length, !afterQuote);
  }
}

function prepareHeader(
  headerRow: readonly CompetitionImportCell[],
  importType: CompetitionImportType,
  initialWarnings: string[],
) {
  assertRowResourceBudget(headerRow);
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
  return { canonicalByIndex, inputWarnings };
}

function mappedRow(
  row: readonly CompetitionImportCell[],
  rowNumber: number,
  canonicalByIndex: readonly (string | null)[],
) {
  assertRowResourceBudget(row);
  const values: Record<string, CompetitionImportCell> = {};
  for (let column = 0; column < canonicalByIndex.length; column += 1) {
    const canonical = canonicalByIndex[column];
    if (canonical) values[canonical] = row[column] ?? null;
  }
  return { rowNumber, values };
}

function mapTabularRows(
  data: CompetitionImportCell[][],
  importType: CompetitionImportType,
  initialWarnings: string[] = [],
) {
  const firstNonEmptyIndex = data.findIndex((row) => !rowIsEmpty(row));
  if (firstNonEmptyIndex < 0) throw new CompetitionImportParseError("导入内容为空。");
  const { canonicalByIndex, inputWarnings } = prepareHeader(data[firstNonEmptyIndex], importType, initialWarnings);
  const rows: CompetitionImportParsedRow[] = [];
  for (let index = firstNonEmptyIndex + 1; index < data.length; index += 1) {
    const row = data[index];
    if (rowIsEmpty(row)) continue;
    rows.push(mappedRow(row, index + 1, canonicalByIndex));
    if (rows.length > COMPETITION_IMPORT_MAX_ROWS) {
      throw new CompetitionImportParseError(`导入行数不能超过 ${COMPETITION_IMPORT_MAX_ROWS} 行。`, 413);
    }
  }
  if (!rows.length) throw new CompetitionImportParseError("没有可导入的数据行。");
  return { rows, inputWarnings };
}

function mapDelimitedText(
  text: string,
  delimiter: "," | "\t",
  importType: CompetitionImportType,
  syntheticHeader?: CompetitionImportCell[],
) {
  let header = syntheticHeader ? prepareHeader(syntheticHeader, importType, []) : null;
  const rows: CompetitionImportParsedRow[] = [];
  forEachDelimitedRow(text, delimiter, (row, recordIndex) => {
    if (rowIsEmpty(row)) return;
    if (!header) {
      header = prepareHeader(row, importType, []);
      return;
    }
    rows.push(mappedRow(row, recordIndex + (syntheticHeader ? 2 : 1), header.canonicalByIndex));
    if (rows.length > COMPETITION_IMPORT_MAX_ROWS) {
      throw new CompetitionImportParseError(`导入行数不能超过 ${COMPETITION_IMPORT_MAX_ROWS} 行。`, 413);
    }
  });
  if (!header) throw new CompetitionImportParseError("导入内容为空。");
  if (!rows.length) throw new CompetitionImportParseError("没有可导入的数据行。");
  return { rows, inputWarnings: header.inputWarnings };
}

export function parseCompetitionImportCsv(text: string, importType: CompetitionImportType) {
  return mapDelimitedText(text, ",", importType);
}

export function parseCompetitionImportPaste(text: string, importType: CompetitionImportType) {
  const source = text.replace(/^\uFEFF/, "");
  const firstNonEmptyLine = source.match(/(?:^|\r?\n)([^\r\n]*\S[^\r\n]*)/u)?.[1] ?? "";
  if (!firstNonEmptyLine.includes("\t") && !/[,"]/.test(firstNonEmptyLine)) {
    if (importType === "TEAM" && canonicalHeader("TEAM", firstNonEmptyLine) !== "name") {
      return mapDelimitedText(source, "\t", importType, ["name"]);
    }
    return mapDelimitedText(source, "\t", importType);
  }
  const delimiter = firstNonEmptyLine.includes("\t") ? "\t" : ",";
  return mapDelimitedText(source, delimiter, importType);
}

export async function parseCompetitionImportXlsx(buffer: Buffer, importType: CompetitionImportType) {
  try {
    inspectCompetitionImportXlsx(buffer);
  } catch (error) {
    if (error instanceof CompetitionImportXlsxPreflightError) {
      throw new CompetitionImportParseError(error.message, error.status);
    }
    throw error;
  }
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
  const rawContentLength = request.headers.get("content-length");
  if (rawContentLength === null) {
    throw new CompetitionImportParseError("导入请求必须提供有效的 Content-Length。", 411);
  }
  if (!/^\d+$/u.test(rawContentLength.trim())) {
    throw new CompetitionImportParseError("导入请求的 Content-Length 无效。", 400);
  }
  const contentLength = Number(rawContentLength);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    throw new CompetitionImportParseError("导入请求的 Content-Length 无效。", 400);
  }
  if (contentLength > COMPETITION_IMPORT_MAX_FILE_BYTES + multipartAllowanceBytes) {
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
