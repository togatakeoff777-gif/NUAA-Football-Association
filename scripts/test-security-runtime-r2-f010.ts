import { strToU8, zipSync } from "fflate";

import {
  CompetitionImportParseError,
  parseCompetitionImportCsv,
  parseCompetitionImportPaste,
  parseCompetitionImportXlsx,
  readCompetitionImportRequest,
} from "../src/lib/competition-import-parser";
import {
  COMPETITION_IMPORT_MAX_CELL_CHARACTERS,
  COMPETITION_IMPORT_MAX_COLUMNS,
  COMPETITION_IMPORT_MAX_FILE_BYTES,
  COMPETITION_IMPORT_MAX_ROWS,
  COMPETITION_IMPORT_XLSX_MAX_CELLS,
  COMPETITION_IMPORT_XLSX_MAX_UNCOMPRESSED_BYTES,
  COMPETITION_IMPORT_XLSX_MAX_XML_ENTRY_BYTES,
  COMPETITION_IMPORT_XLSX_MAX_ZIP_ENTRIES,
} from "../src/lib/competition-import-types";
import {
  CompetitionImportXlsxPreflightError,
  inspectCompetitionImportXlsx,
} from "../src/lib/competition-import-xlsx-security";

const centralDirectoryEntrySignature = 0x02014b50;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectParseError(
  label: string,
  action: () => unknown | Promise<unknown>,
  status: 400 | 411 | 413 | 415,
  messagePattern?: RegExp,
) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof CompetitionImportParseError, `${label} returned the wrong error type.`);
    assert(error.status === status, `${label} returned ${error.status}; expected ${status}.`);
    if (messagePattern) assert(messagePattern.test(error.message), `${label} returned an unexpected message: ${error.message}`);
    console.log(`PASS ${label}: ${status} ${error.message}`);
    return;
  }
  throw new Error(`${label} was accepted.`);
}

function worksheetArchive(worksheetXml: string, level: 0 | 6 = 6) {
  return Buffer.from(zipSync({ "xl/worksheets/sheet1.xml": strToU8(worksheetXml) }, { level }));
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function validXlsx(rows: string[][]) {
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      let column = "";
      for (let ordinal = columnIndex + 1; ordinal > 0; ordinal = Math.floor((ordinal - 1) / 26)) {
        column = String.fromCharCode(65 + ((ordinal - 1) % 26)) + column;
      }
      return `<c r="${column}${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Import" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:B${rows.length}"/><sheetData>${rowXml}</sheetData></worksheet>`,
  };
  return Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, strToU8(value)]))));
}

function patchCentralDirectorySize(archive: Buffer, path: string, fieldOffset: 20 | 24, size: number) {
  const result = Buffer.from(archive);
  for (let offset = 0; offset + 46 <= result.byteLength; offset += 1) {
    if (result.readUInt32LE(offset) !== centralDirectoryEntrySignature) continue;
    const fileNameLength = result.readUInt16LE(offset + 28);
    const entryPath = result.toString("utf8", offset + 46, offset + 46 + fileNameLength);
    if (entryPath === path) {
      result.writeUInt32LE(size, offset + fieldOffset);
      return result;
    }
  }
  throw new Error(`Unable to locate central directory entry ${path}.`);
}

function worksheetXml(body: string, dimension = "A1:A1") {
  return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimension}"/><sheetData>${body}</sheetData></worksheet>`;
}

async function requestBoundaryTests() {
  async function rejectedBeforeFormData(label: string, headers: Headers, status: 400 | 411 | 413) {
    let formDataCalled = false;
    const request = {
      headers,
      formData: async () => {
        formDataCalled = true;
        throw new Error("formData must not be called");
      },
    } as unknown as Request;
    await expectParseError(label, () => readCompetitionImportRequest(request), status);
    assert(!formDataCalled, `${label} reached request.formData().`);
  }

  const multipart = "multipart/form-data; boundary=security-r2";
  await rejectedBeforeFormData("missing Content-Length preflight", new Headers({ "content-type": multipart }), 411);
  await rejectedBeforeFormData("invalid Content-Length preflight", new Headers({ "content-type": multipart, "content-length": "invalid" }), 400);
  await rejectedBeforeFormData("zero Content-Length preflight", new Headers({ "content-type": multipart, "content-length": "0" }), 400);
  await rejectedBeforeFormData("declared body above limit preflight", new Headers({
    "content-type": multipart,
    "content-length": String(COMPETITION_IMPORT_MAX_FILE_BYTES + 256 * 1024 + 1),
  }), 413);
}

