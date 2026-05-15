# 大宜宾 AI H5 阿里云部署说明

本文用于指导把当前项目部署到公司阿里云服务器，并尽量保持现有域名不变，通过 `https://dayibin.cn/ai` 访问 AI H5。

当前项目不是纯静态 H5。它是一个 Next.js Web 服务，包含：

- 用户 H5 页面
- 管理后台
- `/api` 后端接口
- 用户登录会话
- 图片上传
- AI 生成任务
- 数据库记录
- 图片存储
- 定时轮询 worker

所以不能只把一个 HTML 文件夹上传到服务器。正式部署需要一台能运行 Node.js 或 Docker 的服务器。

## 1. 推荐部署目标

推荐优先方案：

```text
访问地址：https://dayibin.cn/ai
服务器：公司阿里云 ECS
运行方式：项目作为独立 Node.js 服务运行
对外入口：继续使用 dayibin.cn
主站影响：dayibin.cn 原网站不动，只新增 /ai 路径
```

推荐最终访问结构：

```text
https://dayibin.cn/          现有大宜宾网站，保持不变
https://dayibin.cn/ai        AI H5 功能选择入口
https://dayibin.cn/ai/photo  AI 写真 H5
https://dayibin.cn/ai/fortune AI 算命 H5
https://dayibin.cn/ai/admin  AI H5 管理后台
https://dayibin.cn/ai/api    AI H5 后端接口
```

关键判断：

```text
能不能保持域名不变：技术上可以。
关键前提：能操作 dayibin.cn 所在服务器的网站配置。
```

如果 `dayibin.cn` 当前已经指向阿里云 ECS，并且我们有服务器登录权限，就优先在这台服务器上新增 AI 项目。

## 2. 服务器方案选择

### 方案 A：部署在现有 dayibin.cn 服务器上

这是成本最低、域名最自然的方案。

适用条件：

- 现有服务器在阿里云 ECS
- 我们有登录权限
- 服务器资源还有余量
- 可以修改网站配置
- 当前网站没有占用 `/ai` 路径

优点：

- 不换域名
- 不需要新增服务器
- App 内入口可以直接配置为 `https://dayibin.cn/ai`

风险：

- 如果配置不当，可能影响现有网站
- AI 项目资源占用会和现有网站共用
- 后续排查问题时，需要区分主站和 AI 项目

建议：

```text
如果现有服务器配置不低，且网站访问量不是特别高，可以先用方案 A 内部测试。
上线前必须做好服务器快照和回滚方案。
```

### 方案 B：新增一台阿里云 ECS，再接到 dayibin.cn/ai

这是更稳的生产方案。

适用条件：

- 现有服务器不方便动
- 现有服务器资源不足
- 想把 AI 项目和主站隔离
- 可以让现有 dayibin.cn 服务器把 `/ai` 转发到新服务器

优点：

- 不影响现有网站
- AI 项目独立维护
- 后续扩容更方便

成本：

- 新 ECS 费用
- 云盘费用
- 公网流量或带宽费用
- 可能还有服务器维护费用

注意：

```text
即使新增服务器，如果访问地址仍要用 https://dayibin.cn/ai，
也仍然需要现有 dayibin.cn 服务器配合转发 /ai。
```

### 方案 C：新增子域名 ai.dayibin.cn

这是技术上最清晰的方案，但不是当前第一优先。

```text
https://ai.dayibin.cn
```

优点：

- 配置简单
- 与主站隔离
- 适合独立部署

缺点：

- 用户看到的是新子域名
- 需要新增 DNS 解析
- 可能要处理子域名备案、证书、白名单等

当前建议：

```text
先优先做 dayibin.cn/ai。
如果 /ai 路径方案受限，再切换到 ai.dayibin.cn。
```

## 3. 服务器最低要求

当前项目使用 Next.js 16，生产环境建议：

