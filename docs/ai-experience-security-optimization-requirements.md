# AI 大宜宾体验、安全、分享链路优化需求文档

本文档给 Kimi 执行。执行前不要先写代码，必须先读：

- `AGENTS.md`
- `docs/development-red-lines-and-deployment.md`
- `node_modules/next/dist/docs/` 中与当前改动相关的 Next.js 16 文档

本项目当前 Next.js 版本不是常规认知里的 Next.js，写代码前必须确认当前版本 API 和约定。

## 一、目标

本次优化不是单点修 bug，而是从用户真实使用感受出发，解决三个核心问题：

1. AI 写真和 AI 算命点击保存后缺少持续、可信、可感知的状态反馈，尤其 AI 算命 2K 成品图约 7MB，下载慢时 App 会像卡死一样，用户第一次点保存没有反应，容易误判为死机并重启 App。
2. 图片生成后点击分享到微信，微信里打开页面时展示默认“大宜宾用户”，不是实时微信用户信息，导致分享裂变体验不可信。
3. 从安全和成本角度检查并补强：防止用户通过伪造身份薅免费生成额度，防止接口被外部滥用，确认 AI 服务 API Key 不泄露。

最终目标：

- 用户从点击“保存”那一刻开始，立刻知道系统正在处理。
- 用户等待大图保存时，页面不能沉默、不能让按钮瞬间恢复、不能让用户误以为 App 死机。
- 用户默认更快拿到适合手机保存和分享的图片。
- 分享到微信后，新用户进入页面能拿到微信实时身份，不能再显示默认用户。
- 生成成本可控，生产环境不能靠前端传 `uid` 来建立用户身份。

## 二、当前代码现状

### 2.1 保存链路现状

当前保存公共逻辑在：

- `src/lib/qfh5-actions.ts`

当前写真保存入口在：

- `src/features/h5/photo-workspace.tsx`

当前算命保存入口在：

- `src/features/fortune/fortune-app.tsx`

现状问题：

1. `saveImageToPhone` 只在开始时调用一次 toast，文案是“高清图片正在下载中，请稍候”。
2. 写真和算命卡片里的 `isSaving` 都用 800ms 定时恢复，和真实保存耗时无关。
3. 如果原生保存接口 10 秒、20 秒、30 秒后才回调，H5 页面期间没有持续 UI 状态。
4. 算命 2K 图体积大，保存时很容易超过用户心理等待阈值。
5. 用户点保存后看不到进度、看不到任务仍在进行、也不知道能否重复点击，因此会误以为 App 卡死。

### 2.2 分享和身份现状

当前身份交换逻辑在：

- `src/features/auth/app-token-login.tsx`
- `src/app/api/auth/exchange/route.ts`
- `src/features/auth/app-auth-service.ts`

现状问题：

1. H5 会尝试从 URL 或 `QFH5.getUserInfo` 读取用户信息。
2. 后端目前只要拿到 `uid` 或 `app_user_id` 就会创建/更新用户会话。
3. 生产环境如果继续信任前端传入的 `uid`，外部用户可以伪造任意用户身份。
4. 微信外部打开分享页时没有 App WebView 的 `QFH5` 能力，所以页面拿不到实时微信用户信息，视觉上回退为默认“大宜宾用户”。

### 2.3 旧项目参考结论

参考路径：

- `/Users/lixin/AI code/dayibin code`

旧 H5 的关键模式：

1. 旧 H5 登录后会保存 `classify:token`、`classify:userId`。
2. 后续接口会带 `Authorization: Bearer ${token}`。
3. 用户信息通过 `/api/ucuser/{userId}` 拉取。
4. App 内优先使用千帆相关登录能力，例如读取 `wap_token` 后请求 `/api/login/qfLogin?token=...`，或者调用 `QFH5.jumpLogin`。
5. 旧业务不是单纯信任前端给一个昵称或用户 ID，而是尽量通过服务端 token 链路确认真实用户。

