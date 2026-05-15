# 大宜宾 App 接入 AI 写真 H5 说明

## 1. H5 地址

正式建议接入地址：

```text
https://dayibin.cn/ai/photo
```

如果需要先进入 AI 功能选择页，可以使用：

```text
https://dayibin.cn/ai
```

当前 AI H5 是一个 Next.js 服务，不是纯静态页面，包含页面、接口、登录态、图片上传、生成任务、结果图读取等能力。

---

## 2. 接入目标

App 端需要在用户点击入口时，打开 AI 写真 H5 页面。

H5 打开后需要知道当前 App 用户是谁，才能：

1. 建立 H5 登录态。
2. 按用户记录生成任务。
3. 控制用户额度。
4. 展示该用户自己的生成历史。

H5 本身无法凭空获取 App 用户身份，必须由 App WebView 提供用户信息或登录 token。

---

## 3. 推荐接入方式：WebView 注入 QFH5.getUserInfo

H5 页面会自动检测：

```js
window.QFH5.getUserInfo
```

如果 App WebView 注入了这个方法，H5 会自动调用它获取用户信息，并请求 H5 后端建立登录态。

### 3.1 App 需要注入的对象

```js
window.QFH5 = {
  getUserInfo(callback) {
    // App 原生侧实现
  },
  getDeviceId(callback) {
    // 可选：如果 getUserInfo 已经返回 deviceid，可以不实现
  }
}
```

### 3.2 getUserInfo 回调格式

成功时：

```js
callback(1, {
  uid: "用户ID",
  username: "用户昵称",
  face: "用户头像URL",
  deviceid: "设备ID"
})
```

失败或用户未登录时：

```js
callback(0, {
  error: "用户未登录"
})
```

### 3.3 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| uid | 是 | App 用户唯一 ID。H5 会把它作为 app 用户 ID 使用。 |
| username | 否 | 用户昵称。为空时 H5 会使用默认昵称。 |
| face | 否 | 用户头像 URL。 |
| deviceid | 否 | 设备 ID，用于辅助记录和风控。 |

### 3.4 getDeviceId 可选方法

如果 `getUserInfo` 没有返回 `deviceid`，H5 会尝试调用：

```js
window.QFH5.getDeviceId(callback)
```

成功时：

```js
callback(1, {
  deviceid: "设备ID"
})
```

失败时：

```js
callback(0, {
  error: "获取设备ID失败"
})
```

---

## 4. H5 登录流程

整体流程如下：

```text
用户点击 App 内 AI 写真入口
        ↓
App WebView 打开 https://dayibin.cn/ai/photo
        ↓
H5 检测 window.QFH5.getUserInfo
        ↓
H5 调用 getUserInfo 获取 uid、username、face、deviceid
        ↓
H5 请求 POST /ai/api/auth/exchange
        ↓
H5 后端建立登录态 Cookie
        ↓
用户可以上传照片、提交生成、查看生成记录
```

H5 请求接口示例：

```http
POST https://dayibin.cn/ai/api/auth/exchange
Content-Type: application/json
```

请求 body：

```json
{
  "uid": "123456",
  "username": "张三",
  "face": "https://example.com/avatar.png",
  "deviceid": "device-abc-001"
}
```

成功响应示例：

```json
{
  "user": {
    "id": "H5内部用户ID",
    "app_user_id": "123456",
    "nickname": "张三",
    "avatar_url": "https://example.com/avatar.png"
  }
}
```

---

## 5. 临时测试方式：URL 传参

如果 App 暂时还没有注入 `QFH5.getUserInfo`，也可以先用 URL 传参做内部测试。

示例：

```text
https://dayibin.cn/ai/photo?uid=123456&username=张三&face=https%3A%2F%2Fexample.com%2Favatar.png&deviceid=device-abc-001
```

H5 支持读取以下参数：

```text
uid
username
face
deviceid
```

也支持：

```text
app_user_id
nickname
avatar_url
device_id
app_token
```

注意：

1. URL 传参只建议用于内部测试。
2. 用户信息会短暂出现在 URL 中。
3. H5 登录成功后会自动清理 URL 里的身份参数。
4. 正式上线更推荐使用 App WebView 注入方式，或 token 校验方式。

---

## 6. 更安全的正式方案：app_token 校验

如果需要更安全的正式登录方式，建议 App 不直接传 uid，而是传一个短期有效的 `app_token`。

推荐流程：

```text
App 打开 H5
        ↓
App 提供 app_token
        ↓
H5 把 app_token 传给 /ai/api/auth/exchange
        ↓
H5 后端请求 App 后端校验 app_token
        ↓
App 后端返回真实用户信息
        ↓
H5 建立登录态
```

H5 后端已经预留以下环境变量：

```env
APP_AUTH_VERIFY_URL=
APP_AUTH_SHARED_SECRET=
APP_SESSION_SECRET=
```

