# AI 结果小程序卡片分享需求文档

## 给 Kimi 的执行话术

请基于本需求文档实现「AI 写真 / AI 算命生成结果分享到微信小程序卡片」能力。实现前必须阅读 `AGENTS.md` 和 `docs/development-red-lines-and-deployment.md`，并参考旧大宜宾源码里的成熟分享链路。优先完成 H5 项目侧能力：生成可公开访问的结果落地页、生成小程序卡片封面图、在 App WebView 内通过 `QFH5.setShareInfo` 传入小程序卡片参数；如果 App 原生桥不支持小程序卡片，必须自动回落到当前 H5 分享，不允许影响现有保存图片、普通分享、生成流程。

## 背景和当前问题

当前 AI 项目生成图片后点击「分享」，实际走的是 H5 网页链接分享：

- `src/lib/qfh5-actions.ts` 的 `shareImage` 调用 `QFH5.setShareInfo(title, image, description, shareUrl, callback)`。
- `src/features/h5/photo-workspace.tsx` 和 `src/features/fortune/fortune-app.tsx` 传入的 `pageUrl` 是当前列表页路径，即 `/ai/photo` 或 `/ai/fortune`。
- 分享接收者打开后无法直接看到被分享的那张生成图，只会进入对应功能页。
- 当前没有小程序卡片参数，也没有面向分享接收者的公开结果落地页。

目标体验：

- 用户在 App 内生成 AI 写真或 AI 算命报告图后点击「分享」。
- 微信弹出的分享内容优先是「小程序卡片」，卡片封面就是该次生成结果的轻量分享封面。
- 接收者点击卡片后进入大宜宾小程序，打开该 AI 结果的公开落地页，能立即看到这张生成图。
- 如果小程序卡片不可用，自动回落为当前 H5 网页分享，不让用户感知失败。

## 旧大宜宾源码参考结论

参考路径：

- 旧 AI H5 分享桥：`/Users/lixin/AI code/大宜宾源代码/dayibin-code-backup-2026-05-16-175149/ai/src/lib/qfh5-actions.ts`
- 小程序 AppID：`/Users/lixin/AI code/大宜宾源代码/dayibin-code-backup-2026-05-16-175149/mp-weixin/project.config.json`
- 小程序可承接 H5 的页面：`/Users/lixin/AI code/大宜宾源代码/dayibin-code-backup-2026-05-16-175149/mp-weixin/subPack/information/webviewMini.js`
- 旧小程序分享返回格式示例：`/Users/lixin/AI code/大宜宾源代码/dayibin-code-backup-2026-05-16-175149/mp-weixin/subPack/fakePage/carIndex.js`

已确认事实：

- 旧 AI H5 曾按 8 参数形式调用 `QFH5.setShareInfo(title, image, desc, link, callback, 2, "", "{}")`。
- 当前项目的 `QFH5.setShareInfo` 类型定义已经预留 `shareType`、`shareAppLink`、`wxMiniProgram` 三个参数，但当前调用没有传。
- 旧小程序 `webviewMini` 页面读取 `url` 参数的方式是 `JSON.parse(decodeURIComponent(n.url))`，因此小程序路径必须按 `encodeURIComponent(JSON.stringify(h5Url))` 拼接。
- 旧小程序页面 `onShareAppMessage` 返回过 `{ title, desc, path, mpId, imageUrl }`，这说明公司现有小程序分享侧已经使用「标题 + 路径 + 小程序 AppID + 封面图」的成熟模型。

## 微信配置定义

必须区分以下配置，不能混用：

- `WECHAT_APP_ID`：公众号网页授权 AppID，用于 H5 在微信内获取实时微信用户信息。
- `WECHAT_APP_SECRET`：公众号网页授权密钥，只能放服务端环境变量，不能下发前端。
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID`：小程序 AppID，例如旧源码里的 `wx9de8f2724cdecb59`，可下发前端。
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID`：小程序原始 ID，一般形如 `gh_xxx`，用于 App 原生微信 SDK 分享小程序时的 `userName`/`gh_id`。该值需要项目负责人从微信小程序后台确认。
- `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH`：小程序承接 H5 的路径，默认 `/subPack/information/webviewMini`。