AI H5 的正式方案应向“服务端验证 token”靠齐，而不是继续信任前端裸传 `uid`。

## 三、需求 1：保存图片体验重做

这是本次最高优先级需求。必须先解决“用户点击保存后没有反馈”的体验问题。

### 3.1 成熟 App 对标体验

用户在成熟 App 中点击保存图片后，合理预期是：

1. 点击后按钮立即有反馈。
2. 100ms 内出现明确状态，例如“正在保存”。
3. 保存期间不能看起来像什么都没发生。
4. 如果图片大、网络慢，界面要持续告诉用户“仍在进行”。
5. 成功时给明确结果：“已保存到相册”。
6. 失败时给明确原因和可执行兜底：“打开大图长按保存”或“重试”。
7. 用户不应因为等待 30 秒而怀疑 App 卡死。
8. 保存流程不应阻塞 App 主线程，用户能继续看到动画或进度。

当前项目差距：

1. 开始只有短 toast，不够持续。
2. 按钮 800ms 后恢复，和实际保存状态脱钩。
3. 保存大图期间没有面板、进度、耗时提示。
4. 没有区分“准备图片”“下载中”“写入相册”“成功/失败”。
5. 没有针对 7MB 大图做默认轻量保存方案。

### 3.2 交互要求：从点击保存开始的完整状态

用户点击“保存”后，必须立即进入以下 UI 流程。

#### 3.2.1 0-100ms：即时响应

必须满足：

1. 保存按钮立刻变为禁用态。
2. 按钮文案立即从“保存”变为“保存中”。
3. 按钮图标进入转动或脉冲状态。
4. 页面出现持续状态 UI，不能只靠短 toast。

推荐 UI：

- 移动端底部浮层，或居中轻量弹层。
- 不要遮住整屏太重，除非原生保存会阻塞当前页面。
- 浮层需要包含：
  - 标题：`正在保存图片`
  - 当前阶段文案
  - 进度条
  - 小字提示

第一阶段文案：

```text
正在准备图片，请稍候
```

小字提示：

```text
图片较大时需要多等一会儿，请不要重复点击
```

#### 3.2.2 100ms-3s：准备和发起保存

如果使用优化图保存，阶段文案：

```text
正在保存到相册
```

如果正在生成/请求优化图，阶段文案：

```text
正在准备适合保存的清晰图片
```

进度条规则：

1. 如果 App 原生接口返回真实进度，显示真实百分比。
2. 如果没有真实进度，显示不确定进度条，不要显示假的固定百分比。
3. 不确定进度条可以用循环动画，文案必须真实，例如“正在保存中”。

#### 3.2.3 超过 3s：慢保存提示

如果保存 3 秒仍未完成，浮层文案必须更新：

```text
图片较大，仍在保存中
```

小字提示：

```text
请保持当前页面打开，完成后会自动提示
```

目的：明确告诉用户“没有卡死，仍在进行”。

#### 3.2.4 超过 10s：强安抚提示

如果保存 10 秒仍未完成，显示：

```text
网络较慢，正在继续保存
```

小字提示：

```text
2K 高清图保存时间可能较长，请稍候
```

如果有“打开大图长按保存”兜底按钮，可以此时出现，但不能自动打断正在保存的原生流程。

按钮：

- `继续等待`
- `打开大图长按保存`

#### 3.2.5 超过 30s：长等待兜底

如果保存 30 秒仍未收到原生回调，显示：

```text
保存仍在进行，可能受网络影响
```

按钮：

- `继续等待`
- `打开大图长按保存`
- `重试保存`

注意：

1. 不能让按钮在 800ms 自动恢复。
2. 不能静默失败。
3. 不能让用户重启 App 才发现其实还在下载。

#### 3.2.6 成功状态

原生回调成功时：

1. 浮层显示成功态。
2. 文案：

```text
已保存到相册
```

3. 1.2 秒后自动关闭浮层。
4. 保存按钮恢复为“保存”。
5. 可以保留 toast，但不能只用 toast。

