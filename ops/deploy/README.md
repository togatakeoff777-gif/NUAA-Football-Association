# NUAAFA production deployer provenance

## Status

`ops/deploy/nuaafa-deploy` is the byte-identical source-control adoption of the
deployer that was installed on production when R1-3D PREFLIGHT FIX-3A was
performed. This adoption records provenance only. It does not approve an
installation, deployment, stage-only mode, activation mode, or production
mutation.

Do not edit the adopted file as part of FIX-3A. Any future behavior change must
start from this exact baseline, receive isolated tests and source review, and be
separately approved before production installation.

## Capture provenance

| Field | Captured value |
| --- | --- |
| Production source path | `/usr/local/sbin/nuaafa-deploy` |
| Capture time | `2026-08-24T13:08:04Z` |
| Production file type | regular Bourne-Again shell script, ASCII executable |
| Production owner/group | `root:root` |
| Production mode | `0755` |
| Production size | `3634` bytes |
| Production SHA-256 | `a3de22095a9d894c3ae2bc412c07432263dd0822f24d4bea28d2acadb545d694` |
| Adopted repository path | `ops/deploy/nuaafa-deploy` |
| Observed production release | `/srv/nuaafa/releases/09e8222c5e02193d38e9a0348385bd0987596168` |
| Observed production release SHA | `09e8222c5e02193d38e9a0348385bd0987596168` |

The production file was read without modification and copied out of production.
The captured local file and the adopted repository file were each hashed before
commit. Both hashes matched the production SHA-256 above. No line-ending
normalization, reformatting, header insertion, or behavioral edit was made to
the adopted script.

The secret-material scan found no embedded password, access token, private key,
SSH credential, database credential, session secret, API key, or `.env` value.
The script contains operational configuration such as fixed filesystem paths,
the `nuaafa.service` name, the `nuaafa` Unix user, an SSH host alias, and the
repository URL.

## Current behavior characterization

The adopted deployer performs these operations in order:

1. Enables `set -Eeuo pipefail`, requires root, applies `umask 077`, and changes
   its working directory to `/`.
2. Parses `--dry-run`, `--help`, and at most one optional commit argument.
3. Acquires a non-blocking `flock` on `/run/lock/nuaafa-deploy.lock`.
4. Uses the supplied commit or resolves `refs/heads/main` from the configured
   repository, then requires exactly 40 lowercase hexadecimal characters.
5. Resolves the current release and reads its Git SHA when it has a `.git`
   directory. An already-current target exits successfully.
6. In dry-run mode, prints the target and current SHA and exits before creating
   or modifying deployment state.
7. Constructs `/srv/nuaafa/releases/<sha>`, cloning when the target does not
   already contain a `.git` directory, then fetches `origin` and checks out the
   requested SHA detached.
8. Links the shared production environment and SQLite database into the release
   and applies link ownership.
9. Runs `npm ci`, ESLint, Unicode checking, the referee-flow test, and a
   critical-level production dependency audit as `nuaafa`.
10. Runs the installed DB-only backup command.
11. Runs `prisma migrate deploy` against the production environment, builds the
    application, and requires `.next/BUILD_ID`.
12. Creates `/srv/nuaafa/.current.new` and uses `mv -Tf` to switch
    `/srv/nuaafa/current` to the release.
13. Restarts `nuaafa.service`. A restart failure restores the prior release link
    and attempts to restart the prior application.
14. Polls `/api/health` up to 20 times. A persistent health failure restores the
    prior release link and service, but explicitly does not roll back database
    migrations.
15. Reports the deployed and previous Git SHAs on success.

Cleanup is intentionally limited: the script removes the release-local DB entry
before recreating its symlink and removes the fixed temporary current-link path.
It does not delete old release directories, roll back database migrations, or
clean a partially prepared release after an earlier failure.

## Existing safety observations

### Blocking for future modification

These findings do not block byte-identical provenance adoption. They must be
resolved or explicitly dispositioned before adding stage-only or
activate-staged behavior:

- The release path is derived from a validated SHA, but an already-existing
  release directory is not required to be a non-symlink whose resolved path,
  owner, Git origin, and clean state are trustworthy and contained below the
  exact releases root.
- Reusing an existing `.git` directory does not verify a clean worktree,
  expected origin, build provenance, or unambiguous prior staging state. A
  partial failed deployment can therefore affect a later reuse attempt.
- `git fetch origin` followed by checkout of a SHA does not prove that the SHA
  is reachable from the specifically approved remote ref. A tampered local
  release repository could already contain an unrelated object.
- The release-local `.env.production` and `prisma/dev.db` entries are replaced
  without first rejecting unexpected file types or symlinks. In particular,
  `rm -f "$release/prisma/dev.db"` relies on the release directory being safe.
- The installed current link and its resolved previous target are not required
  to be safe symlinks contained below `/srv/nuaafa/releases/<40-hex-sha>` before
  switching or rollback.
- The fixed `/srv/nuaafa/.current.new` path is removed without a prior
  collision/type check. Future activation must fail closed on ambiguous state
  and retain the established same-directory atomic switch.

### Non-blocking legacy observations

- `set -Eeuo pipefail`, root enforcement, restrictive `umask`, exact SHA syntax
  validation, and the deployment lock are useful existing fail-closed controls.
- The legacy full-deploy path intentionally couples build, DB backup, migration,
  release switching, restart, and health checks. That behavior is incompatible
  with the controlled R1-3D stage/maintenance split but remains the adopted
  baseline and is not changed here.
- There is no `trap`-based cleanup. Failure before switching leaves a partial
  release for investigation, but future idempotent staging must reject or safely
  characterize that state rather than overwriting it.
- Restart/health rollback restores only the application release and explicitly
  leaves migrations in place. Database rollback belongs to the separate
  reviewed R1-3D backup/staging/quarantine procedure.
- The dependency audit uses `--audit-level=critical`; known high-severity
  advisory disposition is handled by the separate release-candidate process.
- The script performs no `rm -rf` release cleanup and does not automatically
  delete historical releases.

## Future change boundary

FIX-3A ends with source adoption. Stage-only, activate-staged, production
bootstrap instructions, and installation remain separate reviewed work. The
production copy at `/usr/local/sbin/nuaafa-deploy` must not be replaced from this
commit without fresh human approval.