async function main() {
  const csv = parseCompetitionImportCsv('name,teamType\r\n"安全,球队",FREEFORM\r\n', "TEAM");
  assert(csv.rows.length === 1 && csv.rows[0].values.name === "安全,球队", "Normal CSV regression failed.");
  assert(parseCompetitionImportPaste("无表头甲\n无表头乙", "TEAM").rows.length === 2, "Paste compatibility regressed.");
  const nearRows = `name\n${Array.from({ length: COMPETITION_IMPORT_MAX_ROWS }, (_, index) => `球队${index}`).join("\n")}`;
  assert(parseCompetitionImportCsv(nearRows, "TEAM").rows.length === COMPETITION_IMPORT_MAX_ROWS, "Near-row-limit CSV was rejected.");
  await expectParseError("row limit", () => parseCompetitionImportCsv(`${nearRows}\n超限球队`, "TEAM"), 413);
  await expectParseError(
    "column limit",
    () => parseCompetitionImportCsv(`${Array.from({ length: COMPETITION_IMPORT_MAX_COLUMNS + 1 }, (_, index) => index === 0 ? "name" : `c${index}`).join(",")}\n球队`, "TEAM"),
    413,
  );
  await expectParseError(
    "cell character limit",
    () => parseCompetitionImportCsv(`name\n${"A".repeat(COMPETITION_IMPORT_MAX_CELL_CHARACTERS + 1)}`, "TEAM"),
    413,
  );

  const normalWorkbook = validXlsx([["name", "teamType"], ["正常XLSX球队", "FREEFORM"]]);
  const normalMetadata = inspectCompetitionImportXlsx(normalWorkbook);
  assert(normalMetadata.zipEntries === 5 && normalMetadata.worksheets === 1, "Normal XLSX metadata mismatch.");
  assert(normalMetadata.maximumRow === 2 && normalMetadata.maximumColumn === 2, "Normal XLSX dimensions mismatch.");
  const normalXlsx = await parseCompetitionImportXlsx(normalWorkbook, "TEAM");
  assert(normalXlsx.rows[0]?.values.name === "正常XLSX球队", "Normal XLSX parser regression failed.");
  console.log(`PASS normal XLSX: ${JSON.stringify(normalMetadata)}`);

  await expectParseError(
    "XLSX compressed file bytes",
    () => parseCompetitionImportXlsx(Buffer.alloc(COMPETITION_IMPORT_MAX_FILE_BYTES + 1), "TEAM"),
    413,
    /压缩文件/u,
  );

  const highlyCompressed = worksheetArchive(worksheetXml(" ".repeat(512 * 1024)));
  await expectParseError("XLSX high compression ratio", () => parseCompetitionImportXlsx(highlyCompressed, "TEAM"), 413, /压缩比/u);

  const underdeclaredXml = Buffer.from(zipSync({
    "xl/worksheets/sheet1.xml": strToU8(worksheetXml('<c r="A1"/>')),
    "xl/sharedStrings.xml": strToU8(`<sst>${"A".repeat(256 * 1024)}</sst>`),
  }, { level: 6 }));
  const patchedUnderdeclaredXml = patchCentralDirectorySize(underdeclaredXml, "xl/sharedStrings.xml", 24, 64);
  await expectParseError(
    "XLSX underdeclared parser XML",
    () => parseCompetitionImportXlsx(patchedUnderdeclaredXml, "TEAM"),
    415,
    /ZIP 结构/u,
  );

  const tinyWorksheet = worksheetArchive(worksheetXml('<c r="A1"/>'), 0);
  const excessTotal = patchCentralDirectorySize(
    tinyWorksheet,
    "xl/worksheets/sheet1.xml",
    24,
    COMPETITION_IMPORT_XLSX_MAX_UNCOMPRESSED_BYTES + 1,
  );
  await expectParseError("XLSX declared uncompressed total", () => parseCompetitionImportXlsx(excessTotal, "TEAM"), 413, /总大小/u);
  const excessXml = patchCentralDirectorySize(
    patchCentralDirectorySize(tinyWorksheet, "xl/worksheets/sheet1.xml", 20, COMPETITION_IMPORT_XLSX_MAX_XML_ENTRY_BYTES + 1),
    "xl/worksheets/sheet1.xml",
    24,
    COMPETITION_IMPORT_XLSX_MAX_XML_ENTRY_BYTES + 1,
  );
  await expectParseError("XLSX declared worksheet XML size", () => parseCompetitionImportXlsx(excessXml, "TEAM"), 413, /XML 单条目/u);

  const manyEntries = Buffer.from(zipSync(Object.fromEntries(
    Array.from({ length: COMPETITION_IMPORT_XLSX_MAX_ZIP_ENTRIES + 1 }, (_, index) => [
      index === 0 ? "xl/worksheets/sheet1.xml" : `safe/entry-${index}.xml`,
      strToU8(index === 0 ? worksheetXml('<c r="A1"/>') : "<x/>")
    ]),
  )));
  await expectParseError("XLSX ZIP entry count", () => parseCompetitionImportXlsx(manyEntries, "TEAM"), 413, /条目/u);
  await expectParseError("XLSX row dimension", () => parseCompetitionImportXlsx(worksheetArchive(worksheetXml("", `A1:A${COMPETITION_IMPORT_MAX_ROWS + 2}`), 0), "TEAM"), 413, /行号/u);
  await expectParseError("XLSX column dimension", () => parseCompetitionImportXlsx(worksheetArchive(worksheetXml("", "A1:AG2"), 0), "TEAM"), 413, /列数/u);

  const excessiveCells = worksheetXml(`<row r="1">${'<c r="A1"/>'.repeat(COMPETITION_IMPORT_XLSX_MAX_CELLS + 1)}</row>`, "A1:AF5001");
  await expectParseError("XLSX cell count", () => parseCompetitionImportXlsx(worksheetArchive(excessiveCells, 0), "TEAM"), 413, /单元格/u);

  await requestBoundaryTests();
  console.log("F-010 deterministic multipart, CSV and XLSX resource-boundary regressions passed.");
}

main().catch((error) => {
  if (error instanceof CompetitionImportXlsxPreflightError) console.error(`${error.status} ${error.message}`);
  else console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