#### 3.2.7 失败状态

原生回调失败时：

1. 浮层显示失败态。
2. 文案优先展示原生错误，如果原生没有明确错误，使用：

```text
未能直接保存，请打开大图后长按图片保存
```

3. 按钮：

- `重试保存`
- `打开大图保存`
- `关闭`

#### 3.2.8 用户主动关闭

如果保存仍在进行，不建议允许用户直接误关闭。若允许关闭，关闭前文案：

```text
图片可能仍在保存中，关闭提示不会取消系统保存
```

按钮：

- `继续等待`
- `关闭提示`

### 3.3 技术要求：保存函数必须可感知真实完成

当前 `saveImageToPhone(url, previewUrl)` 是同步返回，调用方不知道什么时候成功或失败。

必须改为：

```ts
saveImageToPhone(input: {
  url: string;
  previewUrl?: string;
  originalUrl?: string;
  onStateChange?: (state: SaveImageState) => void;
}): Promise<SaveImageResult>
```

`SaveImageState` 至少包含：

```ts
type SaveImageState =
  | { stage: "preparing"; message: string }
  | { stage: "saving"; message: string; progress?: number }
  | { stage: "slow"; message: string }
  | { stage: "success"; message: string }
  | { stage: "failed"; message: string; error?: string }
  | { stage: "fallback"; message: string };
```

调用方必须根据 Promise 完成/失败恢复按钮状态。

### 3.4 App 原生接口要求

如果 App 端可配合，要求 QFH5 保存接口升级为支持进度回调。

建议格式：

```js
QFH5.saveImageToAlbum(url, function(state, data) {
  // state = 2 表示进度
  // state = 1 表示成功
  // state = 0 表示失败
})
```

进度回调示例：

```js
callback(2, {
  received: 1048576,
  total: 7340032,
  progress: 14
})
```

成功回调：

```js
callback(1, {
  localPath: "..."
})
```

失败回调：

```js
callback(0, {
  error: "用户未授权相册权限"
})
```

App 端必须保证：

1. 图片下载不能阻塞 WebView 主线程。
2. 写入相册不能阻塞 UI 主线程。
3. 下载开始后必须尽快回调进度或“已开始”状态。
4. 如果没有相册权限，要主动弹系统授权或返回明确错误。
5. 大图下载期间 App 页面不能无响应。

### 3.5 默认保存图片尺寸优化

不要默认保存 7MB 的 2K 原图。

新增图片变体：

1. `preview`：卡片展示用，宽度约 520px，现有逻辑可保留。
2. `share` 或 `save`：默认保存/分享用，最长边不超过 1800px，质量 85-88，目标体积 1-2MB，文字必须清晰。
3. `original`：高清原图，保留给用户手动打开大图保存。

保存按钮默认使用 `share/save` 变体。

新增次级入口：

```text
高清原图
```

点击后打开大图页或调用 `QFH5.viewImages`，提示：

```text
高清原图较大，保存可能需要更久
```

### 3.6 写真和算命都必须接入

必须同时改：

- AI 写真生成记录卡片
- AI 算命生成记录卡片

验收时不能只改算命或只改写真。

### 3.7 保存体验验收标准

必须逐条满足：

1. 点击保存后 100ms 内出现持续状态 UI。
2. 保存按钮不再 800ms 自动恢复。
3. 真实保存完成前不能让用户以为已经结束。
4. 保存超过 3 秒，文案变为“图片较大，仍在保存中”。
5. 保存超过 10 秒，明确提示“网络较慢，正在继续保存”。
6. 保存超过 30 秒，提供“继续等待 / 打开大图长按保存 / 重试保存”。
7. 成功后显示“已保存到相册”。
8. 失败后提供重试和大图兜底。
9. AI 算命 2K 约 7MB 原图不再作为默认保存图。
10. 默认保存图在手机里清晰可分享，体积明显小于原图。

