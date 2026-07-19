import type { Metadata } from "next";

import { DetailPageLayout } from "@/components/templates/detail-page-layout";
import { demoNews } from "@/data/content";

export const metadata: Metadata = { title: "演示新闻详情", description: "新闻详情模板演示页面。" };

export default function DemoNewsDetailPage() {
  const story = demoNews[0];
  return (
    <DetailPageLayout eyebrow="NEWS DETAIL / DEMO" title={story.title} description={story.summary} meta={{ source: "南京航空航天大学天目湖足球协会（演示）", published: story.dateLabel, updated: "演示更新时间" }} attachments={[]} related={[{ title: "返回新闻与公告列表", href: "/news", meta: "内容列表" }, { title: "查看赛程与赛果", href: "/competitions/schedule", meta: "赛事数据" }]}>
      <p className="detail-article-lead">这是 V2.1 详情模板的演示页面，用于验证标题、来源、发布日期、更新时间、正文、附件和相关内容的统一结构。</p>
      <h2>比赛信息将在核验后发布</h2>
      <p>当前页面不对应真实比赛，也不使用未经确认的球队、球员、比分或时间。正式战报需要在赛事信息完成核验后，由协会按统一内容流程发布。</p>
      <blockquote>演示内容不代表真实历史记录；如需了解最新安排，请以协会正式公告为准。</blockquote>
      <h2>详情模板的后续用途</h2>
      <p>该结构可以继续用于新闻详情、公告详情、赛事详情、比赛详情和文件详情。后续接入内容系统时，页面主体仍可保持服务端渲染，仅对筛选、分页等必要交互增加局部客户端组件。</p>
    </DetailPageLayout>
  );
}
