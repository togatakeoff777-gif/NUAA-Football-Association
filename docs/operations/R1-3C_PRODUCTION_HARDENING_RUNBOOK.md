# R1-3C Production Hardening and R1-3D Provisioning Runbook

Status: R1-3C preparation only. **Do not execute R1-3D without explicit human production approval.**

This runbook preserves the frozen R1-2, R1-3A, and R1-3B behavior. It introduces no schema migration and no business feature. As of R1-3C, production still uses the prior content source and has no Unified Admin migration, upload directory, combined backup timer, environment switch, deployment, push, or merge from this branch.

## Frozen production upload contract

The R1-3D production values are fixed:

```text
Path:        /srv/nuaafa/shared/uploads
Owner:       nuaafa
Group:       nuaafa
Mode:        0700
Environment: NUAAFA_UPLOAD_DIR=/srv/nuaafa/shared/uploads
```

Do not substitute `0750`, `0755`, `0770`, or `0777`. Historical documents that mention a different suggested mode are superseded by this frozen contract.

## Production environment contract

No real value for any secret belongs in Git, this document, shell history, systemd unit text, or logs.

| Variable | Requirement | Secret | Filesystem path | Purpose |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required | No credentials for local SQLite, but operationally sensitive | Yes | Absolute production SQLite `file:` URL |
| `NUAAFA_UPLOAD_DIR` | Required | No | Yes | Must equal `/srv/nuaafa/shared/uploads` |
| `REFEREE_ADMIN_SESSION_SECRET` | Required | Yes | No | Independent admin session secret, at least 32 characters |
| `REFEREE_MEMBER_SESSION_SECRET` | Required | Yes | No | Independent referee-member session secret, at least 32 characters |
| `REFEREE_ADMIN_PASSWORD_HASH` | Transitional/required while legacy admin auth remains enabled | Yes | No | Password hash only; never plaintext |
| `NUAAFA_CONTENT_SOURCE` | Required at enablement | No | No | Remains current source until the controlled database switch step |
| `APP_BASE_URL` | Required | No | No | Canonical HTTPS application origin |
| `NUAAFA_BACKUP_ROOT` | Required for backup automation | No | Yes | Combined backups only: `/srv/nuaafa/shared/backups/unified` |
| `NUAAFA_BACKUP_RETENTION_COUNT` | Required before retention use | No | No | Configurable count; recommended starting value 14 is not business-approved |
| `NUAAFA_DISK_WARNING_PERCENT` | Optional | No | No | Configurable free-space warning; recommended 20 |
| `NUAAFA_DISK_CRITICAL_PERCENT` | Optional | No | No | Configurable free-space critical; recommended 10 and lower than warning |
| `NUAAFA_UPLOAD_MIN_FREE_BYTES` | Optional | No | No | Upload provisioning free-space floor |
| `NUAAFA_STALE_STAGING_AGE_MS` | Optional | No | No | Orphan monitor stale staging threshold; default one hour |
| `HEALTHCHECK_ORIGIN` | Optional | No | No | Local health-check origin |
| `NUAAFA_RESTORE_ISOLATED` | Rehearsal only | No | No | Must be `1` for isolated restore CLI |
| `NUAAFA_RESTORE_TARGET_ROOT` | Rehearsal only | No | Yes | Absolute allowlisted isolated restore root |
| `NUAAFA_RETENTION_APPLY` | Explicit cleanup only | No | No | Must be `1` together with `--apply`; never set in the dry-run unit |
| `NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY` | One-shot content import apply only | No | No | Must be `1` together with `--production --apply`; never reuse `NUAAFA_STATIC_IMPORT_ISOLATED` |

The production environment file is `/srv/nuaafa/shared/.env.production`. Preserve its existing protected ownership/mode, never print its contents, and capture it with metadata before enablement. The supplied systemd templates reference the file but contain no value.

## Unified backup

The existing `backup:unified` architecture remains authoritative; `db:backup` is not sufficient for R1-3D restore points.

The combined-backup and combined-retention root is frozen to `/srv/nuaafa/shared/backups/unified`. The parent `/srv/nuaafa/shared/backups` also contains existing DB-only `daily` and `weekly` material; combined retention must never scan that parent. This Fix-2 does not move, delete, or relabel any existing DB-only backup.

### FINAL PRE-ENABLEMENT legacy bridge

The reviewed bridge is explicit. It is never inferred from missing tables. Before Unified Admin migration and before the managed upload directory exists, the future authorized Phase B command is:

```bash
sudo -u nuaafa -H env \
  DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
  NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
  NUAAFA_BACKUP_ROOT='/srv/nuaafa/shared/backups/unified' \
  npm run backup:unified -- \
    --root=/srv/nuaafa/shared/backups/unified \
    --profile=legacy-pre-enablement
```

`NUAAFA_UPLOAD_DIR` identifies the future managed location and may be absent only in this explicit profile. The v4 legacy manifest records `LEGACY_PRE_ENABLEMENT`, the reviewed first-three-migration inventory, present and expected-absent protected tables, and managed uploads as `ABSENT` or `PRESENT_EMPTY`. It records no invented media or files. Unexpected migration/table capability, a non-empty upload root, or any database failure stops the backup.

Verify the exact generated directory before any migration:

```bash
npm run backup:verify -- \
  --backup=/srv/nuaafa/shared/backups/unified/EXACT_FINAL_PRE_ENABLEMENT_DIRECTORY
```

Record backup directory, backup ID, UTC start/end, application SHA, schema profile, migration inventory, manifest SHA-256, completion marker, protected counts, and operator. The normal modern v3 path remains the default and must omit `--profile`; it still requires the complete Unified schema and real managed upload root.

Future creation command:

