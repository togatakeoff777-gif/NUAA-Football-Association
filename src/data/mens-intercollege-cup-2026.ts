import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import competition from "@/data/archives/2026-mens-intercollege-cup/competition.json";
import imageSourceIndex from "@/data/archives/2026-mens-intercollege-cup/image-source-index.json";
import matches from "@/data/archives/2026-mens-intercollege-cup/matches.json";
import news from "@/data/archives/2026-mens-intercollege-cup/news.json";
import officials from "@/data/archives/2026-mens-intercollege-cup/officials.json";
import standings from "@/data/archives/2026-mens-intercollege-cup/standings.json";
import statistics from "@/data/archives/2026-mens-intercollege-cup/statistics.json";
import teams from "@/data/archives/2026-mens-intercollege-cup/teams.json";
import type { NewsCategory, NewsItem } from "@/types";

const sharedMetadata = {
  campus: "tianmuhu",
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
} as const;

const imageAltByStoryId: Record<string, string> = {
  "2026-mens-cup-joint-meeting": "2026男子足球院际杯赛前联席会议现场",
  "2026-mens-cup-final-preview": "天目湖校区西操场晚霞与足球",
  "2026-mens-cup-final-live": "2026男子足球院际杯决赛直播预告海报",
  "2026-mens-cup-closing": "致慧书院夺得2026男子足球院际杯冠军后合影",
  "2026-mens-cup-final-report": "致慧书院球员在决赛点球大战获胜后庆祝",
};

export const officialMensCupNews: readonly NewsItem[] = news.map((item) => ({
  ...sharedMetadata,
  id: item.id,
  category: item.category as NewsCategory,
  dateLabel: item.date,
  title: item.title,
  summary: item.summary,
  image: item.image,
  imageAlt: imageAltByStoryId[item.id] ?? "2026男子足球院际杯新闻配图",
  href: item.href,
  dataStatus: "confirmed" as const,
  badge: "官方报道",
  source: item.source,
}));

export type MensCupArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: readonly string[] };

export type MensCupArticle = {
  id: string;
  blocks: readonly MensCupArticleBlock[];
};

export const mensCupArticles: readonly MensCupArticle[] = [
  {
    id: "2026-mens-cup-joint-meeting",
    blocks: [
      { type: "paragraph", text: "2026年南京航空航天大学男子足球院际杯（天目湖校区）于3月20日正式开幕。赛前联席会议围绕赛程与场地安排、参赛资格核验、奖项设置、保险与纪律保障等事项进行了说明。" },
      { type: "paragraph", text: "本届赛事在天目湖校区西操场举行，由南京航空航天大学体育部等单位主办，南京航空航天大学天目湖学生足球协会承办。赛事共有8支球队参赛，采用两个小组单循环加淘汰赛的赛制。" },
      { type: "paragraph", text: "A组：民航通飞联队、致慧书院、数学学院、电信-人文-计算机联队。" },
      { type: "paragraph", text: "B组：经管-继教联队、致微-致和书院联队、自动化学院、致元书院。" },
      { type: "paragraph", text: "各组前两名晋级淘汰赛，最终通过半决赛、三四名决赛和决赛产生冠军。" },
    ],
  },
  {
    id: "2026-mens-cup-final-preview",
    blocks: [
      { type: "paragraph", text: "经过小组赛和淘汰赛的角逐，民航通飞联队与致慧书院会师2026年男子足球院际杯决赛。" },
      { type: "paragraph", text: "比赛日为2026年5月17日，地点为天目湖校区西操场。13:30进行赛前活动，14:00正式开球。" },
      { type: "paragraph", text: "民航通飞联队以小组第一身份晋级，并在半决赛中4:1战胜致微-致和书院联队。致慧书院在小组赛后稳步提升，于半决赛3:1击败经管-继教联队。" },
      { type: "paragraph", text: "两支球队将在绿茵场上争夺本届赛事冠军。" },
    ],
  },
  {
    id: "2026-mens-cup-final-live",
    blocks: [
      { type: "paragraph", text: "民航通飞联队 VS 致慧书院" },
      { type: "list", items: ["开球时间：2026年5月17日14:00", "比赛地点：南京航空航天大学天目湖校区西操场", "直播平台：Bilibili「南航大足球协会」"] },
      { type: "paragraph", text: "欢迎关注这场校园足球巅峰对决。" },
    ],
  },
  {
    id: "2026-mens-cup-closing",
    blocks: [
      { type: "paragraph", text: "2026年南京航空航天大学男子足球院际杯（天目湖校区）正式落幕。16场比赛共打入69粒进球，8支球队、169名参赛球员共同完成了本届赛事。" },
      { type: "paragraph", text: "决赛中，致慧书院与民航通飞联队在常规时间战成2:2。经过八轮点球大战，致慧书院以8:7取胜，以总比分10:9夺得冠军。" },
      { type: "heading", text: "最终名次" },
      { type: "list", items: ["1. 致慧书院", "2. 民航通飞联队", "3. 经管-继教联队", "4. 致微-致和书院联队"] },
      { type: "heading", text: "个人奖项" },
      { type: "list", items: ["金球奖：黄敬瀚（致慧书院）", "金靴奖：刘晋毅（民航通飞联队）", "金手套奖：石瑞峰（致慧书院）", "金哨奖：颜铭宣"] },
      { type: "heading", text: "决赛裁判组" },
      { type: "list", items: ["比赛监督：郭洪波", "裁判监督：陈爽", "裁判员：王相翰", "第一助理裁判员：颜铭宣", "第二助理裁判员：吴佳宇", "第四官员：石翔宇", "候补助理裁判员：高羽键"] },
    ],
  },
  {
    id: "2026-mens-cup-final-report",
    blocks: [
      { type: "paragraph", text: "5月17日下午，2026年南京航空航天大学男子足球院际杯决赛在天目湖校区西操场举行。民航通飞联队与致慧书院在常规时间战成2:2，致慧书院在点球大战中8:7获胜。" },
      { type: "paragraph", text: "第7分钟，民航通飞联队17号刘晋毅率先破门。第25分钟，10号金成俊补射得分，将领先优势扩大到两球。" },
      { type: "paragraph", text: "第34分钟，致慧书院10号黄敬瀚以一记远射扳回一城。第41分钟，黄敬瀚送出助攻，14号李靖愷将比分追成2:2。" },
      { type: "paragraph", text: "常规时间结束后，比赛进入点球大战。双方前七轮全部命中。第八轮，民航通飞联队徐嘉乐的射门被石瑞峰扑出，随后致慧书院李欣睿罚入制胜点球。" },
      { type: "paragraph", text: "致慧书院以点球8:7、总比分10:9赢得决赛，夺得本届赛事冠军。" },
    ],
  },
];

export const mensIntercollegeCup2026 = {
  competition,
  teams,
  matches,
  standings,
  statistics,
  officials,
  news: officialMensCupNews,
  imageSourceIndex,
} as const;

export type MensCupMatch = (typeof matches)[number];
export type MensCupTeam = (typeof teams)[number];
export type MensCupStandingGroup = (typeof standings.groups)[number];

export function getMensCupArticle(id: string) {
  return mensCupArticles.find((article) => article.id === id);
}

export function getMensCupNewsItem(id: string) {
  return officialMensCupNews.find((item) => item.id === id);
}
