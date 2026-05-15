# App WebView 联调说明

## 目标

App 内打开 AI H5 后，直接获取当前登录用户信息并写入 H5 会话，尽量少改双方代码。

## 当前 H5 支持

H5 已支持以下两类入参：

- `uid / username / face / deviceid`
- `app_user_id / nickname / avatar_url / device_id`

H5 会把这些信息提交到：

- `POST /ai-test/api/auth/exchange`

成功后自动写入 H5 登录 Cookie。

## 推荐联调方式

### App 侧

在 WebView 打开 H5 时，先调用：

- `QFH5.getUserInfo(function(state, data) { ... })`

成功后把以下字段传给 H5：

- `uid`
- `username`
- `face`
- `deviceid`

可选补充：

- `phone`

### H5 侧

H5 已支持直接接收上述字段，不需要再走短期 `app_token` 方案。

示例请求体：

```json
{
  "uid": 12345,
  "username": "张三",
  "face": "https://.../avatar.png",
  "deviceid": "md5-device-id"
}
```

返回成功后，H5 会建立自己的会话。

## 对外包的话术

> 我们这边 H5 已经兼容 QFH5 的 `getUserInfo` 返回字段了。你们在 App WebView 打开页面后，直接调用 `QFH5.getUserInfo`，拿到 `uid / username / face / deviceid`，然后把这些字段 POST 到 `/ai-test/api/auth/exchange` 即可。H5 收到后会自己建立登录 Cookie，不需要再做短期 `app_token` 方案。

## 部署后检查

- 打开 `https://ces.dayibin.cn/ai-test/photo`
- 确认页面首屏能快速出现
- 在 WebView 内确认登录后用户信息正常
- 检查 `POST /ai-test/api/auth/exchange` 是否返回 200

