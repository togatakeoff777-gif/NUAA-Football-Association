export type HistoricalStanding = {
  position: number;
  team: string;
  record?: string;
  goals?: string;
  points?: number;
};

export type HistoricalCompetition = {
  id: string;
  name: string;
  format?: string;
  teamCount?: number;
  startDate?: string;
  venue?: string;
  final?: {
    home: string;
    away: string;
    score: string;
    date: string;
  };
  standings?: readonly HistoricalStanding[];
  note?: string;
  officials?: readonly { role: string; name: string }[];
};

export const historicalCompetitionYears: readonly {
  year: number;
  competitions: readonly HistoricalCompetition[];
}[] = [
  {
    year: 2025,
    competitions: [
      {
        id: "2025-freshman-cup",
        name: "2025年南京航空航天大学“跃动牧星·活力青年”新生杯足球赛",
        format: "十一人制",
        teamCount: 12,
        startDate: "2025-10-18",
        venue: "天目湖校区西操场",
        final: {
          home: "致元书院",
          away: "国际教育学院",
          score: "0-3",
          date: "2025-12-28 13:00",
        },
        standings: [
          { position: 1, team: "国际教育学院" },
          { position: 2, team: "致元书院" },
          { position: 3, team: "机电学院" },
          { position: 4, team: "致慧书院2队" },
        ],
      },
      {
        id: "2025-tianmuhu-mens-futsal",
        name: "2025南京航空航天大学天目湖校区五人制联赛（男子组）",
        format: "五人制",
        teamCount: 21,
        startDate: "2025-10-20",
        venue: "天目湖东操五人制球场西场",
        final: {
          home: "加密通话",
          away: "海底小纵队",
          score: "3-5",
          date: "2025-12-21 19:00",
        },
        standings: [
          { position: 1, team: "海底小纵队" },
          { position: 2, team: "加密通话" },
          { position: 3, team: "无言以对" },
          { position: 4, team: "BGV" },
        ],
      },
      {
        id: "2025-tianmuhu-womens-futsal",
        name: "2025南京航空航天大学天目湖校区五人制联赛（女子组）",
        format: "五人制",
        teamCount: 3,
        startDate: "2025-10-20",
        standings: [
          { position: 1, team: "果宝特攻", record: "4场 4胜 0平 0负", goals: "32/2", points: 12 },
          { position: 2, team: "不想上早八对不队", record: "4场 2胜 0平 2负", goals: "7/15", points: 6 },
          { position: 3, team: "不buy不buy", record: "4场 0胜 0平 4负", goals: "4/26", points: 0 },
        ],
      },
      {
        id: "2025-tianmuhu-seven-a-side",
        name: "南京航空航天大学天目湖校区2025七人制联赛",
        format: "七人制",
        teamCount: 17,
        startDate: "2025-03-29",
        venue: "天目湖校区东操场",
        final: {
          home: "加密通话",
          away: "海底小纵队",
          score: "2-3",
          date: "2025-06-27 19:00",
        },
        standings: [
          { position: 1, team: "海底小纵队" },
          { position: 2, team: "加密通话" },
          { position: 3, team: "让你们飞起来" },
          { position: 4, team: "cfy一打十一迫于赛制只能一打七队" },
        ],
        note: "manchester因违规使用队员，取消本届赛事资格并减1积分。",
      },
      {
        id: "2025-tianmuhu-womens-football",
        name: "南京航空航天大学天目湖校区2025女子足球赛",
        format: "五人制",
        teamCount: 4,
        startDate: "2025-04-01",
        standings: [
          { position: 1, team: "民航学院女足（天目湖）", record: "3场 3胜", goals: "21/1", points: 9 },
          { position: 2, team: "电信继教女足联队（天目湖）", record: "3场 2胜 1负", goals: "4/5", points: 6 },
          { position: 3, team: "人文与社会科学学院女足（天目湖）", record: "3场 1胜 2负", goals: "3/8", points: 3 },
          { position: 4, team: "经管数学女足联队（天目湖）", record: "3场 0胜 3负", goals: "2/16", points: 0 },
        ],
      },
    ],
  },
  {
    year: 2024,
    competitions: [
      {
        id: "2024-freshman-cup",
        name: "2024 新生杯",
        standings: [{ position: 1, team: "民航-通飞联队" }],
        officials: [
          { role: "主裁判", name: "牛荣兵" },
          { role: "第一助理裁判员", name: "刘开文" },
          { role: "第二助理裁判员", name: "郭峒" },
          { role: "第四官员", name: "王相翰" },
          { role: "候补助理裁判员", name: "尚哲彤" },
        ],
      },
    ],
  },
];