## 四、需求 2：分享到微信后的实时用户身份

### 4.1 问题描述

用户在 App 内生成图片后点击分享，到微信里打开链接。当前微信端打开后不是实时微信用户，而是默认“大宜宾用户”。这会导致：

1. 用户信任感下降。
2. 分享裂变体验差。
3. 微信新用户进入后无法建立自己的额度、历史和身份。
4. 后续如果活动传播出去，会出现大量匿名默认用户体验。

### 4.2 目标体验

微信用户打开分享页后：

1. 如果已授权，页面顶部显示微信昵称和头像。
2. 如果未授权，页面明确展示授权入口。
3. 不允许把“默认大宜宾用户”当作已登录用户展示。
4. 授权后生成记录、额度和后续生成行为绑定到该微信用户。

### 4.3 App 内身份方案

生产环境 App 内登录必须使用服务端可验证 token。

要求：

1. App 打开 H5 时提供 `app_token`，或 QFH5 返回 `app_token`。
2. H5 后端 `/api/auth/exchange` 用 `APP_AUTH_VERIFY_URL` 向 App 后端校验 token。
3. App 后端返回真实用户：

```json
{
  "uid": "123456",
  "username": "张三",
  "face": "https://example.com/avatar.png",
  "deviceid": "device-abc"
}
```

或：

```json
{
  "app_user_id": "123456",
  "nickname": "张三",
  "avatar_url": "https://example.com/avatar.png",
  "device_id": "device-abc"
}
```

4. H5 后端只信任 App 后端校验结果，不信任前端直接传的用户 ID。

### 4.4 微信外部打开身份方案

新增微信 OAuth 登录链路。

建议新增接口：

- `GET /api/auth/wechat/start?return_to=/ai/fortune`
- `GET /api/auth/wechat/callback`

流程：

1. 用户在微信中打开分享链接。
2. H5 检测微信 UA 且当前无 session。
3. 跳转微信 OAuth。
4. 服务端用 `code` 换 `openid` 和用户资料。
5. 建立 H5 session。
6. 回到原页面。

微信用户 ID 建议：

```text
app_user_id = wechat:{openid}
```

如果能拿到 unionid，优先保存 unionid：

```text
app_user_id = wechat_union:{unionid}
```

但不能阻塞 openid 方案。

### 4.5 页面展示规则

用户信息展示组件必须区分三种状态：

1. `loading`：正在同步登录信息。
2. `authenticated`：显示真实头像昵称。
3. `anonymous`：显示“登录后体验”，不能伪装成“大宜宾用户”。

默认“大宜宾用户”只能作为头像缺省文案，不得作为登录成功身份。

### 4.6 分享链接要求

分享链接必须是页面链接，不应直接裸露服务端内部敏感信息。

分享图片可以用公开图片 URL，但公开图片 URL 必须见安全章节的签名要求。

分享页面 URL 应保留来源参数，例如：

```text
/ai/fortune?from=share&share_task_id=...
```

注意：

1. `share_task_id` 只能用于展示分享作品或活动引导。
2. 不能让别人通过这个 ID 修改或删除原用户记录。
3. 不能让别人通过这个 ID 获得原用户 session。

### 4.7 验收标准

1. App 内打开 `/ai/photo`、`/ai/fortune` 能识别真实 App 用户。
2. 微信中打开分享链接，无 session 时进入微信授权。
3. 微信授权后显示微信头像昵称。
4. 未授权时不显示“大宜宾用户”作为已登录身份。
5. 生产环境裸传 `uid` 到 `/api/auth/exchange` 必须失败。
6. 旧的 `qfh5_debug=1` 调试能力可以保留，但不得绕过生产校验。

## 五、需求 3：防薅羊毛与接口安全

### 5.1 当前主要风险

