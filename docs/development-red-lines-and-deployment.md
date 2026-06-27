# 开发红线与阿里云部署记录

本文档用于后续接手、修 bug、打包、部署前快速校对。只要改动了代码、依赖、构建产物或部署包，都先看这里。

## 强制交付说明

以后每次执行修改后，请详细说下在阿里云的部署步骤指令，一段发给项目负责人。

这段部署指令必须包含：上传哪个压缩包、进入哪个目录、是否需要清理 `.next`、是否需要安装依赖、是否需要执行 `npm run db:generate`、如何重启 PM2、如何用 `curl` 验证 `/ai/photo` 和 `/ai/fortune`。

## 最近更新记录

### 2026-05-16

- 修复 App 内“保存图片”黑屏问题：保存和分享使用 `?public=1` 图片地址，避免原生大图页或微信抓图时拿不到 H5 登录 cookie。
- AI 算命分享改为使用公开图片地址，并通过 `QFH5.setShareInfo` + `QFH5.openShareDialog` 调起客户端分享。
- AI 写真生成记录补充分享按钮。
- 图片接口保留登录态访问，同时增加 `public=1` 公开读取模式；任务 ID 是 UUID，不在列表外暴露，适合用于原生预览和微信分享抓图。
- 打包时必须保留 `.next/node_modules` 里的软链接，尤其是 Prisma、Sharp、AWS SDK 相关链接，否则线上会 500。

### 2026-05-15

- 修复生产环境 cookie 安全属性：`http://ces.dayibin.cn/ai` 不能设置 `Secure` cookie，否则新用户会被错误识别为 mock 用户或旧用户。
- 关闭 `/photo`、`/fortune` 和 `/api/*` 的缓存，避免 App WebView 看到旧页面。
- AI 写真移除模板上方不可点击的装饰上传按钮。
- AI 算命/写真结果预览增加缩略图思路，高清图只在保存/分享时使用。
- `dotenv` 从开发依赖调整到运行依赖，保证服务器使用 `npm ci --omit=dev` 后仍可执行 `prisma generate`。

## 开发红线

- 不要把 `NEXT_PUBLIC_ENABLE_MOCKS` 在生产环境打开。线上必须是 `false`。
- 不要恢复 mock 用户兜底逻辑。新用户额度异常、算命已生成异常，优先检查真实登录态 cookie 和数据库记录。
- 不要删除或绕开 `generation_tasks`、`fortune_generation_tasks`、`daily_usage` 的额度统计逻辑。
- 不要把需要 App 原生能力的保存/分享改回普通浏览器下载。App WebView 里普通下载经常无效。
- 不要让保存/分享继续使用需要登录 cookie 的图片 URL。原生大图页、微信分享抓图不一定带 H5 cookie。
- 不要随意删除 `.next` 后只手动补 `.next/node_modules`。生产运行必须有完整 `.next/BUILD_ID`、`.next/server`、`.next/static`。
- 不要用会丢失构建软链接的压缩方式。`.next/node_modules/@prisma/client-*`、`.next/node_modules/sharp-*`、`.next/node_modules/@aws-sdk/client-s3-*` 必须在包里或上线后补齐。
- 不要裸执行 `pm2 restart aidayibin-h5 --update-env`，除非当前 shell 已经设置 `PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production`。
- 不要在内存紧张的服务器上反复删除 `node_modules` 再安装。若必须安装，优先停 PM2，使用低并发安装命令。
- 不要把 `.env.local` 打进压缩包；服务器上的 `.env.local` 应该保留并由运维/项目负责人维护。

## 阿里云标准部署指令模板

下面是后续每次发版时应提供给项目负责人的完整命令模板。包名按实际新包替换。

```bash
cd /www/wwwroot/ai

pm2 stop aidayibin-h5

rm -rf .next

tar -xzf app-aidayibin-deploy-YYYYMMDD-HHMMSS.tar.gz -C /www/wwwroot/ai

npm_config_jobs=1 NODE_OPTIONS="--max-old-space-size=512" npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps
npm run db:generate

find .next/node_modules/@prisma -maxdepth 1 -type l -ls
find .next/node_modules -maxdepth 2 -type l -ls

PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 restart aidayibin-h5 --update-env

sleep 5

curl -I http://127.0.0.1:3001/ai/photo
curl -I http://127.0.0.1:3001/ai/fortune
pm2 list
```

如果 `curl` 返回 `Connection refused`，先看日志，不要立刻重装：

```bash
pm2 logs aidayibin-h5 --lines 120 --nostream
```

如果日志出现 `Could not find a production build in the '.next' directory`，说明 `.next` 没完整解压，需要重新解压包含 `.next/BUILD_ID`、`.next/server`、`.next/static` 的正确压缩包。

如果日志出现 `Cannot find module '@prisma/client-...'`，说明 `.next/node_modules` 软链接缺失，优先确认压缩包里是否包含：

```bash
tar -tzf app-aidayibin-deploy-YYYYMMDD-HHMMSS.tar.gz | grep '.next/node_modules'
```

## 打包红线

打包时不要用会排除所有 `node_modules` 路径的规则，因为它会误删 `.next/node_modules`。推荐先复制到临时目录，再压缩：

```bash
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

tar -tzf "$latest" | grep '.next/node_modules'
```

打包前至少执行：

```bash
npm run typecheck
npm run lint
npm test
rm -rf .next && npm run build
```

## App H5 原生能力注意事项

- 保存图片优先使用 `QFH5.viewImages(0, [imageUrl])` 打开客户端原生大图页，再让用户长按保存。
- 分享优先使用 `QFH5.setShareInfo(...)` 后调用 `QFH5.openShareDialog()`。
- 微信分享图片地址必须是公网可访问、无需 H5 cookie 的图片地址。
- H5 无法真正模拟系统“长按保存”动作。若后续需要一键保存相册，必须让 App 提供明确的原生保存接口，例如 `QFH5.saveImageToAlbum(url, callback)`。
