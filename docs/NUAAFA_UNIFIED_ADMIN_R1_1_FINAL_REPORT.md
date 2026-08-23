# NUAAFA Unified Admin R1-1 Final Report

生成日期：2026-08-23  
阶段：R1-1 — Foundation Implementation  
结论：**PASS（本地 Foundation 范围）**  
实施代码 HEAD：`2c830b4d00d427737bdf9744cb996612acd0581a`

## A. Git State

- 正式工作树：`D:\WebProjects\NUAA-Football-Association\v2-9-r1-0-main-audit`
- Branch：`feat/v2.9-unified-admin-r1`
- Base：`origin/main@09e8222c5e02193d38e9a0348385bd0987596168`
- 实施代码相对 main：17 个本地提交
- 未设置 upstream
- 未 push、未 merge、未 deploy

主要新增提交：

- `0f264ce` — Next.js 16.3.2 安全更新
- `daa2576` — 正式 Unified Admin schema / migration
- `03a9b1e` — 多角色 RBAC
- `da7b663` — Unified Shell / referee adapter
- `12b8cad` — Content / Discipline foundation
- `5e28a2d` — Media storage / routes
- `709ab9a` — Foundation / migration tests
- `4a09bb4` — 公开内容 cursor API
- `2c830b4` — 隔离 browser smoke fixture

## B. Security Baseline

- Next.js：`16.3.2`
- React / React DOM：`19.2.4`
- Prisma：`7.9.x`
- Node 22 compatibility：**PASS**
  - 使用与 production 相同的 Node `22.23.2`
  - clean install、Prisma generate、TypeScript、全部 tests、production build 均通过
- `npm audit`：3 High、0 Critical
  - 路径：`prisma → @prisma/config → deepmerge-ts`
  - Advisory：递归对象合并可能导致 stack exhaustion
  - 属于 Prisma CLI/tooling 依赖链，不等同于已确认的 HTTP runtime exploit
  - 自动修复建议会将 Prisma 7 降至 6.12，因此未执行
- 未执行 `npm audit fix --force`
- 未引入 `next-admin`、Payload 或 TipTap

## C. V2.9 Business Port

以下已验收资产按历史顺序移入正式分支，并通过原回归测试：

- `82e564d` — 裁判后台 R1 基础
- `c6ceb69` — 后台 IA / UX
- `a6a89de` — 安全本地预览 Origin
- `553a7d6` — 业务模型 Acceptance Fix
- `8f2da68` — Acceptance Fix 3
- `a0a4e34` — Competition / Team / Match 工作流
- `ce86cef` — 裁判选派工作台 UI
- `4b07903` — 受保护的比赛删除

没有复制第二套裁判、比赛、选派、认证或 DTO/Service。

## D. Migration History

正式 migration 顺序共 7 个：

1. `20260722013757_init_referee_center`
2. `20260723124500_add_referee_sessions`
3. `20260730090000_referee_operations_v24`
4. `20260819120000_referee_admin_r1`
5. `20260820120000_referee_business_model_fix2`
6. `20260820160000_referee_acceptance_fix3`
7. `20260823091228_unified_admin_r1_foundation`

Stage A 验证结果：

- 历史 ID、Session、Appointment 与 Version 保留
- additive migration 通过
- 没有 reset、db push 或删除历史 migration
- 隔离 probe 上 `prisma migrate deploy` 无 pending migration
- `prisma migrate status` 返回 database schema is up to date

## E. Unified RBAC

正式角色：

- `SUPER_ADMIN`
- `CONTENT_EDITOR`
- `COMPETITION_ADMIN`
- `REFEREE_ADMIN`

已实现并验证：

- 多角色权限并集
- `(adminAccountId, role)` 唯一约束
- explicit assignment 优先
- legacy env admin → `SUPER_ADMIN`
- 旧 `SUPER_ADMIN` → `SUPER_ADMIN`
- 旧 `REFEREE_MANAGER` → `REFEREE_ADMIN`
- `CONTENT_EDITOR`、`REFEREE_ADMIN` 自动拥有 `competitions:read`
- 新 `/admin` 页面、API 和 Service 均执行服务端授权
- Foundation 没有 Server Actions；mutation 经 Route Handler 重新授权并进入 Service

注意：尚未搬迁的历史 `/referees/admin/*` 仍保留旧角色语义。正式发放受限角色前，R1-2 应完成历史 Route/API 的 permission 映射。

## F. Formal Schema

正式模型：

- `AdminRoleAssignment`
- `ContentPost`
- `DisciplineDetail`
- `MediaAsset`

正式 enums：

- `UnifiedAdminRole`
- `ContentPostType`
- `ContentPostStatus`
- `MediaVisibility`

Prisma validate：**PASS**。

## G. Foundation Migration

