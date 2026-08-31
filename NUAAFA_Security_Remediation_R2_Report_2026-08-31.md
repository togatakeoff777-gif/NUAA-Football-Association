# NUAAFA Security Remediation R2 Report

Date: 2026-08-31 (Asia/Shanghai)

Scope: F-005 and F-010 only

Overall verdict: **F-005 FIXED / F-010 FIXED**

## A. Baseline

- R1 commit / starting HEAD: `75338bcd2d4ca6b53f146626bce66b9923714506`
- Parent: `dfecb6edbb95e7b844cddbf8b42ef488382ff8d4`
- Runtime: Node `v22.23.2`, npm `10.9.8`, Next.js `16.3.2`, Prisma CLI `7.9.1`
- The accepted R2 measurement tree and reports remain unchanged in the separate `v2-9-runtime-verification-r2` worktree.

No Phase 1/R1 finding other than F-005 and F-010 was remediated in this round.

## B. Branch / worktree

- Worktree: `D:\WebProjects\NUAA-Football-Association\v2-9-runtime-remediation-r2`
- Branch: `security/v2.9-runtime-remediation-r2`
- Created as a clean sibling worktree from the exact R1 commit.

## C. Exact files changed

Product code:

- `src/lib/referee-security.ts`
- `src/lib/referee-credentials.ts`
- `src/lib/referee-auth.ts`
- `src/lib/competition-import-types.ts`
- `src/lib/competition-import-parser.ts`
- `src/lib/competition-import-xlsx-security.ts`

Test and gate tooling:

- `package.json`
- `scripts/test-security-runtime-r2.ts`
- `scripts/test-security-runtime-r2-worker.ts`
- `scripts/test-security-runtime-r2-timing.ts`
- `scripts/test-security-runtime-r2-f010.ts`
- `scripts/test-security-runtime-r2-resource.ts`
- `scripts/security-r2-resource-metrics.mjs`
- `scripts/test-competition-import-http-runtime.ts`
- `scripts/test-competition-import-http.ts`

Evidence:

- `security-remediation-r2/F-005.md`
- `security-remediation-r2/F-010.md`
- `security-remediation-r2/GATES.md`
- `NUAAFA_Security_Remediation_R2_Report_2026-08-31.md`

No package lock, Prisma schema, migration, generated Prisma client, application route, production configuration, Nginx, TLS, DNS, or deployment file changed.

## D. F-005 implementation

- Added a fixed valid-format dummy scrypt hash with the same 16-byte salt and 64-byte derived-key format as production hashes. It is unrelated to production secrets or real accounts.
- Added strict usable-hash recognition.
- Admin and referee authentication perform exactly one password verifier call:
  - eligible account with a usable hash: real hash;
  - nonexistent, inactive, missing hash, or unusable hash: dummy hash.
- Legacy admin authentication also uses the dummy hash if its configured hash is absent/unusable.
- Blank legacy username selection was adjusted to avoid accidentally performing two KDFs.
- Generic errors, 401 status, rate-limit identity, five-failure threshold, 15-minute lock, and existing failure-delay behavior were not changed.

No sleep-based timing patch was used.

## E. F-005 deterministic tests

The isolated SQLite regression proves exactly one verifier invocation for:

- admin nonexistent;
- admin active + wrong password;
- admin inactive;
- admin unusable hash;
- referee nonexistent;
- referee active + wrong password;
- referee inactive;
- referee missing hash.

It also proves the dummy hash shape, failed verification against it, and successful valid admin/referee login. Result: **PASS**.

## F. F-005 runtime before / after

Bounded production-mode localhost method: six disposable identities per class, two attempts each, 12 samples per class, four warm-ups, randomized within failure ordinal, 48 measured requests total.

| Comparison | Accepted R2 gap | Remediation gap | P(active slower) | Cliff's delta | Complete separation |
|---|---:|---:|---:|---:|---|
| admin active-wrong vs nonexistent | 54.127 ms | 0.522 ms | 0.5000 | 0.0000 | No |
| referee active-wrong vs nonexistent | 48.908 ms | 2.401 ms | 0.6667 | 0.3333 | No |

The gate forbids complete separation and uses a non-flaky 25 ms maximum absolute identity-median difference. Result: **PASS**. Full raw group statistics are in `security-remediation-r2/F-005.md`.

## G. F-010 implementation

