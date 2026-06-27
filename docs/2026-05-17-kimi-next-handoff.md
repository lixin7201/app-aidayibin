# 2026-05-17 AI 大宜宾优化交接与下一步任务

这份文档用于发给 Kimi 接着处理。当前项目目录：

`/Users/lixin/AI code/app-aidayibin`

Kimi 接手前必须先阅读：

- `AGENTS.md`
- `docs/development-red-lines-and-deployment.md`
- `docs/mini-program-card-share-requirements.md`

本次最重要的目标仍然是：提升 AI 写真 / AI 算命生成后保存、分享、微信身份、安全防刷的成熟 App 体验。不要只追求代码能跑，要站在用户角度确认“点了保存马上有反馈、分享出去能正常打开、微信里不是默认用户、安全上不能被薅羊毛或泄露密钥”。

## 一、今天已经完成的主要事项

### 1. 图片保存体验重做

已完成内容：

- AI 写真和 AI 算命生成结果不再直接让用户下载 2K 原图。
- 默认保存 / 分享使用压缩后的公开分享图，减少 7MB 原图导致的长时间等待。
- 新增保存状态反馈浮层：
  - 用户点击保存后立即进入“正在准备图片，请稍候”。
  - 保存中显示进度 / 加载状态。
  - 3 秒后提示“图片较大，仍在保存中”。
  - 10 秒后提示“网络较慢，正在继续保存”。
  - 30 秒仍未成功时进入兜底，引导用户打开大图长按保存。
- 保存成功后显示“已保存到相册”，并自动关闭。
- 保存失败时提供“重试保存”和“打开大图保存”。
- 保留“高清原图”入口，适合用户明确想保存高质量原图时使用。

涉及文件：

- `src/lib/qfh5-actions.ts`
- `src/components/save-image-overlay.tsx`
- `src/features/h5/photo-workspace.tsx`
- `src/features/fortune/fortune-app.tsx`
- `src/lib/storage/r2.ts`

体验判断：

- 这部分已经解决“用户点保存没有任何反馈，以为 App 卡死”的核心问题。
- 2K 大图保存仍可能受网络影响，但用户会得到清晰状态和兜底入口。

### 2. 图片公开访问与压缩变体

已完成内容：

- 新增 `share` 变体：最长边 1800px，WebP，quality 85，用于默认保存和普通分享。
- 新增 `card` 变体：500x400，JPEG，用于微信小程序卡片封面。
- 保留 `original` 变体：高清原图，仅在用户点击高清原图或兜底保存时使用。
- 图片公开访问必须带签名 token，不能只靠任务 ID。
- `variant` 严格限制为 `share` / `original` / `card`。
- 非法 variant 或签名错误统一 404，避免暴露图片状态。

涉及文件：

- `src/lib/auth/image-token.ts`
- `src/app/api/generations/[id]/image/route.ts`
- `src/app/api/fortune/generations/[id]/image/route.ts`
- `src/lib/storage/r2.ts`

### 3. 结果分享页与小程序卡片分享

已完成内容：

- 新增 AI 写真公开结果页：
  - `/ai/share/photo/{taskId}?s={token}`
- 新增 AI 算命公开结果页：
  - `/ai/share/fortune/{taskId}?s={token}`
- 分享落地页必须校验 `s` 签名 token。
- 分享页展示完整分享图，不再展示被裁剪的小程序 card 封面图。
- 任务列表返回 `sharePageUrl`，签名在服务端生成，前端不再自己签名。
- 前端分享时优先尝试小程序卡片：
  - 优先 `QFH5.shareMiniProgram`
  - 其次 `QFH5.setShareInfo` 8 参数
  - 如果原生桥失败，回落普通 H5 链接分享
- `pageUrl` 已保留 `?s=`，不会再把签名参数丢掉。
- 小程序卡片图片地址和 fallback 地址已转成绝对 URL。
- `NEXT_PUBLIC_APP_URL=http://localhost:3000/ai` + `NEXT_PUBLIC_BASE_PATH=/ai` 的情况下，分享页 URL 已验证不会出现 `/ai/ai/...`。

涉及文件：

- `src/lib/auth/result-share-token.ts`
- `src/lib/share/result-share.ts`
- `src/app/share/photo/[id]/page.tsx`
- `src/app/share/fortune/[id]/page.tsx`
- `src/features/generation/generation-repository.ts`
- `src/features/fortune/fortune-repository.ts`
- `src/features/h5/photo-workspace.tsx`
- `src/features/fortune/fortune-app.tsx`
- `src/lib/qfh5-actions.ts`

