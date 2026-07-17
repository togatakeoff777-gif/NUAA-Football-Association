import type { Metadata } from "next";
import "./globals.css";
import "@/styles/layout.css";
import "@/styles/home.css";
import "@/styles/detail-pages.css";

export const metadata: Metadata = {
  title: {
    default: "南京航空航天大学天目湖足球协会",
    template: "%s | 南航天目湖足协",
  },
  description:
    "南京航空航天大学天目湖足球协会网站，发布天目湖校区足球赛事、新闻公告、裁判规则与参赛信息。",
  keywords: [
    "南京航空航天大学",
    "天目湖足球协会",
    "南航天目湖足协",
    "校园足球",
    "NUAA Tianmuhu Football Association",
  ],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "南航天目湖足协",
    title: "南京航空航天大学天目湖足球协会",
    description: "因热爱，奔赴绿茵。服务天目湖校园足球，EST. 2021。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
