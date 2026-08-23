import { NextResponse } from "next/server";

import type { ContentPostType } from "@/generated/prisma-v29/client";
import { getPublishedContentPage } from "@/lib/admin-content-service";
import { UnifiedAdminInputError, unifiedAdminErrorResponse } from "@/lib/unified-admin-api";

export const dynamic = "force-dynamic";

function readType(value: string | null): ContentPostType | undefined {
  if (!value) return undefined;
  if (value === "NEWS" || value === "ANNOUNCEMENT" || value === "DISCIPLINE") return value;
  throw new UnifiedAdminInputError("公开内容类型不正确。");
}

function readPageSize(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new UnifiedAdminInputError("pageSize 必须是 1 至 50 的整数。");
  }
  return parsed;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await getPublishedContentPage({
      cursor: url.searchParams.get("cursor") ?? undefined,
      type: readType(url.searchParams.get("type")),
      pageSize: readPageSize(url.searchParams.get("pageSize")),
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return unifiedAdminErrorResponse(error, "公开内容读取失败。");
  }
}