### 4. 微信用户身份链路

已完成内容：

- 新增公众号网页授权入口：
  - `/ai/api/auth/wechat/start`
- 新增公众号网页授权回调：
  - `/ai/api/auth/wechat/callback`
- OAuth state 使用签名 cookie，避免 CSRF / open redirect。
- callback 中换取微信 `access_token` 后拉取微信用户信息。
- 按 `unionid` 或 `openid` 建立用户：
  - 有 unionid：`wechat_union:{unionid}`
  - 无 unionid：`wechat:{openid}`
- 成功后写入当前 H5 session。

涉及文件：

- `src/app/api/auth/wechat/start/route.ts`
- `src/app/api/auth/wechat/callback/route.ts`
- `src/features/auth/app-user-repository.ts`
- `src/features/auth/session.ts`

注意：

- 这部分代码已具备能力，但当前本地环境没有配置 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`，所以本地访问 `/ai/api/auth/wechat/start` 返回 500 是符合预期的配置缺失表现。

### 5. 防薅羊毛与接口安全

已完成内容：

- 新增 `api_rate_limits` 表。
- 新增滑动窗口限流服务。
- 限流接入：
  - `/api/auth/exchange`
  - `/api/uploads`
  - `/api/generations`
  - `/api/fortune/generations`
  - `/api/admin/login`
- 上传增加每日 500MB 字节限流。
- 生产环境拒绝裸 `uid` / `app_user_id` 登录，必须走 `app_token` 校验。
- AI 写真和 AI 算命创建任务时加入 MySQL `GET_LOCK` / `RELEASE_LOCK`，降低并发绕过额度的风险。
- `api_rate_limits` 已使用 `INSERT ... ON DUPLICATE KEY UPDATE`，并更新 `updated_at = NOW(3)`。

涉及文件：

- `prisma/schema.prisma`
- `src/lib/security/rate-limit.ts`
- `src/app/api/auth/exchange/route.ts`
- `src/app/api/uploads/route.ts`
- `src/app/api/generations/route.ts`
- `src/app/api/fortune/generations/route.ts`
- `src/app/api/admin/login/route.ts`
- `src/features/auth/app-auth-service.ts`
- `src/features/generation/generation-service.ts`
- `src/features/fortune/fortune-service.ts`

## 二、Codex 今日复查结果

已执行并通过：

```bash
npm run typecheck
npm run lint
npm test
rm -rf .next && npm run build
```

结果：

- typecheck：通过
- lint：通过
- test：通过，7 个测试文件，32 项测试全部通过
- production build：通过

本地生产模式 smoke test：

```bash
PORT=3101 HOSTNAME=127.0.0.1 NODE_ENV=production npm run start
curl -I http://127.0.0.1:3101/ai/photo
curl -I http://127.0.0.1:3101/ai/fortune
```

结果：

- `/ai/photo` 返回 200
- `/ai/fortune` 返回 200

静态产物安全扫描：

- `.next/static` 和 `public` 中未发现以下服务端敏感项：
  - `APP_SESSION_SECRET`
  - `WECHAT_APP_SECRET`
  - `APIMART_API_KEY`
  - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
  - `APP_AUTH_SHARED_SECRET`
  - `local-aidayibin-session-secret`
  - `createHmac`
  - `result-share-page`
- 本地 `.env.local` 中服务端密钥值未进入 `.next/static` 或 `public`。

重要结论：

- 上次发现的“前端引入服务端 HMAC 签名逻辑”问题已经修复。
- 当前前端静态包没有把签名密钥、签名逻辑、服务端密钥泄露出去。
- 分享 URL 已验证不会出现双 `/ai/ai`。

## 三、当前仍然存在的上线阻塞问题

### 阻塞 1：小程序卡片分享当前构建没有启用

当前本地 `.env.local` 缺少：

```bash
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID=
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID=
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH=
```

代码位置：

- `src/features/h5/photo-workspace.tsx`
- `src/features/fortune/fortune-app.tsx`

现状：

- 代码里只有 `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID` 存在时才会传 `miniProgram`。
- 当前构建时没有该变量，所以前端包会自动回落普通 H5 分享。
- 注意：`NEXT_PUBLIC_*` 是构建时写入前端包的变量，不是上线后只改服务器 `.env.local` 就一定生效。必须在执行 `npm run build` 前配置好，然后重新构建打包。

旧源码里能确认的小程序 AppID：

```bash
wx9de8f2724cdecb59
```

来源：

- `/Users/lixin/AI code/大宜宾源代码/dayibin-mini-program-parameters.md`
- `/Users/lixin/AI code/大宜宾源代码/dayibin-external-parameters.md`

仍需确认：

- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID`，一般形如 `gh_xxx`。
- 这个值没有在旧源码里明确找到，需要从微信小程序后台获取“原始 ID”。

