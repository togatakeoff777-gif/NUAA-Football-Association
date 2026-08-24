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
| `NUAAFA_BACKUP_ROOT` | Required for backup automation | No | Yes | Recommended plan: `/srv/nuaafa/shared/backups`; R1-3D confirms |
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

Use a root-owned `EnvironmentFile` such as `/etc/nuaafa/nuaafa.env` with the existing deployment's secret-management permissions. The supplied systemd templates reference the file but contain no value.

## Unified backup

The existing `backup:unified` architecture remains authoritative; `db:backup` is not sufficient for R1-3D restore points.

### FINAL PRE-ENABLEMENT legacy bridge

The reviewed bridge is explicit. It is never inferred from missing tables. Before Unified Admin migration and before the managed upload directory exists, the future authorized Phase B command is:

```bash
sudo -u nuaafa -H env \
  DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
  NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
  NUAAFA_BACKUP_ROOT='/ABSOLUTE/FORMAL/BACKUP/ROOT' \
  npm run backup:unified -- \
    --root=/ABSOLUTE/FORMAL/BACKUP/ROOT \
    --profile=legacy-pre-enablement
```

`NUAAFA_UPLOAD_DIR` identifies the future managed location and may be absent only in this explicit profile. The v4 legacy manifest records `LEGACY_PRE_ENABLEMENT`, the reviewed first-three-migration inventory, present and expected-absent protected tables, and managed uploads as `ABSENT` or `PRESENT_EMPTY`. It records no invented media or files. Unexpected migration/table capability, a non-empty upload root, or any database failure stops the backup.

Verify the exact generated directory before any migration:

```bash
npm run backup:verify -- \
  --backup=/ABSOLUTE/FORMAL/BACKUP/ROOT/EXACT_FINAL_PRE_ENABLEMENT_DIRECTORY
```

Record backup directory, backup ID, UTC start/end, application SHA, schema profile, migration inventory, manifest SHA-256, completion marker, protected counts, and operator. The normal modern v3 path remains the default and must omit `--profile`; it still requires the complete Unified schema and real managed upload root.

Future creation command:

```bash
sudo -u nuaafa -H env \
  DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
  NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
  NUAAFA_BACKUP_ROOT='/srv/nuaafa/shared/backups' \
  npm run backup:unified -- --root=/srv/nuaafa/shared/backups
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
npm run backup:verify -- --backup=/srv/nuaafa/shared/backups/EXACT_BACKUP_DIRECTORY
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
NUAAFA_BACKUP_ROOT=/srv/nuaafa/shared/backups \
NUAAFA_BACKUP_RETENTION_COUNT=14 \
npm run backup:retention -- --root=/srv/nuaafa/shared/backups --keep=14
```

The value 14 is a configurable production recommendation, not an approved business policy. R1-3D must confirm the count against measured production size and recovery requirements.

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
  --root=/srv/nuaafa/shared/backups --keep=APPROVED_COUNT --apply
```

Do not schedule the apply command until R1-3D has reviewed a dry-run report and approved the count. The supplied systemd retention unit is intentionally dry-run only.

## Capacity planning and disk preflight

Run:

```bash
DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
NUAAFA_BACKUP_ROOT='/srv/nuaafa/shared/backups' \
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
DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
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
DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
npm run content:migrate:dry-run -- --production
```

The preflight requires an absolute real SQLite file, exact release migration history, `ContentPost`, `MediaAsset`, and `DisciplineDetail`, integrity/FK success, zero blocking inventory issues, exact safe media inventory, no ambiguous duplicate slugs, and an absolute real read/write upload directory. Any failure exits non-zero before import.

Only a separately approved apply command supplies both controls:

```bash
DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
NUAAFA_UPLOAD_DIR='/srv/nuaafa/shared/uploads' \
NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY=1 \
npm run content:migrate:dry-run -- --production --apply
```

`--apply` without the dedicated environment authorization fails. The environment authorization without `--apply` remains a dry run. The command uses the actual source inventory, upserts idempotently, and fails if its immediate exact reconciliation reports any difference.

Run reconciliation again as a separate read-only recorded gate:

```bash
DATABASE_URL='file:/ABSOLUTE/PRODUCTION/DATABASE.sqlite' \
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

The runner fails closed and includes Node version, live advisory classification, dependency path, Prisma format/validate/generate, TypeScript, ESLint, Unicode, Git whitespace/clean status, R1/R1-2 core tests, R1-3A tests and both migration rehearsals, R1-3B competition import tests, hardening tests, production build, full restore/application rehearsal, and isolated `npm ci` reproducibility.

