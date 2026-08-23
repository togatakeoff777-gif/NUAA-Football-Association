export const backupManifestFormatVersion = 1;

export type BackupManifest = {
  formatVersion: 1;
  generatedAt: string;
  applicationSha: string;
  schema: { migrations: string[] };
  database: { snapshot: string; bytes: number };
  uploads: { fileCount: number; totalBytes: number; mediaAssetCount: number };
  checksums: Record<string, string>;
};

export function createBackupManifest(input: Omit<BackupManifest, "formatVersion" | "generatedAt"> & { generatedAt?: Date }): BackupManifest {
  if (!/^[0-9a-f]{7,40}$/i.test(input.applicationSha)) {
    throw new Error("Backup manifest application SHA is invalid.");
  }
  if (!input.database.snapshot || input.database.bytes < 0) {
    throw new Error("Backup manifest database snapshot is invalid.");
  }
  if (
    input.uploads.fileCount < 0 ||
    input.uploads.totalBytes < 0 ||
    input.uploads.mediaAssetCount < 0
  ) {
    throw new Error("Backup manifest upload counters are invalid.");
  }
  for (const [name, checksum] of Object.entries(input.checksums)) {
    if (!name || !/^[0-9a-f]{64}$/i.test(checksum)) {
      throw new Error("Backup manifest checksum is invalid.");
    }
  }
  return {
    formatVersion: backupManifestFormatVersion,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    applicationSha: input.applicationSha,
    schema: { migrations: [...input.schema.migrations] },
    database: { ...input.database },
    uploads: { ...input.uploads },
    checksums: { ...input.checksums },
  };
}
