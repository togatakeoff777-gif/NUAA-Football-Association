# 南京航空航天大学天目湖足球协会网站

南航天目湖足协官网。项目使用 Next.js 16、TypeScript、React 19、Tailwind CSS 4，以及 Prisma 7 + SQLite，当前聚焦天目湖校区校园足球的信息展示与裁判事务，不代表南京航空航天大学三个校区的统一足球组织。

## 本轮已完成

- 蓝色航空科技风全局设计系统、响应式导航与页脚
- 组件化首页 V2.1：精简 Hero、比赛信息中心、公告与快捷入口、“一大三小”当前赛事、新闻与影像、协会摘要
- 栏目入口、列表、数据、详情、档案与流程六类可复用视觉模板
- 桌面表格与移动分组列表两套赛事数据呈现
- 赛事中心统一目录、真实赛程筛选、赛事文件中心及 2026 男、女子院际杯公开归档
- 裁判中心真实闭环：公开名录、待选派比赛、执裁意向、管理员审核、选派草稿、发布、撤回与历史记录
- 裁判员公开招募流程原型与独立二维码配置（当前尚未开放）
- 仲裁与申诉静态原型
- 赛事、球队、新闻、影像、协会、参赛指南与赛事子栏目占位路由
- 集中的类型与演示数据层，为后续后台、跨校区内容和外部数据接入预留字段

四项核心赛事名称来自项目任务书；比分、日期、队伍、球员、榜单、新闻、公告和赛事状态均为明确标注的演示数据，不代表真实历史记录。

## 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
copy .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

请在 `.env.local` 中设置强管理员密码及至少 32 个字符的 Session secret；真实值不得提交到 Git。SQLite 文件位于 `prisma/dev.db`，已被 Git 忽略。生产环境应在备份后使用 `npx prisma migrate deploy`，不要使用开发迁移命令。

浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 质量检查与生产构建

```bash
npm run lint
npm run build
npm run start
```

`npm run start` 需要先成功执行 `npm run build`。

## 主要路由

- `/`：首页 V2
- `/competitions`：栏目入口模板的天目湖赛事中心
- `/competitions/current`、`schedule`、`standings`、`scorers`、`history`、`cross-campus`：赛事子栏目原型
- `/competitions/arbitration`：仲裁与申诉原型
- `/competitions/files`：真实赛事规则、纪律文件与工作表下载
- `/referees`：裁判中心功能入口
- `/referees/directory`：注册裁判员公开名录
- `/referees/open-matches`、`/referees/open-matches/[slug]`：待选派比赛、岗位需求与真实执裁意向提交
- `/referees/assignments`：已发布且未撤回的未来比赛选派公告
- `/referees/history`：已发布的历史选派记录
- `/referees/admin/login`、`/referees/admin`：环境变量保护的裁判管理后台
- `/referees/recruitment`：裁判员公开招募流程原型
- `/participation`：参赛与报名入口及指南路由
- `/news`：新闻与公告列表模板
- `/news/demo-detail`：详情模板演示页
- `/association`：协会档案模板
- `/teams`、`/media`：保留现有栏目入口页

## 当前边界

裁判中心使用基础单管理员 Session，不是完整账号系统，也不包含支付、短信、多角色权限或个人资料管理。项目没有足球中国 API、爬虫或实时同步；足球中国按钮仅指向平台入口。正式开放场次、裁判员资格、联系人与尚未核验的赛事数据仍须由协会确认。Seed 中 2099 年比赛明确标注为本地功能测试数据，不代表真实赛程。
