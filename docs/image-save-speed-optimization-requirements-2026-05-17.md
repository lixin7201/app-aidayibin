# AI 图片保存速度大幅优化需求文档

日期：2026-05-17

## 1. 背景

当前项目 `app-aidayibin` 的 AI 图片保存体验明显偏慢，尤其是 AI 算命的 3:4、2K 成品图。用户点击“保存”后，一张图经常需要 1-2 分钟才能加载或保存完成，体验明显差于公司旧项目，也明显慢于当前 AI 写真。

经过代码对比：

- 旧项目图片上传接口是 `/system/oss/upload-public`。
- 旧项目图片访问路径由 nginx 静态直出：
  - `/oss/local/upload` -> `/www/wwwroot/application/upload`
  - `/public` -> `/www/wwwroot/application/public`
- 旧项目前端拿到 `ossUrls[].url`、`photoImgUrl`、`advertisingImagesUrl` 后，直接交给 `<image>` 或 `uni.previewImage` 使用。
- 当前 AI 项目成品图存储在 Cloudflare R2，并通过 Next.js API 接口中转读取。
- 当前保存逻辑还会在 H5 里把原图下载成 blob，再转成 base64，最后交给 App 原生保存接口。

因此，当前慢不是单点问题，而是多层叠加：

1. 国内用户访问 Cloudflare R2 链路慢。
2. 用户不是直连图片，而是先请求 Next.js 图片接口，服务端再从 R2 取图后转发。
3. H5 保存前再次下载整张原图，并转 base64，数据体积增加约三分之一。
4. AI 算命固定 2K 输出，图片体积比默认 1K 写真大很多。

## 2. 优化目标

核心目标：对标旧项目，把 AI 成品图访问链路改成国内静态资源直出，并去掉 H5 侧原图 base64 搬运。

预期效果：

- AI 算命 2K 图点击保存后，不再出现 1-2 分钟等待。
- 结果列表仍使用轻量预览图，保证列表滚动和首屏速度。
- 保存、分享使用公网可访问、无需登录 cookie 的国内图片 URL。
- 图片主链路优先走国内，Cloudflare R2 不再作为用户下载主链路。
- 改造后兼容现有历史记录、分享页、App WebView。

建议目标体验：

- 预览图：列表中 1 秒内开始显示。
- 保存原图：正常网络下 3-10 秒内打开原生大图页或完成保存。
- 分享封面图：微信/App 抓图稳定，不依赖 H5 登录态。

## 3. 推荐技术方案

### 3.1 首选方案：阿里云 OSS + CDN

推荐新增阿里云 OSS 存储桶和图片域名，例如：

```text
https://img.dayibin.cn
```

AI 成品图生成完成后，服务端将图片从生成商下载一次，然后上传到阿里云 OSS。前端、分享、保存全部使用阿里云 OSS/CDN 的公开 URL。

推荐对象路径：

```text
ai/results/{userId}/{taskId}.jpg
ai/results-original/{userId}/{taskId}.png
ai/results-preview/{userId}/{taskId}.webp
ai/results-share/{userId}/{taskId}.webp
ai/results-card/{userId}/{taskId}.jpg
```

说明：

- `results-original`：保留原始成品图，供用户保存高清图。
- `results-preview`：列表预览图，宽度 520 左右，webp。
- `results-share`：分享图，最长边 1800 左右，webp。
- `results-card`：微信小程序卡片封面，500x400 左右，jpg。
- 如果担心 URL 暴露用户 ID，可把 `{userId}` 替换为 hash 或按日期分片。

### 3.2 备选方案：阿里云服务器本地目录 + nginx 静态直出

如果短期不想接阿里云 OSS，可以先复刻旧项目方式，在阿里云服务器创建持久目录：

```text
/www/wwwroot/ai-upload
```

nginx 增加静态映射：

```nginx
location ^~ /ai-upload/ {
    alias /www/wwwroot/ai-upload/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
}
```

访问 URL 类似：

```text
https://ces.dayibin.cn/ai-upload/results/{userId}/{taskId}.png
```

