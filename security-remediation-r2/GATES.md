# NUAAFA Security Remediation R2 — Gate ledger

Date: 2026-08-31

Baseline: `75338bcd2d4ca6b53f146626bce66b9923714506`

This file is updated incrementally. `PENDING` is not a PASS.

| Gate | Status | Evidence |
|---|---|---|
| New sibling worktree / branch | PASS | `v2-9-runtime-remediation-r2`, `security/v2.9-runtime-remediation-r2` |
| Baseline HEAD / parent | PASS | HEAD `75338bcd...`; parent `dfecb6ed...` |
| R2 measurement worktree preserved | PASS | Separate `v2-9-runtime-verification-r2` retained |
| Node 22.23.2 | PASS | clean install and all current tests/build use `v22.23.2` |
| `npm ci` reproducibility | PASS | 558 packages installed; lockfile unchanged |
| F-005 deterministic KDF | PASS | 8 failure classes, exactly one real/dummy verifier call |
| F-005 production timing | PASS | no complete separation; controlled gaps 0.522 / 2.401 ms |
| F-005 verdict | FIXED | `F-005.md` |
| F-010 deterministic resource boundaries | PASS | CSV/multipart/XLSX boundary suite |
| F-010 production resource runtime | PASS | 4.67 MiB CSV RSS delta reduced 78.97%; chunked 411; ratio XLSX 413 |
| Existing Competition Import unit/service suite | PASS | parser/reconciliation/dry-run/transaction/race/idempotency |
| F-010 verdict | FIXED | `F-010.md` |
| Browser-style FormData HTTP compatibility | PASS | production-mode native `fetch(FormData)` preview/commit |
| Full Competition Import HTTP suite | PASS | page/RBAC/Origin/CSV/Paste/commit/idempotency/oversize |
| R1 F-001/2/3/4/7/9/11/12 regressions | PASS | all R1 security suites plus HTTP and appointment matrix |
| SEC-01/02/03/04 regressions | PASS | production-mode Unified Admin blocker matrix |
| Prisma format / validate / generate | PASS | no schema/client drift |
| Next typegen | PASS | route types generated |
| TypeScript `--noEmit` | PASS | full project |
| ESLint | PASS | full project after final product code |
| Unicode safety | PASS | final report/checkpoints included |
| `git diff --check` | PASS | final pre-commit diff; line-ending notices only |
| Production build | PASS | final product code; 79/79 static page generation |
| Official RC | PASS | 33 gates; `READY_WITH_DOCUMENTED_ADVISORY`; final clean tree |
| `package-lock.json` unchanged | PASS (checkpoint) | final rerun pending |
| Schema/migrations unchanged | PASS (checkpoint) | final rerun pending |
| Restore rehearsal | PASS | checksums/integrity/row counts/application HTTP probes |
| Isolated clean install | PASS | 558 packages; postinstall generate and validate |
| Dependency advisory disposition | PASS / DOCUMENTED | same 3 high, 0 critical; no dependency change |
| Unrelated diff absent | PASS (pre-report audit) | only F-005/F-010 product, test, checkpoint/report files |
| Local commit | PASS | one reachable branch commit; subject `fix(security): close runtime verification findings` |
| Push / merge / deploy / production change | NONE | prohibited |

The first official RC attempt stopped at a transient npm registry TLS connection failure. A later attempt reached `test:referee-r1-3a`, printed its complete passing assertion JSON, then hit a Windows `0xC0000005` post-assertion process exit; the same suite immediately exited zero standalone. The accepted official clean-tree RC then ran all 33 gates and exited zero with `READY_WITH_DOCUMENTED_ADVISORY`. These were environment/process retries only; no product, dependency, test threshold, or fixture change occurred between attempts.
