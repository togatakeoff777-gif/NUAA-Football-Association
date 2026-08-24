import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildStaticContentManifest,
  importStaticContentManifest,
  reconcileStaticContentManifest,
} from "../src/lib/static-content-migration";
import { assertProductionStaticContentPreflight } from "../src/lib/static-content-import-preflight";

async function main() {
  const isolatedImport = process.argv.includes("--import");
  const production = process.argv.includes("--production");
  const apply = process.argv.includes("--apply");
  const reconcile = process.argv.includes("--reconcile");
  if (isolatedImport && (production || apply || reconcile)) {
    throw new Error("Isolated --import cannot be combined with the production import gate.");
  }
  if ((apply || reconcile) && !production) throw new Error("--apply and --reconcile require --production.");
  if (apply && reconcile) throw new Error("Use production apply and reconciliation as separate commands.");

  const manifest = await buildStaticContentManifest();
  const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
  if (outputArg) await writeFile(path.resolve(outputArg.slice("--output=".length)), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (isolatedImport) {
    if (process.env.NUAAFA_STATIC_IMPORT_ISOLATED !== "1") throw new Error("Import is locked. Set NUAAFA_STATIC_IMPORT_ISOLATED=1 only for an isolated database.");
    console.log(JSON.stringify({ manifest: { entries: manifest.entries.length, media: manifest.media.length, issues: manifest.issues }, reconciliation: await importStaticContentManifest(manifest) }, null, 2));
    return;
  }
  if (production) {
    if (apply && process.env.NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY !== "1") {
      throw new Error("Production import apply is locked. Both --apply and NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY=1 are required.");
    }
    const preflight = await assertProductionStaticContentPreflight(manifest);
    if (apply) {
      const reconciliationResult = await importStaticContentManifest(manifest);
      if (reconciliationResult.differences.length) throw new Error("Production content import reconciliation failed after apply.");
      console.log(JSON.stringify({ production: true, applied: true, preflight, reconciliation: reconciliationResult }, null, 2));
      return;
    }
    if (reconcile) {
      const reconciliationResult = await reconcileStaticContentManifest(manifest);
      if (reconciliationResult.differences.length) throw new Error("Production content reconciliation found differences.");
      console.log(JSON.stringify({ production: true, applied: false, reconciliationOnly: true, preflight, reconciliation: reconciliationResult }, null, 2));
      return;
    }
    console.log(JSON.stringify({ production: true, dryRun: true, authorizedApplyEnvironmentPresent: process.env.NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY === "1", preflight }, null, 2));
    return;
  }
  console.log(JSON.stringify({ dryRun: true, entries: manifest.entries.length, media: manifest.media.length, excludedSources: manifest.excludedSources, issues: manifest.issues }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