```bash
sudo -u nuaafa -H env \
  DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
  NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
  NUAAFA_BACKUP_ROOT='/srv/nuaafa/shared/backups/unified' \
  npm run backup:unified -- --root=/srv/nuaafa/shared/backups/unified
```

The command:

1. validates an explicit SQLite file and real upload directory;
2. checks estimated free space before writing;
3. creates a SQLite snapshot with `VACUUM INTO`;
4. reads `MediaAsset` keys from that snapshot;
5. reconciles the immutable upload files exactly and rejects missing, orphaned, invalid, or symlink entries;
6. copies uploads and records per-file size and SHA-256;
7. writes the manifest with a unique backup ID, timestamp, Git SHA, migration list, DB artifact, uploads, counts, sizes, and checksums;
8. writes `COMPLETED.json` last through an atomic rename, binding the manifest SHA-256 and backup ID.

An upload concurrent with the snapshot is either represented by the DB snapshot and copied, excluded from both, or causes reconciliation to fail. Any failure before the final marker leaves an incomplete directory that restore and retention refuse to treat as valid.

Verification:

```bash
npm run backup:verify -- --backup=/srv/nuaafa/shared/backups/unified/EXACT_BACKUP_DIRECTORY
```

Verification checks the completion marker, manifest schema, manifest hash binding, exact checksum coverage, safe paths, regular files only, exact uploads tree, artifact sizes, SQLite `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, and protected table counts.

The **FINAL PRE-ENABLEMENT BACKUP** in R1-3D must record an unambiguous directory, backup ID, application SHA, completion marker, manifest checksum, start/end time, and operator. Do not proceed to enablement until `backup:verify` passes.

An isolated restore of a legacy bundle creates a fresh empty managed-upload destination while retaining `ABSENT` or `PRESENT_EMPTY` as source capability evidence. It does not invent `MediaAsset` rows. Completion binding, artifact checksum/size, SQLite integrity/FK, reviewed schema capability, migration inventory, and existing protected-table counts remain mandatory.

## Backup failure behavior

- DB snapshot succeeds and upload packaging fails: no final marker; restore rejects it.
- Uploads are copied and manifest/checksum or marker publication fails: no final marker; restore rejects it.
- Reconciliation, checksum, manifest, path, symlink, or SQLite integrity check fails: non-zero exit; no READY result.
- Incomplete directories remain visible for diagnosis but are never valid backup candidates.
- No backup command performs retention deletion.

## Retention

Retention creation and retention deletion are separate operations.

Dry run is the default:

```bash
NUAAFA_BACKUP_ROOT=/srv/nuaafa/shared/backups/unified \
NUAAFA_BACKUP_RETENTION_COUNT=14 \
npm run backup:retention -- --root=/srv/nuaafa/shared/backups/unified --keep=14
```

The value 14 remains a **PROPOSED** production recommendation, not an approved business policy. Human approval must confirm it against measured production size and recovery requirements before any apply or timer installation.

Retention behavior:

- only immediate child directories under the explicit absolute backup root are considered;
- only manifest/checksum/completion-backed backups are candidates;
- newest backups are kept by manifest timestamp;
- malformed, incomplete, symlink, unknown directory, and unrelated file entries are reported and never deleted;
- symlinks are not followed;
- any anomaly blocks an apply run;
- active/incomplete backup directories are not candidates.

An actual apply is a separate, explicitly authorized operation:

```bash
NUAAFA_RETENTION_APPLY=1 npm run backup:retention -- \
  --root=/srv/nuaafa/shared/backups/unified --keep=APPROVED_COUNT --apply
