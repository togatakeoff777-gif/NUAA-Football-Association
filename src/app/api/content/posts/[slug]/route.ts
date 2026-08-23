import { NextResponse } from "next/server";

import { getPublishedContentDetailBySlug } from "@/lib/admin-content-service";
import { unifiedAdminErrorResponse } from "@/lib/unified-admin-api";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const post = await getPublishedContentDetailBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "内容不存在。" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(post, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return unifiedAdminErrorResponse(error, "公开内容读取失败。");
  }
}