这个方案实现最快，速度接近旧项目。但长期风险是磁盘容量、备份、迁移和多机扩容，因此只建议作为过渡方案。

## 4. 当前代码链路说明

当前保存链路大致如下：

```text
APIMart 生成图
  -> 服务端 fetch 生成商图片
  -> 上传 Cloudflare R2
  -> 数据库 stored_image_url 保存 R2 public URL
  -> 前端保存时请求 /api/fortune/generations/{id}/image?public=1&variant=original&t=...
  -> Next.js API 校验 token
  -> Next.js 服务端从 R2 GetObject
  -> Next.js 把图片 stream 回用户
  -> H5 用 XMLHttpRequest 下载整张图
  -> H5 用 FileReader 转 base64
  -> 调用 QFH5.saveImageToAlbum/base64
```

目标链路：

```text
APIMart 生成图
  -> 服务端 fetch 生成商图片
  -> 上传阿里云 OSS 或写入阿里云本地静态目录
  -> 数据库保存国内图片 URL
  -> 前端保存时直接把国内原图 URL 交给 App 原生能力
```

## 5. 具体改造范围

### 5.1 新增国内图片存储模块

新增一个存储抽象，不要把所有逻辑继续写死在 R2 文件里。

建议新增：

```text
src/lib/storage/image-storage.ts
src/lib/storage/aliyun-oss.ts
```

要求：

- 暴露统一方法：
  - `persistRemoteResultImage`
  - `getPublicImageUrl`
  - `deleteImageObject`
- 内部根据环境变量选择阿里云 OSS、本地文件或 R2。
- 生产优先使用阿里云 OSS。
- Cloudflare R2 可作为备份存储，但不再用于用户保存主链路。

建议环境变量：

```env
IMAGE_STORAGE_PROVIDER=aliyun_oss
ALIYUN_OSS_REGION=
ALIYUN_OSS_BUCKET=
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_OSS_PUBLIC_BASE_URL=https://img.dayibin.cn
```

如果使用本地目录过渡：

```env
IMAGE_STORAGE_PROVIDER=local
LOCAL_IMAGE_STORAGE_DIR=/www/wwwroot/ai-upload
LOCAL_IMAGE_PUBLIC_BASE_URL=https://ces.dayibin.cn/ai-upload
```

### 5.2 生成完成后的转存逻辑

当前逻辑在 `src/lib/storage/r2.ts` 的 `persistRemoteImage` 中完成：

- fetch 生成商图片
- 上传原图到 R2
- 生成 preview/share/card
- 保存 R2 URL

改造要求：

- 继续保留“生成完成后立即转存”的模式，不要让用户每次保存都去请求生成商原图。
- 转存目标改为阿里云 OSS 或本地静态目录。
- 原图、preview、share、card 一次性生成并上传。
- 数据库中至少要能保存：
  - 原图 URL
  - 预览图 URL
  - 分享图 URL
  - 卡片图 URL

如果短期不想改数据库结构，也可以先保留 `stored_image_url` 为原图 URL，然后通过约定路径推导 preview/share/card URL。但长期建议加字段，减少推导风险。

推荐新增字段：

```sql
stored_image_url          原图 URL
preview_image_url         列表预览 URL
share_image_url           分享图 URL
card_image_url            小程序卡片图 URL
storage_provider          aliyun_oss/local/r2
storage_object_key        原图对象 key
preview_object_key        预览图对象 key
share_object_key          分享图对象 key
card_object_key           卡片图对象 key
```

涉及表：

- `generation_tasks`
- `fortune_generation_tasks`

### 5.3 前端任务数据改造

当前前端从任务对象里拿：

- `publicImageUrl`
- `originalImageUrl`
- `cardImageUrl`
- `sharePageUrl`

改造后要求：

- `previewUrl` 直接使用国内预览图 URL。
- `originalImageUrl` 直接使用国内原图 URL。
- `publicImageUrl` 可以保留，但应指向国内 share 图或原图。
- `cardImageUrl` 直接指向国内 jpg 卡片图。
- 不再默认用 `/api/.../image` 作为图片展示主地址。