```text
操作系统：Ubuntu 22.04 / Alibaba Cloud Linux 3 / CentOS 7+
CPU：至少 2 核，建议 4 核
内存：至少 4GB，建议 8GB
系统盘：至少 40GB，建议 80GB+
Node.js：20.9 或以上，建议 Node.js 20 LTS / 22 LTS
公网入口：80、443
内部服务端口：例如 3001，只监听 127.0.0.1，不直接暴露公网
```

如果和现有网站共用服务器，建议先看服务器负载：

```bash
top
free -h
df -h
```

判断重点：

- CPU 是否长期很高
- 内存是否充足
- 磁盘是否剩余足够空间
- 网站访问高峰期是否稳定

## 4. 阿里云控制台需要确认的内容

登录阿里云后，先确认：

```text
1. ECS 实例在哪个地域
2. ECS 公网 IP 是否是 dayibin.cn 当前指向的 IP
3. ECS 操作系统是什么
4. 安全组是否允许 80、443
5. 22 端口是否只允许可信 IP 登录
6. 服务器是否已有快照策略
7. 域名 dayibin.cn 是否在同一个账号管理
8. 是否已有 SSL 证书
```

安全组建议：

```text
80 端口：允许公网访问
443 端口：允许公网访问
22 端口：只允许公司固定 IP 或维护人员 IP
3001 端口：不要开放公网
```

阿里云官方安全组说明中也建议网站业务只开放必要端口，如 80/443，限制其他端口直接暴露公网。

## 5. 费用项清单

老板已知道 AI 调用费用，这里重点列 AI 费用之外的成本。

### 5.1 服务器费用

如果用现有 ECS：

```text
可能无新增服务器费用。
但如果资源不够，可能要升级配置。
```

如果新增 ECS：

```text
会增加 ECS、云盘、公网带宽或流量费用。
```

建议初期规格：

```text
内部测试：2 核 4GB
小规模上线：4 核 8GB
用户量上来后：按监控再扩容
```

### 5.2 数据库费用

项目需要保存：

- App 用户记录
- 生成任务
- 历史图片记录
- 每日额度统计
- 管理后台数据

当前代码设计使用 Supabase PostgreSQL。

生产环境可选：

```text
方案 1：继续使用 Supabase
方案 2：使用阿里云 RDS PostgreSQL
方案 3：在 ECS 上自建 PostgreSQL
```

建议：

```text
正式上线更建议用云数据库或 Supabase，不建议把数据库随便放在没有备份的服务器目录里。
```

可能费用：

- 数据库实例费用
- 存储空间费用
- 备份费用
- 公网访问或跨区域流量费用

### 5.3 图片存储和流量费用

项目会存两类图片：

- 用户上传的原始图片
- AI 生成后的结果图片

当前代码设计使用 Cloudflare R2：

```env
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

国内生产环境也可以考虑阿里云 OSS。

阿里云 OSS 常见计费包括：

- 存储费用
- 外网下行流量费用
- 请求费用
- CDN 回源相关费用

建议：

```text
如果主要用户在国内，图片存储最好优先测试国内访问速度。
Cloudflare R2 成本可能低，但国内访问速度需要实测。
阿里云 OSS + CDN 速度更稳，但会有存储和流量费用。
```

### 5.4 CDN 费用

如果图片打开慢，或者用户量变大，建议接 CDN。

可能费用：

- CDN 下行流量
- CDN HTTPS 请求
- OSS 回源流量

什么时候需要 CDN：

```text
1. 用户打开生成图片很慢
2. 图片分享后访问量变大
3. App 内加载图片体验不稳定
```

### 5.5 证书费用

如果继续使用 `https://dayibin.cn/ai`，大概率可以复用 `dayibin.cn` 当前 HTTPS 证书。

可能产生费用的情况：

- 现有证书快过期
- 证书不在我们账号里
- 需要购买商业证书
- 新增子域名需要新的证书

### 5.6 快照和备份费用

上线前建议给 ECS 做快照，方便出问题回滚。

阿里云 ECS 快照会产生快照存储费用。

建议：