1. 生产环境如果允许前端直接传 `uid`，用户可以无限伪造新身份领取额度。
2. 上传接口虽然要求登录，但缺少频率限制和总量限制。
3. 生成接口有额度限制，但并发请求可能绕过“查额度再创建任务”的时间差。
4. 公开图片使用 `public=1`，如果任务 ID 泄露，可被无需登录访问。
5. 管理员登录缺少失败次数限制。
6. Worker 多实例时可能重复处理同一批任务。

### 5.2 身份防刷

生产环境要求：

1. `/api/auth/exchange` 不接受裸 `uid/app_user_id`。
2. 只接受 `app_token` 或微信 OAuth 服务端结果。
3. `APP_AUTH_VERIFY_URL` 和 `APP_AUTH_SHARED_SECRET` 必须配置。
4. `APP_SESSION_SECRET` 必须配置强随机值。
5. `NEXT_PUBLIC_ENABLE_MOCKS=false`。

### 5.3 API 限流

新增通用限流能力，建议存 MySQL。

建议表：`api_rate_limits`

字段：

- `id`
- `rate_key`
- `window_start`
- `count`
- `expires_at`
- `created_at`
- `updated_at`

限流维度：

1. 用户 ID。
2. 设备 ID。
3. IP。
4. User-Agent hash。
5. 接口名。

接口限流要求：

| 接口 | 限制 |
| --- | --- |
| `/api/auth/exchange` | 同 IP 每分钟 20 次，同设备每分钟 10 次 |
| `/api/uploads` | 同用户每分钟 10 次，每日 50 次 |
| `/api/generations` | 同用户每分钟 3 次，每日按现有额度和提交限制 |
| `/api/fortune/generations` | 同用户每分钟 2 次，每日按现有额度和提交限制 |
| `/api/admin/login` | 同 IP 10 分钟 5 次 |

