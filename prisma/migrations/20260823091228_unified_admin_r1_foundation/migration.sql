-- CreateTable
CREATE TABLE "AdminRoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminAccountId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminRoleAssignment_adminAccountId_fkey" FOREIGN KEY ("adminAccountId") REFERENCES "AdminAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "altText" TEXT,
    "metadata" JSONB,
    "uploadedByAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaAsset_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'NEWS',
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "coverMediaId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "authorAdminId" TEXT,
    "source" TEXT,
    "publishedAt" DATETIME,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentPost_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "MediaAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentPost_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DisciplineDetail" (
    "contentPostId" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT,
    "officialMediaId" TEXT,
    "versionLabel" TEXT,
    "scopeLabel" TEXT,
    CONSTRAINT "DisciplineDetail_contentPostId_fkey" FOREIGN KEY ("contentPostId") REFERENCES "ContentPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DisciplineDetail_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DisciplineDetail_officialMediaId_fkey" FOREIGN KEY ("officialMediaId") REFERENCES "MediaAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdminRoleAssignment_role_idx" ON "AdminRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRoleAssignment_adminAccountId_role_key" ON "AdminRoleAssignment"("adminAccountId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storedFilename_key" ON "MediaAsset"("storedFilename");

-- CreateIndex
CREATE INDEX "MediaAsset_visibility_createdAt_idx" ON "MediaAsset"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_mimeType_createdAt_idx" ON "MediaAsset"("mimeType", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedByAdminId_idx" ON "MediaAsset"("uploadedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPost_slug_key" ON "ContentPost"("slug");

-- CreateIndex
CREATE INDEX "ContentPost_status_type_publishedAt_idx" ON "ContentPost"("status", "type", "publishedAt");

-- CreateIndex
CREATE INDEX "ContentPost_status_pinned_publishedAt_idx" ON "ContentPost"("status", "pinned", "publishedAt");

-- CreateIndex
CREATE INDEX "ContentPost_authorAdminId_idx" ON "ContentPost"("authorAdminId");

-- CreateIndex
CREATE INDEX "ContentPost_coverMediaId_idx" ON "ContentPost"("coverMediaId");

-- CreateIndex
CREATE INDEX "DisciplineDetail_competitionId_idx" ON "DisciplineDetail"("competitionId");

-- CreateIndex
CREATE INDEX "DisciplineDetail_officialMediaId_idx" ON "DisciplineDetail"("officialMediaId");

-- Backfill the legacy single-role model into the unified multi-role model.
-- Deterministic primary keys plus the unique account/role key make this idempotent.
INSERT OR IGNORE INTO "AdminRoleAssignment" ("id", "adminAccountId", "role", "createdAt")
SELECT
    'r1-role-' || "id" || '-' || lower("role"),
    "id",
    CASE "role"
        WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
        WHEN 'REFEREE_MANAGER' THEN 'REFEREE_ADMIN'
    END,
    CURRENT_TIMESTAMP
FROM "AdminAccount"
WHERE "role" IN ('SUPER_ADMIN', 'REFEREE_MANAGER');

-- Record one non-sensitive, idempotent audit entry per migrated account.
INSERT OR IGNORE INTO "AuditLog" (
    "id", "actorType", "actorId", "action", "entityType", "entityId", "summary", "metadata", "createdAt"
)
SELECT
    'r1-role-backfill-' || "id",
    'SYSTEM',
    NULL,
    'UNIFIED_ADMIN_ROLE_BACKFILL',
    'AdminAccount',
    "id",
    'Unified Admin compatibility role backfill',
    '{"legacyRole":"' || "role" || '","unifiedRole":"' ||
        CASE "role"
            WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
            WHEN 'REFEREE_MANAGER' THEN 'REFEREE_ADMIN'
        END || '"}',
    CURRENT_TIMESTAMP
FROM "AdminAccount"
WHERE "role" IN ('SUPER_ADMIN', 'REFEREE_MANAGER');
