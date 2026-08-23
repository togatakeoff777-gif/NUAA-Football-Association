export type ContentSource = "static" | "database";

export function getContentSource(): ContentSource {
  return process.env.NUAAFA_CONTENT_SOURCE?.trim().toLowerCase() === "database" ? "database" : "static";
}

export function isDatabaseContentSource() {
  return getContentSource() === "database";
}
