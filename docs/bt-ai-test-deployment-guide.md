# 宝塔服务器 `/ai-test` 测试部署说明

本文面向公司现有服务器，目标是在不影响已有 Java/H5 网站的前提下，把当前 Next.js 项目先部署到：

```text
https://ces.dayibin.cn/ai-test
```

稳定后再切到：

```text
https://ces.dayibin.cn/ai
```

## 1. 服务器环境

已知服务器环境：

```text
系统：Alibaba Cloud Linux 3.2104 U11
面板：宝塔 Linux 面板
Nginx：1.26.1
Node.js：v20.20.2
网站根目录：/www/wwwroot
测试部署目录：/www/wwwroot/ai-test
计划运行端口：3001
测试访问路径：https://ces.dayibin.cn/ai-test
```

结论：

```text
当前服务器环境适合部署本项目。
Node.js 版本满足 Next.js 16 要求。
```

## 2. 项目信息

### 2.1 项目类型

```text
框架：Next.js
版本：16.2.6
React：19.2.4
路由模式：App Router
语言：TypeScript
样式：Tailwind CSS
```

### 2.2 主要命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run worker:poll
npm run worker:cleanup
```

### 2.3 本地验证结果

已用 `/ai-test` 子路径验证：

```bash
NEXT_PUBLIC_BASE_PATH=/ai-test NEXT_PUBLIC_APP_URL=http://localhost:3001/ai-test npm run build
```

结果：

```text
构建成功
```

已用 3001 端口验证：

```bash
NEXT_PUBLIC_BASE_PATH=/ai-test NEXT_PUBLIC_APP_URL=http://localhost:3001/ai-test npm run start -- -p 3001
```

验证结果：

```text
http://127.0.0.1:3001/ai-test         200
http://127.0.0.1:3001/ai-test/photo   200
http://127.0.0.1:3001/ai-test/fortune 200
http://127.0.0.1:3001/ai-test/api/quota 401，未登录时正常
```

结论：

```text
项目可以部署到 /ai-test。
```

## 3. 子路径适配检查

### 3.1 是否依赖根路径 `/`

检查结果：

```text
前端请求、页面跳转、静态资源已经通过统一路径工具适配。
未发现必须依赖根路径 / 的硬编码。
```

当前外部访问路径应为：

```text
/ai-test
/ai-test/photo
/ai-test/fortune
/ai-test/admin
/ai-test/api/...
```

### 3.2 是否需要 `basePath: "/ai-test"`

需要。

当前 `next.config.ts` 已支持通过环境变量配置：

```env
NEXT_PUBLIC_BASE_PATH=/ai-test
```

上线 `/ai-test` 时，不需要改代码，只需要在服务器 `.env.local` 配置：

```env
NEXT_PUBLIC_BASE_PATH=/ai-test
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai-test
```

重要：

```text
basePath 会影响构建结果。
修改 NEXT_PUBLIC_BASE_PATH 后必须重新 npm run build。
```

### 3.3 是否需要 `assetPrefix`

不需要。

原因：

```text
页面、API 和静态资源都在同一个域名 ces.dayibin.cn 下，通过 /ai-test 子路径访问。
Next.js 的 basePath 会自动处理 /ai-test/_next/... 静态资源路径。
```

只有在静态资源要放到独立 CDN 域名时，才考虑 `assetPrefix`。

## 4. 路由和回调检查

### 4.1 页面路由

```text
/ai-test          功能选择页
/ai-test/photo    AI 写真 H5
/ai-test/fortune  AI 算命 H5
/ai-test/admin    管理后台
/ai-test/admin/login 后台登录
```

### 4.2 API 路由

项目包含 API 路由：

```text
/ai-test/api/admin/dashboard
/ai-test/api/admin/export
/ai-test/api/admin/generations
/ai-test/api/admin/login
/ai-test/api/admin/logout
/ai-test/api/admin/templates
/ai-test/api/auth/exchange
/ai-test/api/fortune/generations
/ai-test/api/fortune/generations/:id
/ai-test/api/fortune/generations/:id/image
/ai-test/api/generations
/ai-test/api/generations/:id
/ai-test/api/generations/:id/image
/ai-test/api/mock-image/:slug
/ai-test/api/quota
/ai-test/api/templates
/ai-test/api/uploads
/ai-test/api/uploads/sign
```

### 4.3 上传、登录、回调

上传：

```text
POST /ai-test/api/uploads
POST /ai-test/api/uploads/sign
```

登录：

```text
POST /ai-test/api/auth/exchange
```

App 打开 H5 时建议传：

```text
https://ces.dayibin.cn/ai-test?app_token=xxxx
```

或直接进入功能：

```text
https://ces.dayibin.cn/ai-test/photo?app_token=xxxx
https://ces.dayibin.cn/ai-test/fortune?app_token=xxxx
```

OAuth：

```text
当前项目没有 OAuth 登录流程。
```

支付回调：

```text
当前项目没有支付回调。
```

第三方服务回调：

```text
当前 AI 生成结果靠 worker 主动轮询，不依赖第三方回调。
```

## 5. 环境变量

服务器 `/www/wwwroot/ai-test/.env.local` 需要配置：

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai-test
NEXT_PUBLIC_BASE_PATH=/ai-test
NEXT_PUBLIC_ENABLE_MOCKS=false

SUPABASE_URL=生产 Supabase 地址
SUPABASE_SERVICE_ROLE_KEY=生产 Supabase 服务端密钥

APIMART_API_KEY=生产 APIMart Key
APIMART_BASE_URL=https://api.apimart.ai

CLOUDFLARE_R2_ACCOUNT_ID=R2 Account ID
CLOUDFLARE_R2_ACCESS_KEY_ID=R2 Access Key ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=R2 Secret Access Key
CLOUDFLARE_R2_BUCKET=R2 Bucket
CLOUDFLARE_R2_PUBLIC_BASE_URL=图片公开访问地址

APP_AUTH_VERIFY_URL=大宜宾 App token 校验接口
APP_AUTH_SHARED_SECRET=App token 校验接口共享密钥
APP_SESSION_SECRET=强随机会话签名密钥

ADMIN_SESSION_PASSWORD=正式后台强密码
```

