# 2026-05-18 微信分享修复与待处理问题

记录时间：2026-05-18 11:31 CST

## 上午已处理

- 排查“大宜宾 App 内点击分享到微信好友秒失败”问题。
- 对照了昨天可用包：`/Users/lixin/AI code/app-aidayibin/dist/app-aidayibin-deploy 图片优化版.tar.gz`。
- 对照了旧项目源码：`/Users/lixin/AI code/大宜宾源代码`。
- 关键结论：旧项目和昨天可用包的普通 H5 分享都使用 `QFH5.setShareInfo(title, image, desc, url, callback)` 5 参数调用；当前版本因为小程序分享配置介入，写真和算命入口会走小程序卡片 8 参数调用，导致 App 内分享到微信好友秒失败。
- 已将 AI 写真和 AI 算命的分享入口改回普通 H5 链接分享，不再从页面入口传 `miniProgram` 参数。
- 底层 `shareImage` 仍保留小程序卡片分支，后续要重新启用时，需要先确认 App 侧协议、微信公众号/小程序 OriginalId、WebView path 和微信卡片参数格式。

## 已验证

- `npx vitest run tests/qfh5-actions.test.ts` 通过。
- `npm run typecheck` 通过。
- `npm run lint` 通过。
- `npm test` 通过。
- 生产构建通过。
- 用户线上部署后确认：现在可以正常分享到微信。

## 本次最终部署包

- 包路径：`/Users/lixin/AI code/app-aidayibin/dist/app-aidayibin-deploy-20260518-111714.tar.gz`
- BUILD_ID：`Hf1IhoFOG9aWJdpQdIofc`
- 注意：之前生成的 `app-aidayibin-deploy-20260518-111459.tar.gz` 不要再使用。

## 当前剩余问题

### 1. 分享到微信后外部看不到缩略图

现象：微信聊天里分享卡片能发出，但外层卡片不展示缩略图。

下午优先检查：

- 分享时传给 `QFH5.setShareInfo` 的图片 URL 是否是公网 HTTPS 可访问地址。
- 图片 URL 是否无需登录 cookie、无需 App WebView 环境即可访问。
- 图片尺寸和体积是否满足微信抓取要求。当前有 `thumbImageUrl`、`cardImageUrl`、`publicImageUrl`，需要在线上实际抓取确认最终传的是哪个。
- 分享落地页是否有完整 Open Graph / 微信抓取需要的 meta 信息，例如 `og:title`、`og:description`、`og:image`。
- 如果 App 原生分享只读取 `setShareInfo` 第二个参数，则重点看该图片地址是否被微信服务器抓取失败。

### 2. 微信打开分享链接提示安全证书警告

现象：微信打开 `ces.dayibin.cn` 分享链接时提示：

```text
安全警告
ces.dayibin.cn
该网站的安全证书存在问题，可选择“继续”在浏览器中访问。
```

初步判断：这不是前端代码逻辑错误，更像是域名 HTTPS 证书问题。可能原因包括：

- `ces.dayibin.cn` 的 SSL 证书已过期。
- 证书域名不匹配，没有覆盖 `ces.dayibin.cn`。
- 证书链不完整，中间证书缺失。
- Nginx/宝塔配置里 HTTPS 证书不是当前域名的正确证书。
- 分享链接或跳转过程中使用了 HTTPS，但服务器证书配置异常。

下午优先检查：

- 浏览器访问 `https://ces.dayibin.cn/ai/photo` 是否也提示证书异常。
- 服务器宝塔/Nginx 里 `ces.dayibin.cn` 站点绑定的证书是否有效、是否包含完整证书链。
- 用命令检查证书域名、过期时间和证书链。
- 确认证书修复后，再处理微信缩略图抓取；否则微信可能因为 HTTPS 不可信而抓不到卡片图。

## 下午建议处理顺序

1. 先修 `ces.dayibin.cn` HTTPS 证书警告。证书异常会影响微信打开页面，也可能影响微信抓取缩略图。
2. 证书正常后，用微信重新分享一次，观察缩略图是否恢复。
3. 如果仍无缩略图，再查 `QFH5.setShareInfo` 传入的图片 URL、图片响应头、图片尺寸体积、分享页 meta。
4. 暂时不要重新启用小程序卡片 8 参数分享，除非先确认 App 原生分享协议和小程序 OriginalId 配置完整。
