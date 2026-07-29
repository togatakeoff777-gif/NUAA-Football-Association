import type { MetadataRoute } from "next";

import { absoluteSiteUrl, SITE_ORIGIN } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/referees",
        "/api/referees/",
        "/referees/admin",
        "/referees/admin/",
        "/referees/login",
        "/referees/workspace",
      ],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
