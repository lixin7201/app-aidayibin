# 安全、性能、代码质量检查报告 2026-05-12

## 1. 总结结论

当前项目已经完成一轮上线前安全和性能检查。

结论：

```text
可以继续推进上线准备，但正式上线前仍必须补齐 App token 校验接口和生产环境变量。
```

本次已修复的关键问题：

```text
1. 用户和管理员 Cookie 从普通 base64 改为 HMAC 签名 Cookie
2. 生产环境要求配置 APP_SESSION_SECRET
3. AI 写真用户页不再把完整 prompt / negativePrompt 发给前端
4. AI 写真页 HTML 体积从约 303KB 降到约 95KB
```

## 2. API Key 和密钥泄露检查

### 2.1 本机密钥文件

本机存在：

```text
.env.local
.env.example
```

`.env.local` 中有真实服务密钥，用于本地开发测试。

当前 `.gitignore` 已包含：

```text
.env*
```

结论：

```text
.env.local 正常不会进入 Git 仓库。
但不要截图、复制、发群，也不要上传到服务器以外的公开位置。
```

### 2.2 源码和文档扫描

已扫描源码和文档，未发现真实 API key 明文提交。

文档中出现的是变量名和示例，例如：

```text
APIMART_API_KEY=你的 APIMart Key
SUPABASE_SERVICE_ROLE_KEY=生产数据库服务端密钥
```

结论：

```text
源码和文档层面没有发现真实 key 泄露。
```

### 2.3 前端静态包扫描

已检查 `.next/static`，这是浏览器可下载的前端静态包。

检查结果：

```text
SUPABASE_SERVICE_ROLE_KEY      未进入前端静态包
APIMART_API_KEY                未进入前端静态包
CLOUDFLARE_R2_ACCOUNT_ID       未进入前端静态包
CLOUDFLARE_R2_ACCESS_KEY_ID    未进入前端静态包
CLOUDFLARE_R2_SECRET_ACCESS_KEY 未进入前端静态包
APP_SESSION_SECRET             未进入前端静态包
ADMIN_SESSION_PASSWORD         未进入前端静态包
```

结论：

```text
当前没有发现 API key 被打进浏览器前端包。
```

## 3. 会话安全检查

### 3.1 已发现的问题

检查时发现：

```text
用户 Cookie 和管理员 Cookie 原先只是 base64 编码，不是签名 Cookie。
```

风险：

```text
理论上可被伪造，尤其管理员 Cookie 风险较高。
```

### 3.2 已修复

已新增：

```text
src/lib/auth/signed-cookie.ts
```

现在：

```text
用户 Cookie 使用 HMAC 签名
管理员 Cookie 使用 HMAC 签名
生产环境必须配置 APP_SESSION_SECRET
Cookie path 限制在 /ai
```

生产环境必须新增：

```env
APP_SESSION_SECRET=强随机字符串
```

建议生成方式：

```bash
openssl rand -base64 48
```

## 4. 管理后台安全

当前已完成：

```text
1. 后台登录页不再预填开发默认密码
2. 生产环境如果 ADMIN_SESSION_PASSWORD 仍是 dayibin-admin-dev，会直接报错
3. 管理员 Cookie 已签名
4. 管理员 Cookie path 限制在 /ai
```

仍建议上线后补强：

```text
1. 管理后台加 IP 白名单
2. 后台密码使用更强随机密码
3. 后续改为管理员账号表，而不是单一环境变量密码
4. 登录失败次数限制
```

## 5. App 登录安全

当前状态：

```text
APP_AUTH_VERIFY_URL 未配置
APP_AUTH_SHARED_SECRET 未配置
```

风险：

```text
正式环境如果不接 App token 校验，就无法可靠识别真实 App 用户。
```

正式上线前必须完成：

```text
1. App 打开 H5 时传 app_token
2. H5 后端调用 APP_AUTH_VERIFY_URL
3. App 后端返回 app_user_id
4. 双方约定 APP_AUTH_SHARED_SECRET
```

## 6. 上传和图片安全

当前已有保护：

```text
上传接口要求登录
只允许 JPG / PNG / WEBP
单文件最大 15MB
前端会压缩图片
临时原图有 worker 清理流程
用户可以删除历史记录
```

仍建议上线前确认：

```text
1. worker:cleanup 已配置定时任务
2. 图片存储 Bucket 权限不要过大
3. 图片公开域名只用于结果图访问
4. 日志不要打印完整图片地址和密钥
```

## 7. 依赖安全

执行：

```bash
npm audit --omit=dev --audit-level=moderate
```

结果：

```text
发现 2 个 moderate 级别问题，来源为 Next.js 依赖链中的 postcss advisory。
```

npm 给出的自动修复建议会触发 breaking change，不适合直接执行。

当前判断：

```text
不建议上线前直接 npm audit fix --force。
建议等 Next.js 官方发布安全补丁后，做一次受控升级和回归测试。
```

实际风险补充：

```text
该问题与 CSS stringify 相关。当前项目没有让用户提交自定义 CSS 的功能，实际暴露面较低，但仍需要跟进依赖补丁。
```

## 8. 性能检查

### 8.1 构建结果

已执行：

```bash
npm run build
```

结果：

```text
构建通过
前端静态资源目录 .next/static 约 944KB
最大 JS chunk 约 224KB
```

### 8.2 生产模式本地响应

本地生产模式检查结果：

```text
/ai          200，TTFB 约 108ms，HTML 约 13.9KB
/ai/photo    200，TTFB 约 88ms，HTML 约 94.9KB
/ai/fortune  200，TTFB 约 38ms，HTML 约 19.2KB
```

优化前：

```text
/ai/photo HTML 约 303KB
```

优化后：

```text
/ai/photo HTML 约 95KB
```

优化原因：

```text
用户端不再下发模板完整 prompt / negativePrompt。
```

### 8.3 性能判断

当前性能适合上线前内测和小规模灰度。

潜在性能点：

```text
1. AI 写真模板图片较多，移动端首屏要关注图片加载速度
2. 当前图片使用 unoptimized，依赖静态资源/CDN 速度
3. 生产建议开启 gzip / brotli
4. 图片结果域名建议接 CDN 或使用国内对象存储
5. 历史记录变多后，用户页应考虑分页或限制返回数量
```

## 9. 代码质量检查

已执行：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

结果：

```text
typecheck 通过
lint 通过
test 通过，3 个测试文件，5 个测试用例
build 通过
```

代码质量判断：

```text
整体可维护性尚可，模块拆分比较清楚。
写真、算命、后台、存储、数据库、worker 都有独立模块。
```

上线前建议继续改进：

```text
1. 增加登录、上传、生成任务的集成测试
2. 管理后台权限从单密码升级为账号体系
3. 增加 API 限流，防止频繁提交任务
4. 用户历史记录加分页
5. worker 增加并发锁，避免多台服务器重复轮询同一批任务
```

## 10. 当前上线阻塞项

正式开放前仍必须完成：

```text
1. 配置 APP_AUTH_VERIFY_URL
2. 配置 APP_AUTH_SHARED_SECRET
3. 生产环境配置 APP_SESSION_SECRET
4. 生产环境 NEXT_PUBLIC_ENABLE_MOCKS=false
5. 服务器配置 Nginx /ai 转发
6. 配置 worker 定时任务
7. ECS 创建上线前快照
8. 后台密码更换为强密码
```

