import { csvCell, csvDocument } from "../src/lib/csv-export";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

assertEqual(csvCell("=1+1"), "\"'=1+1\"", "equals formula");
assertEqual(csvCell("+CMD"), "\"'+CMD\"", "plus formula");
assertEqual(csvCell("-1+1"), "\"'-1+1\"", "minus formula");
assertEqual(csvCell("@SUM(A1:A2)"), "\"'@SUM(A1:A2)\"", "at formula");
assertEqual(csvCell("  =1+1"), "\"'  =1+1\"", "leading spaces");
assertEqual(csvCell("\t+CMD"), "\"'\t+CMD\"", "leading tab");
assertEqual(csvCell("普通中文"), "\"普通中文\"", "Chinese text");
assertEqual(csvCell("逗号,引号\"换行\n"), "\"逗号,引号\"\"换行\n\"", "CSV quoting");
assertEqual(csvCell("123"), "\"123\"", "numeric text");
assertEqual(csvCell(123), "\"123\"", "numeric value");
assertEqual(csvCell(-123), "\"-123\"", "negative numeric value");
assertEqual(csvDocument([["姓名", "=1+1"]]), "\uFEFF\"姓名\",\"'=1+1\"", "document output");

console.log("F-002 CSV formula neutralization tests passed.");
