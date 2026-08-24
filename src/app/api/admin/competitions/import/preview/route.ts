import { NextResponse } from "next/server";

import { competitionImportErrorResponse } from "@/lib/competition-import-api";
import { readCompetitionImportRequest } from "@/lib/competition-import-parser";
import { buildCompetitionImportPreview } from "@/lib/competition-import-service";
import { authorizeUnifiedAdminRequest } from "@/lib/unified-admin-api";

export async function POST(request: Request) {
  try {
    await authorizeUnifiedAdminRequest(request, "competitions:write", { mutation: true });
    const input = await readCompetitionImportRequest(request);
    const preview = await buildCompetitionImportPreview(input);
    return NextResponse.json({ preview });
  } catch (error) {
    return competitionImportErrorResponse(error, "赛事导入预览失败，请稍后重试。");
  }
}
