export const SITE_ORIGIN = "https://nuaafa.cn";

export const SITE_NAME = "南京航空航天大学天目湖足球协会";

export const SITE_DESCRIPTION =
  "南京航空航天大学天目湖足球协会官方网站，发布天目湖校区足球赛事、新闻公告、裁判规则与参赛信息。";

export function absoluteSiteUrl(pathname: string) {
  return new URL(pathname, SITE_ORIGIN).toString();
}
