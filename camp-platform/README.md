# camp-platform · 训练营平台（Next.js 全栈单体）

薄平台四件事：**身份 / 状态 / 关系 / 可视化**。内容与判题在 `landing-zone-camp/`（Git），判题执行在 CI，资产在 SkillHub —— 平台不跑学员代码。

## ⚠️ 交付状态说明（务必先读）
本代码在**无外网环境**中编写，未经过 `npm install` 与编译验证。全部采用 Next.js 15 App Router 标准写法，
但首次启动时出现少量类型或依赖小版本问题属正常，预计 <1 小时可清零。建议由一名熟悉 Next.js 的同学做首次点火。

## 技术栈
Next.js 15（App Router, TS）· Prisma 6 + PostgreSQL 16 · BullMQ + Redis 7（独立 worker 进程）· Tailwind 3.4 · jose（会话 JWT）

## 首次启动（开发模式）
```bash
cd camp-platform
cp .env.example .env                 # 修改 SESSION_SECRET / CI_SHARED_TOKEN，确认 CAMP_CONTENT_DIR 指向 ../landing-zone-camp 的绝对路径
npm install                          # 内网 npm 源
npx prisma generate
npm run db:push                      # 建表（试点期用 db push，正式后改 migrate）
npm run seed                         # 一期+8组+演示账号+认证规则+从 curriculum.yaml 导入 30 关
npm run dev                          # Web: http://localhost:3000
npm run worker                       # 另开终端：LLM 判分 worker（默认 LLM_MODE=mock，可完整走通）
```
演示账号（工号 + 密码登录，初始密码均为 `Camp@2026`）：`00001` 营长 / `90001` 教练 / `10001`~`10008` 学员。

## 账号发放流程
1. 管理员在「管理 → 学员管理」批量导入（每行 `工号,姓名,部门[,初始密码]`，密码缺省自动生成）
2. 系统一次性展示初始密码清单（仅本次可见，之后只存加密哈希）——管理员立即发给学员
3. 学员首次登录时强制改密（`mustChangePassword`）；改密前访问任何页面都会被拉回改密页
4. 忘记密码走管理员「重置密码」，不提供自助找回

## Docker 一键起（内网构建）
```bash
cd camp-platform && cp .env.example .env
docker compose up -d --build         # db + redis + web + worker；内容目录以只读卷挂载
docker compose exec web npx prisma db push && docker compose exec web npx tsx prisma/seed.ts
```

## 三条外部接线
1. **训练仓库 CI**：把 `landing-zone-camp/ci-templates/gitlab-ci.yml` 放到训练仓库根目录（改名 `.gitlab-ci.yml`），
   在 GitLab CI/CD Variables 配 `CAMP_API` 与 `CAMP_CI_TOKEN`（=平台 `.env` 的 `CI_SHARED_TOKEN`，Masked）。
2. **Git webhook**：训练仓库 push 事件 → `POST /api/v1/webhooks/git`，Secret Token = `GIT_WEBHOOK_SECRET`。
3. **课程同步**：landing-zone-camp 的 main 更新后调 `POST /api/v1/curriculum/sync`（或管理页点按钮）。

## 接入企业 SSO（上线前必做）
试点用工号直登（`app/login/`）。替换为 OIDC：
1) 在 `lib/auth.ts` 保留 `createSession/getSession` 不动；2) 新增 `/api/auth/callback` 路由完成企业 OIDC 授权码流程，
拿到工号后仍走 `createSession`；3) 登录页改为跳转 IdP。数据侧无需变更（User.empId 即主键关联）。

## 目录速览
```
app/            页面（仪表盘/关卡/评审/看板/教练台/管理/资产）+ api/v1/*
lib/domain/     颜色归约器 · 解锁 · 跨组匹配 · 认证引擎（纯函数，先给这里补单测）
lib/adapters/   llm(mock|gateway) · im(webhook|console)
worker/         grade-llm 队列消费 + 每 10 分钟对账
prisma/         schema（约 20 表）+ seed
```

## Schema 变更说明
- 第三轮移除了 `User.site`（Site 枚举）与 `Group.className`，开发库已用 `prisma db push --accept-data-loss` 应用（允许数据丢失）。
- 第三轮起，营长(00001)与教练(90001)不再编入小组（seed 不创建 Enrollment）；存量脏数据用 `/admin` →「清除演示数据」或 `npm run demo:clean` 处理。

## 上线前检查单
- [ ] SESSION_SECRET / CI_SHARED_TOKEN / GIT_WEBHOOK_SECRET 全部换强随机值
- [ ] rubrics/coach-keys.md 移出学员可见仓库
- [ ] LLM_MODE=gateway 并接内部网关（mock 只用于演示）
- [ ] lib/domain/ 四个纯函数补单测（归约器优先）
- [ ] 备份策略：PostgreSQL 每日备份（判分事件是审计凭证）
