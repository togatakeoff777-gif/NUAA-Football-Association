import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { MediaVisibility, Prisma } from "@/generated/prisma-v29/client";
import { UnifiedAdminInputError } from "@/lib/unified-admin-api";
import { prisma } from "@/lib/prisma";
import {
  assertUnifiedAdminPermission,
  UnifiedAdminAccessError,
  type UnifiedAdminActor,
} from "@/lib/unified-admin-rbac";

type AllowedUpload = {
  extensions: readonly string[];
  maximumBytes: number;
  matches(bytes: Uint8Array): boolean;
};

const mebibyte = 1024 * 1024;

const allowedUploads: Record<string, AllowedUpload> = {
  "image/jpeg": {
    extensions: [".jpg", ".jpeg"],
    maximumBytes: 10 * mebibyte,
    matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extensions: [".png"],
    maximumBytes: 10 * mebibyte,
    matches: (bytes) => Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/webp": {
    extensions: [".webp"],
    maximumBytes: 10 * mebibyte,
    matches: (bytes) => bytes.length >= 12
      && Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF"
      && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP",
  },
  "application/pdf": {
    extensions: [".pdf"],
    maximumBytes: 20 * mebibyte,
    matches: (bytes) => bytes.length >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-",
  },
};

export const maximumMediaRequestBytes = 21 * mebibyte;

function cleanOriginalFilename(value: string) {
  const baseName = path.basename(value.replaceAll("\\", "/")).normalize("NFKC");
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!cleaned || cleaned.length > 180) {
    throw new UnifiedAdminInputError("文件名无效或过长。");
  }
  return cleaned;
}

function cleanAltText(value: string | undefined) {
  const result = value?.trim() ?? "";
  if (result.length > 240) throw new UnifiedAdminInputError("替代文字不能超过 240 个字符。");
  return result || null;
}

function validateVisibility(value: string): MediaVisibility {
  if (value !== "PUBLIC" && value !== "PRIVATE") {
    throw new UnifiedAdminInputError("媒体可见性不正确。");
  }
  return value;
}

export function getMediaUploadRoot() {
  const configured = process.env.NUAAFA_UPLOAD_DIR?.trim();
  if (!configured) throw new Error("必须显式配置 NUAAFA_UPLOAD_DIR，媒体存储已安全关闭。");
  if (!path.isAbsolute(configured)) throw new Error("NUAAFA_UPLOAD_DIR 必须是绝对路径。");
  return path.resolve(configured);
}

function resolveStoragePath(storageKey: string) {
  if (!/^[0-9]{4}\/[0-9]{2}\/[0-9a-f-]+\.(?:jpg|jpeg|png|webp|pdf)$/.test(storageKey)) {
    throw new UnifiedAdminInputError("媒体 storage key 无效。", 404);
  }
  const root = getMediaUploadRoot();
  const target = path.resolve(root, ...storageKey.split("/"));
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new UnifiedAdminInputError("媒体存储路径无效。", 404);
  }
  return { root, target };
}

export async function storeMediaAssetUpload(input: {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  altText?: string;
  visibility: string;
  actor: UnifiedAdminActor;
}) {
  assertUnifiedAdminPermission(input.actor, "media:write");
  const originalFilename = cleanOriginalFilename(input.fileName);
  const rule = allowedUploads[input.mimeType];
  if (!rule) {
    throw new UnifiedAdminInputError("仅允许上传 JPG、PNG、WEBP 或 PDF 文件。", 415);
  }
  const extension = path.extname(originalFilename).toLowerCase();
  if (!rule.extensions.includes(extension)) {
    throw new UnifiedAdminInputError("文件扩展名与声明 MIME 不匹配。", 415);
  }
  if (!input.bytes.length || input.bytes.length > rule.maximumBytes) {
    throw new UnifiedAdminInputError(
      `文件为空或超过 ${Math.floor(rule.maximumBytes / mebibyte)} MB 限制。`,
      413,
    );
  }
  if (!rule.matches(input.bytes)) {
    throw new UnifiedAdminInputError("文件内容 signature 与声明 MIME 不匹配。", 415);
  }
  const visibility = validateVisibility(input.visibility);
  const now = new Date();
  const storedFilename = `${randomUUID()}${extension}`;
  const storageKey = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${storedFilename}`;
  const { root, target } = resolveStoragePath(storageKey);
  const stagingDirectory = path.join(root, ".staging");
  const stagingTarget = path.join(stagingDirectory, `${randomUUID()}.upload`);

  await mkdir(stagingDirectory, { recursive: true });
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(stagingTarget, input.bytes, { flag: "wx" });
  try {
    await rename(stagingTarget, target);
  } catch (error) {
    await rm(stagingTarget, { force: true });
    throw error;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.create({
        data: {
          storageKey,
          originalFilename,
          storedFilename,
          mimeType: input.mimeType,
          size: input.bytes.length,
          visibility,
          altText: cleanAltText(input.altText),
          metadata: { signatureValidated: true, storageVersion: 1 },
          uploadedByAdminId: input.actor.id,
        },
        select: {
          id: true,
          originalFilename: true,
          storedFilename: true,
          mimeType: true,
          size: true,
          visibility: true,
          altText: true,
          createdAt: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorId: input.actor.id,
          action: "MEDIA_ASSET_UPLOAD",
          entityType: "MediaAsset",
          entityId: asset.id,
          summary: `${input.actor.displayName}上传了文件《${asset.originalFilename}》`,
          metadata: JSON.stringify({ mimeType: asset.mimeType, size: asset.size, visibility: asset.visibility }),
        },
      });
      return asset;
    });
  } catch (error) {
    await rm(target, { force: true });
    throw error;
  }
}

export async function getAdminMediaPage(input: {
  actor: UnifiedAdminActor;
  page?: number;
  visibility?: MediaVisibility;
  mimeType?: string;
}) {
  assertUnifiedAdminPermission(input.actor, "media:read");
  const page = Math.max(1, input.page ?? 1);
  const pageSize = 20;
  const where: Prisma.MediaAssetWhereInput = {
    ...(input.visibility ? { visibility: input.visibility } : {}),
    ...(input.mimeType ? { mimeType: input.mimeType } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({
      where,
      select: {
        id: true,
        originalFilename: true,
        mimeType: true,
        size: true,
        visibility: true,
        altText: true,
        storageKey: true,
        createdAt: true,
        uploadedByAdmin: { select: { displayName: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const items = await Promise.all(rows.map(async ({ storageKey, ...row }) => {
    try {
      await access(resolveStoragePath(storageKey).target);
      return { ...row, fileStatus: "AVAILABLE" as const };
    } catch {
      return { ...row, fileStatus: "MISSING" as const };
    }
  }));
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function readMediaAssetFile(id: string, actor: UnifiedAdminActor | null) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      originalFilename: true,
      storageKey: true,
      mimeType: true,
      size: true,
      visibility: true,
    },
  });
  if (!asset) throw new UnifiedAdminInputError("媒体不存在。", 404);
  if (asset.visibility === "PRIVATE") {
    if (!actor) throw new UnifiedAdminAccessError("请先登录管理员后台。", 401);
    assertUnifiedAdminPermission(actor, "media:read");
  }
  try {
    const bytes = await readFile(resolveStoragePath(asset.storageKey).target);
    return { ...asset, bytes };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      throw new UnifiedAdminInputError("媒体记录存在，但文件缺失。", 404);
    }
    throw error;
  }
}
