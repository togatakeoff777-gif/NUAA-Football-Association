import { NextResponse } from "next/server";

import { competitionImportErrorResponse } from "@/lib/competition-import-api";
import { readCompetitionImportRequest } from "@/lib/competition-import-parser";
import { commitCompetitionImport } from "@/lib/competition-import-service";
import { authorizeUnifiedAdminRequest } from "@/lib/unified-admin-api";

export async function POST(request: Request) {
  try {
    const actor = await authorizeUnifiedAdminRequest(request, "competitions:write", { mutation: true });
    const input = await readCompetitionImportRequest(request);
    const result = await commitCompetitionImport(input, actor);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return competitionImportErrorResponse(error, "赛事导入提交失败，请稍后重试。");
  }
}