正式文件：`prisma/migrations/20260823091228_unified_admin_r1_foundation/migration.sql`

结果：

- 只创建新表、索引、约束和外键
- 无 `DROP TABLE`
- 无 `DROP COLUMN`
- 无 destructive rewrite
- 未复用 Spike migration
- 旧角色回填采用确定性 ID + `INSERT OR IGNORE`
- 每个回填账号生成一条不含敏感信息的 AuditLog
- 回填重复执行不会增加重复数据

## H. Migration Dry Run

状态：**PASS**

隔离 migration-history clone 中验证：

- Competition：1 → 1
- Team：2 → 2
- Match：1 → 1
- Referee：1 → 1
- Appointment：1 → 1
- AppointmentVersion：1 → 1
- AdminAccount：2 → 2
- AdminSession：1 → 1
- `SUPER_ADMIN`、`REFEREE_MANAGER` 回填正确
- `integrity_check = ok`
- `foreign_key_check = 0 violations`
- Foundation 表及关键索引存在
- 回填幂等

## I. Unified Shell

正式入口：

- `/admin`
- `/admin/content/news`
- `/admin/media`
- `/admin/referees`

结果：

- 复用现有 NUAAFA 后台设计语言
- 菜单根据权限显示
- 复用原 `AdminAccount` 登录、Session、退出和密码修改
- 支持安全 `next=/admin/...` return path
- 无 PoC / Spike 用户可见文案

## J. Referee Adapter

`/admin/referees`：**PASS**

- 直接复用原裁判员页面组件
- 原筛选器、表格、操作、DTO、Service 和 CSS 保持
- 没有复制裁判业务
- 视觉冒烟确认现有已验收 UI 未被替换

## K. Content

已实现：

- 创建、编辑
- 草稿、发布、归档
- 类型、状态、关键词筛选
- AuditLog
- 后台 `count + skip/take` 真数据库分页
- 公开 `publishedAt DESC, id DESC` cursor/keyset 分页
- 受控结构化 JSON schema
- Public DTO 不返回 AdminAccount、Audit metadata、PRIVATE media 或完整 Prisma model

公开基础接口：

`GET /api/content/posts?type=NEWS&pageSize=10&cursor=...`

正式 `/news` 本轮没有切换。

## L. Discipline

状态：**PASS**

- `ContentPost` 与 `DisciplineDetail` 1:0/1
- 发布纪律处罚必须关联正式 PDF
- PDF 必须为 `PUBLIC`
- 非 PDF、PRIVATE PDF 均拒绝发布
- Competition 删除执行 `SetNull`
- 被引用 Media 执行 `Restrict`
- ContentPost 删除允许 cascade 删除 DisciplineDetail
- 未自行增加未经确认的处罚对象、学号、期限等字段

## M. Media

状态：**PASS**

- 支持 JPG/JPEG、PNG、WEBP、PDF
- 图片最大 10 MiB；PDF 最大 20 MiB
- 校验扩展名、MIME、magic signature、文件名和大小
- UUID 文件名
- `YYYY/MM/uuid.ext` storage key
- 路径穿越防护
- 默认 `PRIVATE`
- `NUAAFA_UPLOAD_DIR` 未配置或不是绝对路径时 Fail Closed
- staging file + atomic rename
- DB 失败补偿删除
- 文件写失败不产生 MediaAsset
- missing-file 可检测
- 上传 AuditLog
- 当前仍是受限内存 multipart，尚非 streaming

## N. Public Media Route

正式 URL：`/media/[id]`

行为：

- PUBLIC：匿名 200
- PRIVATE 未登录：401
- PRIVATE 无权限：403
- PRIVATE 有 `media:read`：200
- 缺失文件：404
- `X-Content-Type-Options: nosniff`
- PUBLIC cache：`public, must-revalidate, max-age=300`
- PRIVATE：`no-store`
- 只接受数据库 ID，不接受任意文件路径

## O. Tests

| 检查 | 结果 |
|---|---|
| Node 22.23.2 clean install | PASS |
| Prisma validate / generate / migrate status | PASS |
| Next typegen / TypeScript | PASS |
| ESLint | PASS |
| Unicode safety | PASS |
| referee-flow | PASS |
| referee-r1 | PASS |
| referee-fix2 / fix3 / fix5 | PASS |
| guarded match deletion | PASS |
| RBAC 全矩阵 / multi-role / legacy | PASS |
| Content / DTO / 状态流 | PASS |
| Discipline invariants | PASS |
| Media 安全 / 原子写入 / 补偿 | PASS |
| 后台分页 / public cursor 分页 | PASS，10 / 10 / 5 |
| Backup manifest contract | PASS |
| Migration dry run | PASS |
| Next 16.3.2 production build | PASS，75 个页面 |
| npm audit | PARTIAL，已知 Prisma CLI 链 3 High |

## P. Browser Smoke

