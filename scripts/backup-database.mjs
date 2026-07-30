import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.startsWith("file:")) {
  console.error("DATABASE_URL must be an explicit file: SQLite URL.");
  process.exit(1);
}

const source = path.resolve(databaseUrl.slice("file:".length));
try {
  await stat(source);
} catch {
  console.error("SQLite database file does not exist.");
  process.exit(1);
}

const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backupDirectory = path.resolve("backups");
await mkdir(backupDirectory, { recursive: true });
const destination = path.join(backupDirectory, `${path.basename(source)}.${stamp}.bak`);
await copyFile(source, destination);
console.log(destination);
