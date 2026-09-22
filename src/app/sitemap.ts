import type { MetadataRoute } from "next";

import { publishedNews, publicAnnouncements } from "@/data/content";
import { getPublicCompetitionCatalog } from "@/lib/public-competition-service";
import { absoluteSiteUrl } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

const publicRoutes = [
  "/",
  "/association",
  "/competitions",
  "/competitions/2026-mens-intercollege-cup",
  "/competitions/2026-womens-intercollege-cup",
  "/competitions/arbitration",
  "/competitions/files",
  "/competitions/history",
  "/competitions/schedule",
  "/competitions/scorers",
  "/competitions/standings",
  "/join",
  "/media",
  "/news",
  "/participation",
  "/participation/event-guide",
  "/participation/join-association",
  "/participation/join-media",
  "/participation/team-manager-guide",
  "/referees",
  "/referees/assignments",
  "/referees/directory",
  "/referees/history",
  "/referees/open-matches",
  "/referees/recruitment",
  "/referees/resources/competition-rules",
  "/referees/resources/training",
  "/referees/resources/work-files",
  "/teams",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const competitions = await getPublicCompetitionCatalog();
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((pathname) => ({
    url: absoluteSiteUrl(pathname),
    changeFrequency: pathname === "/" || pathname === "/news" ? "weekly" : "monthly",
    priority: pathname === "/" ? 1 : pathname.split("/").length === 2 ? 0.8 : 0.6,
  }));

  const newsEntries: MetadataRoute.Sitemap = [
    ...publishedNews,
    ...publicAnnouncements.filter((item) => item.href.startsWith("/news/")),
  ].map((story) => ({
    url: absoluteSiteUrl(story.href),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const competitionEntries: MetadataRoute.Sitemap = competitions.map((competition) => ({
    url: absoluteSiteUrl(competition.detailHref),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...competitionEntries, ...newsEntries];
}