```

Do not schedule the apply command until R1-3D has reviewed a dry-run report and approved the count. The supplied systemd retention unit is intentionally dry-run only.

## Capacity planning and disk preflight

Run:

```bash
DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
NUAAFA_BACKUP_ROOT='/srv/nuaafa/shared/backups/unified' \
NUAAFA_BACKUP_RETENTION_COUNT=14 \
NUAAFA_DISK_WARNING_PERCENT=20 \
NUAAFA_DISK_CRITICAL_PERCENT=10 \
npm run backup:capacity
```

The calculator is parameterized and does not invent production data. Its formula includes:

```text
current dataset       = current DB bytes + current uploads bytes
per backup estimate   = dataset * configurable backup overhead + manifest allowance
retention estimate    = per backup estimate * configured retention count
temporary peak        = backup staging overhead + restore workspace overhead
safety reserve        = configurable fraction of retention + temporary peak
recommended free      = retention estimate + temporary peak + safety reserve
```

It reports current dataset estimate, per-backup estimate, retention estimate, temporary peak, recommended minimum free space, and warning/critical thresholds. Upload and backup paths on the same filesystem are deduplicated by filesystem key so free capacity is not counted twice.

Backup and restore independently enforce required-byte preflight. The percentage levels are operational alerts, while the required-byte gate prevents the immediate operation from starting when its estimated workspace cannot fit.

## Orphan monitoring

Run read-only detection:

```bash
DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
npm run orphan:check
```

It reports count, path/storageKey, classification, severity, detail, and recommended action for:

- `DB_RECORD_MISSING_FILE`;
- `DB_RECORD_FILE_SIZE_MISMATCH`;
- `FILE_WITHOUT_DB_RECORD`;
- `STALE_STAGING_FILE`;
- `INVALID_STORAGE_PATH`, including invalid names and symlinks.

Exit codes:

| Exit | Meaning |
| --- | --- |
| 0 | Clean scan |
| 2 | Scanner completed and found operational anomalies |
| 3 | Scanner itself failed or configuration/filesystem/DB could not be read |

The monitor never deletes, moves, repairs, or changes a record. Cleanup requires a separate human-approved procedure and is outside R1-3C.

## Upload provisioning plan

The following commands are for a future authorized R1-3D window only and were not run in R1-3C:

```bash
sudo install -d -o nuaafa -g nuaafa -m 0700 /srv/nuaafa/shared/uploads
sudo stat -c '%U:%G %a %F %n' /srv/nuaafa/shared/uploads
sudo -u nuaafa test -r /srv/nuaafa/shared/uploads
sudo -u nuaafa test -w /srv/nuaafa/shared/uploads
```

After `NUAAFA_UPLOAD_DIR` is set in the future environment file, run the read-only application preflight:

```bash
NUAAFA_UPLOAD_DIR=/srv/nuaafa/shared/uploads npm run ops:upload-preflight
```

It enforces directory type, `nuaafa:nuaafa`, `0700`, current service-user read/write access, no other permission bits, exact environment resolution, safe staging path, traversal rejection, and minimum free space. It does not call `mkdir`, `chmod`, or `chown`.

## Restore validation and isolated rehearsal

Restore is fail-closed and requires all of:

```text
NUAAFA_RESTORE_ISOLATED=1
NUAAFA_RESTORE_TARGET_ROOT=/ABSOLUTE/ISOLATED/ROOT
--backup=/ABSOLUTE/VERIFIED/BACKUP
--database=/ABSOLUTE/ISOLATED/ROOT/data/restored.sqlite
--uploads=/ABSOLUTE/ISOLATED/ROOT/uploads
```

Destinations must not exist, must remain strictly below the allowlisted root, must not overlap each other or the source backup, and must have sufficient free space. Restore first validates completion, manifest, checksums, artifacts, SQLite integrity/FK, and protected table counts. It then copies to an isolated staging directory, revalidates the staged database and files, and publishes only into the fresh destinations. Any checksum or integrity failure stops before destination writes.

Run the full application rehearsal only after a production build exists:

```bash
npm run restore:rehearsal
```

The rehearsal creates a fresh migrated SQLite database and isolated uploads, seeds representative protected rows and a public media/content item, creates and verifies a combined backup, restores to fresh paths, compares before/after protected table counts, starts `next start`, and requires HTTP 200 from:

```text
/health
/api/health
/news
/news/<DB-backed-slug>
/api/content/posts/<DB-backed-slug>
/media/<public-media-id>
```

It records backup duration, restore duration, first HTTP response, health-ready duration, and recovery-to-health time as the measured local RTO rehearsal. These local timings are evidence, not a production RTO guarantee.

Protected count names include `Competition`, `Team`, `Match`, `Referee`, `RefereeApplication`, `RefereeAppointment`, `AppointmentVersion`, `RefereeAvailability`, `RefereePositionCapability`, `RefereeAdmissionApplication`, `ContentPost`, `MediaAsset`, `AdminAccount`, and `AuditLog`. Zero is acceptable only when it was zero before restore; every before/after count must match.

## Production static content import gate

This gate wraps the existing R1-2 inventory/import/reconciliation implementation; it does not create a second importer. `NUAAFA_STATIC_IMPORT_ISOLATED=1` remains reserved for isolated databases and never authorizes production mode.

Create and review the source inventory without database writes:

```bash
npm run content:migrate:dry-run -- \
  --output=/ABSOLUTE/REVIEW/EVIDENCE/static-content-manifest.json