不得把 `WECHAT_APP_SECRET`、R2 Secret、OpenAI/Apimart Key 等任何密钥写入前端、日志、静态产物或分享参数。

## 第一版实现方案

第一版不要求修改小程序源码，复用现有小程序 `subPack/information/webviewMini` 打开 H5 结果落地页。

分享链路：

1. 用户点击 AI 结果卡片「分享」。
2. H5 根据任务类型和任务 ID 生成公开 H5 结果页：
   - 写真：`/ai/share/photo/{taskId}?s={shareToken}`
   - 算命：`/ai/share/fortune/{taskId}?s={shareToken}`
3. H5 根据公开结果页生成小程序路径：
   - `/subPack/information/webviewMini?url=${encodeURIComponent(JSON.stringify(h5ShareUrl))}`
4. H5 调用 `QFH5.setShareInfo`，传入普通 H5 分享参数和小程序卡片参数。
5. App 原生桥如果支持小程序卡片，则微信展示小程序卡片。
6. App 原生桥不支持或参数异常，则继续展示当前 H5 分享卡片。

## 分享落地页需求

新增两个公开结果页：

- `src/app/share/photo/[id]/page.tsx`
- `src/app/share/fortune/[id]/page.tsx`

页面必须满足：

- 不要求登录。
- 必须校验 `s` 分享签名；签名无效或任务不存在返回 404。
- 只展示该任务生成结果的分享图，不展示用户头像、用户 ID、设备 ID、上传原图、原始高清图、后台错误信息。
- 图片优先使用 `variant=share` 的公开签名图。
- 页面首屏要直接看到图片和明确 CTA：
  - 写真页 CTA：`我也生成 AI 写真`
  - 算命页 CTA：`我也生成 AI 报告`
- CTA 跳转：
  - 写真：`/ai/photo`
  - 算命：`/ai/fortune`
- 页面需要设置基础 metadata/open graph 信息，保证 H5 回落分享也有标题、描述和封面图。

建议页面文案：

- 写真标题：`我在大宜宾生成了一张 AI 写真`
- 写真描述：`点击查看同款 AI 写真效果`
- 算命标题：`我在大宜宾生成了一张 AI 报告图`
- 算命描述：`点击查看你的专属趣味报告`

## 分享签名需求

新增服务端签名工具，建议文件：

- `src/lib/auth/result-share-token.ts`

签名规则：

- 使用 `APP_SESSION_SECRET` 或独立 `RESULT_SHARE_TOKEN_SECRET` 做 HMAC-SHA256。
- payload 至少包含：
  - `kind`: `photo` 或 `fortune`
  - `taskId`
  - `purpose`: 固定为 `result-share-page`
- 生成 base64url token。
- 校验时必须使用 constant-time 比较。
- 分享页和分享构造函数必须复用同一套签名逻辑。

验收规则：

- 没有 `s` 参数：404。
- `kind` 与路由不一致：404。
- `taskId` 被改一位：404。
- `s` 被改一位：404。
- 合法分享链接：200。

## 小程序卡片封面图需求

当前 `variant=share` 是最长边 1800px 的 WebP，适合预览和普通分享，但不适合作为小程序卡片封面。新增小程序卡片专用封面：

- 新增图片变体：`variant=card`
- 输出格式：JPEG
- 建议尺寸：`500x400`，比例 `5:4`
- 裁切方式：中心裁切，不能拉伸变形
- 质量：`80-85`
- 目标大小：`150KB-300KB`
- Content-Type：`image/jpeg`
- 公开访问仍必须要求 `public=1&t=签名`

需要扩展的文件：

- `src/lib/storage/r2.ts`
  - 增加 `createResultCardImageBuffer`
  - 增加 `persistResultCardImage`
  - 增加 `getResultCardImageObject`
  - R2 key 建议：`results-card/{userId}/{taskId}.jpg`
- `src/lib/auth/image-token.ts`
  - `variant` 类型从 `share | original` 扩展为 `share | original | card`
- 图片接口：
  - `src/app/api/generations/[id]/image/route.ts`
  - `src/app/api/fortune/generations/[id]/image/route.ts`
  - 必须严格校验 `variant`，非法值返回 404。

不得用 7M 原图做微信小程序卡片封面。

## H5 分享函数需求

改造 `src/lib/qfh5-actions.ts`。

新增类型：