限流返回：

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "操作太频繁，请稍后再试"
  }
}
```

### 5.4 额度并发锁

写真和算命提交生成时，要用数据库锁包住关键区。

建议 MySQL：

```sql
SELECT GET_LOCK('ai_quota:{userId}:{feature}', 5);
SELECT RELEASE_LOCK('ai_quota:{userId}:{feature}');
```

锁内必须包含：

1. 读取额度。
2. 判断是否有 running task。
3. 创建任务记录。
4. 增加提交计数。

如果服务商提交耗时较长，可以先创建任务和占用提交次数，再释放锁，避免锁持有太久。但不能让并发请求同时通过额度判断。

### 5.5 公开图片访问签名

当前 `public=1` 对分享有用，但安全性不够。

要求新增公开图片 token：

```text
/api/fortune/generations/{id}/image?public=1&variant=share&t={token}
```

token 规则：

```text
HMAC(APP_SESSION_SECRET, "{kind}:{taskId}:{variant}")
```

`kind` 可取：

- `photo`
- `fortune`

校验失败：

- 返回 404 或 403。
- 不泄露任务是否存在。

分享和保存链接由前端从任务数据里拿到服务端生成的 public image URL，或新增 API 返回。

### 5.6 上传安全

上传接口继续保留：

1. 必须登录。
2. 只支持 JPG/PNG/WEBP。
3. 服务端二次压缩。
4. 大小上限。

新增：

1. 同用户每日上传次数限制。
2. 同用户每日上传总字节数限制。
3. 临时图 R2 对象必须真正删除，不只是清空 DB 字段。
4. 上传返回的 `file_url` 不应长期可公开访问。

### 5.7 API Key 泄露检查

APIMart Key、R2 Secret、App Secret 只能在服务端环境变量中使用。

完成后必须检查：

```bash
rg -n "APIMART_API_KEY|CLOUDFLARE_R2_SECRET_ACCESS_KEY|APP_SESSION_SECRET|APP_AUTH_SHARED_SECRET|Bearer " .next/static public
```

要求：

1. `.next/static` 中不能出现服务端密钥。
2. `public/` 中不能出现服务端密钥。
3. 前端请求只能打本项目 `/api/...`，不能直接请求 APIMart。

## 六、体验细节补充

### 6.1 生成完成后的引导

生成完成时，记录卡片除了“保存”“分享”，建议增加轻提示：

```text
建议先保存图片，再分享到朋友圈
```

但不要在页面里堆太多说明文字，优先通过按钮状态和反馈完成引导。

### 6.2 分享按钮状态

点击分享后也要有状态反馈：

1. 立即 toast 或按钮态：`正在打开微信分享`
2. 调起失败：`分享失败，请稍后再试`
3. 分享成功：`分享成功`

分享使用 `variant=share` 图片。

### 6.3 历史记录里的失败状态

失败记录必须清楚展示失败原因。不要只显示“失败”。

如果服务商失败：

```text
生成失败，请稍后重试
```

如果额度用完：

```text
今日体验次数已用完
```

## 七、必须修改的文件范围建议

Kimi 可根据实际实现调整，但预计至少涉及：

- `src/lib/qfh5-actions.ts`
- `src/lib/storage/r2.ts`
- `src/app/api/generations/[id]/image/route.ts`
- `src/app/api/fortune/generations/[id]/image/route.ts`
- `src/features/h5/photo-workspace.tsx`
- `src/features/fortune/fortune-app.tsx`
- `src/features/auth/app-token-login.tsx`
- `src/features/auth/app-auth-service.ts`
- `src/app/api/auth/exchange/route.ts`
- `src/features/quota/quota-service.ts`
- `src/features/fortune/fortune-quota-service.ts`
- `prisma/schema.prisma`
- 新增微信 OAuth 相关 route
- 新增限流相关 lib/service
- 必要测试文件

## 八、测试要求

必须执行：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

保存体验至少人工验证：

1. AI 写真保存。
2. AI 算命保存。
3. 模拟原生保存 1 秒成功。
4. 模拟原生保存 12 秒成功。
5. 模拟原生保存失败。
6. 模拟无原生保存能力，走大图长按保存兜底。

身份体验至少人工验证：

1. App 内有 token 时能识别真实用户。
2. 微信打开分享链接能进入 OAuth。
3. 微信授权后显示真实头像昵称。
4. 未授权时不显示默认“大宜宾用户”。
5. 生产环境裸传 `uid` 登录失败。

安全至少验证：

1. 频繁调用生成接口会被限流。
2. 并发提交不会突破额度。
3. 无签名 token 的公开图片不能访问。
4. 前端静态包不含 APIMart/R2/App Secret。

## 九、部署交付要求

完成代码或依赖变更后，必须在交付说明里给项目负责人一整段阿里云部署命令。

命令块必须包含：

1. 上传哪个压缩包。
2. 进入 `/www/wwwroot/ai`。
3. 是否清理 `.next`。
4. 是否安装依赖。
5. 是否执行 `npm run db:generate`。
6. PM2 重启命令必须带：

```bash
PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 restart aidayibin-h5 --update-env
```

7. curl 检查：

```bash
curl -I http://127.0.0.1:3001/ai/photo
curl -I http://127.0.0.1:3001/ai/fortune
```

标准模板：

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

## 十、最终验收清单

以下任何一项不满足，都不能视为完成：

1. 用户点击保存后 100ms 内有持续状态反馈。
2. 保存超过 3 秒、10 秒、30 秒时都有明确文案变化。
3. 保存按钮不再用固定 800ms 假恢复。
4. AI 写真和 AI 算命都接入新保存体验。
5. AI 算命默认保存不再直接使用 7MB 原图。
6. 保存成功和失败都有明确结果态。
7. 微信打开分享页能获取微信实时用户信息。
8. 未登录/未授权不能伪装成“大宜宾用户”。
9. 生产环境不能裸传 `uid` 换 session。
10. 生成和上传接口有基础限流。
11. 并发提交不能绕过额度。
12. 公开图片访问有签名 token。
13. APIMart/R2/App Secret 不出现在前端静态包。
14. `typecheck/lint/test/build` 全部通过。
