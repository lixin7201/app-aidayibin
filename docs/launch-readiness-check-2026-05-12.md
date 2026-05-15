# 上线前检查记录 2026-05-12

本文记录当前本地项目对以下上线项的检查结果：

```text
1. 正式环境变量
2. App token 校验接口
3. Nginx /ai 转发
4. worker 定时任务
5. ECS 快照
6. 本地访问问题
```

## 1. 本地访问问题

当前项目已经默认适配 `/ai` 路径，所以本地入口不是：

```text
http://localhost:3000
```

而是：

```text
http://localhost:3000/ai
http://localhost:3000/ai/photo
http://localhost:3000/ai/fortune
http://localhost:3000/ai/admin/login
```

本次检查结果：

```text
http://127.0.0.1:3000       307 跳转到 /ai，正常
http://127.0.0.1:3000/ai    200，正常
```

结论：

```text
本地服务没有坏。现在直接访问 http://localhost:3000 会自动跳到 /ai。
```

## 2. 正式环境变量检查

当前本地 `.env.local` 检查结果：

```text
NEXT_PUBLIC_APP_URL          已设置，当前为本地地址 http://localhost:3000
NEXT_PUBLIC_BASE_PATH        未显式设置，但代码默认使用 /ai
NEXT_PUBLIC_ENABLE_MOCKS     已设置，当前为 true
SUPABASE_URL                 已设置
SUPABASE_SERVICE_ROLE_KEY    已设置
APIMART_API_KEY              已设置
APIMART_BASE_URL             已设置
CLOUDFLARE_R2_*              已设置
CLOUDFLARE_R2_PUBLIC_BASE_URL 已设置
APP_AUTH_VERIFY_URL          未设置
APP_AUTH_SHARED_SECRET       未设置
APP_SESSION_SECRET           已设置
ADMIN_SESSION_PASSWORD       已设置
```

本地开发可以继续使用：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000/ai
NEXT_PUBLIC_BASE_PATH=/ai
NEXT_PUBLIC_ENABLE_MOCKS=true
```

正式服务器必须改成：

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
NEXT_PUBLIC_ENABLE_MOCKS=false

SUPABASE_URL=生产数据库地址
SUPABASE_SERVICE_ROLE_KEY=生产数据库服务端密钥

APIMART_API_KEY=生产 AI 服务 Key
APIMART_BASE_URL=https://api.apimart.ai

CLOUDFLARE_R2_ACCOUNT_ID=生产图片存储 Account ID
CLOUDFLARE_R2_ACCESS_KEY_ID=生产图片存储 Access Key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=生产图片存储 Secret Key
CLOUDFLARE_R2_BUCKET=生产图片存储 Bucket
CLOUDFLARE_R2_PUBLIC_BASE_URL=生产图片公开访问地址

APP_AUTH_VERIFY_URL=大宜宾 App token 校验接口
APP_AUTH_SHARED_SECRET=双方约定的服务端密钥
APP_SESSION_SECRET=强随机会话签名密钥

ADMIN_SESSION_PASSWORD=正式后台强密码
```

结论：

```text
本地参数能开发测试。
正式上线参数还缺 App 登录校验接口。
正式上线必须关闭 mock。
```

## 3. App token 校验接口检查

当前代码要求 App 打开 H5 时传入：

```text
app_token
```

H5 后端会把 token 发给：

```env
APP_AUTH_VERIFY_URL
```

接口请求方式：

```http
POST APP_AUTH_VERIFY_URL
Content-Type: application/json
Authorization: Bearer APP_AUTH_SHARED_SECRET
```

请求体：

```json
{
  "app_token": "App 传来的登录 token",
  "device_id": "设备 ID，可选"
}
```

期望返回：

```json
{
  "app_user_id": "用户在大宜宾 App 内的唯一 ID",
  "nickname": "用户昵称，可选",
  "avatar_url": "头像地址，可选",
  "device_id": "设备 ID，可选"
}
```

当前检查结果：

```text
APP_AUTH_VERIFY_URL 未设置
APP_AUTH_SHARED_SECRET 未设置
```

结论：

```text
正式上线前必须让 App 第三方或公司后端提供 token 校验接口。
没有这个接口，用户在正式环境无法可靠识别身份。
```

## 4. Nginx /ai 转发检查

本地项目已经支持：

```text
/ai
/ai/photo
/ai/fortune
/ai/admin
/ai/api/...
```

服务器上需要 Nginx 配置：

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

上线前在服务器执行：

```bash
nginx -t
systemctl reload nginx
curl -I https://dayibin.cn/ai
curl -I https://dayibin.cn/ai/photo
curl -I https://dayibin.cn/ai/fortune
curl -I https://dayibin.cn/ai/admin/login
```

结论：

```text
项目侧已经准备好 /ai。
Nginx 是否已配置，需要登录阿里云服务器确认。
```

## 5. Worker 定时任务检查

项目已有 worker：

```text
npm run worker:poll
npm run worker:cleanup
```

作用：

```text
worker:poll     轮询 AI 生成结果，并同步回数据库
worker:cleanup  清理临时原图记录，降低隐私风险
```

建议服务器 crontab：

```cron
* * * * * cd /var/www/app-aidayibin && /usr/bin/npm run worker:poll >> /var/log/aidayibin-worker-poll.log 2>&1
0 * * * * cd /var/www/app-aidayibin && /usr/bin/npm run worker:cleanup >> /var/log/aidayibin-worker-cleanup.log 2>&1
```

上线前在服务器检查：

```bash
crontab -l
tail -n 100 /var/log/aidayibin-worker-poll.log
tail -n 100 /var/log/aidayibin-worker-cleanup.log
```

结论：

```text
项目侧已有 worker 命令。
是否已配置定时任务，需要登录阿里云服务器确认。
```

## 6. ECS 快照检查

ECS 快照只能在阿里云控制台或服务器管理权限下确认。

上线前必须完成：

```text
1. 找到 dayibin.cn 所在 ECS
2. 创建上线前手动快照
3. 记录快照名称和时间
4. 备份 Nginx 配置
5. 确认回滚负责人
```

建议快照名称：

```text
before-aidayibin-ai-h5-launch-2026-05-12
```

结论：

```text
本地无法确认 ECS 快照。
需要登录阿里云控制台完成。
```

## 7. 当前结论

可以继续推进：

```text
1. /ai 路径项目侧已准备好
2. 两个 H5 入口已准备好
3. 本地 /ai 可访问
4. worker 命令已存在
```

正式上线前仍需完成：

```text
1. 服务器 .env.local 改成生产环境变量
2. 补齐 APP_AUTH_VERIFY_URL
3. 补齐 APP_AUTH_SHARED_SECRET
4. 正式服务器配置强随机 APP_SESSION_SECRET
5. 确认 Nginx /ai 转发已配置
6. 确认 crontab worker 已配置
7. 阿里云 ECS 创建上线前快照
```