建议配置：

```bash
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID=wx9de8f2724cdecb59
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID=gh_xxx_from_wechat_mp_console
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH=/subPack/information/webviewMini
```

### 阻塞 2：微信实时用户身份需要公众号网页授权配置

当前缺少：

```bash
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_OAUTH_REDIRECT_URL=
```

说明：

- `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是公众号网页授权使用的 AppID / Secret。
- 不是小程序 AppID。
- `WECHAT_APP_SECRET` 只能放服务端环境变量，不能进入前端，不能写进文档明文，不能提交仓库。

旧源码里能看到公众号 AppID：

```bash
wx6bb51741d7600c03
```

来源：

- `/Users/lixin/AI code/大宜宾源代码/dayibin-external-parameters.md`
- 旧源码 server 配置中也有等价字段，但不要复制旧文件里的明文 secret 到仓库。

仍需确认：

- 公众号后台是否已配置网页授权域名。
- `WECHAT_APP_SECRET` 是否需要在公众号后台重置。旧源码曾硬编码过 secret，从安全角度建议重置后再配置到服务器环境变量。

建议配置：

```bash
WECHAT_APP_ID=wx6bb51741d7600c03
WECHAT_APP_SECRET=从公众号后台获取或重置后的服务端密钥
WECHAT_OAUTH_REDIRECT_URL=https://ces.dayibin.cn/ai
```

注意：

- 当前代码会把 callback 拼成：
  - `${WECHAT_OAUTH_REDIRECT_URL}/api/auth/wechat/callback`
- 所以 `WECHAT_OAUTH_REDIRECT_URL` 建议填 `https://ces.dayibin.cn/ai`，不要填完整 callback 地址。

### 阻塞 3：真实 App 用户登录校验接口未配置

当前缺少：

```bash
APP_AUTH_VERIFY_URL=
APP_AUTH_SHARED_SECRET=
```

影响：

- 生产环境已经拒绝裸 `uid` / `app_user_id`。
- 如果 App 进入 H5 后只传裸用户 ID，生产会被拒绝。
- 如果 `APP_AUTH_VERIFY_URL` 没配置，生产用户无法通过 `app_token` 换取真实身份。
- 这会影响“分享后微信端打开不是实时用户 / 默认大宜宾用户”的身份体验，也会影响额度、防刷、用户归因。

Kimi 需要确认：

- App 端是否已经把 `app_token` 传给 H5。
- H5 后端调用哪个 App 后端接口校验 token。
- 接口返回字段至少需要包含：
  - `app_user_id` 或 `uid`
  - `nickname` 或 `username`
  - `avatar_url` 或 `face`
  - `device_id` 或 `deviceid`

建议配置：

```bash
APP_AUTH_VERIFY_URL=https://大宜宾App后端/verify-token
APP_AUTH_SHARED_SECRET=双方约定的服务端密钥
```

### 阻塞 4：`.env.example` 还没有补齐新环境变量

当前 `.env.example` 只有：

```bash
APP_AUTH_VERIFY_URL=
APP_AUTH_SHARED_SECRET=
APP_SESSION_SECRET=
```

缺少：

```bash
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_OAUTH_REDIRECT_URL=
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID=
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID=
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH=
```

要求：

- Kimi 需要补齐 `.env.example` 和相关部署说明。
- 不能把真实 secret 写入 `.env.example`。
- 只能写占位符和说明。

### 阻塞 5：上线包必须在补齐构建时环境变量后重新生成

当前已经 build 通过，但这次构建环境没有小程序分享变量。

所以：

- 不要直接拿当前 `.next` 或旧 `dist/*.tar.gz` 上线。
- 必须先配置构建时变量，再重新执行：

```bash
npm run typecheck
npm run lint
npm test
rm -rf .next && npm run build
```

然后重新打包。

## 四、Kimi 下一步必须完成的任务

### 任务 1：补齐环境变量模板和部署文档

修改范围：

- `.env.example`
- `README.md` 或现有部署文档
- 必要时补充 `docs/development-red-lines-and-deployment.md`

必须新增说明：