状态：**PASS**

实际验收：

- 未登录 `/admin` → 登录页
- legacy admin 登录成功
- persistent `AdminAccount` 登录成功
- logout 成功
- `next=/admin` return path 成功
- `SUPER_ADMIN` 完整菜单
- `CONTENT_EDITOR` 菜单正确，直接 `/admin/referees` 被拒绝
- `COMPETITION_ADMIN` 无内容菜单，直接内容页及 API 返回 403
- `REFEREE_ADMIN` 可访问 `/admin/referees`，媒体页被拒绝
- News：草稿不公开 → 发布后公开 DTO 可见 → 归档后消失
- 后台分页：23 条公告，第 2/3 页实际返回 10 行
- PUBLIC JPG 上传、匿名读取成功
- PRIVATE PDF 上传、授权读取成功
- PRIVATE 匿名 401、无权限账号 403
- `/admin/referees` 原 UI、筛选和表格视觉正常

隔离数据从未写入项目数据库或生产数据库。

测试残留：

- `C:\Users\xiang\AppData\Local\Temp\nuaafa-r1-1-browser-smoke-20260823`
- `D:\WebProjects\NUAA-Football-Association\r1-1-foundation-migration-probe`

本机策略拒绝了删除命令，因此没有绕过安全策略强删；两处只包含隔离 SQLite 与测试上传文件。

## Q. Production Change Proposal

以下只作为建议，**未执行**：

1. 创建 `/srv/nuaafa/shared/uploads`，属主 `nuaafa:nuaafa`，建议权限 `0750`。
2. Production env 增加 `NUAAFA_UPLOAD_DIR=/srv/nuaafa/shared/uploads`。
3. Nginx 建议设置 `client_max_body_size 25m`。
4. 部署前联合备份 SQLite、uploads、manifest 和 SHA-256 checksums。
5. 在生产快照 clone 上再次执行 `migrate deploy`、status、FK、integrity 和 row-count 对账。
6. 通过现有 release/dry-run/health/rollback 流程发布，不 seed、不 reset。

未来 Nginx 验收：

- `<10 MB` 合法图片/PDF：成功
- `10–20 MB` 图片：应用 413；PDF：成功
- `>20 MB`：应用 413
- `>25 MB`：Nginx 413

## R. Remaining Risks

- Prisma CLI `deepmerge-ts` 仍有 3 High advisory
- `/news` 仍使用静态内容，尚未切换数据库
- 上传仍整文件进入内存；streaming 是 production hardening 阻塞项
- 生产 uploads、Nginx、backup timer、offsite backup 均未配置
- SQLite 仍是单写者架构，需要监控写入并发和备份窗口
- 未迁移的 `/referees/admin/*` 仍保留旧角色语义
- 需要在真实生产快照 clone 上做最终数据量和迁移耗时验收
- 两个隔离测试目录待人工清理

## S. R1-2 Proposed Scope

1. 将历史 `/referees/admin/*` Route/API 映射到统一 permission resolver。
2. 完成 Competition / Match / Availability / Appointment 的正式 `/admin` adapters。
3. 集成 TipTap，但只输出经过验证的正式 JSON schema。
4. 编写静态新闻迁移器：盘点、映射、隔离 dry-run、幂等 upsert、checksum 对账及双读预览。
5. 为 `/news` 使用公开 cursor service，详情页按 slug 查询。
6. 实现 streaming multipart、并发限制和上传监控。
7. 实施 SQLite + uploads + manifest 联合备份及恢复演练。
8. 完成生产快照 clone migration rehearsal；仍需单独人工批准才能部署。

## 最终结论

1. **R1-1 是否 PASS？** 是，批准范围内的本地 Foundation Implementation 为 PASS。
2. **是否可以进入 R1-2？** 可以，但必须先经人工验收并批准。
3. **哪些内容仍阻塞 production？** Production 配置、streaming、历史 Route/API 权限收口、真实生产快照迁移演练及 `/news` 切换。
4. **Foundation migration 是否 production-safe？** 作为 additive migration candidate 已通过验证；正式执行仍需备份、真实快照和 deployment gate。
5. **Legacy admin 是否仍然可用？** 是，浏览器真实登录通过。
6. **Persistent AdminAccount 是否已验证？** 是，登录、Session、RBAC、退出均通过。
7. **原裁判后台是否保持完整？** 是，业务资产和 UI 未替换。
8. **PUBLIC / PRIVATE Media 是否正确实现？** 是，上传、读取、匿名和越权行为均通过。
9. **正式 `/news` 是否仍未切换？** 是；本轮只提供未来公开 API 基础。
10. **是否进行了任何生产修改？** 没有。未 push、未 merge、未部署、未写生产 DB，未修改 production env/systemd/Nginx/backup。

---

**STOP — 等待人工验收。**
