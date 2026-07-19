# 南京航空航天大学天目湖足球协会网站

南航天目湖足协官网 V2.1 静态前端原型。项目使用 Next.js 16、TypeScript、React 19 与 Tailwind CSS 4，当前聚焦天目湖校区校园足球的信息展示，不代表南京航空航天大学三个校区的统一足球组织。

## 本轮已完成

- 蓝色航空科技风全局设计系统、响应式导航与页脚
- 组件化首页 V2.1：精简 Hero、比赛信息中心、公告与快捷入口、“一大三小”当前赛事、新闻与影像、协会摘要
- 栏目入口、列表、数据、详情、档案与流程六类可复用视觉模板
- 桌面表格与移动分组列表两套赛事数据呈现
- 裁判与规则栏目、开放执裁场次、本地报名交互演示、裁判选派公示
- 裁判员公开招募流程原型与独立二维码配置（当前尚未开放）
- 仲裁与申诉静态原型
- 赛事、球队、新闻、影像、协会、参赛指南与赛事子栏目占位路由
- 集中的类型与演示数据层，为后续后台、跨校区内容和外部数据接入预留字段

四项核心赛事名称来自项目任务书；比分、日期、队伍、球员、榜单、新闻、公告和赛事状态均为明确标注的演示数据，不代表真实历史记录。

## 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
npm run dev
```

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
- `/referees`：裁判与规则
- `/referees/open-matches`：开放执裁场次与报名演示
- `/referees/assignments`：裁判选派公示
- `/referees/recruitment`：裁判员公开招募流程原型
- `/participation`：参赛与报名入口及指南路由
- `/news`：新闻与公告列表模板
- `/news/demo-detail`：详情模板演示页
- `/association`：协会档案模板
- `/teams`、`/media`：保留现有栏目入口页

## 当前边界

本轮没有账号、登录、数据库、后台、真实报名提交、足球中国 API/爬虫或真实数据同步。足球中国按钮仅指向平台入口；正式赛事信息、球队资料、历史档案、联系人姓名与具体视频仍须由协会核验后更新。