- Multipart requests now require a valid positive decimal `Content-Length` before `request.formData()`.
- CSV/TSV/Paste now use a single-pass field-slice parser and directly emit mapped rows instead of retaining both a complete cell matrix and mapped row graph.
- Added 32-column and 2,048-character-per-cell contracts while preserving the 5 MiB and 5,000-row business limits.
- Added a bounded OOXML ZIP preflight before `read-excel-file`.
- Added an isolated production resource harness with per-case fresh servers and a 512 MiB safety ceiling.
- No new third-party dependency was added.

The parser-to-normalized-rows interface and all downstream validation, exact reconciliation, preview, transaction, stable-slug, Asia/Shanghai, conflict, and idempotency behavior remain unchanged.

## H. Multipart boundary

Pre-`formData()` policy:

- missing / chunked without length: 411;
- invalid, zero, negative, or unsafe length: 400;
- above 5 MiB plus 256 KiB multipart allowance: 413.

A trap test proves these decisions happen before `formData()`. A production-mode HTTP suite using native `fetch(FormData)` successfully completed normal preview and commit, proving the formal browser-style upload supplies a usable length header. An actual chunked request returned 411 before multipart parsing.

## I. CSV memory before / after

Identical valid input: 4,894,904 bytes, 4,500 rows, inside the 5 MiB contract.

| Metric | Accepted R2 before | R2 remediation after | Change |
|---|---:|---:|---:|
| RSS increase | 188,035,072 bytes | 39,542,784 bytes | -148,492,288 bytes / -78.97% |
| Wall time | 359.796 ms | 66.912 ms | -292.884 ms |

The comparative gate required at least a 50% RSS-delta reduction; it passed. This result is evidence for this fixed fixture/environment, not an absolute universal memory guarantee.

## J. XLSX resource preflight

Limits:

- compressed XLSX: 5 MiB;
- ZIP entries: 128;
- declared total uncompressed: 16 MiB;
- each parser-relevant XML entry: 8 MiB;
- per-entry and total compression ratio: 120:1;
- worksheets: 8;
- maximum dimension: 5,001 rows including header x 32 columns;
- worksheet cells: 160,032 total.

Normal deterministic fixture: 5 entries, 1,783 uncompressed bytes, 1.8:1 ratio, one 2x2 worksheet and four cells. This provides substantial headroom while the row/cell ceiling exactly preserves the maximum business contract.

The preflight is deliberately limited: it validates EOCD, central/local headers, safe paths, duplicates, encryption, supported compression, actual-vs-declared sizes of all XML entries used by `read-excel-file`, and worksheet dimensions/cells. Bounded Node zlib inflation is only attempted after metadata budgets pass; entries are handled sequentially and not retained. It is not a new general-purpose ZIP library.

## K. F-010 runtime before / after

Final production-mode results:

- normal CSV: 200, RSS `+573,440` bytes;
- normal XLSX: 200, RSS `+638,976` bytes;
- exact 5,000-row CSV: 200, RSS `+7,569,408` bytes;
- 4.67 MiB valid CSV: 200, RSS `+39,542,784` bytes;
- chunked/no-length CSV: 411, RSS `+495,616` bytes;
- declared above-envelope body: 413, RSS `+5,853,184` bytes;
- 2,138-byte high-ratio XLSX: 413 at compression-ratio preflight, RSS `+733,184` bytes.

The high-ratio case was rejected before worksheet inflation and before `read-excel-file`. A separate under-declared shared-strings XML fixture was rejected before that parser with 415. Team/Match/AuditLog counts remained `0/0/0`, and no safety stop fired.

## L. Competition Import regression

- Existing parser/service suite: PASS.
- Existing production-mode HTTP suite: PASS after adding its missing isolated startup wrapper.
- Normal CSV, XLSX, Paste: PASS.
- Preview zero writes: PASS.
- RBAC and Origin: PASS.
- Exact match / no fuzzy merge / conflicts do not overwrite: PASS.
- Stable slug / Asia-Shanghai / transaction / race handling / idempotency: PASS.
- Native `fetch(FormData)` compatibility: PASS.
- Synthetic boundary suite: compressed bytes, rows, columns, cell length, ZIP count, total size, XML size, ratio, dimension, cell count, and under-declared XML all PASS.

## M. R1 regression

All mandated R1 remediation suites passed:

