import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchiveGallery } from "@/components/competitions/archive/archive-gallery";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareActions } from "@/components/share/share-actions";
import { DetailPageLayout } from "@/components/templates/detail-page-layout";
import { DatabaseNewsDetail } from "@/components/database-news-detail";
import {
  freshmanCupPreparationNews,
  freshmanCupPreparationNotice,
  getFreshmanCupArticle,
  getFreshmanCupContentItem,
} from "@/data/freshman-cup-2026";
import {
  getMensCupArticle,
  getMensCupNewsItem,
  officialMensCupNews,
} from "@/data/mens-intercollege-cup-2026";
import {
  getWomensCupArticle,
  getWomensCupNewsItem,
  officialWomensCupNews,
  womensCupGallery,
} from "@/data/womens-intercollege-cup-2026";
import {
  disciplineDecisions,
  getDisciplineDecision,
  getDisciplineDecisionArticle,
} from "@/data/public-information";
import { newsArticleJsonLd } from "@/lib/structured-data";
import { SITE_NAME } from "@/lib/site-metadata";
import { getPublishedContentDetailBySlug } from "@/lib/admin-content-service";
import { isDatabaseContentSource } from "@/lib/content-source";

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return [
    freshmanCupPreparationNews,
    freshmanCupPreparationNotice,
    ...officialMensCupNews,
    ...officialWomensCupNews,
    ...disciplineDecisions,
  ].map((story) => ({ slug: story.id }));
}

