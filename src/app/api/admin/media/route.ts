import { NextResponse } from "next/server";

import {
  getAdminMediaPage,
  maximumMediaRequestBytes,
  storeMediaAssetUpload,
} from "@/lib/admin-media-service";
import {
  authorizeUnifiedAdminRequest,
  UnifiedAdminInputError,
  unifiedAdminErrorResponse,
} from "@/lib/unified-admin-api";

export async function GET(request: Request) {
  try {
    const actor = await authorizeUnifiedAdminRequest(request, "media:read");
    const url = new URL(request.url);
    const visibility = url.searchParams.get("visibility");
    const page = Number(url.searchParams.get("page") ?? "1");
    const result = await getAdminMediaPage({
      actor,
      page: Number.isSafeInteger(page) ? page : 1,
      visibility: visibility === "PUBLIC" || visibility === "PRIVATE" ? visibility : undefined,
      mimeType: url.searchParams.get("mimeType") || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return unifiedAdminErrorResponse(error, "媒体列表读取失败。");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeUnifiedAdminRequest(request, "media:write", { mutation: true });
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > maximumMediaRequestBytes) {
      throw new UnifiedAdminInputError("上传请求超过 21 MB 服务端硬限制。", 413);
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new UnifiedAdminInputError("文件格式不正确。");
    const asset = await storeMediaAssetUpload({
      fileName: file.name,
      mimeType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
      altText: typeof form.get("altText") === "string" ? String(form.get("altText")) : "",
      visibility: typeof form.get("visibility") === "string" ? String(form.get("visibility")) : "PRIVATE",
      actor,
    });
    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch (error) {
    return unifiedAdminErrorResponse(error, "文件上传失败。");
  }
}
