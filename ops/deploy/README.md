# NUAAFA production deployer provenance and reviewed modes

## Status

`ops/deploy/nuaafa-deploy` is the canonical source for the production deployer.
R1-3D PREFLIGHT FIX-3A adopted the then-installed production file byte for byte.
R1-3D PREFLIGHT FIX-3B starts from that frozen source and adds reviewed,
isolated-test-backed staging and activation primitives. It does not install or
execute the changed deployer on production and does not authorize Phase B.

| Field | Value |
| --- | --- |
| Fix-3A production/source baseline SHA-256 | `a3de22095a9d894c3ae2bc412c07432263dd0822f24d4bea28d2acadb545d694` |
| Fix-3B reviewed source SHA-256 | `a5267ba836d54e6857c9fcac317a4ac21f9dc7635ea3e72b5f09dfd105f712c5` |
| Version output | `nuaafa-deploy R1-3D-FIX-3B-1` |
| Canonical repository path | `ops/deploy/nuaafa-deploy` |
| Installed production path, if later approved | `/usr/local/sbin/nuaafa-deploy` |

The source is forced to LF by `.gitattributes` and remains executable in Git.
The separate bootstrap procedure requires both the old and new hashes, syntax,
owner, and mode checks before an atomic replacement.

### Preserved Fix-3A capture evidence

The Fix-3A baseline came from `/usr/local/sbin/nuaafa-deploy` at
`2026-08-24T13:08:04Z`. The observed production file was a regular executable,
owned by `root:root`, mode `0755`, size `3634` bytes, and its production,
captured-local, and committed-source hashes all matched the Fix-3A baseline
above. The then-observed current release was
`/srv/nuaafa/releases/09e8222c5e02193d38e9a0348385bd0987596168`;
that observation is evidence, never a permanent rollback assumption.

The Fix-3A secret scan found no embedded password, access token, private key,
SSH credential, database credential, session secret, API key, or `.env` value.
Fixed filesystem paths, the service/user names, SSH host alias, and repository
URL are operational configuration rather than secrets. Fix-3B retains that
boundary and adds no secret value.

## CLI

The default invocation remains the backward-compatible full deployment path.
The two new operations require an explicit exact 40-character lowercase SHA:

```bash
nuaafa-deploy --stage-only \
  --allowed-ref refs/heads/feat/v2.9-unified-admin-r1 \
  EXACT_40_HEX_SHA

nuaafa-deploy --activate-staged \
  --allowed-ref refs/heads/feat/v2.9-unified-admin-r1 \
  EXACT_40_HEX_SHA
```

`--dry-run` is compatible with stage-only, activate-staged, and the default
full mode. Conflicting modes, a missing SHA for either new mode, unsafe refs,
and invalid SHAs fail closed. `--help` documents the modes and `--version`
provides a deterministic operator-visible source version.

## Stage-only boundary

Stage-only takes the deployment lock, validates the fixed layout, fetches the
explicit allowed ref, proves the requested commit is its ancestor, checks out
detached, installs dependencies, runs the existing static/Prisma checks, builds,
validates `.next/BUILD_ID`, and writes deterministic provenance under the
release's `.git` directory. A new release is prepared under an operation-scoped
`.staging-<sha>-<pid>` directory and is published to the canonical SHA path only
after the build and provenance checks pass.

It does not run a backup or migration, alter the shared environment/database,
switch `current`, import content, provision uploads, touch timers, or control the
service. A failed partial preparation cannot be mistaken for a valid canonical
staged release. An existing canonical release is reused only after all staged
provenance checks pass.

## Activate-staged boundary

Activate-staged performs read-only validation of the canonical release path,
owner, origin, clean HEAD, recorded allowed-ref provenance, build artifact,
shared environment/database links, and current-link state. It then performs
only an operation-scoped same-parent atomic `current` link replacement.

It does not install, build, back up, migrate, import, modify environment data,
provision uploads, change timers, or stop/start/restart/reload the service. An
already-current verified release returns a deterministic success.

## Full deploy compatibility

The default path still runs checks, DB-only backup, `prisma migrate deploy`,
build verification, current switch, service restart, and health polling. Its
restart/health rollback continues to restore the prior application link without
claiming to roll back database migrations. Shared path helpers now fail closed
on ambiguous release, link, and temporary-current state; the isolated full-mode
regression proves the legacy operation ordering remains available.

## Safety and provenance

- Release and preparation directories must be canonical direct children of
  `/srv/nuaafa/releases`; unexpected types, symlinks, traversal, dirty worktrees,
  incorrect origins, and mismatched HEADs are rejected.
- `.env.production` and `prisma/dev.db` may only be direct links to canonical
  shared regular files. Existing unexpected entries and link chains fail closed.
- `current` may be absent or a direct link to an existing owned
  `/srv/nuaafa/releases/<40-hex>` release. A regular file, directory, outside
  target, chain, or invalid name is rejected.
- The temporary current link is unique to the operation and SHA. Any collision
  is rejected without unlinking it.
- Staged provenance binds format, commit, allowed ref, fetched ref HEAD,
  repository, BUILD_ID SHA-256, and deployer version.
- No release cleanup uses `rm -rf`, and unrelated releases are not deleted.

## Validation and production boundary

Run the isolated matrix with `npm run test:deployer`; it uses temporary roots,
test remotes, fake shared files, and mocked service/database actions, never
`/srv/nuaafa`. The RC runner includes this matrix together with the production
hardening, content gate, backup/restore, Prisma, TypeScript, lint, Unicode,
R1/R1-2/R1-3A/R1-3B, build, and clean-install gates.

The reviewed future installation procedure is
[`docs/operations/R1-3D_DEPLOYER_BOOTSTRAP.md`](../../docs/operations/R1-3D_DEPLOYER_BOOTSTRAP.md).
Do not execute it without separate human Phase B authorization.

No production database, filesystem, environment, service, timer, deployer
installation, deployment, push, or merge change was performed by Fix-3B.
