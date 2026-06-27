# 大宜宾 AI 能力平台 H5 MVP

这是一个面向大宜宾 App 的 AI 能力平台 H5 项目。  
当前包含“个人展示面生成器”和“AI 算命”两个大栏目；AI 算命下包含 AI 看手相、AI 看面相。后续还可以扩展 AI 恋爱训练营、AI 聊天等更多功能。  
它支持：模板选择、照片上传、AI 生成、历史记录、下载分享删除、管理后台、R2 转存、MySQL 数据存储。

如果你是后续接手的人，先看：

1. `docs/project-handoff.md`
2. `docs/development-red-lines-and-deployment.md`
3. `docs/env-local-setup.md`
4. `docs/templates.md`
5. `docs/ai-fortune-requirements.md`

## 技术栈

- Next.js + TypeScript
- MySQL + Prisma
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

默认开启 mock 模式，不配置 R2、APIMart 也可以预览页面；数据库需要配置 `DATABASE_URL`。

- 用户端：`http://localhost:3000`
- 管理后台：`http://localhost:3000/admin`

## 数据库初始化

配置 `.env.local` 中的 `DATABASE_URL` 后执行：

```bash
npx prisma db push
npm run db:seed
```

`db:seed` 会写入系统配置，并把男女各 20 个写实写真模板写入 `photo_templates` 表。

## 真实服务配置

正式接入时，在 `.env.local` 配置：

- `DATABASE_URL`
- `APIMART_API_KEY`
- `APIMART_BASE_URL`
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`
- `APP_AUTH_VERIFY_URL`
- `APP_AUTH_SHARED_SECRET`
- `WECHAT_APP_ID` (公众号网页授权，用于微信内实时身份)
- `WECHAT_APP_SECRET` (仅服务器环境变量配置，不可进入前端或源码)
- `WECHAT_OAUTH_REDIRECT_URL` (如 https://ces.dayibin.cn/ai)
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID` (必须在 npm run build 前配置，用于小程序卡片分享)
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID` (必须在 npm run build 前配置，小程序的原始 ID gh_xxx)
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH` (必须在 npm run build 前配置，如 /subPack/information/webviewMini)

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

## 发版检测与压缩包制作

每次交给阿里云部署前，先在本机完整检测，再重新生成生产构建，最后制作压缩包。不要把 `.env.local`、根目录 `node_modules`、旧 `dist` 打进包；但必须保留 `.next/node_modules` 里的生产运行软链接。

```bash
cd "/Users/lixin/AI code/app-aidayibin"

npm run typecheck
npm run lint
npm test

rm -rf .next
npm run build

find .next/node_modules/@prisma -maxdepth 1 -type l -ls
find .next/node_modules -maxdepth 2 -type l -ls

stage="/tmp/app-aidayibin-deploy"
rm -rf "$stage"
mkdir -p "$stage"

rsync -a \
  --exclude '/.env' \
  --exclude '/.env.*' \
  --exclude '/.git/' \
  --exclude '/node_modules/' \
  --exclude '/dist/' \
  --exclude '/outputs/' \
  --exclude '/.DS_Store' \
  --exclude '/tsconfig.tsbuildinfo' \
  ./ "$stage"/

mkdir -p dist
latest="dist/app-aidayibin-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
(cd "$stage" && COPYFILE_DISABLE=1 tar --no-xattrs -czf "/Users/lixin/AI code/app-aidayibin/$latest" .)

tar -tzf "$latest" | grep '.next/BUILD_ID'
tar -tzf "$latest" | grep '.next/server'
tar -tzf "$latest" | grep '.next/static'
tar -tzf "$latest" | grep '.next/node_modules'
```

### 阿里云服务器部署信息

当前生产服务器按低配机器处理，后续部署命令必须默认照顾 2 核 4G 内存，不要使用高并发安装或在服务器上反复删除 `node_modules`。

- 服务器：阿里云 ECS，2 核 4G
- SSH 登录后项目目录：`/www/wwwroot/ai`
- PM2 应用名：`aidayibin-h5`
- Next.js 生产端口：`3001`
- 监听地址：`0.0.0.0`
- 生产环境变量：`NODE_ENV=production`
- 对外 base path：`/ai`
- 健康检查：`http://127.0.0.1:3001/ai/photo`、`http://127.0.0.1:3001/ai/fortune`
- 部署包位置：上传到 `/www/wwwroot/ai`
- 部署包命名：`app-aidayibin-deploy-YYYYMMDD-HHMMSS.tar.gz`，执行命令时必须替换成真实包名，例如 `app-aidayibin-deploy-20260516-172953.tar.gz`

### 阿里云低内存部署命令

下面命令里的 `PACKAGE` 必须改成本次真实包名。不要直接复制 `YYYYMMDD-HHMMSS` 占位符，否则 `tar` 会提示找不到文件。

```bash
cd /www/wwwroot/ai

PACKAGE="app-aidayibin-deploy-YYYYMMDD-HHMMSS.tar.gz"
ls -lh "$PACKAGE"

pm2 stop aidayibin-h5

rm -rf .next
tar -xzf "$PACKAGE" -C /www/wwwroot/ai

# 2 核 4G 服务器：依赖未变化且 node_modules 已存在时，可以跳过 npm ci。
# 不确定时使用下面的低内存安装方式，不要提高并发。
npm_config_jobs=1 npm_config_foreground_scripts=true NODE_OPTIONS="--max-old-space-size=512" \
  npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps

NODE_OPTIONS="--max-old-space-size=512" npm run db:generate

find .next/node_modules/@prisma -maxdepth 1 -type l -ls
find .next/node_modules -maxdepth 2 -type l -ls

PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 restart aidayibin-h5 --update-env

sleep 5

curl -I http://127.0.0.1:3001/ai/photo
curl -I http://127.0.0.1:3001/ai/fortune
pm2 list
```

一次成功部署的关键输出应包括：`npm ci` added packages 正常结束，`npm run db:generate` 生成 Prisma Client 成功，`.next/node_modules` 中能看到 `@prisma/client-*`、`sharp-*`、`@aws-sdk/client-s3-*` 软链接，PM2 状态为 `online`，两个 `curl -I` 都返回 `HTTP/1.1 200 OK`。

线上解压和 PM2 重启的红线记录见 `docs/development-red-lines-and-deployment.md`。每次发包时，把本次实际生成的 `dist/app-aidayibin-deploy-*.tar.gz` 包名发给项目负责人。

## 模板说明

模板 prompt 在 `src/features/templates/default-templates.ts`，模板清单在 `src/features/templates/portrait-template-specs.ts`。当前模板为男 20 套、女 20 套，全部为写实摄影风，并统一强调“保持参考照片人脸一致性”和“去 AI 感”。

## 开发红线

- 完整红线、更新记录、阿里云部署模板见 `docs/development-red-lines-and-deployment.md`。
- 不要随意删除生成任务、历史记录、额度统计、R2 转存、模板封面这些主链路。
- 不要改坏 `generation_tasks -> stored_image_url` 这条记录回写链路。
- 不要把 mock 逻辑和真实生产逻辑混成一套，避免本地能跑、线上不能用。
- 不要轻易删数据库字段，尤其是历史记录相关字段。
- 后续新增 AI 算命、看手相、看面相、恋爱训练营等功能时，优先独立拆模块，不要硬改写真主链路。
- 任何删减代码前，先判断是否会影响现有功能、历史数据和后台导出。
