# 大宜宾 AI 能力平台 H5 MVP

这是一个面向大宜宾 App 的 AI 能力平台 H5 项目。  
当前包含“个人展示面生成器”和“AI 算命”两个大栏目；AI 算命下包含 AI 看手相、AI 看面相。后续还可以扩展 AI 恋爱训练营、AI 聊天等更多功能。  
它支持：模板选择、照片上传、AI 生成、历史记录、下载分享删除、管理后台、R2 转存、Supabase 存储。

如果你是后续接手的人，先看：

1. `docs/project-handoff.md`
2. `docs/env-local-setup.md`
3. `docs/templates.md`
4. `docs/ai-fortune-requirements.md`

## 技术栈

- Next.js + TypeScript
- Supabase PostgreSQL
- Cloudflare R2
- APIMart GPT-Image-2
- Tailwind CSS
- Zod
- Vitest

## 本地启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

默认开启 mock 模式，不配置 Supabase、R2、APIMart 也可以预览页面。

- 用户端：`http://localhost:3000`
- 管理后台：`http://localhost:3000/admin`

## Supabase 初始化

把 `supabase/migrations/001_initial_schema.sql` 和 `supabase/migrations/002_fortune_module.sql` 执行到 Supabase PostgreSQL。

然后访问后台，点击“写入默认模板”，把男女各 20 个写实写真模板写入 `photo_templates` 表，并下线旧模板。

## 真实服务配置

正式接入时，在 `.env.local` 配置：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APIMART_API_KEY`
- `APIMART_BASE_URL`
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`
- `APP_AUTH_VERIFY_URL`
- `APP_AUTH_SHARED_SECRET`

详细步骤见 `docs/env-local-setup.md`。

生产环境必须设置：

```env
NEXT_PUBLIC_ENABLE_MOCKS=false
```

## Worker

单次轮询：

```bash
npm run worker:poll
```

单次清理临时原图：

```bash
npm run worker:cleanup
```

生产环境建议用 cron 或进程管理器定时运行 worker。

## 验证

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 模板说明

模板 prompt 在 `src/features/templates/default-templates.ts`，模板清单在 `src/features/templates/portrait-template-specs.ts`。当前模板为男 20 套、女 20 套，全部为写实摄影风，并统一强调“保持参考照片人脸一致性”和“去 AI 感”。

## 开发红线

- 不要随意删除生成任务、历史记录、额度统计、R2 转存、模板封面这些主链路。
- 不要改坏 `generation_tasks -> stored_image_url` 这条记录回写链路。
- 不要把 mock 逻辑和真实生产逻辑混成一套，避免本地能跑、线上不能用。
- 不要轻易删数据库字段，尤其是历史记录相关字段。
- 后续新增 AI 算命、看手相、看面相、恋爱训练营等功能时，优先独立拆模块，不要硬改写真主链路。
- 任何删减代码前，先判断是否会影响现有功能、历史数据和后台导出。
