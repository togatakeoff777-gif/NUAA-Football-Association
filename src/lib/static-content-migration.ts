import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";

import { freshmanCupPreparationNews, freshmanCupPreparationNotice, getFreshmanCupArticle } from "@/data/freshman-cup-2026";
import { getMensCupArticle, officialMensCupNews } from "@/data/mens-intercollege-cup-2026";
import { disciplineDecisions, getDisciplineDecisionArticle } from "@/data/public-information";
import { getWomensCupArticle, officialWomensCupNews } from "@/data/womens-intercollege-cup-2026";
import type { ContentPostType, Prisma } from "@/generated/prisma-v29/client";
import { validateStructuredContent, type StructuredContent, type StructuredContentNode } from "@/lib/admin-content-input";
import { getMediaUploadRoot } from "@/lib/admin-media-service";
import { prisma } from "@/lib/prisma";

type LegacyBlock = { type: "paragraph"; text: string } | { type: "heading"; text: string } | { type: "list"; items: readonly string[] };
type StaticStory = {
  id: string;
  title: string;
  summary: string;
  dateLabel: string;
  publishedAt?: string;
  source?: string;
  image?: string;
  imageAlt?: string;
  publicationStatus?: string;
};

export type StaticContentManifestEntry = {
  sourcePath: string;
  contentSourcePath: string;
  slug: string;
  type: ContentPostType;
  title: string;
  summary: string;
  publishedAt: string;
  source: string | null;
  cover: { path: string; altText: string | null } | null;
  attachments: Array<{ kind: "official-pdf"; path: string; versionLabel: string | null; scopeLabel: string | null }>;
  pinned: boolean;
  featured: boolean;
  content: StructuredContent;
  contentHash: string;
};

export type StaticMigrationIssue = {
  severity: "error" | "warning";
  code: string;
  slug?: string;
  path?: string;
  message: string;
};

export type StaticContentManifest = {
  formatVersion: 1;
  generatedAt: string;
  entries: StaticContentManifestEntry[];
  media: Array<{ path: string; bytes: number; sha256: string; mimeType: string }>;
  excludedSources: Array<{ path: string; reason: string }>;
  issues: StaticMigrationIssue[];
};

function checksum(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function parseLegacyDate(story: StaticStory) {
  if (story.publishedAt && !Number.isNaN(Date.parse(story.publishedAt))) return new Date(story.publishedAt).toISOString();
  const normalized = story.dateLabel.replaceAll(".", "-").trim();
  const candidate = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(normalized)
    ? `${normalized.replace(/\s+/, "T")}:00+08:00`
    : /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? `${normalized}T12:00:00+08:00` : "";
  if (!candidate || Number.isNaN(Date.parse(candidate))) throw new Error(`Invalid legacy date: ${story.dateLabel}`);
  return new Date(candidate).toISOString();
}

function blocksToContent(blocks: readonly LegacyBlock[]): StructuredContent {
  const content: StructuredContentNode[] = blocks.map((block) => {
    if (block.type === "paragraph") return { type: "paragraph", content: [{ type: "text", text: block.text }] };
    if (block.type === "heading") return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: block.text }] };
    return { type: "bulletList", content: block.items.map((item) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: item }] }] })) };
  });
  return validateStructuredContent({ schemaVersion: 1, document: { type: "doc", content } });
}

function makeEntry(input: {
  story: StaticStory;
  blocks: readonly LegacyBlock[];
  type: ContentPostType;
  sourcePath: string;
  contentSourcePath: string;
  pdf?: { path: string; versionLabel: string; scopeLabel: string };
}) {
  const content = blocksToContent(input.blocks);
  const entry: StaticContentManifestEntry = {
    sourcePath: input.sourcePath,
    contentSourcePath: input.contentSourcePath,
    slug: input.story.id,
    type: input.type,
    title: input.story.title,
    summary: input.story.summary,
    publishedAt: parseLegacyDate(input.story),
    source: input.story.source ?? null,
    cover: input.story.image ? { path: input.story.image, altText: input.story.imageAlt ?? null } : null,
    attachments: input.pdf ? [{ kind: "official-pdf", path: input.pdf.path, versionLabel: input.pdf.versionLabel, scopeLabel: input.pdf.scopeLabel }] : [],
    pinned: input.story.publicationStatus === "置顶",
    featured: false,
    content,
    contentHash: checksum(JSON.stringify(content)),
  };
  return entry;
}

