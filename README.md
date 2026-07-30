# 南京航空航天大学天目湖足球协会网站

南京航空航天大学天目湖足球协会官网，服务天目湖校区校园足球。项目使用 Next.js 16、React 19、TypeScript、Tailwind CSS 4、Prisma 7 与 SQLite，不代表南京航空航天大学三个校区的统一足球组织。

## 当前能力

- 蓝色航空科技风响应式官网、六屏首页和完整二级栏目体系
- 2026 男、女子足球院际杯真实赛事归档
- 新生杯、天目湖五人制联赛等核心赛事入口
- 新闻公告、正式文件、球队、影像资料和协会档案
- 裁判员账号、开放场次、执裁意向、管理员审核、选派草稿、发布、撤回、重新发布和历史版本
- 经授权公开的裁判员名录、CSV 导出、打印选派单和管理员审计日志
- 独立管理员与裁判员 Session、scrypt 密码哈希、首次登录改密、账号停用和登录限速
- canonical、Open Graph、RSS、sitemap、robots 与结构化数据

未确认的比赛日期、场地、人员岗位和其他资料保持正式待确认状态，不作推测。

## 本地运行

需要 Node.js 20.9 或更高版本。

```powershell
npm install
Copy-Item .env.example .env.local
npx prisma migrate deploy
npm run dev
```

在 `.env.local` 中配置独立开发数据库和本地认证值。仓库不提供默认管理员密码、裁判员账号或任何可用 Secret；不要把真实 `.env`、SQLite 数据库、密码或 Token 提交到 Git。

管理员密码哈希可在当前终端临时设置 `PASSWORD_TO_HASH` 后生成：

```powershell
npm run security:hash-password
```

输出仅写入本地或生产环境配置，不写入仓库。裁判员账号由授权管理员在后台创建，并要求首次登录修改初始密码。

## 检查

```powershell
npm run check:unicode
npx tsc --noEmit
npm run lint
npm run build
npm run test:referee-flow
```

`test:referee-flow` 使用独立临时 SQLite 数据库，结束后自动删除，不读写生产数据库。

## 主要路由

- `/`：首页
- `/competitions`：赛事中心
- `/competitions/freshman-cup`：2026 新生杯筹备信息
- `/competitions/2026-mens-intercollege-cup`、`/competitions/2026-womens-intercollege-cup`：赛事归档
- `/news`、`/news/[slug]`：新闻公告与详情
- `/teams`：球队信息
- `/media`：影像资料与官方抖音二维码
- `/association`：协会档案与现任工作班子
- `/referees`：裁判中心
- `/referees/directory`：经授权公开名录
- `/referees/open-matches`：已发布开放场次
- `/referees/assignments`、`/referees/history`：有效公示与历史选派
- `/referees/login`、`/referees/workspace`：裁判员受保护工作区
- `/referees/admin/login`、`/referees/admin`：授权管理后台
- `/api/health`：最小只读健康检查
- `/rss.xml`、`/robots.txt`、`/sitemap.xml`：内容订阅与搜索引擎入口

## 生产发布

生产发布前必须暂停写入并备份 SQLite 数据库，再配置四个环境变量、执行向前迁移、构建和健康检查。完整步骤见 [v2.4 生产发布检查清单](docs/V2.4_RELEASE_CHECKLIST.md)。

本项目不自动修改 Nginx、PM2、服务器账号或生产数据库内容。