```text
上线前手动做一次快照。
正式上线后配置自动快照策略。
数据库和图片存储也要单独备份。
```

### 5.7 日志和监控费用

初期可以先用服务器本地日志。

后续建议接入：

- 阿里云云监控
- 日志服务 SLS
- 错误报警

可能费用：

- 日志存储费用
- 日志查询费用
- 监控告警短信费用

### 5.8 第三方 App 配合费用

如果大宜宾 App 是第三方平台维护，可能需要他们配合：

- App 入口打开 `https://dayibin.cn/ai`
- App 打开 H5 时传用户 token
- 提供 token 校验接口
- App 内上传、下载、分享能力适配
- 配置 H5 域名白名单

这部分可能产生第三方开发费或服务费。

## 6. 部署前必须完成的代码适配

当前项目默认运行在网站根路径 `/`。

如果要部署到：

```text
https://dayibin.cn/ai
```

必须适配 `/ai` 路径前缀。否则可能出现：

- 页面能打开，但静态资源 404
- API 请求跑到 `https://dayibin.cn/api`，没有进入 AI 项目
- 后台跳转到 `https://dayibin.cn/admin`，影响主站
- 分享链接少了 `/ai`
- Cookie 作用到整个 `dayibin.cn`，可能和主站互相影响

建议代码适配项：

```text
1. next.config.ts 增加 basePath: "/ai"
2. 生产环境 NEXT_PUBLIC_APP_URL 改为 https://dayibin.cn/ai
3. 前端 fetch("/api/...") 改为带 basePath 的请求
4. 页面跳转 "/admin" 改为 "/ai/admin" 或统一用 basePath helper
5. 图片路径 "/brand/xxx.png" 改为支持 basePath
6. Cookie path 从 "/" 改为 "/ai"
7. 登录 redirect 不要写死 http://localhost:3000
8. R2/mock 内部图片 URL 需要包含正确的 APP_URL
```

当前已发现需要注意的文件：

```text
next.config.ts
src/features/h5/ai-photo-app.tsx
src/features/fortune/fortune-app.tsx
src/features/admin/admin-dashboard.tsx
src/app/admin/page.tsx
src/app/admin/login/page.tsx
src/app/api/auth/exchange/route.ts
src/features/auth/session.ts
src/lib/storage/r2.ts
```

建议上线前先由开发侧完成 `/ai` 适配，再部署。

## 7. 生产环境参数

服务器上的 `.env.local` 建议如下。

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
NEXT_PUBLIC_ENABLE_MOCKS=false

SUPABASE_URL=你的生产数据库地址
SUPABASE_SERVICE_ROLE_KEY=你的生产数据库服务端密钥

APIMART_API_KEY=你的 APIMart Key
APIMART_BASE_URL=https://api.apimart.ai

CLOUDFLARE_R2_ACCOUNT_ID=你的 R2 Account ID
CLOUDFLARE_R2_ACCESS_KEY_ID=你的 R2 Access Key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=你的 R2 Secret Key
CLOUDFLARE_R2_BUCKET=你的 R2 Bucket
CLOUDFLARE_R2_PUBLIC_BASE_URL=你的图片公开访问地址

APP_AUTH_VERIFY_URL=大宜宾 App 用户 token 校验接口
APP_AUTH_SHARED_SECRET=双方约定的服务端密钥
APP_SESSION_SECRET=强随机会话签名密钥

ADMIN_SESSION_PASSWORD=正式后台强密码
```

重要提醒：

```text
NEXT_PUBLIC_ENABLE_MOCKS=false 必须设置。
否则线上可能还在走本地模拟用户和模拟生成逻辑。
```

## 8. 数据库初始化

当前项目数据库迁移文件：

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fortune_module.sql
```

初始化步骤：

```text
1. 创建生产数据库
2. 依次执行 001_initial_schema.sql
3. 再执行 002_fortune_module.sql
4. 配好 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
5. 启动项目后进入 /ai/admin
6. 写入默认模板数据
```

如果继续使用 Supabase：

