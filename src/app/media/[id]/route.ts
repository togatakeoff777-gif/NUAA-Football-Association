import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

import { getMediaUploadRoot, resolveMediaAssetFile } from "@/lib/admin-media-service";
import { unifiedAdminErrorResponse } from "@/lib/unified-admin-api";
import { getUnifiedAdminActor } from "@/lib/unified-admin-rbac";

export const dynamic = "force-dynamic";

function rfc5987(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function fallbackFilename(mimeType: string) {
  if (mimeType === "application/pdf") return "document.pdf";
  if (mimeType === "image/png") return "image.png";
  if (mimeType === "image/webp") return "image.webp";
  return "image.jpg";
}

export async function GET(_request: Request, context: RouteContext<"/media/[id]">) {
  try {
    // Resolve the configured root up front so a missing environment variable fails closed.
    getMediaUploadRoot();
    const { id } = await context.params;
    const actor = await getUnifiedAdminActor();
    const asset = await resolveMediaAssetFile(id, actor);
    const body = Readable.toWeb(createReadStream(asset.filePath)) as ReadableStream<Uint8Array>;
    return new Response(body, {
      headers: {
        "Cache-Control": asset.visibility === "PUBLIC"
          ? "public, max-age=300, must-revalidate"
          : "private, no-store",
        "Content-Disposition": `inline; filename="${fallbackFilename(asset.mimeType)}"; filename*=UTF-8''${rfc5987(asset.originalFilename)}`,
        "Content-Length": String(asset.size),
        "Content-Type": asset.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return unifiedAdminErrorResponse(error, "媒体读取失败。");
  }
}
