# App WebView 安全登录联调说明

## 目标

App 内打开 AI H5 后，必须用服务端可校验的登录 Token 建立 H5 会话。生产环境禁止使用前端传入的 `uid/app_user_id` 认定用户身份。

## Token 来源

H5 按以下来源读取 Token：

1. `QFH5.getUserInfo` 返回的 `app_token`、`wap_token` 或 `token`。
2. 当前域可见的 `wap_token` Cookie。
3. 当前域 `localStorage` 中已有的 `classify:token`。

App 推荐直接提供：

```js
window.QFH5.getUserInfo = function (callback) {
  callback(1, {
    app_token: "短期或可撤销的用户登录 Token",
    uid: "仅用于展示，不作为身份依据",
    username: "用户昵称",
    face: "用户头像 URL",
    deviceid: "设备 ID"
  })
}
```

H5 只把 Token 和设备号提交给：

```http
POST /ai/api/auth/exchange
Content-Type: application/json

{
  "app_token": "用户登录 Token",
  "device_id": "设备 ID"
}
```

后端校验 Token 后返回其绑定的权威用户 ID，再写入 Secure、HttpOnly 的 H5 会话 Cookie。请求中夹带的其他 `uid` 不得覆盖服务端身份。

## 现有千帆兼容链

现有大宜宾 H5 使用 `wap_token -> /api/login/qfLogin -> userId`。AI H5 已支持通过服务器回环地址复用该校验：

```env
APP_AUTH_VERIFY_URL=http://127.0.0.1:8080/api/login/qfLogin
```

该模式必须使用 `127.0.0.1` 或 `localhost`，避免把查询参数中的 Token 写入公网 Nginx 访问日志。通用内部验签接口则必须同时配置 `APP_AUTH_SHARED_SECRET`。

## 联调验收

1. 用真实 Android 和 iOS App 分别打开 `/ai/webview-test`。
2. 页面必须显示“登录态交换成功”，仅显示 QFH5 返回 UID 不算通过。
3. 已登录、退出登录、Token 过期三种状态符合预期。
4. 用两个账号验证不会串号，服务端返回的用户 ID 与 App 当前账号一致。
5. `/ai/photo`、`/ai/fortune`、`/ai/life-test` 的上传、生成和历史记录正常。
6. Nginx、应用日志和页面调试信息中不能出现 Token。

生产环境裸 `uid/app_user_id` 请求必须返回 401。URL 身份参数和 `app_token` 仅允许本地 mock，禁止作为正式接入方式。