```text
在 Supabase SQL Editor 里按顺序执行两个 SQL 文件。
```

如果改用阿里云 RDS PostgreSQL：

```text
需要确认当前代码能否直接使用 RDS 连接方式。
当前代码使用 Supabase SDK，不是普通 PostgreSQL 客户端。
如果换 RDS，需要改数据库访问代码。
```

所以初期建议：

```text
先继续使用 Supabase，减少上线改动。
后续稳定后再评估是否迁移到阿里云 RDS。
```

## 9. 图片存储配置

当前项目使用 R2 风格的 S3 接口。

正式上线必须确认：

```text
1. Bucket 已创建
2. Access Key 有读写权限
3. Public Base URL 可以公开访问
4. 服务器可以访问 R2 接口
5. App 内可以正常加载图片
```

上线前测试：

```bash
npm run r2:test
```

如果国内访问慢：

```text
备选方案：改为阿里云 OSS。
但这不是只改参数，可能需要改 src/lib/storage/r2.ts。
```

## 10. App 登录接入

当前项目已经预留 App 登录校验：

```env
APP_AUTH_VERIFY_URL=
APP_AUTH_SHARED_SECRET=
```

期望流程：

```text
1. 用户在大宜宾 App 内点击 AI 入口
2. App 打开 https://dayibin.cn/ai?app_token=xxxx
3. H5 后端把 app_token 发给 APP_AUTH_VERIFY_URL
4. App 后端返回用户 ID、昵称、头像等信息
5. H5 建立自己的登录会话
6. 用户开始上传、生成、查看历史记录
```

需要第三方 App 平台提供：

```text
1. app_token 如何获取
2. token 如何传给 H5
3. token 校验接口地址
4. 请求方式和参数
5. 返回字段
6. token 有效期
7. 签名或密钥规则
8. 测试账号和测试 token
```

没有登录接口时，可以先内部测试，但不能正式开放给用户。

## 11. 服务器部署步骤

以下以 Node.js + PM2 部署为例。

### 11.1 登录服务器

```bash
ssh root@服务器公网IP
```

建议不要长期使用 root 运行项目。可以创建部署用户：

```bash
adduser deploy
usermod -aG sudo deploy
```

### 11.2 安装基础环境

需要安装：

```text
Node.js 20+
npm
git
nginx
pm2
```

示例：

```bash
node -v
npm -v
nginx -v
```

确认 Node.js 版本不低于 20.9。

### 11.3 上传项目代码

推荐目录：

```text
/var/www/app-aidayibin
```

方式一：从代码仓库拉取：

```bash
cd /var/www
git clone 你的代码仓库地址 app-aidayibin
cd app-aidayibin
```

方式二：本地打包上传：

```text
把项目上传到 /var/www/app-aidayibin。
```

不要上传：

```text
node_modules
.next
.env.local
```

`.env.local` 应该在服务器上单独创建。

### 11.4 安装依赖

```bash
cd /var/www/app-aidayibin
npm ci
```

如果服务器内存较小，构建时可能卡住或被系统杀掉。建议至少 4GB 内存。

### 11.5 创建生产环境变量

```bash
cp .env.example .env.local
nano .env.local
```

按第 7 节填写生产参数。

### 11.6 构建项目

```bash
npm run build
```

构建成功后再继续。

如果构建失败，不要上线，先修复报错。

### 11.7 启动服务

建议项目监听本机端口 `3001`。

```bash
PORT=3001 npm run start
```

确认本机可访问：

```bash
curl -I http://127.0.0.1:3001/ai
```

如果还没做 `/ai` basePath 适配，这里可能应该访问：

```bash
curl -I http://127.0.0.1:3001/
```

正式 `dayibin.cn/ai` 上线前必须完成 basePath 适配。

### 11.8 使用 PM2 守护进程

安装 PM2：

```bash
npm install -g pm2
```

启动：

```bash
cd /var/www/app-aidayibin
PORT=3001 pm2 start npm --name aidayibin-h5 -- run start
pm2 save
pm2 startup
```