```

After the reviewed migration has completed and the production upload directory/environment has passed its own gates, run the production-aware dry run. It is non-mutating by default:

```bash
DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
npm run content:migrate:dry-run -- --production
```

The preflight requires an absolute real SQLite file, exact release migration history, `ContentPost`, `MediaAsset`, and `DisciplineDetail`, integrity/FK success, zero blocking inventory issues, exact safe media inventory, no ambiguous duplicate slugs, and an absolute real read/write upload directory. Any failure exits non-zero before import.

Only a separately approved apply command supplies both controls:

```bash
DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY=1 \
npm run content:migrate:dry-run -- --production --apply
```

`--apply` without the dedicated environment authorization fails. The environment authorization without `--apply` remains a dry run. The command uses the actual source inventory, upserts idempotently, and fails if its immediate exact reconciliation reports any difference.

Run reconciliation again as a separate read-only recorded gate:

```bash
DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
npm run content:migrate:dry-run -- --production --reconcile
```

Do not set or change `NUAAFA_CONTENT_SOURCE` in any inventory/import/reconciliation command. The importer does not switch the content source and does not deploy or restart the application. Only after the separate exact reconciliation succeeds may a later approved step switch the content source to DB.

## Migration rehearsal

R1-3C requires both official paths:

```bash
npm run test:referee-r1-3a:migration:fresh
npm run test:referee-r1-3a:migration
```

The first applies the complete migration chain to a fresh SQLite database with `prisma migrate deploy`. The second uses the representative pre-R1-3A legacy fixture and checks protected IDs/counts across deploy. Never use `prisma migrate reset` or `prisma db push` on a business database.

R1-3B has no schema migration. R1-3C adds no schema migration.

No approved production snapshot or clone was locally available during the R1-3C audit. Therefore the classification is:

```text
FINAL SNAPSHOT REHEARSAL BLOCKED BY ABSENCE OF APPROVED SNAPSHOT
```

R1-3D preflight must obtain a freshly approved snapshot through the authorized production procedure, then in an isolated clone run migrate deploy, content/import rehearsal if approved, integrity/FK checks, protected counts/IDs, build/start, and smoke. R1-3C must not SSH production to obtain it.

## Release Candidate check

Official command, under Node `22.23.2`:

```bash
npm run rc:check
```

The runner fails closed and includes Node version, live advisory classification, dependency path, Prisma format/validate/generate, TypeScript, ESLint, Unicode, Git whitespace/clean status, R1/R1-2 core tests, R1-3A tests and both migration rehearsals, R1-3B competition import tests, the Fix-3B isolated deployer matrix, hardening tests, production build, full restore/application rehearsal, and isolated `npm ci` reproducibility.

The only non-PASS security classification currently permitted is `KNOWN-ADVISORY` for the exact documented GHSA chain. Any new audit finding, Critical finding, missing disposition, failed gate, or dirty tree produces `NOT_READY`. Successful completion with the known exception produces `READY_WITH_DOCUMENTED_ADVISORY`, never `SECURITY CLEAN`.

## Backup systemd templates

Templates:

- `ops/systemd/nuaafa-unified-backup.service`
- `ops/systemd/nuaafa-unified-backup.timer`
- `ops/systemd/nuaafa-unified-retention-dry-run.service`

The timer template encodes the still-**PROPOSED**, not approved, schedule `03:00 Asia/Shanghai`, `RandomizedDelaySec=30m`, and `Persistent=true`. The proposed retention count is 14. The retention template only produces a dry run. Neither proposal is approved merely because it appears in a template or this runbook.

Future authorized installation must copy the reviewed files to `/etc/systemd/system`, run `systemctl daemon-reload`, inspect `systemd-analyze verify`, run one manual service backup and verification, then separately enable the timer. None of those steps belongs to R1-3C.

## R1-3D controlled provisioning sequence

Stop immediately if any preflight, backup, migration, reconciliation, health, RBAC, media, or rollback gate fails.

Future Phase B remains separately human-authorized and must execute in this exact order. None of these steps was executed by Fix-3B.

Online preparation while the current service remains online:

1. **Push the exact reviewed final HEAD** only after separate push authorization; record the remote SHA.
2. **Bootstrap/install the reviewed deployer** with [`R1-3D_DEPLOYER_BOOTSTRAP.md`](R1-3D_DEPLOYER_BOOTSTRAP.md), requiring the frozen Fix-3A hash before replacement.
3. **Verify the installed deployer SHA and version** against the reviewed Fix-3B source; stop and restore the quarantined old deployer on any mismatch.
4. **Stage-only the exact reviewed application SHA** with the explicit reviewed ref; do not use default/full deploy:

   ```bash
   /usr/local/sbin/nuaafa-deploy --stage-only \
     --allowed-ref refs/heads/feat/v2.9-unified-admin-r1 \
     "$new_sha"
   ```

5. **Verify staged release provenance/build**: canonical direct release path, owner, clean exact HEAD, origin/ref provenance record, canonical shared links, and non-empty `.next/BUILD_ID`. Confirm `current`, DB, environment, and service state are unchanged.

Maintenance/write-freeze window:

6. **Stop `nuaafa.service`** and require inactive state, `MainPID=0`, and no listener on `127.0.0.1:3001`.
7. **Verify the write freeze** and capture the actual previous release/environment state; the previously observed SHA is evidence, not a permanent rollback assumption.
8. **Create the true FINAL PRE-ENABLEMENT backup** with the explicit legacy profile only after writes are frozen.
9. **Verify and rehearse an isolated restore** of that exact bundle; recheck completion binding, DB/uploads, checksums, counts, integrity, and FK state before migration.
10. **Provision uploads and prepare the approved environment** while stopped, preserving protected ownership/modes and never logging secrets; keep the current content source until reconciliation succeeds.
11. **Run only the reviewed `prisma migrate deploy`** and require exact migrations, integrity `ok`, zero FK violations, protected counts, and representative IDs.
12. **Run production static-content import dry-run and dual-authorized apply** using the reviewed gate.
13. **Perform exact reconciliation** and stop on any inventory, count, identity, media, or protected-data mismatch.
14. **Switch the DB content source** only after exact reconciliation, still with the service stopped.
15. **Run DB/content-source verification** and confirm the compatible environment/data set is complete before release switching.
16. **Activate only the exact staged SHA**; this changes `current` only and does not control the service:

    ```bash
    /usr/local/sbin/nuaafa-deploy --activate-staged \
      --allowed-ref refs/heads/feat/v2.9-unified-admin-r1 \
      "$new_sha"
    ```

17. **Run reviewed pre-start checks** against the exact staged release, environment, database, uploads, integrity/FK, content reconciliation, service unit, and current target. Keep the service stopped on any failure.
18. **Explicitly start `nuaafa.service`** with `systemctl start nuaafa.service`; activation itself must never start or restart it.
19. **Run health and smoke acceptance** for API readiness, public content, RBAC, media, referee, and competition import.
20. **Clean only approved test fixtures** using the separately reviewed fixture/account policy; do not delete operational evidence or unrelated data.
21. **Create and verify the post-enable modern backup**. Timer/retention installation remains a separate authorization.
22. **Begin staffed observation** for 24 hours, with a 36-hour grace only when explicitly approved.

Any failed coupled-data gate enters the reviewed rollback procedure: stop or keep stopped, restore the FINAL PRE-ENABLEMENT bundle through fresh staging, quarantine the failed DB/uploads/environment/current link, publish the verified prior set, and smoke again. Do not improvise a partial rollback.

## Maintenance window and rollback plan

Choose the smallest rollback that restores a consistent service:

- **Application-only rollback:** only before migration/content/upload/environment writes, when the previous application remains compatible with the untouched data/source.
- **Content-source rollback:** only when the migrated database/uploads remain internally valid and the fault is limited to source selection/rendering.
- **Combined DB + uploads rollback:** mandatory after migration, content import, media write, DB/file coupling, or any uncertain reconciliation/integrity result.

`git revert` is never a database rollback. Never restore only SQLite after coupled media/content changes, and never restore only uploads when metadata changed.

### Evidence-based maintenance estimate

Preparation—release staging/build, command review, capacity checks, and non-mutating inventory—keeps the service online. The write freeze begins only when `nuaafa.service` is stopped and ends only after the selected release/data/environment set has passed health and rollback smoke.

The Fix-1 Node 22.23.2 local rehearsal measured 87 ms for backup, 24 ms for restore, and 935 ms from restore start to application health on a small isolated fixture. Those measurements prove the path works; they do not predict production data copy speed or human review time. For planning, reserve a **60-minute enablement maintenance window**, with an additional **30-minute rollback contingency** if a coupled-data gate fails. This 60/90-minute model is a planning estimate, not an SLA, RTO guarantee, or authorization. Production capacity measurements and operator timing may require a larger approved window. Consistency wins over minimizing downtime.

### Phase B command preamble and captured rollback state

These commands are templates for a separately approved Phase B root session. Replace only the angle-bracket value, then run every validation before any mutation. Do not print or inspect environment-file contents.

```bash
sudo -i
set -euo pipefail
umask 077

