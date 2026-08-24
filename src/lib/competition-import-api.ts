import { NextResponse } from "next/server";

import { CompetitionImportParseError } from "@/lib/competition-import-parser";
import {
  CompetitionImportCommitConflict,
  CompetitionImportServiceError,
} from "@/lib/competition-import-service";
import { unifiedAdminErrorResponse } from "@/lib/unified-admin-api";

export function competitionImportErrorResponse(error: unknown, fallback: string) {
  if (error instanceof CompetitionImportCommitConflict) {
    return NextResponse.json(
      { error: error.message, preview: error.preview },
      { status: error.status },
    );
  }
  if (error instanceof CompetitionImportParseError || error instanceof CompetitionImportServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return unifiedAdminErrorResponse(error, fallback);
}