常用命令：

```bash
pm2 status
pm2 logs aidayibin-h5
pm2 restart aidayibin-h5
pm2 stop aidayibin-h5
```

## 12. dayibin.cn/ai 域名接入方式

### 12.1 如果项目部署在 dayibin.cn 当前服务器

Nginx 思路：

```text
外部用户访问 https://dayibin.cn/ai
Nginx 接到请求
Nginx 把 /ai 转发给 http://127.0.0.1:3001/ai
Next.js 返回页面和接口
```

示例配置：

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
这个配置假设项目已经适配 basePath=/ai。
```

测试 Nginx 配置：

```bash
nginx -t
systemctl reload nginx
```

### 12.2 如果项目部署在新增 ECS

仍然要在 dayibin.cn 当前服务器上配置：

```nginx
location /ai/ {
    proxy_pass http://新ECS内网或公网IP:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /ai {
    return 301 /ai/;
}
```

更推荐：

```text
如果两台 ECS 在同一阿里云地域和 VPC，优先用内网 IP 转发。
不要把新 ECS 的 3001 端口暴露公网。
```

## 13. Worker 定时任务

项目有两个生产 worker：

```bash
npm run worker:poll
npm run worker:cleanup
```

作用：

```text
worker:poll     轮询 AI 生成结果，把成功图片转存并回写数据库
worker:cleanup  清理临时原图，降低隐私和存储风险
```

建议用 crontab：

```bash
crontab -e
```

示例：

```cron
* * * * * cd /var/www/app-aidayibin && /usr/bin/npm run worker:poll >> /var/log/aidayibin-worker-poll.log 2>&1
0 * * * * cd /var/www/app-aidayibin && /usr/bin/npm run worker:cleanup >> /var/log/aidayibin-worker-cleanup.log 2>&1
```

注意：

```text
如果 npm 路径不对，用 which npm 查看真实路径。
```

## 14. 上线前检查清单

### 14.1 服务器检查

```text
ECS 已做快照
80/443 可访问
3001 未暴露公网
PM2 服务可自动重启
Nginx 配置测试通过
磁盘空间充足
```

### 14.2 项目检查

```text
npm run lint 通过
npm run typecheck 通过
npm run test 通过
npm run build 通过
NEXT_PUBLIC_ENABLE_MOCKS=false
NEXT_PUBLIC_APP_URL=https://dayibin.cn/ai
NEXT_PUBLIC_BASE_PATH=/ai
/ai 路径适配完成
```

### 14.3 业务检查

```text
App 内能打开 https://dayibin.cn/ai
App token 能传给 H5
用户登录能识别
图片能上传
AI 能生成
结果图能展示
历史记录能查看
下载/分享可用
管理后台可登录
后台数据可查看
worker 能回写生成结果
```

### 14.4 安全检查

```text
后台密码已改强密码
数据库密钥未提交到代码仓库
R2/OSS 密钥未提交到代码仓库
服务器只开放必要端口
日志不打印用户敏感照片 URL 或密钥
Cookie path 建议限制在 /ai
用户和管理员 Cookie 必须使用签名 Cookie，生产环境必须配置 APP_SESSION_SECRET
```

## 15. 推荐上线流程

### 第一步：内部服务器确认

确认：

```text
dayibin.cn 当前 ECS 是否可登录
是否能修改网站配置
是否已有 HTTPS
服务器资源是否够
```

### 第二步：代码完成 /ai 适配

完成后本地验证：

```text
http://localhost:3000/ai
http://localhost:3000/ai/admin
http://localhost:3000/ai/api/...
```

### 第三步：服务器测试部署

先部署到服务器内部端口：

```text
http://127.0.0.1:3001/ai
```

确认服务本身正常。

### 第四步：接入 dayibin.cn/ai

配置 Nginx 后访问：

```text
https://dayibin.cn/ai
```

### 第五步：只给内部测试

建议先内部测试 1-3 天：

```text
测试上传、生成、历史记录、后台、费用消耗、图片速度。
```

### 第六步：App 灰度接入

让第三方 App 平台配置入口：

```text
https://dayibin.cn/ai
```

先小范围用户开放。

### 第七步：正式开放

确认：

```text
费用可控
生成成功率稳定
服务器负载正常
图片访问速度正常
没有大量报错
```

再正式放量。

## 16. 回滚方案

上线前必须准备回滚方案。

推荐：

```text
1. ECS 上线前创建快照
2. 备份 Nginx 配置
3. 保留旧版本项目目录
4. PM2 可快速切换旧版本
5. App 入口可临时关闭或隐藏
```

如果 `dayibin.cn/ai` 出问题：

```text
1. Nginx 去掉 /ai 配置，恢复主站
2. PM2 停止 AI 服务
3. App 入口临时下线
4. 排查数据库、AI 服务、图片存储和服务器日志
```

## 17. 最容易踩坑的地方

### 17.1 没做 /ai 适配

表现：

```text
页面打开空白
按钮没反应
接口 404
后台跳转错地址
图片加载失败
```

解决：

```text
先完成 basePath=/ai 适配，再部署。
```

### 17.2 把 3001 端口开放公网

不建议。

正确做法：

```text
公网只访问 80/443。
3001 只给本机或内网访问。
```

### 17.3 线上还开着 mock

表现：

```text
用户都变成模拟用户
AI 生成不是正式结果
数据不真实
```

解决：

```env
NEXT_PUBLIC_ENABLE_MOCKS=false
```

### 17.4 没配置 worker

表现：

```text
用户提交生成后一直在等待
AI 服务商其实已经生成成功，但我们系统没同步结果
```

解决：

```text
配置 worker:poll 定时执行。
```

### 17.5 图片存储公网地址不可访问

表现：

```text
生成成功，但用户看不到图片。
```

解决：

```text
确认 CLOUDFLARE_R2_PUBLIC_BASE_URL 或 OSS/CDN 地址可公开访问。
```

## 18. 给阿里云/服务器维护人员的对接话术

可以直接发送：

```text
我们需要把 AI H5 项目部署到公司阿里云服务器，并通过现有域名访问：

