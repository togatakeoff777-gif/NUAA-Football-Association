import { getMediaUploadRoot, readMediaAssetFile } from "@/lib/admin-media-service";
import { unifiedAdminErrorResponse } from "@/lib/unified-admin-api";
import { getUnifiedAdminActor } from "@/lib/unified-admin-rbac";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/media/[id]">) {
  try {
    // Resolve the configured root up front so a missing environment variable fails closed.
    getMediaUploadRoot();
    const { id } = await context.params;
    const actor = await getUnifiedAdminActor();
    const asset = await readMediaAssetFile(id, actor);
    const encodedName = encodeURIComponent(asset.originalFilename);
    return new Response(asset.bytes, {
      headers: {
        "Cache-Control": asset.visibility === "PUBLIC"
          ? "public, max-age=300, must-revalidate"
          : "private, no-store",
        "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(asset.size),
        "Content-Type": asset.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return unifiedAdminErrorResponse(error, "媒体读取失败。");
  }
}