new_sha='<APPROVED_40_HEX_SHA>'
printf '%s\n' "$new_sha" | grep -Eq '^[0-9a-f]{40}$'

operation_id="r1-3d-$(date -u +%Y%m%dT%H%M%SZ)"
printf '%s\n' "$operation_id" | grep -Eq '^r1-3d-[0-9]{8}T[0-9]{6}Z$'

for directory in /srv/nuaafa /srv/nuaafa/releases /srv/nuaafa/shared /srv/nuaafa/shared/prisma /srv/nuaafa/shared/backups; do
  test -d "$directory"
  test ! -L "$directory"
done
test "$(readlink -f /srv/nuaafa/shared)" = /srv/nuaafa/shared
test "$(readlink -f /srv/nuaafa/shared/prisma)" = /srv/nuaafa/shared/prisma

reviewed_release="/srv/nuaafa/releases/$new_sha"
test -d "$reviewed_release"
test ! -L "$reviewed_release"
test "$(git -C "$reviewed_release" rev-parse HEAD)" = "$new_sha"

test -L /srv/nuaafa/current
previous_release="$(readlink -f /srv/nuaafa/current)"
printf '%s\n' "$previous_release" | grep -Eq '^/srv/nuaafa/releases/[0-9a-f]{40}$'
previous_sha="$(basename -- "$previous_release")"
test -d "$previous_release"
test ! -L "$previous_release"
test "$(git -C "$previous_release" rev-parse HEAD)" = "$previous_sha"

test -f /srv/nuaafa/shared/.env.production
test ! -L /srv/nuaafa/shared/.env.production

operation_parent=/srv/nuaafa/shared/rollback-operations
operation_root="$operation_parent/$operation_id"
test ! -e "$operation_root"
if test -e "$operation_parent"; then
  test -d "$operation_parent"
  test ! -L "$operation_parent"
  test "$(readlink -f "$operation_parent")" = /srv/nuaafa/shared/rollback-operations
else
  install -d -o root -g root -m 0700 "$operation_parent"
fi
mkdir -m 0700 "$operation_root"
cp -a -- /srv/nuaafa/shared/.env.production "$operation_root/env.production.before"
printf '%s\n' "$new_sha" > "$operation_root/reviewed-release.sha"
printf '%s\n' "$previous_sha" > "$operation_root/previous-release.sha"
printf '%s\n' "$previous_release" > "$operation_root/previous-release.path"
```

The previously observed `09e8222c5e02193d38e9a0348385bd0987596168` may be noted in the operation record, but the validated `previous_sha` captured above is authoritative for that window.

### Write-freeze boundary and FINAL PRE-ENABLEMENT backup

Do all online preparation first. Enter the write freeze with:

```bash
systemctl stop nuaafa.service
if systemctl is-active --quiet nuaafa.service; then
  echo 'STOP: nuaafa.service is still active' >&2
  exit 1
fi
test "$(systemctl show -p MainPID --value nuaafa.service)" = 0
if ss -ltnp 'sport = :3001' | tail -n +2 | grep -q .; then
  echo 'STOP: application listener on port 3001 is still present' >&2
  exit 1
fi
```

The service must remain stopped through backup, verification, quick restore, migration, import, reconciliation, environment/release activation, and all pre-start checks. Create the dedicated combined root without touching existing `daily` or `weekly` DB-only backups, then run the explicit legacy backup from the staged reviewed release:

```bash
combined_backup_root=/srv/nuaafa/shared/backups/unified
if test -e "$combined_backup_root"; then
  test -d "$combined_backup_root"
  test ! -L "$combined_backup_root"
  test "$(readlink -f "$combined_backup_root")" = /srv/nuaafa/shared/backups/unified
else
  install -d -o nuaafa -g nuaafa -m 0700 "$combined_backup_root"
fi

backup_json="$operation_root/final-pre-enablement-backup.json"
sudo -u nuaafa -H env \
  DATABASE_URL='file:/srv/nuaafa/shared/prisma/dev.db' \
  NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
  NUAAFA_BACKUP_ROOT='/srv/nuaafa/shared/backups/unified' \
  bash -c 'cd "$1" && exec /usr/bin/npm run backup:unified -- --root="$2" --profile=legacy-pre-enablement' \
  _ "$reviewed_release" "$combined_backup_root" | tee "$backup_json"

backup_dir="$(/usr/bin/node -e 'const f=require("fs");const v=JSON.parse(f.readFileSync(process.argv[1],"utf8"));process.stdout.write(v.outputDirectory)' "$backup_json")"
test "$(dirname -- "$backup_dir")" = "$combined_backup_root"
test -d "$backup_dir"
test ! -L "$backup_dir"