https://dayibin.cn/ai

项目不是纯静态页面，需要作为 Node.js 服务运行，内部端口计划使用 3001。

请协助确认：

1. dayibin.cn 当前是否部署在这台 ECS 上；
2. 是否可以在服务器上安装 Node.js 20+、npm、pm2；
3. 是否可以把项目部署到 /var/www/app-aidayibin；
4. 是否可以配置 PM2 守护服务；
5. 是否可以修改 Nginx，把 /ai 转发到 http://127.0.0.1:3001；
6. 是否可以复用 dayibin.cn 当前 HTTPS 证书；
7. 是否可以在上线前给 ECS 创建快照；
8. 3001 端口不需要开放公网，只需要服务器本机访问。

现有 dayibin.cn 主站保持不变，只新增 /ai 路径。
```

## 19. 官方参考

- Next.js 官方自托管说明：建议在 Next.js 服务前放反向代理，如 Nginx；`next start` 支持完整 Next.js 功能。  
  https://nextjs.org/docs/app/guides/self-hosting

- Next.js 官方安装要求：Next.js 当前要求 Node.js 20.9 或以上。  
  https://nextjs.org/docs/app/getting-started/installation

- 阿里云 ECS 安全组说明：网站业务通常只开放必要的公网端口，如 80/443。  
  https://help.aliyun.com/zh/ecs/user-guide/security-groups-for-different-use-cases

- 阿里云 ECS 备份与恢复说明：可使用快照、镜像、云备份等方式做容灾。  
  https://help.aliyun.com/zh/ecs/user-guide/disaster-recovery-solutions

- 阿里云 OSS 计费说明：OSS 通常涉及存储、外网下载流量、请求等费用。  
  https://help.aliyun.com/zh/oss/billing-overview