### 6.1 APP_AUTH_VERIFY_URL 说明

`APP_AUTH_VERIFY_URL` 是 App 后端提供给 H5 后端的 token 校验接口。

H5 后端会请求：

```http
POST APP_AUTH_VERIFY_URL
Content-Type: application/json
Authorization: Bearer APP_AUTH_SHARED_SECRET
```

请求 body：

```json
{
  "app_token": "App传入的token",
  "device_id": "设备ID"
}
```

App 后端需要返回：

```json
{
  "uid": "123456",
  "username": "张三",
  "face": "https://example.com/avatar.png",
  "deviceid": "device-abc-001"
}
```

或者返回这些字段也可以：

```json
{
  "app_user_id": "123456",
  "nickname": "张三",
  "avatar_url": "https://example.com/avatar.png",
  "device_id": "device-abc-001"
}
```

如果 token 无效，App 后端应返回非 2xx 状态码，例如：

```http
401 Unauthorized
```

---

## 7. 当前代码已支持的能力

当前 H5 已支持：

1. 读取 URL 参数中的用户信息。
2. 读取 `window.QFH5.getUserInfo` 返回的用户信息。
3. 调用 `/ai/api/auth/exchange` 建立登录态。
4. 使用 Cookie 保存 H5 登录态。
5. 用户上传照片。
6. 提交 AI 写真生成任务。
7. 查看生成记录。
8. 查看生成结果图。

---

## 8. App 端最小接入清单

App 开发至少需要做以下事情：

### 8.1 增加入口

在 App 内增加入口按钮，例如：

```text
AI 写真
```

点击后打开：

```text
https://dayibin.cn/ai/photo
```

### 8.2 WebView 注入用户信息方法

注入：

```js
window.QFH5.getUserInfo
```

返回：

```js
callback(1, {
  uid: "用户ID",
  username: "用户昵称",
  face: "用户头像URL",
  deviceid: "设备ID"
})
```

### 8.3 未登录处理

如果用户未登录：

```js
callback(0, {
  error: "用户未登录"
})
```

App 可以选择：

1. 先引导用户登录，再打开 H5。
2. 打开 H5 后由 H5 展示未登录状态。

当前更推荐 App 侧先保证用户已登录后再进入 AI 写真。

---

## 9. H5 调试方式

如果需要在 App 内调试 H5 是否拿到用户信息，可以在 URL 后加：

```text
?qfh5_debug=1
```

例如：

```text
https://dayibin.cn/ai/photo?qfh5_debug=1
```

页面左下角会显示简单调试信息，例如：

```text
已检测到 QFH5，正在获取用户信息
登录成功，H5 已建立会话
未检测到 QFH5.getUserInfo
```

如果要本地模拟 QFH5，可以用：

```text
https://dayibin.cn/ai/photo?mock_qfh5=1&qfh5_debug=1
```

也可以指定模拟用户：

```text
https://dayibin.cn/ai/photo?mock_qfh5=1&qfh5_debug=1&mock_uid=10001&mock_username=测试用户&mock_deviceid=test-device-001
```

---

## 10. 上线前确认项

上线前请确认：

1. H5 正式地址可以打开：

```text
https://dayibin.cn/ai/photo
```

2. App WebView 可以正常打开该地址。
3. App 已注入 `window.QFH5.getUserInfo`。
4. H5 可以拿到用户 `uid`。
5. H5 登录接口 `/ai/api/auth/exchange` 返回 200。
6. 上传照片成功。
7. 提交生成成功。
8. 生成结果可以查看。
9. 用户退出再进入时，仍能识别同一个 App 用户。
10. 生产环境关闭 mock：

```env
NEXT_PUBLIC_ENABLE_MOCKS=false
```

---

## 11. 给 App 开发的简短版说明

如果只看最关键内容，请看这一段：

```text
请在 App 内新增 AI 写真入口，打开：
https://dayibin.cn/ai/photo

H5 会调用 window.QFH5.getUserInfo(callback) 获取用户信息。

请 WebView 注入：
window.QFH5.getUserInfo = function(callback) {
  callback(1, {
    uid: '用户ID',
    username: '用户昵称',
    face: '用户头像URL',
    deviceid: '设备ID'
  })
}

成功 state 为 1，失败 state 为 0。
H5 拿到用户信息后会自动请求 /ai/api/auth/exchange 建立登录态。
```

---

## 12. 注意事项

1. H5 不能自己获取 App 用户身份，必须由 App 提供。
2. 内部测试可以直接传 `uid`，正式上线建议使用 `app_token` 校验。
3. 如果 App 的桥接方法名不是 `QFH5.getUserInfo`，需要提前告知 H5 侧修改适配。
4. 如果 App 返回字段名不同，也需要提前同步字段名。
5. 如果使用 `app_token`，需要 App 后端提供 token 校验接口。
