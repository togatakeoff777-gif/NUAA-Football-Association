import type { MetadataRoute } from "next";

import { officialMensCupNews } from "@/data/mens-intercollege-cup-2026";
import { officialWomensCupNews } from "@/data/womens-intercollege-cup-2026";
import { absoluteSiteUrl } from "@/lib/site-metadata";

const publicRoutes = [
  "/",
  "/association",
  "/competitions",
  "/competitions/2026-mens-intercollege-cup",
  "/competitions/2026-womens-intercollege-cup",
  "/competitions/arbitration",
  "/competitions/cross-campus",
  "/competitions/current",
  "/competitions/files",
  "/competitions/freshman-cup",
  "/competitions/history",
  "/competitions/schedule",
  "/competitions/scorers",
  "/competitions/standings",
  "/competitions/tianmuhu-futsal-league",
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
  "/referees/resources/work-files",
  "/teams",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((pathname) => ({
    url: absoluteSiteUrl(pathname),
    changeFrequency: pathname === "/" || pathname === "/news" ? "weekly" : "monthly",
    priority: pathname === "/" ? 1 : pathname.split("/").length === 2 ? 0.8 : 0.6,
  }));

  const newsEntries: MetadataRoute.Sitemap = [
    ...officialMensCupNews,
    ...officialWomensCupNews,
  ].map((story) => ({
    url: absoluteSiteUrl(story.href),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...staticEntries, ...newsEntries];
}