生成 `APP_SESSION_SECRET`：

```bash
openssl rand -base64 48
```

注意：

```text
.env.local 不要上传到公开仓库。
不要截图发群。
不要放到现有 Java/H5 网站目录。
```

## 6. 外部依赖

### 6.1 数据库

项目使用：

```text
Supabase PostgreSQL
```

不是：

```text
MySQL
Prisma
Drizzle
Redis
```

必须执行数据库迁移：

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fortune_module.sql
```

### 6.2 对象存储

项目使用：

```text
Cloudflare R2，S3 协议
```

用途：

```text
用户上传图片
AI 生成结果图
结果图读取
结果图删除
```

服务器本地不保存上传图片。

### 6.3 第三方 API

项目使用：

```text
APIMart
```

用途：

```text
AI 写真生成
AI 算命报告图生成
生成结果轮询
```

### 6.4 App 登录校验

正式上线需要：

```text
APP_AUTH_VERIFY_URL
APP_AUTH_SHARED_SECRET
```

如果测试阶段还没有 App 登录接口，可以临时用 mock，但正式上线必须关闭 mock。

## 7. 上传、缓存、日志目录

### 7.1 上传目录

不需要创建服务器上传目录。

原因：

```text
上传图片直接进入 R2。
服务器不会长期存储用户上传文件。
```

### 7.2 缓存目录

不需要手动创建业务缓存目录。

Next.js 构建会生成：

```text
/www/wwwroot/ai-test/.next
```

### 7.3 日志目录

建议创建独立日志目录：

```bash
mkdir -p /www/wwwlogs/aidayibin-ai-test
```

建议日志文件：

```text
/www/wwwlogs/aidayibin-ai-test/app.log
/www/wwwlogs/aidayibin-ai-test/worker-poll.log
/www/wwwlogs/aidayibin-ai-test/worker-cleanup.log
```

## 8. 上传文件清单

部署到：

```text
/www/wwwroot/ai-test
```

需要上传：

```text
package.json
package-lock.json
next.config.ts
tsconfig.json
postcss.config.mjs
eslint.config.mjs
src/
public/
scripts/
supabase/
docs/ 可选
```

不要上传：

```text
node_modules/
.next/
.env.local
.env*
.git/
```

建议流程：

```text
先上传代码，再在服务器内创建 .env.local。
```

## 9. 部署命令

进入目录：

```bash
cd /www/wwwroot/ai-test
```

安装依赖：

```bash
npm ci
```

创建 `.env.local`：

```bash
vi .env.local
```

确认环境变量里是：

```env
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai-test
NEXT_PUBLIC_BASE_PATH=/ai-test
NEXT_PUBLIC_ENABLE_MOCKS=false
```

构建：

```bash
npm run build
```

启动测试：

```bash
npm run start -- -p 3001
```

如果宝塔 PM2 管理器支持启动命令，建议：

```text
项目目录：/www/wwwroot/ai-test
启动命令：npm run start -- -p 3001
项目端口：3001
```

也可以用 PM2：

```bash
pm2 start npm --name aidayibin-ai-test -- run start -- -p 3001
pm2 save
```

注意：

```text
不要重启整台服务器。
不要改已有 Java/H5 项目的启动配置。
不要覆盖 /www/wwwroot 下已有站点目录。
```

## 10. 端口

计划使用：

```text
3001
```

检查端口是否占用：

```bash
lsof -i:3001
```

要求：

```text
3001 只给服务器本机 Nginx 反向代理使用。
不建议在阿里云安全组开放 3001 公网访问。
公网只走 80/443。
```

## 11. Nginx 反向代理

宝塔里建议只改 `ces.dayibin.cn` 对应站点的 Nginx 配置，不要改全局 Nginx。

新增：

```nginx
location /ai-test/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location = /ai-test {
    return 301 /ai-test/;
}
```

不要配置成：

```nginx
proxy_pass http://127.0.0.1:3001/;
```

原因：

```text
项目本身已经通过 basePath 使用 /ai-test。
Nginx 不要把 /ai-test 剥掉。
```

配置后检查：

```bash
nginx -t
```

然后只重载 Nginx：

```bash
nginx -s reload
```

或通过宝塔面板保存配置。

注意：

```text
不要重启整台服务器。
不要改已有 location / 或 Java/H5 站点代理。
只新增 /ai-test 这两个 location。
```

## 12. 验证部署成功

### 12.1 服务器本机验证

```bash
curl -I http://127.0.0.1:3001/ai-test
curl -I http://127.0.0.1:3001/ai-test/photo
curl -I http://127.0.0.1:3001/ai-test/fortune
curl -I http://127.0.0.1:3001/ai-test/admin/login
```

期望：

```text
返回 200
```

API 未登录验证：

```bash
curl -I http://127.0.0.1:3001/ai-test/api/quota
```

期望：

```text
返回 401，说明 API 路径存在，未登录被拦截，正常。
```

### 12.2 域名验证

```bash
curl -I https://ces.dayibin.cn/ai-test
curl -I https://ces.dayibin.cn/ai-test/photo
curl -I https://ces.dayibin.cn/ai-test/fortune
curl -I https://ces.dayibin.cn/ai-test/admin/login
```

浏览器打开：

```text
https://ces.dayibin.cn/ai-test
https://ces.dayibin.cn/ai-test/photo
https://ces.dayibin.cn/ai-test/fortune
```

检查页面源代码或浏览器 Network：

```text
静态资源应该是 /ai-test/_next/...
接口请求应该是 /ai-test/api/...
不应请求 /_next/... 或 /api/...
```

## 13. Worker 定时任务

项目需要 worker：

```text
worker:poll     轮询 AI 生成结果
worker:cleanup  清理临时原图记录
```

建议 crontab：

```cron
* * * * * cd /www/wwwroot/ai-test && /usr/bin/npm run worker:poll >> /www/wwwlogs/aidayibin-ai-test/worker-poll.log 2>&1
0 * * * * cd /www/wwwroot/ai-test && /usr/bin/npm run worker:cleanup >> /www/wwwlogs/aidayibin-ai-test/worker-cleanup.log 2>&1
```

确认 npm 路径：

```bash
which npm
```

如果不是 `/usr/bin/npm`，把 crontab 里的路径替换成真实路径。

## 14. 从 `/ai-test` 切到 `/ai`

稳定后切换到 `/ai` 时：

```env
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
```

必须重新构建：

```bash
npm run build
```

Nginx 新增或调整：

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

注意：

```text
不要同时用同一个 3001 进程服务 /ai-test 和 /ai。
basePath 是构建期配置，一个构建对应一个子路径。
```

如果要 `/ai-test` 和 `/ai` 同时存在，需要两个部署目录、两个端口、两套构建：

```text
/www/wwwroot/ai-test -> 3001 -> /ai-test
/www/wwwroot/ai      -> 3002 -> /ai
```

## 15. 风险提醒

上线前必须确认：

```text
1. 不覆盖现有网站目录
2. 不修改已有 location /
3. 不重启整台服务器
4. 3001 不开放公网
5. .env.local 不进入代码仓库
6. NEXT_PUBLIC_ENABLE_MOCKS=false
7. APP_SESSION_SECRET 已配置强随机值
8. ADMIN_SESSION_PASSWORD 不是默认密码
9. 已做服务器快照或至少备份 Nginx 配置
```