The only non-PASS security classification currently permitted is `KNOWN-ADVISORY` for the exact documented GHSA chain. Any new audit finding, Critical finding, missing disposition, failed gate, or dirty tree produces `NOT_READY`. Successful completion with the known exception produces `READY_WITH_DOCUMENTED_ADVISORY`, never `SECURITY CLEAN`.

## Backup systemd templates

Templates:

- `ops/systemd/nuaafa-unified-backup.service`
- `ops/systemd/nuaafa-unified-backup.timer`
- `ops/systemd/nuaafa-unified-retention-dry-run.service`

The backup timer uses `Persistent=true` and a randomized delay. Its `03:00` schedule and 30-minute jitter are adjustable template values; R1-3D must finalize the actual schedule. The retention template only produces a dry run.

Future authorized installation must copy the reviewed files to `/etc/systemd/system`, run `systemctl daemon-reload`, inspect `systemd-analyze verify`, run one manual service backup and verification, then separately enable the timer. None of those steps belongs to R1-3C.

## R1-3D controlled provisioning sequence

Stop immediately if any preflight, backup, migration, reconciliation, health, RBAC, media, or rollback gate fails.

Future Phase B remains separately human-authorized and must execute in this order; none of these steps is executed by this Fix-1:

1. **Exact approved release available:** confirm the reviewed SHA is present through the approved transfer/push path, artifacts are clean, Node is 22.23.2, RC classification is accepted, and owners are staffed.
2. **Stage without switching current:** stage the exact release while the current application, service, and content source remain unchanged.
3. **FINAL PRE-ENABLEMENT legacy restore bundle:** run the explicit `--profile=legacy-pre-enablement` combined backup against the pre-migration database and not-yet-enabled upload path.
4. **Verify backup:** record and verify completion/manifest binding, checksums, schema profile/capabilities, migration inventory, SQLite integrity/FK, and legacy protected counts.
5. **Isolated clone/rehearsal:** restore the exact bundle to fresh isolated DB/uploads, deploy migrations only on the clone, rehearse inventory/import/reconciliation/build/start/smoke, and prove rollback readiness.
6. **Provision uploads `0700`:** create only `/srv/nuaafa/shared/uploads` as `nuaafa:nuaafa` `0700`, then verify owner/mode, service-user read/write, traversal/staging, and disk gates.
7. **Configure environment:** update only the approved protected EnvironmentFile values without logging secrets; do not switch the content source yet.
8. **Migrate deploy:** execute only the reviewed `prisma migrate deploy` path against production; never reset, seed, or db-push.
9. **Integrity/FK:** require SQLite `integrity_check=ok`, zero FK violations, exact migration inventory, protected counts, and representative IDs.
10. **Production content inventory/dry-run/apply:** record source inventory, pass `--production` dry run, then use the separately approved dual-authorized `--production --apply` command.
11. **Exact reconciliation:** require exact content/media counts, checksums, relationships, protected counts, and representative IDs; repeat the read-only `--production --reconcile` gate.
12. **Switch content source:** only after step 11, change the approved `NUAAFA_CONTENT_SOURCE` value to DB.
13. **Deploy/restart:** activate only the exact approved release/environment and perform the reviewed service restart.
14. **Production smoke:** require health/no-new-5xx plus approved four-role RBAC, news, media, referee, and competition-import smoke. Smoke accounts/fixtures follow the separately approved production policy.
15. **Backup automation:** install/verify the approved backup service/timer only after smoke; retention apply remains separately authorized.
16. **Post-enablement backup:** create and verify a normal modern v3 combined backup with no legacy profile argument.
17. **Observation:** begin the staffed 24-hour plan, with allowed 36-hour grace only when explicitly approved.

## Rollback plan

Choose the smallest rollback that restores a consistent service:

- **Application-only rollback:** use when the new release fails before migration/content/upload writes or when a code-only issue occurs and the prior application remains compatible with the unchanged database/uploads/source. Restore the prior release artifact and restart; do not restore data unnecessarily.
- **Content-source rollback:** use when database content is valid but the source switch or public rendering is faulty. Switch back to the prior source under explicit approval and restart; preserve the new DB/uploads for investigation.
- **Combined DB + uploads restore:** required when migration, content import, media writes, or reconciliation produced data/files that the prior release cannot safely interpret; when DB and files are inconsistent; or when integrity/FK/checksum fails. Stop writes, verify the FINAL PRE-ENABLEMENT backup, restore both database and uploads as one set, verify integrity/FK/counts/checksums, then restore the compatible application/source.

`git revert` or application checkout is not a database rollback. Never restore only SQLite after media/content changes, and never restore only uploads when metadata changed.

Before the production window, rehearse the exact rollback decision, record commands and owners, and verify the restore target has capacity. If rollback validation is ambiguous, do not enable.

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
