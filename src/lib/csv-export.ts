const spreadsheetFormulaPrefix = /^[=+\-@]/u;
const leadingWhitespaceOrControl = /^[\s\u0000-\u001f\u007f]+/u;

export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  const normalizedLeading = text.replace(leadingWhitespaceOrControl, "");
  const literalText =
    typeof value === "string" && spreadsheetFormulaPrefix.test(normalizedLeading)
      ? `'${text}`
      : text;
  return `"${literalText.replaceAll('"', '""')}"`;
}

export function csvDocument(rows: unknown[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}
