# 大宜宾 AI H5 上线前需求文档

本文用于沉淀正式上线前需要完成的产品、技术、部署和安全要求。

## 1. 上线目标

正式上线目标：

```text
主入口：https://dayibin.cn/ai
AI 写真：https://dayibin.cn/ai/photo
AI 算命：https://dayibin.cn/ai/fortune
管理后台：https://dayibin.cn/ai/admin
```

用户在大宜宾 App 内点击不同按钮时，直接进入不同 H5：

```text
点击 AI 写真按钮 -> https://dayibin.cn/ai/photo
点击 AI 算命按钮 -> https://dayibin.cn/ai/fortune
```

`https://dayibin.cn/ai` 保留为功能选择页，方便测试、兜底和后续扩展。

## 2. 本次改造范围

### 2.1 `/ai` 路径适配

当前项目要部署在 `dayibin.cn` 主域名下的 `/ai` 路径，而不是网站根目录。

必须保证：

- 页面访问路径带 `/ai`
- 接口请求路径带 `/ai/api`
- 静态图片路径带 `/ai`
- 后台跳转路径带 `/ai/admin`
- 分享和下载链接带 `/ai`
- Cookie 只作用在 `/ai` 路径下，尽量不影响主站

### 2.2 两个 H5 独立入口

上线后不再把 AI 写真和 AI 算命放在同一个页面里切换。

新的页面结构：

```text
/ai          功能选择页
/ai/photo    AI 写真 H5
/ai/fortune  AI 算命 H5
/ai/admin    管理后台
```

这样做的好处：

- App 可以分别配置两个按钮
- 用户进入后目标明确
- 后续统计和推广更清楚
- 单个功能出问题时更容易定位
- 后续新增 AI 聊天、AI 恋爱训练营等功能时更容易扩展

### 2.3 上线前安全检查

重点检查：

- 环境变量是否为生产配置
- mock 是否关闭
- 后台默认密码是否移除
- 管理后台密码是否足够强
- 服务器端口是否只开放必要端口
- 数据库和对象存储密钥是否只存在服务器环境变量里
- App 用户 token 校验是否接入
- 图片上传大小和格式限制是否正常
- 定时 worker 是否可控
- Nginx 是否只新增 `/ai` 路径，不影响主站

## 3. 详细需求

## 3.1 `/ai` 路径适配需求

### 功能要求

项目必须支持以下访问方式：

```text
https://dayibin.cn/ai
https://dayibin.cn/ai/photo
https://dayibin.cn/ai/fortune
https://dayibin.cn/ai/admin
https://dayibin.cn/ai/api/...
```

不应该再出现这些正式访问：

```text
https://dayibin.cn/api/...
https://dayibin.cn/admin
https://dayibin.cn/photo
https://dayibin.cn/fortune
```

### 技术要求

需要完成：

```text
1. Next.js basePath 设置为 /ai
2. 增加统一路径工具，避免代码里到处写死 /api、/admin
3. 前端接口请求统一使用 /ai/api/...
4. 页面跳转统一使用 /ai/...
5. public 静态资源统一使用 /ai/...
6. 用户和管理员 Cookie 的 path 设置为 /ai
7. 分享、下载、图片预览链接都包含 /ai
```

### 环境变量要求

生产环境建议：

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
NEXT_PUBLIC_ENABLE_MOCKS=false
```

本地按 `/ai` 测试时：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000/ai
NEXT_PUBLIC_BASE_PATH=/ai
NEXT_PUBLIC_ENABLE_MOCKS=true
```

## 3.2 AI 写真 H5 需求

访问地址：

```text
https://dayibin.cn/ai/photo
```

保留能力：

- 模板选择
- 性别选择
- 图片比例选择
- 上传 1-4 张参考照
- 自动压缩图片
- 提交生成任务
- 查看生成记录
- 下载结果图
- 分享结果图
- 删除生成记录
- 额度展示
- 生成中状态展示

接口要求：

```text
GET  /ai/api/quota
GET  /ai/api/generations
POST /ai/api/uploads
POST /ai/api/generations
GET  /ai/api/generations/:id/image
DELETE /ai/api/generations/:id
```

## 3.3 AI 算命 H5 需求

访问地址：

```text
https://dayibin.cn/ai/fortune
```

保留能力：

- 当前先开放 AI 看手相
- 上传 1 张手掌照片
- 自动压缩图片
- 生成 3:4、2K 掌纹命运走势报告图
- 查看生成记录
- 下载结果图
- 分享结果图
- 删除生成记录
- 额度展示
- 生成中状态展示
- 页面文案必须强调娱乐参考，不构成医学、投资、法律或人生决策建议

接口要求：

```text
GET  /ai/api/fortune/generations
POST /ai/api/uploads
POST /ai/api/fortune/generations
GET  /ai/api/fortune/generations/:id/image
DELETE /ai/api/fortune/generations/:id
```

## 3.4 功能选择页需求

访问地址：

```text
https://dayibin.cn/ai
```

页面目标：

- 展示 AI 写真入口
- 展示 AI 算命入口
- 用户点击后跳转到对应 H5
- 可作为 App 入口兜底页

注意：

```text
正式 App 可以直接跳 /ai/photo 和 /ai/fortune，不一定经过 /ai。
```

## 3.5 管理后台需求

访问地址：

```text
https://dayibin.cn/ai/admin
```

后台能力：

