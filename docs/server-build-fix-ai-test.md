# `/ai-test` 服务器构建失败修复说明

## 1. 当前错误原因

服务器构建时报错：

```text
ADMIN_SESSION_PASSWORD must be changed
Failed to collect page data for /api/admin/dashboard
```

根因：

```text
src/lib/config.ts 在模块导入阶段就检查生产默认后台密码。
Next.js 构建时会导入 API route，用于收集路由数据。
导入 /api/admin/dashboard 相关模块时触发了这个生产环境校验，于是 build 失败。
```

这个校验本身是正确的，但不能放在模块顶层，否则 API route 只要被构建导入就会失败。

## 2. 已完成的代码修复

### 2.1 后台密码校验改为运行时

已修改：

```text
src/lib/config.ts
src/features/admin/admin-auth.ts
```

现在：

```text
npm run build 不会因为 ADMIN_SESSION_PASSWORD 缺失或默认值而失败。
管理员登录时仍会校验：生产环境不能使用 dayibin-admin-dev。
```

### 2.2 移除 Google Fonts 构建依赖

已修改：

```text
src/app/layout.tsx
```

现在不再依赖：

```text
next/font/google
Geist
Geist_Mono
```

避免服务器无法访问 Google Fonts 导致构建失败。

## 3. 已验证结果

使用服务器当前最小环境变量模拟：

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai-test
NEXT_PUBLIC_BASE_PATH=/ai-test
```

执行：

```bash
npm run build
```

结果：

```text
构建成功
```

同时已通过：

```bash
npm run typecheck
npm run lint
npm run test
```

## 4. 环境变量分类

## 4.1 build 必须有

构建 `/ai-test` 时建议至少有：

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai-test
NEXT_PUBLIC_BASE_PATH=/ai-test
```

严格来说，当前代码在 build 阶段不强制要求数据库、R2、APIMart、App 登录接口。

但为了减少构建和运行环境差异，建议服务器 `.env.local` 一次性补齐。

## 4.2 运行时必须有

正式运行完整功能需要：

```env
NEXT_PUBLIC_ENABLE_MOCKS=false

ADMIN_SESSION_PASSWORD=正式后台强密码
APP_SESSION_SECRET=强随机会话签名密钥

SUPABASE_URL=Supabase 项目地址
SUPABASE_SERVICE_ROLE_KEY=Supabase service role key

APIMART_API_KEY=APIMart Key
APIMART_BASE_URL=https://api.apimart.ai

CLOUDFLARE_R2_ACCOUNT_ID=R2 Account ID
CLOUDFLARE_R2_ACCESS_KEY_ID=R2 Access Key ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=R2 Secret Access Key
CLOUDFLARE_R2_BUCKET=R2 Bucket
CLOUDFLARE_R2_PUBLIC_BASE_URL=图片公开访问域名

APP_AUTH_VERIFY_URL=App token 校验接口
APP_AUTH_SHARED_SECRET=App token 校验接口共享密钥
```

## 4.3 运行到具体功能才需要

```text
后台登录：ADMIN_SESSION_PASSWORD、APP_SESSION_SECRET
用户登录：APP_AUTH_VERIFY_URL、APP_AUTH_SHARED_SECRET、APP_SESSION_SECRET
数据库读写：SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY
图片上传和结果图：CLOUDFLARE_R2_*
AI 生成：APIMART_API_KEY、APIMART_BASE_URL
worker 轮询：SUPABASE_*、APIMART_*、CLOUDFLARE_R2_*
```

## 5. 默认密码校验逻辑

位置：

```text
src/features/admin/admin-auth.ts
src/lib/config.ts
```

规则：

```text
生产环境不能使用 ADMIN_SESSION_PASSWORD=dayibin-admin-dev。
```

正确配置：

```env
ADMIN_SESSION_PASSWORD=换成强密码
```

建议至少：

```text
16 位以上，包含大小写字母、数字、符号。
```

## 6. APP_SESSION_SECRET 生成方式

必须配置。

用途：

```text
给用户和管理员 Cookie 做 HMAC 签名，防止伪造登录态。
```

建议生成：

```bash
openssl rand -base64 48
```

要求：

```text
建议 32 字节以上强随机。
不要使用固定单词、手机号、公司名、生日。
不要和 ADMIN_SESSION_PASSWORD 使用同一个值。
```

## 7. 测试阶段没有真实服务怎么办

如果只是为了让服务器 `npm run build` 成功：

```text
可以只配置 NODE_ENV、NEXT_PUBLIC_APP_URL、NEXT_PUBLIC_BASE_PATH。
```

如果要启动并打开页面，但暂时不测试真实 AI 生成：

```env
NEXT_PUBLIC_ENABLE_MOCKS=false
ADMIN_SESSION_PASSWORD=强密码
APP_SESSION_SECRET=强随机值
```

如果要测试上传、生成、历史记录：

```text
必须配置 Supabase、R2、APIMart。
```

不建议生产测试环境开启：

```env
NEXT_PUBLIC_ENABLE_MOCKS=true
```

原因：

```text
生产 NODE_ENV 下 mock 逻辑不会启用，且开启 mock 容易造成测试结论不可靠。
```

## 8. 最终服务器 `.env.local` 模板

路径：

```text
/www/wwwroot/ai-test/.env.local
```

模板：

```env
# 必填，真实值
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ces.dayibin.cn/ai-test
NEXT_PUBLIC_BASE_PATH=/ai-test
NEXT_PUBLIC_ENABLE_MOCKS=false

# 绝不能用默认值
ADMIN_SESSION_PASSWORD=请填写正式后台强密码
APP_SESSION_SECRET=请使用 openssl rand -base64 48 生成

# 完整功能必填，若只验证 build 可以暂时不填
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AI 生成必填，若只验证 build 可以暂时不填
APIMART_API_KEY=
APIMART_BASE_URL=https://api.apimart.ai

# 图片上传和结果图必填，若只验证 build 可以暂时不填
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=

# App 正式登录必填，若只验证 build 可以暂时不填
APP_AUTH_VERIFY_URL=
APP_AUTH_SHARED_SECRET=
```

注意：

```text
URL 类型变量如果填写，必须是合法 URL。
不要写“占位”“待填写”这类中文，否则 zod 校验会失败。
不确定时宁可留空。
```

## 9. 服务器执行顺序

```bash
cd /www/wwwroot/ai-test
npm ci
vi .env.local
npm run build
npm run start -- -p 3001
```

验证：

```bash
curl -I http://127.0.0.1:3001/ai-test
curl -I http://127.0.0.1:3001/ai-test/photo
curl -I http://127.0.0.1:3001/ai-test/fortune
curl -I http://127.0.0.1:3001/ai-test/api/quota
```

预期：

```text
/ai-test 页面 200
/ai-test/photo 页面 200
/ai-test/fortune 页面 200
/ai-test/api/quota 未登录时 401，正常
```

