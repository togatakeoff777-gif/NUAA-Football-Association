# NUAAFA Security Remediation R1 — pre-commit gate record

Date: 2026-08-31 (Asia/Shanghai)

Baseline: `dfecb6edbb95e7b844cddbf8b42ef488382ff8d4`

Worktree: `D:\WebProjects\NUAA-Football-Association\v2-9-security-remediation-r1`

Branch: `security/v2.9-phase1-r1`

Runtime: Node `v22.23.2`, npm `10.9.8`

## Finding status

- F-001: FIXED
- F-002: FIXED
- F-003: FIXED
- F-004: FIXED
- F-007: FIXED
- F-009: FIXED; disabled repository candidate only, proxy runtime activation remains outside R1 authority
- F-011: FIXED
- F-012: FIXED

## New R1 regression suites

- `test:security-csv`: PASS
- `test:security-admission`: PASS; trusted address, 7-day duplicate, shared NAT, concurrent duplicate serialization, fixed-window expiry/reset and 429 zero-write assertions passed. One earlier post-assertion Windows process crash was retried standalone and exited 0 with every assertion PASS
- `test:security-nginx`: PASS
- `test:security-appointments`: PASS; 30/30 matrix, 20/20 illegal transitions zero mutation
- `test:security-api-errors`: PASS
- `test:security-http`: PASS; production-mode application and isolated database-failure service

## Existing regression suites

- `test:unified-admin-r1`: PASS
- `test:unified-admin-r1-2`: PASS
- `test:unified-admin-rbac`: PASS
- `test:unified-admin-migration`: PASS
- `test:unified-admin-blockers:http`: PASS
- `test:referee-r1`: PASS
- `test:referee-admission`: PASS
- `test:referee-r1-3a`: PASS
- `test:referee-r1-3a:migration`: PASS
- `test:referee-r1-3a:migration:fresh`: PASS
- `test:referee-flow`: PASS after updating its source assertion to follow the new shared member guard
- `test:referee-fix2`: PASS
- `test:referee-fix3`: PASS
- `test:referee-fix5`: PASS
- `test:referee-match-deletion`: PASS
- `test:competition-import`: PASS
- `test:competition-import:http`: PASS against isolated fixture/dev smoke; production Origin behavior is covered separately
- `test:deployer`: PASS
- `test:production-hardening`: PASS
- `test:static-content-import-gate`: PASS

## Static, dependency, build and recovery gates

- clean-install reproducibility / isolated `npm ci`: PASS
- Prisma format: PASS
- Prisma validate: PASS
- Prisma generate: PASS
- Next.js typegen: PASS
- TypeScript `--noEmit`: PASS with fresh incremental cache
- ESLint: PASS
- Unicode safety: PASS
- `git diff --check`: PASS
- Node 22 production build: PASS; 79/79 static pages generated
- `restore:rehearsal`: PASS; checksums, database integrity, row counts and application HTTP probes passed
- dependency path: `prisma@7.9.1 -> @prisma/config@7.9.1 -> deepmerge-ts@7.1.5`
- `npm audit --json`: documented exception only, 3 high / 0 critical; no audit fix or dependency change

## SEC regression matrix

- SEC-01 Required-password RSC leak: PASS
- SEC-02 PRIVATE Media bypass: PASS
- SEC-03 `/referees/admin` compatibility/RBAC: PASS
- SEC-04 login/password internal error leakage: PASS

## Change boundaries

- Prisma schema changed: NO
- migration generated or changed: NO
- `package-lock.json` changed: NO
- dependency upgraded: NO
- production modified: NO
- push: NO
- merge: NO
- deploy: NO

The official `npm run rc:check` requires a clean tree. It will be executed after the single authorized local commit; this pre-commit record covers every substantive RC subgate before commit.
