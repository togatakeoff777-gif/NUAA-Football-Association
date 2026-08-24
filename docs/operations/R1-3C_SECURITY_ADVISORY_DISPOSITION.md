# R1-3C Security Advisory Disposition

Assessment date: 2026-08-24 (Asia/Shanghai)

Classification: **KNOWN SECURITY ADVISORY — TEMPORARY ACCEPTED PRE-PRODUCTION EXCEPTION**

This disposition does not classify the dependency tree as security-clean. It permits R1-3C release-candidate validation only; R1-3D execution remains gated by a fresh official recheck.

## Finding

| Field | Current assessment |
| --- | --- |
| Advisory | GHSA-ggr8-5vv4-36mx / CVE-2026-40345 |
| Severity | High; GitHub reviewed; CVSS 4.0 score 8.2 |
| Weakness | CWE-674 uncontrolled recursion / stack exhaustion |
| Affected package | `deepmerge-ts < 8.0.0` |
| Installed package | `deepmerge-ts 7.1.5` |
| Patched upstream package | `deepmerge-ts 8.0.0`; latest observed `8.0.2` |
| Dependency path | `prisma 7.9.1 -> @prisma/config 7.9.1 -> deepmerge-ts 7.1.5` |
| Dependency type | `prisma` is a direct dev dependency; vulnerable path is Prisma CLI/config tooling |
| Current stable Prisma | `7.9.1` is the npm `latest` tag as assessed; `@prisma/config` latest is also `7.9.1` |
| Stable compatible fix | None available as assessed |

Commands re-run in this phase:

```text
npm audit
npm audit --json
npm ls prisma @prisma/config deepmerge-ts
npm view prisma version
npm view @prisma/config version
npm view deepmerge-ts version
```

Observed audit result: 3 High, 0 Critical. The three reported nodes are `prisma`, `@prisma/config`, and `deepmerge-ts`, all representing the same transitive advisory chain. The recorded JSON is in `docs/operations/evidence/npm-audit-2026-08-24.json`.

Observed versions:

```text
prisma latest:          7.9.1
@prisma/config latest:  7.9.1
deepmerge-ts latest:    8.0.2
```

## Reachability

The vulnerable function requires two recursive/cyclic object graphs at the same merge path. Plain JSON alone cannot create the recursive graph described by the advisory.

The installed `@prisma/config` imports `deepmerge` while loading local `prisma.config.ts`/JavaScript configuration through `c12`. Its configuration explicitly disables remote config extension, RC files, package.json config, and remote fetching. In this project the input is the version-controlled local Prisma configuration used by CLI/build/migration operators.

Consequences for this application:

- The vulnerable dependency is not imported by the Next.js HTTP application runtime or media/competition/referee request handlers.
- Untrusted remote request data has no identified path into this merge call.
- A party able to replace the local Prisma config already has local code/config modification capability.
- Plausible project exposure is Prisma CLI availability during trusted install, generate, validate, or migration operations—not confirmed remote production compromise, confidentiality loss, or database mutation.
- Severity remains **High** in the record; reachability analysis does not lower or hide the upstream severity.

## Compatibility decision

Rejected actions:

- `npm audit fix --force`, because npm proposes Prisma `6.12.0`, a breaking downgrade.
- A blind `deepmerge-ts` 8 override/resolution, because `@prisma/config 7.9.1` pins `7.1.5` and compatibility is not officially established.
- Prisma 8 RC/prerelease adoption.
- Manual `node_modules` changes or audit-output suppression.

Decision: keep the lockfile dependency structure unchanged for R1-3C, retain the finding as a documented pre-production exception, and continue only if all other RC gates pass.

## R1-3D mandatory gate

Before any R1-3D production action, re-run the six commands above and check the GitHub advisory, npm metadata, and official Prisma stable releases.

Exact gate label:

```text
RECHECK PRISMA / DEEPMERGE ADVISORY
```

If a stable compatible Prisma release is then available, R1-3D must pause for an isolated upgrade assessment covering Prisma Client, Prisma CLI, `@prisma/adapter-libsql`, generate, validate, migration deploy, the complete regression suite, and the Node 22 production build. If only an override, downgrade, or prerelease is available, production approval requires a renewed explicit risk decision.
