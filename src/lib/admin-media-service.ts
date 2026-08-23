import { randomUUID } from "node:crypto";
import { access, mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

import type { MediaVisibility, Prisma } from "@/generated/prisma-v29/client";
import { UnifiedAdminInputError } from "@/lib/unified-admin-api";
import { prisma } from "@/lib/prisma";
import { assertUnifiedAdminPermission, UnifiedAdminAccessError, type UnifiedAdminActor } from "@/lib/unified-admin-rbac";

type AllowedUpload = {
  extensions: readonly string[];
  maximumBytes: number;
  matches(bytes: Uint8Array): boolean;
};

const mebibyte = 1024 * 1024;
const signatureProbeBytes = 16;
const maximumConcurrentUploads = 2;
const maximumQueuedUploads = 4;
const uploadQueueWaitMs = 5_000;
const uploadStreamTimeoutMs = 30_000;
const abandonedStagingAgeMs = 60 * 60 * 1_000;

const allowedUploads: Record<string, AllowedUpload> = {
  "image/jpeg": { extensions: [".jpg", ".jpeg"], maximumBytes: 10 * mebibyte, matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extensions: [".png"], maximumBytes: 10 * mebibyte, matches: (bytes) => bytes.length >= 8 && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extensions: [".webp"], maximumBytes: 10 * mebibyte, matches: (bytes) => bytes.length >= 12 && Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP" },
  "application/pdf": { extensions: [".pdf"], maximumBytes: 20 * mebibyte, matches: (bytes) => bytes.length >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-" },
};

export const maximumMediaRequestBytes = 21 * mebibyte;
export const mediaUploadConcurrency = { active: 0, queued: 0, maximumActive: maximumConcurrentUploads, maximumQueued: maximumQueuedUploads };
export const mediaUploadMetrics = { maximumObservedActive: 0 };
const uploadWaiters: Array<() => void> = [];

function cleanOriginalFilename(value: string) {
  const baseName = path.basename(value.replaceAll("\\", "/")).normalize("NFKC");
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!cleaned || cleaned.length > 180) throw new UnifiedAdminInputError("文件名无效或过长。");
  return cleaned;
}

function cleanAltText(value: string | undefined) {
  const result = value?.trim() ?? "";
  if (result.length > 240) throw new UnifiedAdminInputError("替代文字不能超过 240 个字符。");
  return result || null;
}

function validateVisibility(value: string): MediaVisibility {
  if (value !== "PUBLIC" && value !== "PRIVATE") throw new UnifiedAdminInputError("媒体可见性不正确。");
  return value;
}

export function getMediaUploadRoot() {
  const configured = process.env.NUAAFA_UPLOAD_DIR?.trim();
  if (!configured) throw new Error("必须显式配置 NUAAFA_UPLOAD_DIR，媒体存储已安全关闭。");
  if (!path.isAbsolute(configured)) throw new Error("NUAAFA_UPLOAD_DIR 必须是绝对路径。");
  return path.resolve(configured);
}

export function resolveMediaStoragePath(storageKey: string) {
  if (!/^[0-9]{4}\/[0-9]{2}\/[0-9a-f-]+\.(?:jpg|jpeg|png|webp|pdf)$/.test(storageKey)) {
    throw new UnifiedAdminInputError("媒体 storage key 无效。", 404);
  }
  const root = getMediaUploadRoot();
  const target = path.resolve(root, ...storageKey.split("/"));
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new UnifiedAdminInputError("媒体存储路径无效。", 404);
  return { root, target };
}

async function acquireUploadSlot() {
  if (mediaUploadConcurrency.active < maximumConcurrentUploads) {
    mediaUploadConcurrency.active += 1;
    mediaUploadMetrics.maximumObservedActive = Math.max(mediaUploadMetrics.maximumObservedActive, mediaUploadConcurrency.active);
    return releaseUploadSlot;
  }
  if (uploadWaiters.length >= maximumQueuedUploads) throw new UnifiedAdminInputError("上传队列繁忙，请稍后重试。", 429);
  await new Promise<void>((resolve, reject) => {
    const waiter = () => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(() => {
      const index = uploadWaiters.indexOf(waiter);
      if (index >= 0) uploadWaiters.splice(index, 1);
      mediaUploadConcurrency.queued = uploadWaiters.length;
      reject(new UnifiedAdminInputError("等待上传队列超时，请稍后重试。", 429));
    }, uploadQueueWaitMs);
    uploadWaiters.push(waiter);
    mediaUploadConcurrency.queued = uploadWaiters.length;
  });
  mediaUploadConcurrency.active += 1;
  mediaUploadMetrics.maximumObservedActive = Math.max(mediaUploadMetrics.maximumObservedActive, mediaUploadConcurrency.active);
  mediaUploadConcurrency.queued = uploadWaiters.length;
  return releaseUploadSlot;
}

function releaseUploadSlot() {
  mediaUploadConcurrency.active = Math.max(0, mediaUploadConcurrency.active - 1);
  const waiter = uploadWaiters.shift();
  mediaUploadConcurrency.queued = uploadWaiters.length;
  waiter?.();
}

async function readWithDeadline(reader: ReadableStreamDefaultReader<Uint8Array>, deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new UnifiedAdminInputError("上传数据流超时。", 408);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new UnifiedAdminInputError("上传数据流超时。", 408)), remaining); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function streamToStaging(input: { stream: ReadableStream<Uint8Array>; stagingTarget: string; maximumBytes: number; expectedBytes?: number; timeoutMs?: number }) {
  const handle = await open(input.stagingTarget, "wx", 0o600);
  const reader = input.stream.getReader();
  let size = 0;
  let signature = new Uint8Array();
  const deadline = Date.now() + Math.max(1, input.timeoutMs ?? uploadStreamTimeoutMs);
  try {
    while (true) {
      const { done, value } = await readWithDeadline(reader, deadline);
      if (done) break;
      if (!(value instanceof Uint8Array) || !value.length) continue;
      size += value.length;
      if (size > input.maximumBytes) throw new UnifiedAdminInputError(`文件超过 ${Math.floor(input.maximumBytes / mebibyte)} MB 限制。`, 413);
      if (signature.length < signatureProbeBytes) {
        const needed = signatureProbeBytes - signature.length;
        signature = Uint8Array.from([...signature, ...value.subarray(0, needed)]);
      }
      await handle.write(value);
    }
    if (!size || (input.expectedBytes !== undefined && size !== input.expectedBytes)) {
      throw new UnifiedAdminInputError(input.expectedBytes === undefined ? "文件不能为空。" : "上传数据流长度与 Content-Length 不一致。", 400);
    }
    await handle.sync();
    return { size, signature };
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
    await handle.close();
  }
}

export async function cleanupAbandonedMediaStaging(options: { now?: Date; maximumAgeMs?: number } = {}) {
  const root = getMediaUploadRoot();
  const stagingDirectory = path.join(root, ".staging");
  const cutoff = (options.now ?? new Date()).getTime() - (options.maximumAgeMs ?? abandonedStagingAgeMs);
  await mkdir(stagingDirectory, { recursive: true });
  const entries = await readdir(stagingDirectory, { withFileTypes: true });
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".upload")) continue;
    const target = path.join(stagingDirectory, entry.name);
    if ((await stat(target)).mtimeMs < cutoff) { await rm(target, { force: true }); removed += 1; }
  }
  return removed;
}

