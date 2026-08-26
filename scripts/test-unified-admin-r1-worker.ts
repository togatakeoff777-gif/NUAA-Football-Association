import { readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";
import type { UnifiedAdminActor } from "../src/lib/unified-admin-rbac";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function applyMigrations(url: string) {
  const client = createClient({ url });
  const entries = await readdir(path.resolve("prisma/migrations"), { withFileTypes: true });
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await client.executeMultiple(await readFile(path.resolve("prisma/migrations", entry.name, "migration.sql"), "utf8"));
  }
  client.close();
}

async function countFiles(root: string): Promise<number> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (entry.isDirectory()) count += await countFiles(path.join(root, entry.name));
      else if (entry.isFile()) count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}

const doc = (text: string) => ({
  schemaVersion: 1 as const,
  document: {
    type: "doc" as const,
    content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text }] }],
  },
});

const contentInput = (
  slug: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" = "PUBLISHED",
  type: "NEWS" | "ANNOUNCEMENT" | "DISCIPLINE" = "NEWS",
) => ({
  type,
  slug,
  title: `测试内容 ${slug}`,
  summary: `数据库内容摘要 ${slug}`,
  content: doc(`正文 ${slug}`),
  source: "NUAAFA R1",
  status,
  pinned: false,
  featured: false,
});

