import { writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStaticContentManifest, importStaticContentManifest } from "../src/lib/static-content-migration";

async function main() {
  const manifest = await buildStaticContentManifest();
  const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
  if (outputArg) await writeFile(path.resolve(outputArg.slice("--output=".length)), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (process.argv.includes("--import")) {
    if (process.env.NUAAFA_STATIC_IMPORT_ISOLATED !== "1") throw new Error("Import is locked. Set NUAAFA_STATIC_IMPORT_ISOLATED=1 only for an isolated database.");
    console.log(JSON.stringify({ manifest: { entries: manifest.entries.length, media: manifest.media.length, issues: manifest.issues }, reconciliation: await importStaticContentManifest(manifest) }, null, 2));
  } else {
    console.log(JSON.stringify({ dryRun: true, entries: manifest.entries.length, media: manifest.media.length, excludedSources: manifest.excludedSources, issues: manifest.issues }, null, 2));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
