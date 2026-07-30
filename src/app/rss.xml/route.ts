import { publishedNews, publicAnnouncements } from "@/data/content";
import { absoluteSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const items = [
    ...publishedNews,
    ...publicAnnouncements.filter((item) => item.href.startsWith("/news/")),
  ].sort((left, right) => right.dateLabel.localeCompare(left.dateLabel));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(SITE_NAME)}</title>
    <link>${absoluteSiteUrl("/")}</link>
    <description>${xml(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    ${items.map((item) => `<item>
      <title>${xml(item.title)}</title>
      <link>${absoluteSiteUrl(item.href)}</link>
      <guid isPermaLink="true">${absoluteSiteUrl(item.href)}</guid>
      <description>${xml(item.summary)}</description>
      <pubDate>${new Date(("publishedAt" in item && item.publishedAt) || `${item.dateLabel.replaceAll(".", "-")}T12:00:00+08:00`).toUTCString()}</pubDate>
    </item>`).join("\n    ")}
  </channel>
</rss>`;
  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=1800",
    },
  });
}