function mimeTypeFor(sourcePath: string) {
  const extension = path.extname(sourcePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".pdf") return "application/pdf";
  return null;
}

function importedMediaStorageKey(media: StaticContentManifest["media"][number], publishedAt: string) {
  const extension = path.extname(media.path).toLowerCase();
  const date = new Date(publishedAt);
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${media.sha256.slice(0, 32)}${extension}`;
}

function expectedImportedMediaKeys(manifest: StaticContentManifest) {
  const mediaByPath = new Map(manifest.media.map((item) => [item.path, item]));
  const result = new Map<string, string>();
  for (const entry of manifest.entries) {
    const references = [entry.cover?.path, ...entry.attachments.map((item) => item.path)]
      .filter((item): item is string => Boolean(item));
    for (const mediaPath of references) {
      const media = mediaByPath.get(mediaPath);
      if (media && !result.has(mediaPath)) result.set(mediaPath, importedMediaStorageKey(media, entry.publishedAt));
    }
  }
  return result;
}

export function validateStaticManifestEntries(entries: readonly StaticContentManifestEntry[]) {
  const issues: StaticMigrationIssue[] = [];
  const slugs = new Set<string>();
  const mediaReferences = new Map<string, string[]>();
  for (const entry of entries) {
    if (!entry.slug || !entry.title || !entry.summary || !entry.publishedAt) issues.push({ severity: "error", code: "MISSING_REQUIRED_FIELD", slug: entry.slug, message: "缺少必填字段。" });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) issues.push({ severity: "error", code: "INVALID_SLUG", slug: entry.slug, message: "Slug 格式无效。" });
    if (slugs.has(entry.slug)) issues.push({ severity: "error", code: "DUPLICATE_SLUG", slug: entry.slug, message: "Slug 重复。" });
    slugs.add(entry.slug);
    if (Number.isNaN(Date.parse(entry.publishedAt))) issues.push({ severity: "error", code: "INVALID_DATE", slug: entry.slug, message: "发布日期无效。" });
    for (const reference of [entry.cover?.path, ...entry.attachments.map((item) => item.path)].filter((item): item is string => Boolean(item))) {
      if (!mimeTypeFor(reference)) issues.push({ severity: "error", code: "UNSUPPORTED_MEDIA_FORMAT", slug: entry.slug, path: reference, message: "媒体格式不受支持。" });
      mediaReferences.set(reference, [...(mediaReferences.get(reference) ?? []), entry.slug]);
    }
  }
  for (const [mediaPath, references] of mediaReferences) {
    if (references.length > 1) issues.push({ severity: "warning", code: "DUPLICATE_MEDIA_REFERENCE", path: mediaPath, message: `同一文件被 ${references.length} 条内容引用。` });
  }
  return issues;
}

export async function buildStaticContentManifest(): Promise<StaticContentManifest> {
  const entries: StaticContentManifestEntry[] = [];
  for (const story of [freshmanCupPreparationNews, freshmanCupPreparationNotice]) {
    const article = getFreshmanCupArticle(story.id)!;
    entries.push(makeEntry({ story, blocks: article.blocks, type: article.kind === "notice" ? "ANNOUNCEMENT" : "NEWS", sourcePath: "src/data/freshman-cup-2026.ts", contentSourcePath: "src/data/freshman-cup-2026.ts" }));
  }
  for (const story of officialMensCupNews) {
    entries.push(makeEntry({ story, blocks: getMensCupArticle(story.id)!.blocks, type: "NEWS", sourcePath: "src/data/archives/2026-mens-intercollege-cup/news.json", contentSourcePath: "src/data/mens-intercollege-cup-2026.ts" }));
  }
  for (const story of officialWomensCupNews) {
    entries.push(makeEntry({ story, blocks: getWomensCupArticle(story.id)!.blocks, type: "NEWS", sourcePath: "src/data/womens-intercollege-cup-2026.ts", contentSourcePath: "src/data/womens-intercollege-cup-2026.ts" }));
  }
  for (const story of disciplineDecisions) {
    entries.push(makeEntry({ story, blocks: getDisciplineDecisionArticle(story.id)!.blocks, type: "DISCIPLINE", sourcePath: "src/data/public-information.ts", contentSourcePath: "src/data/public-information.ts", pdf: { path: story.pdfHref, versionLabel: story.version, scopeLabel: story.scope } }));
  }

  const issues = validateStaticManifestEntries(entries);
  const mediaPaths = [...new Set(entries.flatMap((entry) => [entry.cover?.path, ...entry.attachments.map((item) => item.path)]).filter((item): item is string => Boolean(item)))].sort();
  const media: StaticContentManifest["media"] = [];
  const hashes = new Map<string, string>();
  for (const mediaPath of mediaPaths) {
    const mimeType = mimeTypeFor(mediaPath);
    const diskPath = path.resolve("public", mediaPath.replace(/^\//, ""));
    try {
      const bytes = await readFile(diskPath);
      const sha256 = checksum(bytes);
      media.push({ path: mediaPath, bytes: bytes.length, sha256, mimeType: mimeType! });
      const previous = hashes.get(sha256);
      if (previous && previous !== mediaPath) issues.push({ severity: "warning", code: "DUPLICATE_MEDIA_FILE", path: mediaPath, message: `文件内容与 ${previous} 重复。` });
      else hashes.set(sha256, mediaPath);
    } catch {
      issues.push({ severity: "error", code: "MISSING_MEDIA", path: mediaPath, message: "静态媒体文件不存在或不可读。" });
    }
  }
  return {
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    entries,
    media,
    excludedSources: [{ path: "src/data/content.ts", reason: "仅含演示占位新闻及由上述真实来源聚合出的 feed；演示项不进入正式数据库。" }],
    issues,
  };
}

async function ensureImportedMedia(media: StaticContentManifest["media"][number], publishedAt: string) {
  const storageKey = importedMediaStorageKey(media, publishedAt);
  const storedFilename = path.basename(storageKey);
  const existing = await prisma.mediaAsset.findUnique({ where: { storageKey }, select: { id: true } });
  const uploadRoot = getMediaUploadRoot();
  const target = path.join(uploadRoot, ...storageKey.split("/"));
  if (!existing) {
    const staging = path.join(uploadRoot, ".staging", `${randomUUID()}.upload`);
    await mkdir(path.dirname(staging), { recursive: true });
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.resolve("public", media.path.replace(/^\//, "")), staging);
    await rename(staging, target);
    try {
      return await prisma.mediaAsset.create({ data: { storageKey, originalFilename: path.basename(media.path), storedFilename, mimeType: media.mimeType, size: media.bytes, visibility: "PUBLIC", metadata: { migrationSourcePath: media.path, sha256: media.sha256, migrationVersion: 1 } }, select: { id: true } });
    } catch (error) { await rm(target, { force: true }); throw error; }
  }
  const bytes = await readFile(target);
  if (bytes.length !== media.bytes || checksum(bytes) !== media.sha256) throw new Error(`Imported media checksum mismatch: ${media.path}`);
  return existing;
}

export async function importStaticContentManifest(manifest: StaticContentManifest) {
  const errors = manifest.issues.filter((issue) => issue.severity === "error");
  if (errors.length) throw new Error(`Static manifest contains ${errors.length} blocking issue(s).`);
  const mediaByPath = new Map(manifest.media.map((item) => [item.path, item]));
  const mediaIds = new Map<string, string>();
  for (const entry of manifest.entries) {
    for (const mediaPath of [entry.cover?.path, ...entry.attachments.map((item) => item.path)].filter((item): item is string => Boolean(item))) {
      if (!mediaIds.has(mediaPath)) mediaIds.set(mediaPath, (await ensureImportedMedia(mediaByPath.get(mediaPath)!, entry.publishedAt)).id);
    }
  }
  for (const entry of manifest.entries) {
    const official = entry.attachments.find((item) => item.kind === "official-pdf");
    await prisma.contentPost.upsert({
      where: { slug: entry.slug },
      create: {
        type: entry.type, slug: entry.slug, title: entry.title, summary: entry.summary,
        content: entry.content as unknown as Prisma.InputJsonValue,
        coverMediaId: entry.cover ? mediaIds.get(entry.cover.path)! : null,
        status: "PUBLISHED", source: entry.source, publishedAt: new Date(entry.publishedAt), pinned: entry.pinned, featured: entry.featured,
        ...(official ? { discipline: { create: { officialMediaId: mediaIds.get(official.path)!, versionLabel: official.versionLabel, scopeLabel: official.scopeLabel } } } : {}),
      },
      update: {
        type: entry.type, title: entry.title, summary: entry.summary,
        content: entry.content as unknown as Prisma.InputJsonValue,
        coverMediaId: entry.cover ? mediaIds.get(entry.cover.path)! : null,
        status: "PUBLISHED", source: entry.source, publishedAt: new Date(entry.publishedAt), pinned: entry.pinned, featured: entry.featured,
        ...(official ? { discipline: { upsert: { create: { officialMediaId: mediaIds.get(official.path)!, versionLabel: official.versionLabel, scopeLabel: official.scopeLabel }, update: { officialMediaId: mediaIds.get(official.path)!, versionLabel: official.versionLabel, scopeLabel: official.scopeLabel } } } } : {}),
      },
      select: { id: true },
    });
  }
  return reconcileStaticContentManifest(manifest);
}

export async function reconcileStaticContentManifest(manifest: StaticContentManifest) {
  const differences: string[] = [];
  const expectedMediaKeys = expectedImportedMediaKeys(manifest);
  const posts = await prisma.contentPost.findMany({
    where: { slug: { in: manifest.entries.map((entry) => entry.slug) } },
    select: {
      slug: true,
      title: true,
      summary: true,
      type: true,
      status: true,
      source: true,
      publishedAt: true,
      pinned: true,
      featured: true,
      content: true,
      coverMedia: { select: { storageKey: true } },
      discipline: { select: { officialMedia: { select: { storageKey: true } } } },
    },
  });
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  for (const entry of manifest.entries) {
    const post = bySlug.get(entry.slug);
    if (!post) { differences.push(`${entry.slug}: missing post`); continue; }
    if (
      post.title !== entry.title || post.summary !== entry.summary || post.type !== entry.type || post.status !== "PUBLISHED" ||
      post.source !== entry.source || post.publishedAt?.toISOString() !== entry.publishedAt ||
      post.pinned !== entry.pinned || post.featured !== entry.featured
    ) differences.push(`${entry.slug}: metadata mismatch`);
    if (checksum(JSON.stringify(validateStructuredContent(post.content))) !== entry.contentHash) differences.push(`${entry.slug}: content checksum mismatch`);
    const expectedCoverKey = entry.cover ? expectedMediaKeys.get(entry.cover.path) ?? null : null;
    if ((post.coverMedia?.storageKey ?? null) !== expectedCoverKey) differences.push(`${entry.slug}: cover media relationship mismatch`);
    const official = entry.attachments.find((item) => item.kind === "official-pdf");
    const expectedOfficialKey = official ? expectedMediaKeys.get(official.path) ?? null : null;
    if ((post.discipline?.officialMedia?.storageKey ?? null) !== expectedOfficialKey) differences.push(`${entry.slug}: official PDF relationship mismatch`);
  }
  const mediaRows = await prisma.mediaAsset.findMany({ select: { storageKey: true, metadata: true } });
  const mediaByStorageKey = new Map(mediaRows.map((row) => [row.storageKey, row]));
  for (const media of manifest.media) {
    const storageKey = expectedMediaKeys.get(media.path);
    const row = storageKey ? mediaByStorageKey.get(storageKey) : null;
    if (!storageKey || !row) { differences.push(`${media.path}: media row unavailable`); continue; }
    const metadataHash = typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata) && "sha256" in row.metadata
      ? row.metadata.sha256
      : null;
    if (metadataHash !== media.sha256) differences.push(`${media.path}: media metadata checksum mismatch`);
    const target = path.join(getMediaUploadRoot(), ...row.storageKey.split("/"));
    try { const bytes = await readFile(target); if (bytes.length !== media.bytes || checksum(bytes) !== media.sha256) differences.push(`${media.path}: media checksum mismatch`); }
    catch { differences.push(`${media.path}: media unavailable`); }
  }
  return {
    expectedCount: manifest.entries.length,
    actualCount: posts.length,
    expectedMediaCount: manifest.media.length,
    reconciledMediaCount: manifest.media.filter((media) => mediaByStorageKey.has(expectedMediaKeys.get(media.path) ?? "")).length,
    slugSetMatches: posts.length === manifest.entries.length,
    differences,
  };
}
