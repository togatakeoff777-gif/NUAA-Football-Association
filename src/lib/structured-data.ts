import { associationIdentity } from "@/data/association";
import { ASSOCIATION_EMAIL } from "@/data/platforms";
import { absoluteSiteUrl, SITE_NAME, SITE_ORIGIN } from "@/lib/site-metadata";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: associationIdentity.englishName,
    url: SITE_ORIGIN,
    logo: absoluteSiteUrl("/brand/nuaa-fa-logo.jpg"),
    foundingDate: String(associationIdentity.establishedYear),
    email: ASSOCIATION_EMAIL,
    areaServed: "南京航空航天大学天目湖校区",
  };
}

export function newsArticleJsonLd(input: {
  title: string;
  summary: string;
  path: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    description: input.summary,
    url: absoluteSiteUrl(input.path),
    mainEntityOfPage: absoluteSiteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt,
    image: [absoluteSiteUrl(input.image)],
    author: organizationJsonLd(),
    publisher: organizationJsonLd(),
  };
}

export function sportsEventJsonLd(input: {
  name: string;
  description: string;
  path: string;
  status: "EventScheduled" | "EventCompleted" | "EventCancelled";
  startDate?: string;
  location?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: input.name,
    description: input.description,
    url: absoluteSiteUrl(input.path),
    eventStatus: `https://schema.org/${input.status}`,
    ...(input.startDate ? { startDate: input.startDate } : {}),
    ...(input.location
      ? { location: { "@type": "Place", name: input.location } }
      : {}),
    organizer: organizationJsonLd(),
  };
}