需要检查位置：

```text
src/features/h5/photo-workspace.tsx
src/features/fortune/fortune-app.tsx
src/features/generation/generation-repository.ts
src/features/fortune/fortune-repository.ts
src/app/share/photo/[id]/page.tsx
src/app/share/fortune/[id]/page.tsx
```

### 5.4 保存逻辑改造

当前 `src/lib/qfh5-actions.ts` 的保存逻辑会：

- 先创建高清图片预加载。
- 点击保存后通过 XHR 下载原图。
- 用 FileReader 转成 base64。
- 再调用 `QFH5.saveImageToAlbum` 等原生接口。

这是本次必须去掉的性能瓶颈。

改造要求：

优先级 1：如果 App 支持原生保存 URL：

```ts
QFH5.saveImageToAlbum(imageUrl, callback)
```

则直接传国内原图 URL，不要转 base64。

优先级 2：如果 App 暂时不支持保存 URL：

```ts
QFH5.viewImages(0, [imageUrl])
```

打开原生大图页，让用户长按保存。这个和项目红线一致，也更接近旧项目的 `uni.previewImage` 思路。

优先级 3：浏览器兜底下载：

- 可以保留普通 `<a download>`。
- 不建议再默认把 2K 原图转 base64。

明确要求：

- 删除或禁用保存主流程里的 `fetchImageAsBase64`。
- 保存主流程只传 URL。
- base64 仅作为极少数旧 App 版本兼容兜底，而且要有开关，不得默认启用。

### 5.5 图片接口保留但降级为兼容

当前接口：

```text
/api/generations/{id}/image
/api/fortune/generations/{id}/image
```

改造后不建议删除，但应变成兼容/兜底接口：

- 历史 R2 图片仍可通过它访问。
- 分享页旧链接仍可打开。
- 新生成任务不再把它作为主要图片 URL。

如果新任务已有国内 URL，接口可以：

- 直接 302 到国内图片 URL；或
- 返回一层轻量代理，但不建议作为主链路。

推荐做法：

- `variant=original/share/card/preview` 时，如果数据库已有对应国内 URL，直接 `302 redirect`。
- 没有国内 URL 的历史任务，继续走 R2 GetObject。

### 5.6 历史数据迁移

建议提供迁移脚本：

```text
scripts/migrate-r2-images-to-aliyun.ts
```

功能：

- 扫描 `generation_tasks` 和 `fortune_generation_tasks` 中已成功但仍指向 R2 的记录。
- 下载原图。
- 上传到阿里云 OSS 或本地目录。
- 生成 preview/share/card。
- 更新数据库字段。
- 支持 dry-run。
- 支持断点重跑。
- 每次处理数量可配置，避免线上压力过大。

命令示例：

```bash
npm run migrate:images -- --dry-run
npm run migrate:images -- --limit=100
```

### 5.7 清理逻辑改造

当前临时图清理逻辑会清理 R2 临时对象。

需要同步改造：

- 临时上传图如果仍在 R2，保持原逻辑。
- 如果未来临时图也迁到阿里云 OSS，需要清理对应 provider 的对象。
- 不要误删成品图。

检查文件：

```text
src/workers/cleanup-temp-images.ts
```

## 6. 安全要求

- 图片保存/分享地址必须公网可访问，但不得暴露任何密钥。
- 阿里云 OSS AccessKey 只能存在服务端环境变量。
- 不得把 AccessKey、R2 Secret、APIMart Key 打入前端静态包。
- 用户上传的临时图可以继续保持短期留存和定期清理。
- 成品图 URL 如果担心被猜测，应使用 UUID taskId、hash key 或签名路径，不要使用连续 ID。
- 分享图和保存图不依赖 H5 登录 cookie。

## 7. 性能要求

图片规格建议：

- 预览图：宽 520，webp，quality 72。
- 分享图：最长边 1800，webp，quality 85。
- 卡片图：500x400，jpg，quality 82。
- 原图：保留生成商原图，必要时可统一转 jpg，但要确认透明通道/画质需求。

前端要求：