```bash
# 公众号网页授权，用于微信内实时身份
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_OAUTH_REDIRECT_URL=https://ces.dayibin.cn/ai

# 大宜宾小程序卡片分享，NEXT_PUBLIC_* 必须在 npm run build 前配置
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID=wx9de8f2724cdecb59
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID=
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH=/subPack/information/webviewMini
```

同时明确：

- `WECHAT_APP_SECRET` 只能在服务器环境变量配置，不能下发前端。
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID` 可以下发前端。
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID` 是小程序原始 ID，不是 AppID。
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_*` 必须在构建前设置。

### 任务 2：确认小程序原始 ID 和 App 原生桥参数

Kimi 需要和项目负责人或 App 端确认：

- 小程序原始 ID：`gh_xxx`
- App 当前 `QFH5.setShareInfo` 第 6/7/8 参数是否支持小程序卡片。
- App 是否支持 `QFH5.shareMiniProgram`。
- 如果 App 端要求字段名不是 `gh_id` / `userName` / `path` / `webpageUrl` / `imageUrl`，需要同步调整 `src/lib/qfh5-actions.ts`。

当前 H5 传参结构：

```json
{
  "appId": "wx...",
  "gh_id": "gh_...",
  "userName": "gh_...",
  "path": "/subPack/information/webviewMini?url=...",
  "webpageUrl": "https://.../ai/share/photo/{id}?s=...",
  "title": "...",
  "description": "...",
  "imageUrl": "https://.../ai/api/generations/{id}/image?public=1&variant=card&t=..."
}
```

### 任务 3：补充针对小程序分享的自动测试

现有测试已经覆盖基础 8 参数调用，但还需要补充更贴近这次风险的测试：

建议新增 / 加强：

- `buildResultSharePageUrl` 测试：
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000/ai`
  - `NEXT_PUBLIC_BASE_PATH=/ai`
  - 输出必须是 `http://localhost:3000/ai/share/photo/task-123?s=token`
  - 不能出现 `/ai/ai/`
- `shareImage` 测试：
  - explicit `pageUrl` 带 `?s=token` 时，`setShareInfo` 第 4 个参数必须保留完整 query。
  - `miniProgram.imageUrl` 是相对路径时，传给原生桥必须转成绝对 URL。
  - `miniProgram.fallbackUrl` 是相对路径时，传给原生桥必须转成绝对 URL。
- 静态包扫描测试或脚本：
  - `.next/static` 中不能出现 `APP_SESSION_SECRET`
  - `.next/static` 中不能出现 `WECHAT_APP_SECRET`
  - `.next/static` 中不能出现 `local-aidayibin-session-secret`
  - `.next/static` 中不能出现 `createHmac`

### 任务 4：重新构建和打包

Kimi 完成配置文档和必要测试后，必须重新执行：

```bash
npm run typecheck
npm run lint
npm test
rm -rf .next && npm run build
```

然后重新做静态产物扫描：

```bash
rg -n "APP_SESSION_SECRET|WECHAT_APP_SECRET|APIMART_API_KEY|CLOUDFLARE_R2_SECRET_ACCESS_KEY|APP_AUTH_SHARED_SECRET|local-aidayibin-session-secret|createHmac|Bearer " .next/static public
```

预期：

- 没有任何命中。

再确认 `.next/node_modules` 软链接存在：

```bash
find .next/node_modules/@prisma -maxdepth 1 -type l -ls
find .next/node_modules -maxdepth 2 -type l -ls
```

预期至少看到：

- `@prisma/client-*`
- `sharp-*`
- `@aws-sdk/client-s3-*`

### 任务 5：重新生成阿里云部署包

必须用 `docs/development-red-lines-and-deployment.md` 中推荐的 rsync + tar 方式。

注意：

- 不要把 `.env.local` 打进包。
- 不要排除 `.next/node_modules`。
- 不要复用旧包名。
- 交付时必须告诉项目负责人新包的完整路径和文件名。

## 五、上线前人工验收清单

### 1. 保存图片体验

AI 写真：

- 生成成功后点击“保存”。
- 必须立刻出现保存状态反馈。
- 弱网或大图情况下，3 秒和 10 秒后有清晰提示。
- 不允许用户点保存后 30 秒没有任何反馈。
- 保存失败或超时后能打开大图保存。

AI 算命：

- 生成 2K 图后点击“保存”。
- 必须立刻出现保存状态反馈。
- App 不应该表现为“无响应”。
- 默认保存不应直接下载 7MB 原图。
- “高清原图”入口仍可打开原图。

### 2. 普通 H5 分享

