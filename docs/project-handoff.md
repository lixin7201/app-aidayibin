# 大宜宾 AI 能力平台项目交接手册

这是一个给大宜宾 App 使用的 AI 能力平台 H5 MVP。  
当前包含“个人展示面生成器”和“AI 算命”两个大栏目；AI 算命下包含 AI 看手相、AI 看面相。后续可扩展 AI 恋爱训练营、AI 聊天等能力。  
当前目标是：用户在 App 内点击入口后，可切换到个人展示面生成器生成写实风展示面，也可切换到 AI 算命上传手部或面部照片生成玄学视觉报告；用户可随时回来查看历史记录。  
当前技术栈：Next.js 16、TypeScript、Supabase、Cloudflare R2、APIMart GPT-Image-2、Tailwind CSS。

## 这个项目做什么

- 用户端 H5：顶部大栏目切换、模板选择、照片上传、参数选择、生成、记录查看、删除、下载、分享。
- AI 算命：独立 fortune 模块，支持 AI 看手相、AI 看面相，固定 3:4、2K 报告图。
- 管理后台：数据看板、模板管理、任务列表、CSV 导出、配置系统参数。
- 后端接口：登录会话、上传、生成任务、额度统计、记录操作。
- Worker：轮询 APIMart 生成结果、把成品图转存到 R2、清理临时图片。

## 当前约定

- 本地开发默认允许 mock 模式，方便你只测试流程。
- 线上接入时，再切换真实 App 登录、Supabase、R2、APIMart。
- 当前个人展示面模板为男 20 套、女 20 套，全部是写实风，不做未来机甲、二次元、插画类。
- 所有模板都强调“人脸一致性优先”，尽量保持像本人。

## 开发红线

1. 不要随意删接口、表字段、Worker、定时清理脚本。
2. 不要轻易改数据库字段名，尤其是 `app_users`、`generation_tasks`、`daily_usage`。
3. 不要把本地 mock 和真实线上逻辑混在一起。
4. 不要移除模板封面、历史记录、下载、分享这些用户可见能力。
5. 不要删掉“生成成功后再回写记录”的链路。
6. 不要破坏 `src/features/templates/default-templates.ts` 和 `src/features/templates/portrait-template-specs.ts` 里的男女 40 个模板。
7. 修改上传、生成、记录、额度相关代码时，要考虑是否会影响现有记录和历史数据。
8. 后续新增 AI 功能时，不要强行塞进写真模块；应按功能拆分独立模块，避免互相影响。
9. 任何删减代码前，先判断是否会影响：
   - 用户历史记录
   - 额度统计
   - 任务回写
   - 后台导出
   - R2 成品图访问

## 最容易出问题的地方

- `src/features/generation/generation-service.ts`：提交生成的主链路。
- `src/features/generation/generation-sync.ts`：把服务商结果同步回库。
- `src/features/quota/quota-service.ts`：额度与次数统计。
- `src/lib/storage/r2.ts`：上传、保存、读取成品图。
- `src/features/auth/session.ts`：本地 mock 登录和真实登录入口。
- `src/features/templates/default-templates.ts`：模板 prompt 和封面。

## 开发顺序建议

1. 先改 UI，再改接口。
2. 先改 mock 流程，再改真实服务。
3. 先确认数据库和记录，再改生成链路。
4. 任何新增功能，先判断会不会影响历史记录。
5. 新增 AI 算命、看手相、看面相、恋爱训练营等功能时，优先新建独立 feature，不要复用写真生成逻辑做硬改。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

常用检查：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 重要命令

- `npm run dev`：启动本地开发
- `npm run db:seed`：写入默认模板
- `npm run worker:poll`：手动轮询生成结果
- `npm run worker:cleanup`：清理临时原图
- `npm run templates:generate-covers`：重新生成模板封面
- `npm run r2:test`：测试 R2 连接

## 环境变量

本地参数说明见：

- `docs/env-local-setup.md`
- `.env.example`

## 数据库

Supabase 初始化迁移：

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_fortune_module.sql`

核心表：

- `app_users`
- `photo_templates`
- `generation_tasks`
- `fortune_generation_tasks`
- `daily_usage`
- `system_configs`
- `admin_users`
- `admin_audit_logs`

## 模板说明

模板说明文件：

- `docs/templates.md`
- `src/features/templates/default-templates.ts`

## 如果你换其他编程软件

先看这三份文件：

1. `README.md`
2. `docs/project-handoff.md`
3. `docs/env-local-setup.md`
4. `docs/ai-fortune-requirements.md`

然后再看：

- `src/features/templates/default-templates.ts`
- `src/features/generation/generation-service.ts`
- `src/features/generation/generation-sync.ts`
- `src/features/fortune/fortune-service.ts`
- `src/features/fortune/fortune-sync.ts`
- `src/features/quota/quota-service.ts`

## 一句话总结

这是一个“大宜宾 App 内嵌的 AI 能力平台 H5 项目”，个人展示面和 AI 算命是并列能力，重点不是做炫技，而是稳定、可回看、可运营、可持续扩展。