async function main() {
  const databasePath = process.env.UNIFIED_ADMIN_R1_DATABASE_PATH;
  const uploadRoot = process.env.NUAAFA_UPLOAD_DIR;
  if (!databasePath || !uploadRoot) throw new Error("R1 isolated paths are required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;
  process.env.REFEREE_ADMIN_SESSION_SECRET = "unified-admin-r1-session-secret-2026";
  await applyMigrations(url);

  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const { hashPassword } = await import("../src/lib/referee-security");
  const credentials = await import("../src/lib/referee-credentials");
  const rbac = await import("../src/lib/unified-admin-rbac");
  const contentInputModule = await import("../src/lib/admin-content-input");
  const content = await import("../src/lib/admin-content-service");
  const media = await import("../src/lib/admin-media-service");
  const auth = await import("../src/lib/referee-auth");
  const backup = await import("../src/lib/backup-manifest");
  const { prisma } = await import("../src/lib/prisma");

  try {
    const passwordHash = await hashPassword("Unified-R1-Password-2026!");
    const accounts = await Promise.all([
      verifier.adminAccount.create({ data: { username: "r1-super", displayName: "超级管理员", passwordHash, role: "SUPER_ADMIN" } }),
      verifier.adminAccount.create({ data: { username: "r1-content", displayName: "内容编辑", passwordHash, role: "REFEREE_MANAGER" } }),
      verifier.adminAccount.create({ data: { username: "r1-competition", displayName: "赛事管理员", passwordHash, role: "REFEREE_MANAGER" } }),
      verifier.adminAccount.create({ data: { username: "r1-referee", displayName: "裁判管理员", passwordHash, role: "REFEREE_MANAGER" } }),
    ]);
    const [, contentAccount, competitionAccount, refereeAccount] = accounts;
    await verifier.adminRoleAssignment.createMany({ data: [
      { adminAccountId: contentAccount.id, role: "CONTENT_EDITOR" },
      { adminAccountId: competitionAccount.id, role: "COMPETITION_ADMIN" },
      { adminAccountId: refereeAccount.id, role: "REFEREE_ADMIN" },
    ] });
    assert((await credentials.authenticateAdminCredentials("r1-content", "Unified-R1-Password-2026!"))?.id === contentAccount.id, "AdminAccount authentication was not reused.");
    assert(auth.getSafeAdminReturnTo("/admin/content/news") === "/admin/content/news", "Safe admin return path was rejected.");
    assert(auth.getSafeAdminReturnTo("//evil.example") === "/admin", "Protocol-relative return path was accepted.");

    const expected: Record<string, string[]> = {
      SUPER_ADMIN: [...rbac.allUnifiedAdminPermissions],
      CONTENT_EDITOR: ["dashboard:read", "content:read", "content:write", "media:read", "media:write"],
      COMPETITION_ADMIN: ["dashboard:read", "competitions:read", "competitions:write"],
      REFEREE_ADMIN: ["dashboard:read", "referees:read", "referees:write"],
    };
    for (const [role, permissions] of Object.entries(expected)) {
      for (const permission of rbac.allUnifiedAdminPermissions) {
        assert(
          rbac.hasUnifiedAdminPermission([role as keyof typeof rbac.unifiedAdminPermissionsByRole], permission) === permissions.includes(permission),
          `RBAC matrix mismatch for ${role}/${permission}.`,
        );
      }
    }
    assert(rbac.resolveUnifiedAdminRoles({ explicitRoles: [], isLegacy: true }).join() === "SUPER_ADMIN", "Legacy env admin lost SUPER_ADMIN compatibility.");
    assert(rbac.resolveUnifiedAdminRoles({ explicitRoles: [], legacyRole: "REFEREE_MANAGER" }).join() === "REFEREE_ADMIN", "Legacy referee role fallback failed.");
    assert(rbac.resolveUnifiedAdminRoles({ explicitRoles: ["CONTENT_EDITOR"], legacyRole: "REFEREE_MANAGER" }).join() === "CONTENT_EDITOR", "Explicit assignment did not override legacy role.");
    const union = rbac.resolveUnifiedAdminRoles({ explicitRoles: ["CONTENT_EDITOR", "REFEREE_ADMIN", "CONTENT_EDITOR"] });
    assert(union.length === 2 && rbac.hasUnifiedAdminPermission(union, "content:write") && rbac.hasUnifiedAdminPermission(union, "referees:write"), "Multi-role union failed.");

    const contentActor: UnifiedAdminActor = { id: contentAccount.id, displayName: contentAccount.displayName, isLegacy: false, roles: ["CONTENT_EDITOR"] };
    const refereeActor: UnifiedAdminActor = { id: refereeAccount.id, displayName: refereeAccount.displayName, isLegacy: false, roles: ["REFEREE_ADMIN"] };
    const workflow = await content.createContentPost(contentInput("workflow-proof", "DRAFT"), contentActor);
    assert((await content.getPublishedContentPage({})).items.every((item) => item.slug !== workflow.slug), "DRAFT leaked to public DTO.");
    await content.updateContentPost(workflow.id, { ...contentInput("workflow-proof", "DRAFT"), title: "编辑后的草稿" }, contentActor);
    await content.updateContentPost(workflow.id, { ...contentInput("workflow-proof", "PUBLISHED"), title: "已发布新闻" }, contentActor);
    const publishedWorkflow = (await content.getPublishedContentPage({})).items.find((item) => item.slug === workflow.slug);
    assert(publishedWorkflow && !("authorAdmin" in publishedWorkflow) && !("authorAdminId" in publishedWorkflow), "Public DTO leaked admin fields.");
    await content.updateContentPost(workflow.id, { ...contentInput("workflow-proof", "ARCHIVED"), title: "已归档新闻" }, contentActor);
    assert((await content.getPublishedContentPage({})).items.every((item) => item.slug !== workflow.slug), "ARCHIVED leaked to public DTO.");

    const future = await content.createContentPost(contentInput("future-news"), contentActor);
    await verifier.contentPost.update({ where: { id: future.id }, data: { publishedAt: new Date("2030-01-01T00:00:00.000Z") } });
    assert((await content.getPublishedContentPage({ now: new Date("2029-01-01T00:00:00.000Z") })).items.every((item) => item.slug !== future.slug), "Future content leaked to public DTO.");

    let invalidEnvelope = false;
    try {
      contentInputModule.readContentPostInput({ ...contentInput("invalid-json"), content: { type: "doc", content: [] } });
    } catch { invalidEnvelope = true; }
    assert(invalidEnvelope, "Invalid JSON envelope was accepted.");
    let invalidSlug = false;
    try { await content.createContentPost({ ...contentInput("valid-slug"), slug: "Invalid Slug" }, contentActor); } catch { invalidSlug = true; }
    assert(invalidSlug, "Invalid slug was accepted.");
    await content.createContentPost(contentInput("duplicate-slug"), contentActor);
    let duplicateSlug = false;
    try { await content.createContentPost(contentInput("duplicate-slug"), contentActor); } catch (error) { duplicateSlug = error instanceof Error && error.message.includes("Slug"); }
    assert(duplicateSlug, "Duplicate slug was accepted.");

    let refereeContentDenied = false;
    try { await content.createContentPost(contentInput("forbidden-referee"), refereeActor); } catch (error) { refereeContentDenied = error instanceof rbac.UnifiedAdminAccessError && error.status === 403; }
    assert(refereeContentDenied, "Content service did not enforce RBAC.");

    const baseTime = Date.parse("2026-08-01T00:00:00.000Z");
    for (let index = 1; index <= 25; index += 1) {
      const post = await content.createContentPost(contentInput(`paged-${String(index).padStart(2, "0")}`, "PUBLISHED", "ANNOUNCEMENT"), contentActor);
      await verifier.contentPost.update({ where: { id: post.id }, data: { publishedAt: new Date(baseTime + index * 1_000) } });
    }
    const cursorPages = [];
    let cursor: string | undefined;
    do {
      const page = await content.getPublishedContentPage({ cursor, type: "ANNOUNCEMENT", now: new Date("2026-09-01T00:00:00.000Z"), pageSize: 10 });
      cursorPages.push(page);
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    const cursorItems = cursorPages.flatMap((page) => page.items);
    assert(cursorPages.map((page) => page.items.length).join() === "10,10,5", "Cursor pagination page sizes are incorrect.");
    assert(new Set(cursorItems.map((item) => item.slug)).size === 25, "Cursor pagination has duplicates or omissions.");
    assert(cursorItems[0]?.slug === "paged-25" && cursorItems.at(-1)?.slug === "paged-01", "Cursor pagination ordering is unstable.");
    const adminPage3 = await content.getAdminContentPage({ actor: contentActor, page: 3, type: "ANNOUNCEMENT" });
    assert(adminPage3.total === 25 && adminPage3.items.length === 5, "Admin count/skip/take pagination is incorrect.");

    const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\nNUAAFA R1\n%%EOF");
    const publicImage = await media.storeMediaAssetUpload({ fileName: "../../proof.png", mimeType: "image/png", bytes: pngBytes, altText: "公开图片", visibility: "PUBLIC", actor: contentActor });
    const privatePdf = await media.storeMediaAssetUpload({ fileName: "decision.pdf", mimeType: "application/pdf", bytes: pdfBytes, visibility: "PRIVATE", actor: contentActor });
    assert(publicImage.originalFilename === "proof.png" && publicImage.visibility === "PUBLIC" && privatePdf.visibility === "PRIVATE", "Media normalization or visibility failed.");
    assert((await media.readMediaAssetFile(publicImage.id, null)).bytes.length === pngBytes.length, "Anonymous PUBLIC read failed.");
    let privateAnonymousDenied = false;
    try { await media.readMediaAssetFile(privatePdf.id, null); } catch (error) { privateAnonymousDenied = error instanceof rbac.UnifiedAdminAccessError && error.status === 401; }
    assert(privateAnonymousDenied, "Anonymous PRIVATE read was allowed.");
    let privateWrongRoleDenied = false;
    try { await media.readMediaAssetFile(privatePdf.id, refereeActor); } catch (error) { privateWrongRoleDenied = error instanceof rbac.UnifiedAdminAccessError && error.status === 403; }
    assert(privateWrongRoleDenied, "Wrong-role PRIVATE read was allowed.");
    assert((await media.readMediaAssetFile(privatePdf.id, contentActor)).bytes.length === pdfBytes.length, "Authorized PRIVATE read failed.");

    const competition = await verifier.competition.create({ data: { slug: "discipline-test", name: "纪律测试赛事", campus: "天目湖校区", format: "ELEVEN_A_SIDE", status: "ONGOING" } });
    const disciplineDraft = await content.createContentPost({
      ...contentInput("discipline-proof", "DRAFT", "DISCIPLINE"),
      discipline: { competitionId: competition.id, officialMediaId: privatePdf.id, versionLabel: "正式决定", scopeLabel: "测试赛事" },
    }, contentActor);
    let nonPdfRejected = false;
    try { await content.updateContentPost(disciplineDraft.id, { ...contentInput("discipline-proof", "PUBLISHED", "DISCIPLINE"), discipline: { officialMediaId: publicImage.id } }, contentActor); } catch { nonPdfRejected = true; }
    assert(nonPdfRejected, "Non-PDF discipline media was accepted.");
    let privatePdfRejected = false;
    try { await content.updateContentPost(disciplineDraft.id, { ...contentInput("discipline-proof", "PUBLISHED", "DISCIPLINE"), discipline: { officialMediaId: privatePdf.id } }, contentActor); } catch { privatePdfRejected = true; }
    assert(privatePdfRejected, "PRIVATE discipline PDF was published.");
    await verifier.mediaAsset.update({ where: { id: privatePdf.id }, data: { visibility: "PUBLIC" } });
    await content.updateContentPost(disciplineDraft.id, { ...contentInput("discipline-proof", "PUBLISHED", "DISCIPLINE"), discipline: { competitionId: competition.id, officialMediaId: privatePdf.id, versionLabel: "正式决定", scopeLabel: "测试赛事" } }, contentActor);
    await verifier.competition.delete({ where: { id: competition.id } });
    assert((await verifier.disciplineDetail.findUniqueOrThrow({ where: { contentPostId: disciplineDraft.id } })).competitionId === null, "Competition onDelete SetNull failed.");
    let mediaRestrict = false;
    try { await verifier.mediaAsset.delete({ where: { id: privatePdf.id } }); } catch { mediaRestrict = true; }
    assert(mediaRestrict, "Referenced official media was not protected by Restrict.");

    for (const invalid of [
      { fileName: "wrong.jpg", mimeType: "image/png", bytes: pngBytes },
      { fileName: "fake.pdf", mimeType: "application/pdf", bytes: new TextEncoder().encode("not-pdf") },
    ]) {
      let rejected = false;
      try { await media.storeMediaAssetUpload({ ...invalid, visibility: "PRIVATE", actor: contentActor }); } catch { rejected = true; }
      assert(rejected, "Invalid extension/signature upload was accepted.");
    }
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
    oversized.set(pngBytes.subarray(0, 8));
    let oversizedRejected = false;
    try { await media.storeMediaAssetUpload({ fileName: "large.png", mimeType: "image/png", bytes: oversized, visibility: "PRIVATE", actor: contentActor }); } catch { oversizedRejected = true; }
    assert(oversizedRejected, "Oversized upload was accepted.");

    const beforeFailureFiles = await countFiles(uploadRoot);
    let dbFailure = false;
    try {
      await media.storeMediaAssetUpload({ fileName: "orphan.png", mimeType: "image/png", bytes: pngBytes, visibility: "PRIVATE", actor: { ...contentActor, id: "missing-admin" } });
    } catch { dbFailure = true; }
    assert(dbFailure && await countFiles(uploadRoot) === beforeFailureFiles, "DB failure left an orphan upload.");

    const missingAsset = await media.storeMediaAssetUpload({ fileName: "missing.png", mimeType: "image/png", bytes: pngBytes, visibility: "PRIVATE", actor: contentActor });
    const missingRow = await verifier.mediaAsset.findUniqueOrThrow({ where: { id: missingAsset.id }, select: { storageKey: true } });
    await rm(path.join(uploadRoot, ...missingRow.storageKey.split("/")), { force: true });
    let missingDetected = false;
    try { await media.readMediaAssetFile(missingAsset.id, contentActor); } catch (error) { missingDetected = error instanceof Error && error.message.includes("缺失"); }
    assert(missingDetected, "Missing media file was not detected.");
    assert((await stat(uploadRoot)).isDirectory() && !path.resolve(uploadRoot).startsWith(path.resolve(process.cwd())), "Upload root is not isolated from the repository.");
    const savedUploadRoot = process.env.NUAAFA_UPLOAD_DIR;
    delete process.env.NUAAFA_UPLOAD_DIR;
    let failClosed = false;
    try { media.getMediaUploadRoot(); } catch { failClosed = true; }
    process.env.NUAAFA_UPLOAD_DIR = savedUploadRoot;
    assert(failClosed, "Missing NUAAFA_UPLOAD_DIR did not fail closed.");

    const manifest = backup.createBackupManifest({
      applicationSha: "09e8222c5e02193d38e9a0348385bd0987596168",
      schema: { migrations: ["20260823091228_unified_admin_r1_foundation"] },
      database: { snapshot: "db.sqlite", bytes: 123 },
      uploads: { fileCount: await countFiles(uploadRoot), totalBytes: 456, mediaAssetCount: await verifier.mediaAsset.count() },
      checksums: { "db.sqlite": "a".repeat(64) },
      generatedAt: new Date("2026-08-23T00:00:00.000Z"),
    });
    assert(manifest.formatVersion === 1 && manifest.schema.migrations.length === 1, "Backup manifest contract failed.");

    console.log(JSON.stringify({
      fullRolePermissionMatrix: true,
      legacyAndExplicitRoleCompatibility: true,
      multiRoleUnion: true,
      structuredJsonValidation: true,
      contentDraftPublishArchiveAndPublicDto: true,
      stableCursorPagination: { pageSizes: cursorPages.map((page) => page.items.length), total: cursorItems.length },
      disciplineInvariantsAndForeignKeys: true,
      publicPrivateMediaAuthorization: true,
      uploadValidationAndAtomicCleanup: true,
      missingFileDetection: true,
      externalFailClosedStorage: true,
      backupManifestContract: true,
      auditLogCount: await verifier.auditLog.count(),
    }, null, 2));
  } finally {
    await verifier.$disconnect();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Unified Admin R1 worker failed.");
  process.exit(1);
});