```ts
type MiniProgramShareInput = {
  appId: string;
  originalId?: string;
  path: string;
  fallbackUrl: string;
  imageUrl: string;
};
```

`shareImage` 入参扩展：

```ts
{
  title: string;
  description: string;
  imageUrl: string;
  pageUrl?: string;
  miniProgram?: MiniProgramShareInput;
}
```

调用规则：

- `pageUrl` 必须是公开结果页，不再是 `/ai/photo` 或 `/ai/fortune` 列表页。
- `imageUrl` 用 `variant=card` 的 JPEG 卡片封面；如 card 图生成失败，再用 `variant=share`。
- 如果 `miniProgram` 存在，调用 `QFH5.setShareInfo` 时必须传满 8 个参数。
- 第 6 个参数 `shareType` 先沿用旧 AI H5 的 `2`。
- 第 7 个参数 `shareAppLink` 传 `miniProgram.fallbackUrl`。
- 第 8 个参数 `wxMiniProgram` 传 JSON 字符串。

`wxMiniProgram` JSON 必须至少包含这些字段，兼容 App 端可能使用的不同命名：

```json
{
  "appId": "wx...",
  "gh_id": "gh_xxx",
  "userName": "gh_xxx",
  "path": "/subPack/information/webviewMini?url=...",
  "webpageUrl": "https://.../ai/share/photo/{id}?s=...",
  "title": "分享标题",
  "description": "分享描述",
  "imageUrl": "https://.../api/generations/{id}/image?public=1&variant=card&t=..."
}
```

如果 `NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID` 未配置，必须直接走当前 H5 分享，不弹错误。

如果 App 原生 callback 返回失败，toast 文案使用：

- `分享失败，已为你切换普通链接分享`

并自动重试一次普通 H5 分享。不要无限重试。

## 分享路径构造需求

新增工具函数，建议文件：

- `src/lib/share/result-share.ts`

必须导出：

- `buildResultSharePageUrl(kind, taskId, token)`
- `buildMiniProgramWebviewPath(h5Url)`
- `buildResultShareTitle(kind, task)`
- `buildResultShareDescription(kind, task)`

路径规则：

```ts
const h5Url = `${origin}${appPath(`/share/photo/${taskId}`)}?s=${token}`;
const miniPath = `${miniWebviewPath}?url=${encodeURIComponent(JSON.stringify(h5Url))}`;
```

注意：

- `h5Url` 必须是完整 HTTPS URL，不能是相对路径。
- `miniPath` 必须以 `/` 开头。
- `url` 参数必须是 `encodeURIComponent(JSON.stringify(h5Url))`，因为旧小程序 `webviewMini` 是这样解析的。
- 不要把 `publicImageUrl` 这种很长的图片地址塞进 `miniPath`；图片地址只放在卡片封面字段里。

## 写真和算命接入需求

修改：

- `src/features/h5/photo-workspace.tsx`
- `src/features/fortune/fortune-app.tsx`

分享按钮点击时：

- 必须等待/拿到当前 task 的：
  - `id`
  - `publicImageUrl`
  - `cardImageUrl` 或可构造 card image URL
  - `originalImageUrl` 不参与分享卡片
- 调用新的分享 helper。
- 分享中按钮可短暂禁用，避免用户连续点 3 次弹多个分享面板。
- 分享按钮文案不用改，仍为「分享」即可。

结果 task 类型建议扩展：

- `cardImageUrl?: string | null`
- `sharePageUrl?: string | null`

如果不想扩展接口字段，也可以在前端通过 task id 构造，但必须复用统一 helper，不能在两个组件里各写一套 URL 拼接。

## App 原生桥对接需求

H5 侧必须先按当前 `QFH5.setShareInfo` 8 参数兼容实现。但需要把以下对接信息发给 App 端确认：

期望 App 支持：

```ts
QFH5.setShareInfo(
  title,
  imageUrl,
  description,
  fallbackUrl,
  callback,
  2,
  fallbackUrl,
  JSON.stringify(wxMiniProgramPayload),
);
```

其中 `wxMiniProgramPayload` 至少包含：

- `appId`: 小程序 AppID
- `userName` 或 `gh_id`: 小程序原始 ID
- `path`: 小程序打开路径
- `webpageUrl`: 兼容低版本微信的 H5 兜底 URL
- `imageUrl`: 卡片封面图