- 未配置小程序变量时，分享应正常回落 H5 链接。
- 分享链接必须包含 `?s=`。
- 微信里打开分享链接能看到完整图片。
- 错误 token 或缺少 `s` 必须 404。

### 3. 小程序卡片分享

配置 `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_*` 并重新构建后：

- AI 写真点击分享，App 微信分享面板应展示小程序卡片。
- AI 算命点击分享，App 微信分享面板应展示小程序卡片。
- 卡片封面使用 500x400 card 图，不使用 7MB 原图。
- 小程序打开后能进入承接 H5 的 webview 页面。
- webview 内打开的是 `/ai/share/photo/{id}?s=...` 或 `/ai/share/fortune/{id}?s=...`。
- 如果 App 原生桥不支持小程序卡片，必须自动回落普通 H5 分享。

### 4. 微信身份

- 微信内打开分享页后，如果需要登录，应走公众号 OAuth。
- 授权后显示真实微信用户信息。
- 不应显示默认“大宜宾用户”。
- OAuth state 错误、缺失、重复使用都不能登录成功。

### 5. 防刷与额度

- 同一用户连续快速提交 AI 写真，超过限制应 429。
- 同一用户连续快速提交 AI 算命，超过限制应 429。
- 同一用户并发提交，不能绕过“已有任务生成中”。
- 生产环境裸 `uid` / `app_user_id` 登录应被拒绝。
- 上传接口每日数量和每日 500MB 限制生效。

## 六、给 Kimi 的直接话术

Kimi，请继续处理当前项目 `/Users/lixin/AI code/app-aidayibin`。先阅读 `AGENTS.md`、`docs/development-red-lines-and-deployment.md`、`docs/mini-program-card-share-requirements.md` 和本文档。

目前代码主流程已通过 Codex 复查：保存体验、小程序分享基础实现、签名安全、防刷限流、生产构建都通过。但还有上线前阻塞：小程序卡片分享和微信实时身份依赖的环境变量没有补齐，`.env.example` 和部署文档也没有完整说明；当前构建环境未设置 `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_*`，所以不会启用小程序卡片分享。

请完成以下任务：

1. 补齐 `.env.example` 和部署说明，新增公众号网页授权、小程序卡片分享、App token 校验相关环境变量说明。
2. 明确提醒 `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_*` 必须在 `npm run build` 前配置，否则前端不会启用小程序卡片。
3. 不要把任何真实 secret 写进仓库。
4. 补充针对分享 URL 不双 `/ai`、`?s=` 不丢失、小程序图片 URL 转绝对地址、静态包不含签名密钥/签名逻辑的测试或验证脚本。
5. 重新执行 `npm run typecheck`、`npm run lint`、`npm test`、`rm -rf .next && npm run build`。
6. 扫描 `.next/static public`，确认没有 `APP_SESSION_SECRET`、`WECHAT_APP_SECRET`、`APIMART_API_KEY`、`CLOUDFLARE_R2_SECRET_ACCESS_KEY`、`APP_AUTH_SHARED_SECRET`、`local-aidayibin-session-secret`、`createHmac`。
7. 使用项目部署文档推荐方式重新生成部署包，并给出完整阿里云部署命令。

关键配置参考：

```bash
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
NEXT_PUBLIC_ENABLE_MOCKS=false

WECHAT_APP_ID=wx6bb51741d7600c03
WECHAT_APP_SECRET=从公众号后台获取或重置后的服务端密钥
WECHAT_OAUTH_REDIRECT_URL=https://ces.dayibin.cn/ai

NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID=wx9de8f2724cdecb59
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID=gh_xxx_from_wechat_mp_console
NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH=/subPack/information/webviewMini

APP_AUTH_VERIFY_URL=https://大宜宾App后端/verify-token
APP_AUTH_SHARED_SECRET=双方约定的服务端密钥
APP_SESSION_SECRET=强随机值
```

其中 `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID` 必须从微信小程序后台确认，旧源码里目前只确认到小程序 AppID `wx9de8f2724cdecb59`，没有确认到 `gh_xxx`。

## 七、当前是否可以上架

结论：暂不建议直接上架。

原因：

- 代码层面基本过关。
- 但小程序卡片分享依赖的构建时环境变量缺失，当前包不会启用小程序卡片。
- 微信实时用户身份依赖的公众号 OAuth 和 App token 校验配置缺失，当前线上若不补配置，会出现身份链路不可用或仍然无法拿到真实用户的问题。

补齐配置、重新构建、重新打包、完成 App 真机分享 / 保存验收后，再上架阿里云。