- 数据看板
- 模板管理
- 写入默认模板
- 写真生成记录
- 算命生成记录
- CSV 导出
- 退出登录

安全要求：

- 生产环境必须修改 `ADMIN_SESSION_PASSWORD`
- 登录页不能预填默认开发密码
- Cookie 作用路径限制在 `/ai`
- 后台入口不要暴露给普通用户
- 可考虑后续增加 IP 白名单或更完整的管理员账号体系

## 4. 部署要求

### 4.1 Nginx 接入

推荐结构：

```text
Next.js 项目运行在服务器本机 3001 端口
Nginx 接收 dayibin.cn/ai 请求
Nginx 转发到 http://127.0.0.1:3001
```

示例：

```nginx
location /ai/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location = /ai {
    return 301 /ai/;
}
```

要求：

```text
只新增 /ai 相关配置，不改动主站已有路径。
3001 端口不要开放公网。
```

### 4.2 Worker 定时任务

必须配置：

```text
worker:poll     轮询 AI 生成结果
worker:cleanup  清理临时原图
```

建议频率：

```cron
* * * * * cd /var/www/app-aidayibin && /usr/bin/npm run worker:poll >> /var/log/aidayibin-worker-poll.log 2>&1
0 * * * * cd /var/www/app-aidayibin && /usr/bin/npm run worker:cleanup >> /var/log/aidayibin-worker-cleanup.log 2>&1
```

## 5. 上线前安全检查清单

### 5.1 环境变量

必须确认：

```text
NEXT_PUBLIC_ENABLE_MOCKS=false
NEXT_PUBLIC_APP_URL=https://dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
ADMIN_SESSION_PASSWORD 已换强密码
APP_SESSION_SECRET 已配置强随机密钥
SUPABASE_SERVICE_ROLE_KEY 已配置生产密钥
APIMART_API_KEY 已配置生产密钥
CLOUDFLARE_R2_* 已配置生产密钥
APP_AUTH_VERIFY_URL 已接入真实 App 用户校验接口
APP_AUTH_SHARED_SECRET 已配置
```

不能出现：

```text
ADMIN_SESSION_PASSWORD=dayibin-admin-dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_MOCKS=true
```

### 5.2 服务器

必须确认：

```text
ECS 已创建上线前快照
80/443 正常开放
3001 未开放公网
SSH 端口只允许可信 IP
磁盘空间充足
PM2 或 systemd 已配置自启动
Nginx reload 前已执行 nginx -t
```

### 5.3 数据库

必须确认：

```text
生产数据库已执行迁移 SQL
默认模板已写入
数据库有备份策略
服务端密钥没有提交到代码仓库
```

### 5.4 图片存储

必须确认：

```text
图片存储 Bucket 可写入
图片公开访问地址可打开
App 内 WebView 能加载结果图
图片链接不是临时签名短期失效链接
```

### 5.5 App 接入

必须确认：

```text
App AI 写真按钮跳转 /ai/photo
App AI 算命按钮跳转 /ai/fortune
App 打开 H5 时能传 app_token
H5 后端能调用 token 校验接口
iOS/安卓均能上传图片
iOS/安卓均能下载或分享图片
```

### 5.6 隐私和合规

必须确认：

```text
上传图片仅用于生成任务
临时原图有清理机制
用户能删除历史记录
AI 算命页面明确提示娱乐参考
后台导出的数据不包含不必要的敏感信息
日志不要输出密钥或完整敏感信息
```

## 6. 验收标准

### 6.1 路径验收

以下地址能正常打开：

```text
/ai
/ai/photo
/ai/fortune
/ai/admin
```

以下请求不应成为正式入口：

```text
/api
/photo
/fortune
/admin
```

### 6.2 功能验收

AI 写真：

```text
能上传照片
能提交任务
能看到生成中状态
worker 能同步生成结果
能下载、分享、删除
```

AI 算命：

```text
能上传手掌照片
能提交任务
能看到生成中状态
worker 能同步生成结果
能下载、分享、删除
```

后台：

```text
能登录
能查看数据
能导出 CSV
能退出登录
```

### 6.3 安全验收

```text
mock 已关闭
默认后台密码已移除
Cookie path 为 /ai
用户和管理员 Cookie 已做服务端签名，不能只靠 base64 明文会话
3001 不暴露公网
密钥不在代码仓库
上线前快照已完成
```

## 7. 本次代码改造记录

已完成：

```text
1. 增加 NEXT_PUBLIC_BASE_PATH=/ai
2. Next.js basePath 默认设置为 /ai
3. 增加统一路径工具 src/lib/routes.ts
4. 新增 /photo 页面作为 AI 写真独立 H5
5. 新增 /fortune 页面作为 AI 算命独立 H5
6. /ai 首页改为功能选择页
7. 写真页面请求、图片、下载、分享路径适配 /ai
8. 算命页面请求、图片、下载、分享路径适配 /ai
9. 后台请求、导出、退出、登录跳转适配 /ai
10. 用户和管理员 Cookie path 改为 /ai
11. 用户和管理员 Cookie 改为 HMAC 签名 Cookie
12. 生产环境要求配置 APP_SESSION_SECRET
13. 后台登录页不再预填开发默认密码
```

待上线前确认：

```text
1. 生产服务器环境变量
2. App token 校验接口
3. 图片存储正式域名
4. worker 定时任务
5. Nginx /ai 反向代理
6. ECS 快照和回滚方案
```
