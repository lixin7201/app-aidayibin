# 大宜宾 App 接入 AI H5 指南

## 正式入口

```text
https://ces.dayibin.cn/ai/photo
https://ces.dayibin.cn/ai/fortune
https://ces.dayibin.cn/ai/life-test
```

AI H5 包含用户会话、图片上传、生成任务和个人历史记录，因此正式环境必须验证当前 App 用户，不能相信浏览器提交的 UID。

## 推荐接入

原生 WebView 注入 `QFH5.getUserInfo`，返回可由服务端验证的登录 Token：

```js
window.QFH5 = {
  getUserInfo(callback) {
    callback(1, {
      app_token: "短期或可撤销的用户登录 Token",
      uid: "用户 ID，仅用于展示",
      username: "用户昵称",
      face: "用户头像 URL",
      deviceid: "设备 ID"
    })
  },
  getDeviceId(callback) {
    callback(1, { deviceid: "设备 ID" })
  },
  jumpLogin(callback) {
    // 未登录时调起 App 登录；完成后回调，H5 会有限次数重试。
  }
}
```

如果当前 App 版本没有返回 `app_token`，H5 会尝试读取当前域已有的 `wap_token` Cookie 或 `classify:token`。这条兼容链必须在真实 Android、iOS WebView 上验证；不同域或不同 WebView 数据仓可能不共享 Cookie/localStorage。

## 安全登录流程

```text
App 打开 AI H5
        ↓
H5 获取 app_token / wap_token / 现有登录 Token
        ↓
POST /ai/api/auth/exchange
        ↓
H5 服务端调用正式验签服务
        ↓
验签服务返回 Token 所属的权威用户 ID
        ↓
H5 写入 Secure、HttpOnly 会话 Cookie
```

H5 请求：

```http
POST https://ces.dayibin.cn/ai/api/auth/exchange
Content-Type: application/json

{
  "app_token": "用户登录 Token",
  "device_id": "设备 ID"
}
```

生产环境只接受 Token。请求中附带的 `uid/app_user_id/nickname/avatar_url` 不得决定身份。

## 服务端配置

### 现有千帆 `wap_token` 兼容模式

大宜宾现有 Java 后端已经提供 `qfLogin`，AI 服务通过本机回环调用，避免 Token 进入公网代理日志：

```env
APP_AUTH_VERIFY_URL=http://127.0.0.1:8080/api/login/qfLogin
APP_SESSION_SECRET=<独立随机服务端密钥>
```

`qfLogin` 返回 `{ code: 200, data: { userId, username, token } }` 后，AI H5 只采用其中的权威 `userId/username`。配置为公网主机时服务会拒绝该校验请求，防止查询参数 Token 泄漏。

### 通用内部 verifier 模式

```env
APP_AUTH_VERIFY_URL=https://内部验签服务/verify
APP_AUTH_SHARED_SECRET=<仅服务端持有的共享密钥>
APP_SESSION_SECRET=<独立随机服务端密钥>
```

AI 服务发送：

```http
POST APP_AUTH_VERIFY_URL
Authorization: Bearer APP_AUTH_SHARED_SECRET
Content-Type: application/json

{
  "app_token": "用户登录 Token",
  "device_id": "设备 ID"
}
```

验签成功返回：

```json
{
  "app_user_id": "123456",
  "nickname": "张三",
  "avatar_url": "https://example.com/avatar.jpg",
  "device_id": "device-001"
}
```

无效、过期或撤销 Token 返回非 2xx。验签接口必须根据 Token 的服务端安全上下文获取用户，不得接受客户端 UID 后原样返回。

## 调试与验收

桥接测试页：

```text
https://ces.dayibin.cn/ai/webview-test
```

页面只有在 QFH5 调用成功并且 `/api/auth/exchange` 真正建立会话后才显示成功；Token 字段会被隐藏。

本地开发可以使用：

```text
?mock_qfh5=1&qfh5_debug=1
```

mock 与 URL 身份参数只用于非生产构建。生产构建会忽略 URL 中的身份和 Token 参数。

上线前必须完成：

1. Android、iOS 各验证已登录、未登录、Token 过期和重新登录。
2. 两个真实账号交叉验证不会串号。
3. `/ai/photo`、`/ai/fortune`、`/ai/life-test` 上传、生成、历史记录均正常。
4. 裸 `uid/app_user_id` 请求返回 401。
5. 伪造、过期、重定向、超时及畸形 verifier 响应均不能创建会话。
6. 页面、Nginx 和应用日志中不出现 Token。

## 发布边界

修改 `APP_AUTH_VERIFY_URL` 或认证代码后，Node 进程必须加载新环境。生产单实例 `pm2 restart` 存在短暂中断，不符合零停机要求；应在空闲 loopback 端口启动新实例，完整验收后原子切换 Nginx，再退出旧实例。不要占用现有 3002，也不要改动 SSH 22 或 `dayibin-server` 公钥入口。