backup_id="$(/usr/bin/node -e 'const f=require("fs");const v=JSON.parse(f.readFileSync(process.argv[1],"utf8"));process.stdout.write(v.manifest.backupId)' "$backup_json")"
printf '%s\n' "$backup_id" | grep -Eq '^nuaafa-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{12}$'
printf '%s\n' "$backup_dir" > "$operation_root/final-backup.path"
printf '%s\n' "$backup_id" > "$operation_root/final-backup.id"

sudo -u nuaafa -H bash -c \
  'cd "$1" && exec /usr/bin/npm run backup:verify -- --backup="$2"' \
  _ "$reviewed_release" "$backup_dir" | tee "$operation_root/final-pre-enablement-verify.json"
```

Any service/listener ambiguity, backup failure, invalid JSON/path/profile/capability/checksum/count, or missing completion marker stops the window. Do not migrate.

### Isolated staged restore and verification

The isolated flag remains truthful: it restores only below a fresh allowlisted staging root, never over canonical paths.

```bash
restore_parent=/srv/nuaafa/shared/restore-staging
if test -e "$restore_parent"; then
  test -d "$restore_parent"
  test ! -L "$restore_parent"
  test "$(readlink -f "$restore_parent")" = /srv/nuaafa/shared/restore-staging
else
  install -d -o nuaafa -g nuaafa -m 0700 "$restore_parent"
fi

restore_root="$restore_parent/$backup_id/pre-enable"
staged_db="$restore_root/database/restored.sqlite"
staged_uploads="$restore_root/uploads"

test ! -e "$restore_root"
test "$staged_db" != /srv/nuaafa/shared/prisma/dev.db
test "$staged_uploads" != /srv/nuaafa/shared/uploads

sudo -u nuaafa -H env \
  NUAAFA_RESTORE_ISOLATED=1 \
  NUAAFA_RESTORE_TARGET_ROOT="$restore_root" \
  bash -c 'cd "$1" && exec /usr/bin/npm run restore:unified -- --backup="$2" --database="$3" --uploads="$4"' \
  _ "$reviewed_release" "$backup_dir" "$staged_db" "$staged_uploads" \
  | tee "$operation_root/pre-enable-restore.json"

test -f "$staged_db"
test ! -L "$staged_db"
test -d "$staged_uploads"
test ! -L "$staged_uploads"
if find -P "$staged_uploads" -type l -print -quit | grep -q .; then
  echo 'STOP: staged uploads contain a symlink' >&2
  exit 1
fi

shared_device="$(stat -c %d /srv/nuaafa/shared)"
test "$(stat -c %d "$restore_root")" = "$shared_device"
test "$(stat -c %d /srv/nuaafa/shared/prisma)" = "$shared_device"

expected_db_sha="$(/usr/bin/node -e 'const f=require("fs");const v=JSON.parse(f.readFileSync(process.argv[1],"utf8"));process.stdout.write(v.database.sha256)' "$backup_dir/manifest.json")"
expected_db_bytes="$(/usr/bin/node -e 'const f=require("fs");const v=JSON.parse(f.readFileSync(process.argv[1],"utf8"));process.stdout.write(String(v.database.bytes))' "$backup_dir/manifest.json")"
printf '%s\n' "$expected_db_sha" | grep -Eq '^[0-9a-f]{64}$'
printf '%s\n' "$expected_db_bytes" | grep -Eq '^[0-9]+$'
test "$(sha256sum "$staged_db" | awk '{print $1}')" = "$expected_db_sha"
test "$(stat -c %s "$staged_db")" = "$expected_db_bytes"
test "$(sqlite3 "$staged_db" 'PRAGMA integrity_check;')" = ok
test -z "$(sqlite3 "$staged_db" 'PRAGMA foreign_key_check;')"
```

The restore command already rechecks completion binding, DB/upload sizes and SHA-256 values, exact upload tree, protected row counts, profile/capabilities, integrity, and FK state. The recorded restore JSON must show identical `rowCounts` and `sourceRowCounts`. Do not proceed if the staging device differs from the canonical shared device; cross-filesystem publication is prohibited.

### Exact release activation and explicit service-start boundary

Only after the reviewed migration, production content import, exact reconciliation, content-source switch, and DB verification have all passed may the separately authorized operator activate the already-staged release:

```bash
test -d "$reviewed_release"
test ! -L "$reviewed_release"
test "$(git -C "$reviewed_release" rev-parse HEAD)" = "$new_sha"
test -s "$reviewed_release/.next/BUILD_ID"

/usr/local/sbin/nuaafa-deploy --activate-staged \
  --allowed-ref refs/heads/feat/v2.9-unified-admin-r1 \
  "$new_sha"

test -L /srv/nuaafa/current
test "$(readlink /srv/nuaafa/current)" = "$reviewed_release"
test "$(readlink -f /srv/nuaafa/current)" = "$reviewed_release"
if systemctl is-active --quiet nuaafa.service; then exit 1; fi
test "$(systemctl show -p MainPID --value nuaafa.service)" = 0
if ss -ltnp 'sport = :3001' | tail -n +2 | grep -q .; then exit 1; fi
```

Activation switches only `current`. It must not install/build, migrate/import,
modify the environment, or control the service. Run every reviewed pre-start
integrity, FK, content, upload, environment, release, and service-unit check
after activation. Only then is service start a separate explicit action:

```bash
systemctl start nuaafa.service
systemctl is-active --quiet nuaafa.service
```

Health/readiness polling and the reviewed smoke suite follow the explicit start.
If a pre-start check fails, keep the service stopped and enter the reviewed
rollback decision; do not call default/full deploy and do not silently restart.

### Failed enablement: fresh staging and quarantine preflight

If any failure occurs after migration, import, content-source change, or media/DB writes, keep or stop the service and create a new rollback staging root. Never reuse a possibly modified pre-enable staging tree.

```bash
systemctl stop nuaafa.service
if systemctl is-active --quiet nuaafa.service; then exit 1; fi
test "$(systemctl show -p MainPID --value nuaafa.service)" = 0
if ss -ltnp 'sport = :3001' | tail -n +2 | grep -q .; then exit 1; fi