export async function storeMediaAssetUploadStream(input: {
  fileName: string;
  mimeType: string;
  stream: ReadableStream<Uint8Array>;
  contentLength?: number;
  timeoutMs?: number;
  altText?: string;
  visibility: string;
  actor: UnifiedAdminActor;
}) {
  assertUnifiedAdminPermission(input.actor, "media:write");
  const originalFilename = cleanOriginalFilename(input.fileName);
  const rule = allowedUploads[input.mimeType];
  if (!rule) throw new UnifiedAdminInputError("仅允许上传 JPG、PNG、WEBP 或 PDF 文件。", 415);
  const extension = path.extname(originalFilename).toLowerCase();
  if (!rule.extensions.includes(extension)) throw new UnifiedAdminInputError("文件扩展名与声明 MIME 不匹配。", 415);
  if (input.contentLength !== undefined && (!Number.isSafeInteger(input.contentLength) || input.contentLength <= 0 || input.contentLength > rule.maximumBytes)) {
    throw new UnifiedAdminInputError(`文件为空或超过 ${Math.floor(rule.maximumBytes / mebibyte)} MB 限制。`, 413);
  }
  const visibility = validateVisibility(input.visibility);
  const altText = cleanAltText(input.altText);
  const release = await acquireUploadSlot();
  const now = new Date();
  const storedFilename = `${randomUUID()}${extension}`;
  const storageKey = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${storedFilename}`;
  const { root, target } = resolveMediaStoragePath(storageKey);
  const stagingDirectory = path.join(root, ".staging");
  const stagingTarget = path.join(stagingDirectory, `${randomUUID()}.upload`);
  try {
    await mkdir(stagingDirectory, { recursive: true });
    await cleanupAbandonedMediaStaging();
    await mkdir(path.dirname(target), { recursive: true });
    const streamed = await streamToStaging({ stream: input.stream, stagingTarget, maximumBytes: rule.maximumBytes, expectedBytes: input.contentLength, timeoutMs: input.timeoutMs });
    if (!rule.matches(streamed.signature)) throw new UnifiedAdminInputError("文件内容 signature 与声明 MIME 不匹配。", 415);
    try { await rename(stagingTarget, target); } catch (error) { await rm(stagingTarget, { force: true }); throw error; }
    try {
      return await prisma.$transaction(async (tx) => {
        const asset = await tx.mediaAsset.create({
          data: { storageKey, originalFilename, storedFilename, mimeType: input.mimeType, size: streamed.size, visibility, altText, metadata: { signatureValidated: true, storageVersion: 2, streamed: true }, uploadedByAdminId: input.actor.id },
          select: { id: true, originalFilename: true, storedFilename: true, mimeType: true, size: true, visibility: true, altText: true, createdAt: true },
        });
        await tx.auditLog.create({ data: { actorType: "ADMIN", actorId: input.actor.id, action: "MEDIA_ASSET_UPLOAD", entityType: "MediaAsset", entityId: asset.id, summary: `${input.actor.displayName}上传了文件《${asset.originalFilename}》`, metadata: JSON.stringify({ mimeType: asset.mimeType, size: asset.size, visibility: asset.visibility, streamed: true }) } });
        return asset;
      });
    } catch (error) { await rm(target, { force: true }); throw error; }
  } catch (error) {
    await rm(stagingTarget, { force: true });
    throw error;
  } finally {
    release();
  }
}

export async function storeMediaAssetUpload(input: { fileName: string; mimeType: string; bytes: Uint8Array; altText?: string; visibility: string; actor: UnifiedAdminActor }) {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(input.bytes); controller.close(); } });
  return storeMediaAssetUploadStream({ ...input, stream, contentLength: input.bytes.length });
}

export async function getAdminMediaPage(input: { actor: UnifiedAdminActor; page?: number; visibility?: MediaVisibility; mimeType?: string }) {
  assertUnifiedAdminPermission(input.actor, "media:read");
  const page = Math.max(1, input.page ?? 1);
  const pageSize = 20;
  const where: Prisma.MediaAssetWhereInput = { ...(input.visibility ? { visibility: input.visibility } : {}), ...(input.mimeType ? { mimeType: input.mimeType } : {}) };
  const [total, rows] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({ where, select: { id: true, originalFilename: true, mimeType: true, size: true, visibility: true, altText: true, storageKey: true, createdAt: true, uploadedByAdmin: { select: { displayName: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  const items = await Promise.all(rows.map(async ({ storageKey, ...row }) => {
    try { await access(resolveMediaStoragePath(storageKey).target); return { ...row, fileStatus: "AVAILABLE" as const }; }
    catch { return { ...row, fileStatus: "MISSING" as const }; }
  }));
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function resolveMediaAssetFile(id: string, actor: UnifiedAdminActor | null) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true, originalFilename: true, storageKey: true, mimeType: true, size: true, visibility: true } });
  if (!asset) throw new UnifiedAdminInputError("媒体不存在。", 404);
  if (asset.visibility === "PRIVATE") {
    if (!actor) throw new UnifiedAdminAccessError("请先登录管理员后台。", 401);
    assertUnifiedAdminPermission(actor, "media:read");
  }
  const filePath = resolveMediaStoragePath(asset.storageKey).target;
  try {
    const file = await stat(filePath);
    if (!file.isFile() || file.size !== asset.size) throw new Error("size mismatch");
    return { ...asset, filePath };
  } catch {
    throw new UnifiedAdminInputError("媒体记录存在，但文件缺失或大小不一致。", 404);
  }
}

export async function readMediaAssetFile(id: string, actor: UnifiedAdminActor | null) {
  const asset = await resolveMediaAssetFile(id, actor);
  return { ...asset, bytes: await readFile(asset.filePath) };
}

async function listStoredFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === ".staging") continue;
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listStoredFiles(root, target));
    else if (entry.isFile()) files.push(path.relative(root, target).split(path.sep).join("/"));
  }
  return files;
}

export async function scanOrphanedMediaFiles() {
  const root = getMediaUploadRoot();
  await mkdir(root, { recursive: true });
  const [files, rows] = await Promise.all([listStoredFiles(root), prisma.mediaAsset.findMany({ select: { storageKey: true } })]);
  const expected = new Set(rows.map((row) => row.storageKey));
  return files.filter((file) => !expected.has(file)).sort();
}