function contentDate(dateLabel: string) {
  return `${dateLabel.replaceAll(".", "-")}T12:00:00+08:00`;
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isDatabaseContentSource()) {
    const post = await getPublishedContentDetailBySlug(slug);
    if (!post) return { robots: { index: false, follow: false } };
    const canonicalPath = `/news/${slug}`;
    const image = post.cover?.url ?? "/brand/nuaa-fa-logo.jpg";
    return {
      title: post.title,
      description: post.summary,
      alternates: { canonical: canonicalPath },
      openGraph: { type: "article", locale: "zh_CN", siteName: SITE_NAME, title: post.title, description: post.summary, url: canonicalPath, publishedTime: post.publishedAt.toISOString(), modifiedTime: post.updatedAt.toISOString(), images: [{ url: image, alt: post.cover?.altText ?? post.title }] },
      twitter: { card: "summary_large_image", title: post.title, description: post.summary, images: [image] },
    };
  }
  const story =
    getFreshmanCupContentItem(slug) ??
    getMensCupNewsItem(slug) ??
    getWomensCupNewsItem(slug) ??
    getDisciplineDecision(slug);
  if (!story) return { robots: { index: false, follow: false } };
  const canonicalPath = `/news/${slug}`;
  const image = "image" in story ? story.image : "/brand/nuaa-fa-logo.jpg";
  const imageAlt = "imageAlt" in story
    ? story.imageAlt
    : "南京航空航天大学天目湖足球协会正式标识";
  return {
    title: story.title,
    description: story.summary,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      locale: "zh_CN",
      siteName: SITE_NAME,
      title: story.title,
      description: story.summary,
      url: canonicalPath,
      publishedTime: "publishedAt" in story ? story.publishedAt : contentDate(story.dateLabel),
      modifiedTime: "updatedAt" in story ? story.updatedAt : contentDate(story.dateLabel),
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.summary,
      images: [image],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  if (isDatabaseContentSource()) return <DatabaseNewsDetail slug={slug} />;
  const isWomensCupStory = Boolean(getWomensCupNewsItem(slug));
  const isFreshmanCupStory = Boolean(getFreshmanCupContentItem(slug));
  const disciplineDecision = getDisciplineDecision(slug);
  const isDisciplineDecision = Boolean(disciplineDecision);
  const story =
    getFreshmanCupContentItem(slug) ??
    getMensCupNewsItem(slug) ??
    getWomensCupNewsItem(slug) ??
    disciplineDecision;
  const article =
    getFreshmanCupArticle(slug) ??
    getMensCupArticle(slug) ??
    getWomensCupArticle(slug) ??
    getDisciplineDecisionArticle(slug);
  if (!story || !article) notFound();

  const related = [
    freshmanCupPreparationNews,
    freshmanCupPreparationNotice,
    ...officialWomensCupNews,
    ...officialMensCupNews,
    ...disciplineDecisions,
  ]
    .filter((item) => item.id !== story.id)
    .slice(0, 3)
    .map((item) => ({ title: item.title, href: item.href, meta: `${item.category} · ${item.dateLabel}` }));

  const image = "image" in story ? story.image : "/brand/nuaa-fa-logo.jpg";
  const imageAlt = "imageAlt" in story
    ? story.imageAlt
    : "南京航空航天大学天目湖足球协会正式标识";
  const publishedAt = "publishedAt" in story
    ? story.publishedAt ?? contentDate(story.dateLabel)
    : contentDate(story.dateLabel);
  const updatedAt = "updatedAt" in story
    ? story.updatedAt ?? contentDate(story.dateLabel)
    : contentDate(story.dateLabel);

  return (
    <DetailPageLayout
      eyebrow={
        isDisciplineDecision
          ? "DISCIPLINARY DECISION / 纪律决定"
          : isFreshmanCupStory
          ? "2026 FRESHMAN CUP / OFFICIAL UPDATE"
          : isWomensCupStory
            ? "OFFICIAL NEWS / 2026 WOMEN'S CUP"
            : "OFFICIAL NEWS / 2026 MEN'S CUP"
      }
      title={story.title}
      description={story.summary}
      statusLabel={
        isDisciplineDecision
          ? "纪律决定 · 正式发布"
          : isFreshmanCupStory
          ? `${story.category} · 正式发布`
          : "正式报道 · 2026赛季已归档"
      }
      meta={{
        source: story.source ?? "湖区FA公众号",
        published: story.dateLabel,
        updated: story.dateLabel,
        sourceLabel: isDisciplineDecision ? "发布单位" : "来源",
      }}
      attachments={[{
        label: isDisciplineDecision
          ? "查看 / 下载处罚决定原件（PDF）"
          : isFreshmanCupStory
          ? "2026新生杯赛事详情"
          : isWomensCupStory
            ? "2026女子足球院际杯赛事档案"
            : "2026男子足球院际杯完整赛事档案",
        href: isDisciplineDecision && disciplineDecision
          ? disciplineDecision.pdfHref
          : isFreshmanCupStory
          ? "/competitions/freshman-cup"
          : isWomensCupStory
            ? "/competitions/2026-womens-intercollege-cup"
            : "/competitions/2026-mens-intercollege-cup",
      }]}
      related={related}
    >
      <JsonLd
        data={newsArticleJsonLd({
          title: story.title,
          summary: story.summary,
          path: `/news/${story.id}`,
          publishedAt,
          updatedAt,
          image,
        })}
      />
      <ShareActions title={story.title} text={story.summary} />
      {!isDisciplineDecision ? (
        <figure className={`detail-story-figure${isFreshmanCupStory ? " detail-story-figure-brand" : ""}`}>
          <Image src={image} alt={imageAlt} fill sizes="(max-width: 720px) 100vw, 780px" />
        </figure>
      ) : null}
      <p className="detail-article-lead">{story.summary}</p>
      {article.blocks.map((block, index) =>
        block.type === "paragraph" ? (
          <p key={`${story.id}-paragraph-${index}`}>{block.text}</p>
        ) : block.type === "heading" ? (
          <h2 key={`${story.id}-heading-${index}`}>{block.text}</h2>
        ) : (
          <ul className="detail-story-list" key={`${story.id}-list-${index}`}>
            {block.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ),
      )}
      {isFreshmanCupStory ? (
        <blockquote>报名时间、比赛日期、比赛场地、参赛资格和竞赛规程以协会后续正式公告为准。</blockquote>
      ) : isWomensCupStory ? (
        <>
          <h2>赛事影像</h2>
          <ArchiveGallery images={womensCupGallery} ariaLabel="2026女子足球院际杯收官报道原始照片" className="detail-archive-gallery" />
        </>
      ) : (
        <blockquote>本文数据来自赛事秩序册、足球中国赛事后台及湖区FA公众号归档资料。</blockquote>
      )}
    </DetailPageLayout>
  );
}