- 列表只加载预览图。
- 保存才使用原图 URL。
- 分享小程序卡片使用 card 图，不要用 2K 原图。
- 不得在 H5 主线程把 2K 原图转 base64。

服务端要求：

- 生成完成时一次性产出衍生图，避免用户第一次打开/保存时才临时生成。
- 图片响应尽量由 nginx/CDN/OSS 直接返回，不走 Next.js SSR/API 主进程。

## 8. 验收标准

### 8.1 功能验收

- AI 写真生成成功后，历史列表能显示预览图。
- AI 算命生成成功后，历史列表能显示预览图。
- AI 写真保存能打开高清图或保存到相册。
- AI 算命 2K 图保存能打开高清图或保存到相册。
- 分享图片能正常被 App/微信抓取。
- 分享页无需登录即可看到分享图。
- 删除记录不影响其他用户图片。
- 旧 R2 历史记录仍可访问，至少不出现 404。

### 8.2 性能验收

在国内手机网络或公司常用测试网络下：

- 列表预览图首屏 1 秒内开始显示。
- 点击保存后 3-10 秒内打开原生大图页或完成保存。
- AI 算命 2K 图不再出现 1-2 分钟加载。
- 保存流程不再出现“正在下载原图 0%-100%”长时间卡住。

### 8.3 代码验收

- `src/lib/qfh5-actions.ts` 保存主流程不得默认调用 `fetchImageAsBase64`。
- 新生成任务的 `originalImageUrl` 不应指向 `/api/.../image`。
- 新生成任务的 `originalImageUrl` 应指向 `img.dayibin.cn` 或 `/ai-upload/` 这类国内静态地址。
- `/api/.../image` 可以保留为历史兼容，但不再是新任务主链路。
- 前端静态产物中不得出现 OSS/R2/APIMart 密钥。

## 9. 回滚方案

必须保留以下回滚能力：

1. 环境变量切回 R2：

```env
IMAGE_STORAGE_PROVIDER=r2
```

2. 图片接口继续支持从 R2 读取历史图片。
3. 如果阿里云 OSS/CDN 出问题，新任务可临时回退到现有 R2 存储。
4. 前端保存如果原生 URL 保存异常，可临时退回 `QFH5.viewImages` 打开原生大图页。

不建议回滚到 H5 base64 保存主流程，除非 App 旧版本完全不支持 URL。

## 10. 建议实施顺序

第一阶段：最快止血

1. 改保存逻辑：优先 `QFH5.viewImages(0, [originalUrl])` 或原生 URL 保存。
2. 禁止默认 base64 转换。
3. 保持 R2 存储不变。
4. 验证保存速度是否明显改善。

第二阶段：国内存储主链路

1. 接入阿里云 OSS 或本地静态目录。
2. 新生成图片转存到国内存储。
3. 任务接口返回国内图片 URL。
4. 前端展示/保存/分享使用国内 URL。

第三阶段：历史迁移

1. 编写 R2 -> 阿里云 OSS 迁移脚本。
2. 小批量迁移历史成功任务。
3. 观察访问日志、错误率、存储成本。
4. 稳定后扩大迁移范围。

## 11. Kimi 执行注意事项

- 不要直接删除 R2 逻辑，先做 provider 抽象和兼容。
- 不要把图片再次放进 Next.js `public/` 构建目录，成品图是运行时上传内容，应放 OSS 或服务器持久目录。
- 不要把 `/www/wwwroot/ai` 作为上传目录，避免发版清理 `.next` 或项目目录时误删用户图片。
- 本地静态目录方案必须使用 `/www/wwwroot/ai-upload` 这类独立持久目录。
- 如果改了代码，交付时必须附上阿里云部署命令，并包含：
  - 上传哪个压缩包
  - 进入 `/www/wwwroot/ai`
  - 是否清理 `.next`
  - 是否安装依赖
  - 是否执行 `npm run db:generate`
  - PM2 重启命令：`PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 restart aidayibin-h5 --update-env`
  - `curl -I http://127.0.0.1:3001/ai/photo`
  - `curl -I http://127.0.0.1:3001/ai/fortune`

