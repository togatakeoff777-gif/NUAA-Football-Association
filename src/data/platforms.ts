import type { PlatformItem } from "@/types";

export const WECHAT_QR_IMAGE = "/images/huqu-fa-wechat-qr.jpg";
export const BILIBILI_PROFILE_URL =
  "https://space.bilibili.com/1030999538?spm_id_from=333.337.0.0";
export const FOOTBALL_CHINA_URL = "http://www.lyzg90.com/";
export const ASSOCIATION_EMAIL = "nuaafootball@163.com";
export const DOUYIN_ID = "nuaafa";
export const DOUYIN_QR_IMAGE = "/images/media/nuaafa-douyin-qr-cropped.png";

export const wechatPlatform = {
  id: "wechat",
  kind: "wechat",
  name: "湖区FA",
  label: "微信公众号",
  description:
    "关注“湖区FA”，获取赛事报名、赛程通知、比赛战报、协会活动和招新信息。",
  qrImage: WECHAT_QR_IMAGE,
  qrAlt: "微信公众号“湖区FA”二维码",
  interactionLabel: "点击放大二维码",
  external: false,
} as const;

export const bilibiliPlatform = {
  id: "bilibili",
  kind: "bilibili",
  name: "南航大足球协会",
  label: "南航校园足球共享视频平台",
  description:
    "观看南航校园足球比赛集锦、全场录像、赛事回顾和人物影像。本账号由相关校区足球组织共同使用。",
  href: BILIBILI_PROFILE_URL,
  linkLabel: "前往哔哩哔哩主页",
  external: true,
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

export const douyinPlatform = {
  id: "douyin",
  kind: "douyin",
  name: "南航足协",
  label: `抖音号：${DOUYIN_ID}`,
  description: "南京航空航天大学天目湖足球协会独立官方抖音账号。",
  qrImage: DOUYIN_QR_IMAGE,
  qrAlt: "南航足协抖音号 nuaafa 官方二维码",
  interactionLabel: "点击放大二维码",
  qrStatus: "官方二维码",
  href: "/media#douyin",
  linkLabel: "查看抖音二维码",
  external: false,
} as const;

export const footballChinaPlatform = {
  id: "football-china",
  kind: "football-china",
  name: "足球中国",
  label: "校内足球竞赛管理平台入口",
  description:
    "南京航空航天大学校内足球赛事使用“足球中国”平台完成球员注册、球队组建、赛事报名及相关竞赛管理。",
  scopeNotice:
    "当前链接仅为足球中国平台入口，不是天目湖专属赛事页面。",
  securityNotice: "该外部平台当前提供 HTTP 入口，请留意浏览器安全提示。",
  href: FOOTBALL_CHINA_URL,
  linkLabel: "前往足球中国注册报名",
  external: true,
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

export const emailPlatform = {
  id: "email",
  kind: "email",
  name: "协会邮箱",
  label: ASSOCIATION_EMAIL,
  description: "用于赛事与报名咨询、协会合作、内容纠错和网站问题反馈。",
  href: `mailto:${ASSOCIATION_EMAIL}`,
  linkLabel: "发送邮件",
  uses: ["赛事与报名咨询", "协会合作", "内容纠错", "网站问题反馈"],
  external: false,
} as const;

export const officialPlatforms = [
  wechatPlatform,
  bilibiliPlatform,
  douyinPlatform,
  footballChinaPlatform,
  emailPlatform,
] as const satisfies readonly PlatformItem[];

export const platforms = officialPlatforms;
