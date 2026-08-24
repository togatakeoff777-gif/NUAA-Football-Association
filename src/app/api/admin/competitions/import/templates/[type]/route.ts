import { authorizeUnifiedAdminRequest } from "@/lib/unified-admin-api";
import { competitionImportErrorResponse } from "@/lib/competition-import-api";
import { CompetitionImportParseError, competitionImportTemplate } from "@/lib/competition-import-parser";

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> },
) {
  try {
    await authorizeUnifiedAdminRequest(request, "competitions:write");
    const { type } = await context.params;
    const importType = type === "team" ? "TEAM" : type === "match" ? "MATCH" : null;
    if (!importType) throw new CompetitionImportParseError("导入模板类型无效。");
    return new Response(competitionImportTemplate(importType), {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": `attachment; filename="nuaafa-${type}-import-template.csv"`,
        "content-type": "text/csv; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return competitionImportErrorResponse(error, "导入模板下载失败，请稍后重试。");
  }
}
