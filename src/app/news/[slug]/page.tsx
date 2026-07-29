import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchiveGallery } from "@/components/competitions/archive/archive-gallery";
import { DetailPageLayout } from "@/components/templates/detail-page-layout";
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

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...officialMensCupNews, ...officialWomensCupNews].map((story) => ({ slug: story.id }));
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getMensCupNewsItem(slug) ?? getWomensCupNewsItem(slug);
  if (!story) return { robots: { index: false, follow: false } };
  const canonicalPath = `/news/${slug}`;
  return {
    title: story.title,
    description: story.summary,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      locale: "zh_CN",
      siteName: "南航天目湖足协",
      title: story.title,
      description: story.summary,
      url: canonicalPath,
      images: [{ url: story.image, alt: story.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.summary,
      images: [story.image],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const isWomensCupStory = Boolean(getWomensCupNewsItem(slug));
  const story = getMensCupNewsItem(slug) ?? getWomensCupNewsItem(slug);
  const article = getMensCupArticle(slug) ?? getWomensCupArticle(slug);
  if (!story || !article) notFound();

  const related = [...officialWomensCupNews, ...officialMensCupNews]
    .filter((item) => item.id !== story.id)
    .slice(0, 3)
    .map((item) => ({ title: item.title, href: item.href, meta: `${item.category} · ${item.dateLabel}` }));

  return (
    <DetailPageLayout
      eyebrow={isWomensCupStory ? "OFFICIAL NEWS / 2026 WOMEN'S CUP" : "OFFICIAL NEWS / 2026 MEN'S CUP"}
      title={story.title}
      description={story.summary}
      statusLabel={isWomensCupStory ? "正式报道 · 来源已确认" : "正式报道 · 官方数据"}
      meta={{ source: story.source ?? "湖区FA公众号", published: story.dateLabel, updated: story.dateLabel }}
      attachments={[{
        label: isWomensCupStory ? "2026女子足球院际杯赛事档案" : "2026男子足球院际杯完整赛事档案",
        href: isWomensCupStory ? "/competitions/2026-womens-intercollege-cup" : "/competitions/2026-mens-intercollege-cup",
      }]}
      related={related}
    >
      <figure className="detail-story-figure">
        <Image src={story.image} alt={story.imageAlt} fill sizes="(max-width: 720px) 100vw, 780px" />
      </figure>
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
      {isWomensCupStory ? (
        <>
          <h2>赛事影像</h2>
          <ArchiveGallery images={womensCupGallery} ariaLabel="2026女子足球院际杯收官报道原始照片" className="detail-archive-gallery" />
          <blockquote>本文依据NUAA湖畔印象报道与协会原始照片重新整理；逐场数据及完整名单后续补充。</blockquote>
        </>
      ) : (
        <blockquote>本文数据来自赛事秩序册、足球中国赛事后台及湖区FA公众号归档资料。</blockquote>
      )}
    </DetailPageLayout>
  );
}
