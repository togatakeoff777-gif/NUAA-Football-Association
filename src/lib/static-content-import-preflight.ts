import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";

import {
  expectedImportedMediaKeys,
  resolveStaticMediaSourcePath,
  validateStaticManifestEntries,
  type StaticContentManifest,
} from "@/lib/static-content-migration";

const requiredTables = ["_prisma_migrations", "ContentPost", "MediaAsset", "DisciplineDetail"] as const;

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function productionDatabasePath(databaseUrl: string | undefined) {
  if (!databaseUrl?.startsWith("file:")) throw new Error("Production import requires an explicit file: DATABASE_URL.");
  const raw = databaseUrl.slice("file:".length);
  if (!raw || raw.includes("?") || raw.includes("#")) throw new Error("Production DATABASE_URL must identify one plain SQLite file.");
  const normalized = raw.replaceAll("/", path.sep);
  if (!path.isAbsolute(normalized)) throw new Error("Production DATABASE_URL must use an absolute SQLite path.");
  return path.normalize(normalized);
}

async function expectedMigrationNames() {
  return (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d+_[0-9A-Za-z_-]+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function validateManifestInventory(manifest: StaticContentManifest) {
  if (manifest.formatVersion !== 1 || !manifest.entries.length || !manifest.media.length) {
    throw new Error("Static content manifest is empty or uses an unsupported format.");
  }
  const entryIssues = validateStaticManifestEntries(manifest.entries);
  const blockingIssues = [...manifest.issues, ...entryIssues].filter((issue) => issue.severity === "error");
  if (blockingIssues.length) throw new Error(`Static content inventory contains ${blockingIssues.length} blocking issue(s).`);

  const references = new Set(manifest.entries.flatMap((entry) => [
    entry.cover?.path,
    ...entry.attachments.map((attachment) => attachment.path),
  ]).filter((item): item is string => Boolean(item)));
  const mediaPaths = manifest.media.map((media) => media.path);
  if (new Set(mediaPaths).size !== mediaPaths.length) throw new Error("Static content media inventory contains duplicate paths.");
  if (
    [...references].sort().join("\n") !== [...mediaPaths].sort().join("\n") ||
    manifest.entries.some((entry) => !entry.contentHash || !/^[0-9a-f]{64}$/i.test(entry.contentHash))
  ) {
    throw new Error("Static content references do not reconcile with the exact media inventory.");
  }
  for (const media of manifest.media) {
    if (!Number.isSafeInteger(media.bytes) || media.bytes < 1 || !/^[0-9a-f]{64}$/i.test(media.sha256)) {
      throw new Error("Static content media inventory metadata is invalid.");
    }
    const bytes = await readFile(resolveStaticMediaSourcePath(media.path));
    if (bytes.length !== media.bytes || sha256(bytes) !== media.sha256) {
      throw new Error(`Static content media inventory changed after manifest creation: ${media.path}`);
    }
  }
  return { entries: manifest.entries.length, media: manifest.media.length, blockingIssues: 0 };
}

export async function assertProductionStaticContentPreflight(manifest: StaticContentManifest) {
  const inventory = await validateManifestInventory(manifest);
  const databasePath = productionDatabasePath(process.env.DATABASE_URL);
  const databaseInfo = await lstat(databasePath);
  if (!databaseInfo.isFile() || databaseInfo.isSymbolicLink()) {
    throw new Error("Production import database must be an existing real SQLite file.");
  }

  const configuredUploadRoot = process.env.NUAAFA_UPLOAD_DIR?.trim();
  if (!configuredUploadRoot || !path.isAbsolute(configuredUploadRoot)) {
    throw new Error("Production import requires an absolute NUAAFA_UPLOAD_DIR.");
  }
  const uploadRoot = path.resolve(configuredUploadRoot);
  const uploadInfo = await lstat(uploadRoot);
  if (!uploadInfo.isDirectory() || uploadInfo.isSymbolicLink()) {
    throw new Error("Production import upload root must be an existing real directory.");
  }
  await access(uploadRoot, constants.R_OK | constants.W_OK);

  const client = createClient({ url: `file:${databasePath.replaceAll("\\", "/")}` });
  try {
    const integrity = await client.execute("PRAGMA integrity_check");
    if (integrity.rows.length !== 1 || String(integrity.rows[0]?.integrity_check).toLowerCase() !== "ok") {
      throw new Error("Production import database integrity check failed.");
    }
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    if (foreignKeys.rows.length) throw new Error("Production import database foreign key check failed.");

    const tableRows = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
    const tables = new Set(tableRows.rows.map((row) => String(row.name)));
    const missingTables = requiredTables.filter((table) => !tables.has(table));
    if (missingTables.length) throw new Error(`Production import schema is missing required tables: ${missingTables.join(", ")}.`);

    const migrationRows = await client.execute(
      'SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations"',
    );
    if (migrationRows.rows.some((row) => row.finished_at === null || row.rolled_back_at !== null)) {
      throw new Error("Production import migration history contains unfinished or rolled-back entries.");
    }
    const appliedMigrations = migrationRows.rows.map((row) => String(row.migration_name)).sort();
    const expectedMigrations = await expectedMigrationNames();
    if (
      new Set(appliedMigrations).size !== appliedMigrations.length ||
      appliedMigrations.join("\n") !== expectedMigrations.join("\n")
    ) {
      throw new Error("Production import migration inventory does not match this release.");
    }

    const duplicateSlugs = await client.execute(
      'SELECT "slug", COUNT(*) AS "count" FROM "ContentPost" GROUP BY "slug" HAVING COUNT(*) > 1',
    );
    if (duplicateSlugs.rows.length) throw new Error("Production import found ambiguous existing content slugs.");

    const expectedMediaKeys = expectedImportedMediaKeys(manifest);
    const uniqueStorageKeys = new Set(expectedMediaKeys.values());
    if (expectedMediaKeys.size !== manifest.media.length || uniqueStorageKeys.size !== manifest.media.length) {
      throw new Error("Production import media inventory does not map one-to-one to storage keys.");
    }
    const mediaRows = await client.execute('SELECT "storageKey", "metadata" FROM "MediaAsset"');
    const mediaByStorageKey = new Map(mediaRows.rows.map((row) => [String(row.storageKey), row]));
    let existingExactMedia = 0;
    for (const media of manifest.media) {
      const storageKey = expectedMediaKeys.get(media.path);
      if (!storageKey) throw new Error(`Production import media storage key is unavailable: ${media.path}`);
      const row = mediaByStorageKey.get(storageKey);
      const target = path.resolve(uploadRoot, ...storageKey.split("/"));
      if (!target.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Production import generated an unsafe managed-media path.");
      let targetBytes: Buffer | null = null;
      try {
        const info = await lstat(target);
        if (!info.isFile() || info.isSymbolicLink()) throw new Error("Production import media target must be a real regular file.");
        targetBytes = await readFile(target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (Boolean(row) !== Boolean(targetBytes)) {
        throw new Error("Production import found an existing media row/file collision or mismatch.");
      }
      if (row && targetBytes) {
        let metadata: unknown = row.metadata;
        if (typeof metadata === "string") {
          try { metadata = JSON.parse(metadata); }
          catch { throw new Error("Production import found invalid existing media metadata."); }
        }
        const metadataHash = typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) && "sha256" in metadata
          ? metadata.sha256
          : null;
        if (targetBytes.length !== media.bytes || sha256(targetBytes) !== media.sha256 || metadataHash !== media.sha256) {
          throw new Error("Production import existing media does not match the source inventory.");
        }
        existingExactMedia += 1;
      }
    }

    const manifestSlugs = manifest.entries.map((entry) => entry.slug);
    const existingPosts = await client.execute({
      sql: `SELECT COUNT(*) AS "count" FROM "ContentPost" WHERE "slug" IN (${manifestSlugs.map(() => "?").join(", ")})`,
      args: manifestSlugs,
    });

    return {
      ready: true as const,
      database: { integrityCheck: "ok" as const, foreignKeyViolations: 0, requiredTables: [...requiredTables] },
      migrations: { applied: appliedMigrations.length, expected: expectedMigrations.length, exactMatch: true as const },
      inventory,
      dryRunPlan: {
        existingContent: Number(existingPosts.rows[0]?.count ?? 0),
        contentToCreateOrUpdate: manifest.entries.length,
        existingExactMedia,
        mediaToCreate: manifest.media.length - existingExactMedia,
      },
      uploadRoot: { absolute: true as const, realDirectory: true as const, readWrite: true as const },
    };
  } finally {
    client.close();
  }
}
