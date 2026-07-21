import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailPageLayout } from "@/components/templates/detail-page-layout";
import {
  getMensCupArticle,
  getMensCupNewsItem,
  officialMensCupNews,
} from "@/data/mens-intercollege-cup-2026";

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return officialMensCupNews.map((story) => ({ slug: story.id }));
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getMensCupNewsItem(slug);
  if (!story) return {};
  return { title: story.title, description: story.summary };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const story = getMensCupNewsItem(slug);
  const article = getMensCupArticle(slug);
  if (!story || !article) notFound();

  const related = officialMensCupNews
    .filter((item) => item.id !== story.id)
    .slice(0, 3)
    .map((item) => ({ title: item.title, href: item.href, meta: `${item.category} · ${item.dateLabel}` }));

  return (
    <DetailPageLayout
      eyebrow="OFFICIAL NEWS / 2026 MEN'S CUP"
      title={story.title}
      description={story.summary}
      statusLabel="正式报道 · 官方数据"
      meta={{ source: story.source ?? "湖区FA公众号", published: story.dateLabel, updated: story.dateLabel }}
      attachments={[{ label: "2026男子足球院际杯完整赛事档案", href: "/competitions/2026-mens-intercollege-cup" }]}
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
      <blockquote>本文数据来自赛事秩序册、足球中国赛事后台及湖区FA公众号归档资料。</blockquote>
    </DetailPageLayout>
  );
}