如果当前 App 端完全不解析第 8 个参数，需要 App 端补一个明确接口：

```ts
QFH5.shareMiniProgram({
  title,
  description,
  imageUrl,
  appId,
  userName,
  path,
  webpageUrl,
  callback,
});
```

H5 实现时优先检测 `QFH5.shareMiniProgram`，不存在时再走 `QFH5.setShareInfo` 8 参数。

## 小程序后台配置要求

上线前必须确认：

- 小程序 AppID 是否为 `wx9de8f2724cdecb59`，以微信后台为准。
- 小程序原始 ID `gh_xxx` 必须从微信小程序后台复制。
- 小程序业务域名必须加入 AI H5 域名，例如 `ces.dayibin.cn` 或正式域名。
- H5 分享页必须 HTTPS 可访问。
- 小程序 `subPack/information/webviewMini` 页面能正常打开 AI H5 分享页。

## 安全要求

- 分享落地页只通过 HMAC token 公开，不允许凭任务 ID 直接访问。
- 公开页不得返回上传原图地址、原图高清地址、用户信息、生成提示词、provider task id。
- `variant=original` 仍只允许签名访问，不得作为卡片图或公开落地页默认图。
- 小程序路径里不得出现密钥、R2 key、临时上传图地址。
- 继续保留现有限流，不要移除 `/api/generations`、`/api/fortune/generations`、`/api/uploads` 的限流。
- card 图生成失败时记录服务端 warning，但前端回落 share 图，不影响用户分享。

## 测试要求

必须新增或更新测试：

- `tests/result-share-token.test.ts`
  - 合法签名通过。
  - 改 taskId 失败。
  - 改 kind 失败。
  - 改 token 失败。
- `tests/qfh5-actions.test.ts`
  - 配置 miniProgram 时，`setShareInfo` 收到 8 个参数。
  - 第 8 个参数可 JSON.parse。
  - JSON 中包含 `appId/path/webpageUrl/imageUrl`。
  - 未配置 miniProgram 时仍走当前普通分享。
  - 原生失败时只回落普通分享一次。
- 图片 token 测试：
  - `variant=card` 可签名和校验。
  - 非法 variant 拒绝。

每次提交前必须通过：

```bash
npm run typecheck
npm run lint
npm test
rm -rf .next && npm run build
```

并扫描静态产物是否包含密钥名或密钥值。

## 人工验收清单

本地/测试环境：

- `/ai/photo` 生成一张图后点分享，mock `QFH5.setShareInfo` 能看到 8 参数。
- `/ai/fortune` 生成一张图后点分享，mock `QFH5.setShareInfo` 能看到 8 参数。
- 打开合法 `/ai/share/photo/{id}?s=...` 可看到结果图。
- 打开合法 `/ai/share/fortune/{id}?s=...` 可看到结果图。
- 删除或篡改 `s` 后返回 404。
- card 图片接口返回 `image/jpeg`。
- share 图片接口仍返回原来的 share 图。
- original 图片接口不被普通分享使用。

App 真机：

- iOS App 内点击分享，微信展示小程序卡片。
- Android App 内点击分享，微信展示小程序卡片。
- 接收者点击卡片，进入大宜宾小程序并打开 AI 结果页。
- 小程序内结果图首屏可见。
- 小程序业务域名未配置时，要能识别并回落普通 H5 分享。
- App 端不支持小程序卡片时，H5 分享不报错、不白屏、不影响保存图片。

## 不做事项

- 不修改 AI 生成模型和提示词。
- 不改变图片保存体验。
- 不把 7M 原图用于微信分享卡片。
- 不把 `WECHAT_APP_SECRET` 或任何服务端密钥下发到浏览器。
- 不要求第一版重写小程序结果页；第一版复用 `webviewMini` 承接 H5 分享页。

## 交付物

Kimi 完成后需要说明：

- 修改了哪些文件。
- 小程序卡片使用的 AppID、原始 ID、webview path 从哪里读取。
- 是否需要 App 原生端配合；如果需要，给出 App 端参数样例。
- 是否需要微信小程序后台配置业务域名。
- `typecheck/lint/test/build` 结果。
- 阿里云部署命令块，必须符合 `docs/development-red-lines-and-deployment.md`。