sudo -u nuaafa -H bash -c \
  'cd "$1" && exec /usr/bin/npm run backup:verify -- --backup="$2"' \
  _ "$reviewed_release" "$backup_dir" | tee "$operation_root/rollback-source-verify.json"

rollback_restore_root="/srv/nuaafa/shared/restore-staging/$backup_id/rollback-$operation_id"
rollback_db="$rollback_restore_root/database/restored.sqlite"
rollback_uploads="$rollback_restore_root/uploads"
test ! -e "$rollback_restore_root"

sudo -u nuaafa -H env \
  NUAAFA_RESTORE_ISOLATED=1 \
  NUAAFA_RESTORE_TARGET_ROOT="$rollback_restore_root" \
  bash -c 'cd "$1" && exec /usr/bin/npm run restore:unified -- --backup="$2" --database="$3" --uploads="$4"' \
  _ "$reviewed_release" "$backup_dir" "$rollback_db" "$rollback_uploads" \
  | tee "$operation_root/rollback-restore.json"

test -f "$rollback_db"
test ! -L "$rollback_db"
test -d "$rollback_uploads"
test ! -L "$rollback_uploads"
if find -P "$rollback_uploads" -type l -print -quit | grep -q .; then exit 1; fi
test "$(stat -c %d "$rollback_restore_root")" = "$shared_device"
test "$(sha256sum "$rollback_db" | awk '{print $1}')" = "$expected_db_sha"
test "$(stat -c %s "$rollback_db")" = "$expected_db_bytes"
test "$(sqlite3 "$rollback_db" 'PRAGMA integrity_check;')" = ok
test -z "$(sqlite3 "$rollback_db" 'PRAGMA foreign_key_check;')"

quarantine_parent=/srv/nuaafa/shared/quarantine
quarantine_root="$quarantine_parent/$operation_id"
test ! -e "$quarantine_root"
if test -e "$quarantine_parent"; then
  test -d "$quarantine_parent"
  test ! -L "$quarantine_parent"
  test "$(readlink -f "$quarantine_parent")" = /srv/nuaafa/shared/quarantine
else
  install -d -o root -g root -m 0700 "$quarantine_parent"
fi
mkdir -m 0700 "$quarantine_root"

test "$(stat -c %d "$quarantine_parent")" = "$shared_device"
test "$(stat -c %d /srv/nuaafa)" = "$shared_device"

test -f /srv/nuaafa/shared/prisma/dev.db
test ! -L /srv/nuaafa/shared/prisma/dev.db
for sidecar in /srv/nuaafa/shared/prisma/dev.db-wal /srv/nuaafa/shared/prisma/dev.db-shm; do
  if test -e "$sidecar"; then test -f "$sidecar"; test ! -L "$sidecar"; fi
done

if test -e /srv/nuaafa/shared/uploads; then
  test -d /srv/nuaafa/shared/uploads
  test ! -L /srv/nuaafa/shared/uploads
  if find -P /srv/nuaafa/shared/uploads -type l -print -quit | grep -q .; then exit 1; fi
fi
test -f /srv/nuaafa/shared/.env.production
test ! -L /srv/nuaafa/shared/.env.production
test -L /srv/nuaafa/current

current_failed_release="$(readlink -f /srv/nuaafa/current)"
printf '%s\n' "$current_failed_release" | grep -Eq '^/srv/nuaafa/releases/[0-9a-f]{40}$'
test -d "$current_failed_release"

source_upload_state="$(/usr/bin/node -e 'const f=require("fs");const v=JSON.parse(f.readFileSync(process.argv[1],"utf8"));process.stdout.write(v.schemaCapabilities.managedUploadsState)' "$backup_dir/manifest.json")"
case "$source_upload_state" in
  ABSENT|PRESENT_EMPTY|PRESENT) ;;
  *) echo 'STOP: invalid source upload state' >&2; exit 1 ;;
esac
```

The fresh `mkdir` fails on a quarantine collision. No command follows a canonical or staged symlink. Every rename below is preflighted onto the same shared filesystem.

### Quarantine and canonical replacement

Prepare same-directory temporary environment/release objects before moving canonical state. The captured environment is restored as a whole, so the previous content-source state returns without logging secrets.

```bash
env_restore_temp="/srv/nuaafa/shared/.env.production.rollback-$operation_id"
current_restore_temp="/srv/nuaafa/.current.rollback-$operation_id"
test ! -e "$env_restore_temp"
test ! -e "$current_restore_temp"
cp -a -- "$operation_root/env.production.before" "$env_restore_temp"
ln -s -- "$previous_release" "$current_restore_temp"
test -f "$env_restore_temp"
test ! -L "$env_restore_temp"
test -L "$current_restore_temp"
test "$(readlink -f "$current_restore_temp")" = "$previous_release"

mv -T -- /srv/nuaafa/shared/prisma/dev.db "$quarantine_root/dev.db.failed"
for name in dev.db-wal dev.db-shm; do
  if test -e "/srv/nuaafa/shared/prisma/$name"; then
    mv -T -- "/srv/nuaafa/shared/prisma/$name" "$quarantine_root/$name.failed"
  fi
done
if test -e /srv/nuaafa/shared/uploads; then
  mv -T -- /srv/nuaafa/shared/uploads "$quarantine_root/uploads.failed"
fi
mv -T -- /srv/nuaafa/shared/.env.production "$quarantine_root/env.production.failed"
mv -T -- /srv/nuaafa/current "$quarantine_root/current.failed"