- F-001 required-password member API boundary;
- F-002 CSV formula neutralization;
- F-003 admission anti-abuse and zero-write limits;
- F-004 safe expected/unexpected API errors;
- F-007 trusted proxy identity and login limiter identity;
- F-009 disabled Nginx candidate contract;
- F-011 terminal appointment transitions;
- F-012 republish reconciliation.

Unified Admin R1/R1-2, RBAC, migration, Referee R1/R1-3A/migrations/fresh deploy/flow/fix2/fix3/fix5/deletion, deployer, production hardening, static content gate, restore rehearsal, and clean-install tests also passed.

## N. SEC-01..04

- SEC-01 required-password RSC/API leak: PASS.
- SEC-02 PRIVATE Media bypass: PASS.
- SEC-03 `/referees/admin` compatibility and RBAC: PASS.
- SEC-04 login/password internal error leakage: PASS.

The production-mode matrix exercised HTML, RSC, canonical/legacy API, multiple roles, required-password sessions, media authorization, redirects, and injected database failures.

## O. Prisma / schema / migration

- Prisma format: PASS.
- Prisma validate: PASS.
- Prisma generate: PASS.
- Prisma schema change: NO.
- Migration added/modified: NO.
- Generated client diff: NO.
- `package-lock.json` diff: NO.
- Dependency version change: NO.

The documented advisory remains unchanged: `prisma@7.9.1 -> @prisma/config@7.9.1 -> deepmerge-ts@7.1.5`, three high / zero critical, `GHSA-ggr8-5vv4-36mx`. No audit fix or Prisma change was performed.

## P. Build / RC

Pre-commit substantive RC gates:

- clean-install reproducibility: PASS (558 packages, Node 22.23.2);
- Prisma format/validate/generate: PASS;
- Next typegen: PASS;
- TypeScript `--noEmit`: PASS;
- full ESLint: PASS;
- Unicode safety: PASS;
- `git diff --check`: PASS;
- all selected existing/new regressions: PASS;
- production build: PASS, 79/79 static-page generation;
- restore/application rehearsal: PASS;
- dependency advisory disposition: `READY_WITH_DOCUMENTED_ADVISORY` equivalent.

The repository's official `npm run rc:check` requires a clean tree and was therefore executed after the single authorized local commit, consistent with the existing R1 gate contract. The accepted run completed all 33 gates, ended with a final clean-tree check, and returned `READY_WITH_DOCUMENTED_ADVISORY`.

An initial attempt stopped at a transient npm registry TLS connection failure. Another attempt printed the complete passing `test:referee-r1-3a` assertion payload but encountered a Windows `0xC0000005` post-assertion process exit; the suite then exited zero standalone. The accepted full RC exited zero. No code, dependency, fixture scale, or threshold changed between these retries.

## Q. Git diff

Pre-commit audit:

- change set is limited to F-005/F-010 product code, their isolated tests, the Competition Import HTTP test runner, checkpoints, and this report;
- package lock, Prisma schema/migrations/generated client: no diff;
- `git diff --check`: PASS (Windows line-ending notices only, no whitespace error);
- no unrelated user change was removed or overwritten.

## R. Local commit

Completed subject: `fix(security): close runtime verification findings`

One reachable branch commit contains the R2 remediation. This report is part of that commit, so it cannot embed its own Git SHA without a recursive content/hash change. The exact final SHA is therefore recorded in the final human handoff and can be verified with `git rev-parse HEAD`. The branch is not pushed or merged.

## S. Production unchanged

- Production modified: NO.
- Production SSH write: NO.
- Production DB write: NO.
- Push: NO.
- Merge: NO.
- Deploy: NO.
- Migration: NO.
- DNS/Nginx/TLS change: NO.

All runtime tests used localhost, disposable SQLite data, disposable identities, and temporary upload roots.

## T. Remaining findings

- F-005: **FIXED**.
- F-010: **FIXED**.
- R1-remediated F-001/F-002/F-003/F-004/F-007/F-009/F-011/F-012 remain PASS in regression.
- SEC-01..04 remain PASS.
- The documented Prisma/deepmerge advisory remains accepted and unchanged; remediation was expressly outside this round.
- R2 did not reassess, reopen, or remediate other Phase 1 items and did not start R3.

Official post-commit clean-tree RC: PASS. **SECURITY REMEDIATION R2: READY FOR HUMAN REVIEW**.