mv -T -- "$rollback_db" /srv/nuaafa/shared/prisma/dev.db
case "$source_upload_state" in
  ABSENT)
    test ! -e /srv/nuaafa/shared/uploads
    ;;
  PRESENT_EMPTY|PRESENT)
    mv -T -- "$rollback_uploads" /srv/nuaafa/shared/uploads
    ;;
esac
mv -T -- "$env_restore_temp" /srv/nuaafa/shared/.env.production
mv -T -- "$current_restore_temp" /srv/nuaafa/current
```

If any rename fails, the shell stops and `nuaafa.service` remains stopped. Do not improvise cleanup or start the service. Use the retained quarantine and staged set to complete a reviewed consistent placement.

For a legacy `managedUploadsState=ABSENT` backup, the restore engine truthfully creates an empty isolated staging directory for verification, but rollback does **not** publish that directory. Any post-enable canonical uploads are quarantined and `/srv/nuaafa/shared/uploads` remains absent, matching the legacy source state. The prior environment/content source and prior release are restored before service start, so post-enable media cannot remain active against the legacy DB.

Restore ownership/mode and verify the published set:

```bash
chown nuaafa:nuaafa /srv/nuaafa/shared/prisma/dev.db
chmod 0600 /srv/nuaafa/shared/prisma/dev.db

if test -d /srv/nuaafa/shared/uploads; then
  if find -P /srv/nuaafa/shared/uploads -type l -print -quit | grep -q .; then exit 1; fi
  chown -R nuaafa:nuaafa /srv/nuaafa/shared/uploads
  find -P /srv/nuaafa/shared/uploads -type d -exec chmod 0700 {} +
  find -P /srv/nuaafa/shared/uploads -type f -exec chmod 0600 {} +
fi

test -f /srv/nuaafa/shared/.env.production
test ! -L /srv/nuaafa/shared/.env.production
test -L /srv/nuaafa/current
test "$(readlink -f /srv/nuaafa/current)" = "$previous_release"
stat -c '%U:%G %a %F %n' /srv/nuaafa/shared/prisma/dev.db
stat -c '%U:%G %a %F %n' /srv/nuaafa/shared/.env.production
if test -e /srv/nuaafa/shared/uploads; then
  stat -c '%U:%G %a %F %n' /srv/nuaafa/shared/uploads
fi

test "$(sqlite3 /srv/nuaafa/shared/prisma/dev.db 'PRAGMA integrity_check;')" = ok
test -z "$(sqlite3 /srv/nuaafa/shared/prisma/dev.db 'PRAGMA foreign_key_check;')"
```

### Service start and rollback acceptance

```bash
systemctl start nuaafa.service
systemctl is-active --quiet nuaafa.service

health_ready=0
for attempt in $(seq 1 60); do
  if curl -fsS --max-time 2 http://127.0.0.1:3001/api/health > /dev/null; then
    health_ready=1
    break
  fi
  sleep 1
done
test "$health_ready" = 1

curl -fsS --max-time 5 http://127.0.0.1:3001/api/health
curl -fsS --max-time 10 -o /dev/null https://nuaafa.cn/
curl -fsS --max-time 10 -o /dev/null https://nuaafa.cn/news
test "$(sqlite3 /srv/nuaafa/shared/prisma/dev.db 'PRAGMA integrity_check;')" = ok
test -z "$(sqlite3 /srv/nuaafa/shared/prisma/dev.db 'PRAGMA foreign_key_check;')"
```

Then execute the approved rollback smoke appropriate to the restored legacy/current source: public home/news, current referee public routes, admin/referee login boundary without writing fixtures, service logs, and no new 5xx. Record acceptance and owners. Keep `$quarantine_root`, both restore evidence trees, and the operation record until a later explicit human cleanup approval; this procedure contains no `rm -rf` cleanup step.

## Observation plan

Normal staffed observation is 24 hours; an allowed grace period extends to 36 hours when explicitly approved. R1-3C does not start observation.

Monitor and record at least:

- `/health` and `/api/health` availability/latency;
- HTTP 5xx rate and service restarts;
- admin and referee login outcomes without credential logging;
- PUBLIC/PRIVATE media read and authorized media write;
- upload, backup, and database filesystem free space and warning/critical levels;
- first scheduled combined backup, completion marker, checksum verification, duration, and capacity;
- SQLite integrity symptoms, lock/busy errors, and migration status;
- orphan monitor anomalies, including staging age;
- representative admin audit events;
- referee and competition-import operations.

Escalate immediately on health failure, unexplained 5xx, integrity/FK failure, failed backup, critical disk, unexpected orphan growth, RBAC breach, or data reconciliation mismatch. Freeze further admin writes while deciding app-only, source, or combined rollback.

## R1-3D approval gates

Required evidence before approval:

- verified combined backup, completion marker, manifest, and checksums;
- failed backup rejection and safe retention dry run;
- clean orphan monitor with zero automatic deletion;
- capacity and free-space preflight for upload, backup, and restore filesystems;
- upload contract fixed at `/srv/nuaafa/shared/uploads`, `nuaafa:nuaafa`, `0700`;
- measured local RTO rehearsal and a separately planned production target;
- SQLite integrity/FK and protected counts/IDs;
- fresh and legacy migration rehearsals;
- R1-3A and R1-3B regression pass;
- Node 22.23.2 production build and isolated `npm ci` pass;
- current advisory disposition plus a fresh R1-3D recheck;
- completed provisioning, rollback, and observation plans;
- explicit production authorization.

R1-3C ends at `READY FOR R1-3D APPROVAL`. It does not authorize deployment, production mutation, push, merge, timer installation, or enablement.
