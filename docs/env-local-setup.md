# `.env.local` 配置指南

这个项目支持两种运行方式：

1. 本地 mock 体验：不接真实 APIMart、不接 Cloudflare R2，也能看页面和流程。
2. 真实服务体验：接本地 Supabase、APIMart、Cloudflare R2。

建议按下面步骤一步步配置。

## 第 1 步：复制环境变量文件

如果还没有 `.env.local`，先复制一份：

```bash
cp .env.example .env.local
```

当前项目已经为本机写好了一份 `.env.local`。

## 第 2 步：先跑通本地 mock

本地 mock 阶段保留：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_MOCKS=true
```

含义：

- `NEXT_PUBLIC_APP_URL`：本地网页地址。
- `NEXT_PUBLIC_ENABLE_MOCKS=true`：开发模式下允许模拟登录、模拟上传、模拟 AI 生成。

这种模式适合先看页面和基本流程。

## 第 3 步：配置本地 Supabase

先进入你的 Supabase 项目目录并查看状态：

```bash
cd ~/supabase-demo
supabase status
```

状态里一般会看到类似信息：

```text
Project URL: http://127.0.0.1:54321
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Secret: sb_secret_xxx
```

所以 `.env.local` 填：

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=把 supabase status 里 Secret 后面的值复制到这里
```

注意：

- Web 项目后端需要用 `SUPABASE_SERVICE_ROLE_KEY`。
- 不要把这个 key 暴露到前端页面。
- 当前代码只在服务端读取这个 key。

## 第 4 步：初始化数据库表

如果你重置过 Supabase，需要重新执行迁移：

```bash
python3 - <<'PY'
from pathlib import Path
import psycopg2

sql = Path('supabase/migrations/001_initial_schema.sql').read_text()
conn = psycopg2.connect(
    host='127.0.0.1',
    port=54322,
    database='postgres',
    user='postgres',
    password='postgres',
)
conn.autocommit = True
cur = conn.cursor()
cur.execute(sql)
cur.close()
conn.close()
print('migration applied')
PY
```

然后写入默认模板：

```bash
npm run db:seed
```

## 第 5 步：配置 APIMart

拿到 APIMart API Key 后填：

```env
APIMART_API_KEY=你的_apimart_key
APIMART_BASE_URL=https://api.apimart.ai
```

如果你要测试真实 APIMart，需要同时关闭 mock：

```env
NEXT_PUBLIC_ENABLE_MOCKS=false
```

当前代码对接：

- 提交图片生成：`POST /v1/images/generations`
- 查询任务：`GET /v1/tasks/{task_id}`
- 模型：`gpt-image-2`

## 第 6 步：配置 Cloudflare R2

真实生成后，需要把服务商返回的图片转存到自己的 R2。填：

```env
CLOUDFLARE_R2_ACCOUNT_ID=你的_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=你的_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=你的_secret_key
CLOUDFLARE_R2_BUCKET=你的_bucket_name
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://你的公开访问域名
```

说明：

- `CLOUDFLARE_R2_PUBLIC_BASE_URL` 必须能公开访问图片。
- 如果没有公开域名，用户生成记录里会无法正常显示成品图。
- 本地 mock 模式下可以先不填 R2。

### 6.1 创建 R2 存储桶

1. 登录 Cloudflare 控制台。
2. 左侧进入 `R2 Object Storage`。
3. 点击 `Create bucket`。
4. Bucket name 建议填：`aidayibin-ai-photo`。
5. 创建后，这个名字填到：

```env
CLOUDFLARE_R2_BUCKET=aidayibin-ai-photo
```

### 6.2 找 Account ID

1. 进入 Cloudflare 控制台首页。
2. 右侧或账户概览里找到 `Account ID`。
3. 复制后填：

```env
CLOUDFLARE_R2_ACCOUNT_ID=你的 Account ID
```

### 6.3 创建 R2 API Token

1. 在 Cloudflare 控制台进入 `R2 Object Storage`。
2. 找到 `Manage R2 API Tokens` 或 `API Tokens`。
3. 点击 `Create API token`。
4. 权限选择能读写 R2 的权限，建议至少包含对象读写。
5. 范围选择刚刚创建的 bucket，或者你的当前账号。
6. 创建后会出现两段值：
   - `Access Key ID`
   - `Secret Access Key`

填入：

```env
CLOUDFLARE_R2_ACCESS_KEY_ID=你的 Access Key ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=你的 Secret Access Key
```

提醒：`Secret Access Key` 只会完整显示一次，创建后马上复制保存到 `.env.local`。

### 6.4 配置图片公开访问地址

用户生成记录里要显示图片，所以 R2 里的结果图必须能公开访问。建议两种方式：

方式 A：绑定你自己的域名或子域名，例如：

```env
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://ai-photo-assets.dayibin.com
```

方式 B：MVP 临时测试可以使用 Cloudflare 给 R2 的公开开发地址，如果控制台里允许开启公开访问，就复制那个公开地址：

```env
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://你的公开地址
```

注意：这个地址最后不要加 `/`。代码会自动拼成：

```text
https://你的公开地址/results/用户ID/任务ID.png
```

### 6.5 R2 填完后的完整示例

```env
CLOUDFLARE_R2_ACCOUNT_ID=你的 Account ID
CLOUDFLARE_R2_ACCESS_KEY_ID=你的 Access Key ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=你的 Secret Access Key
CLOUDFLARE_R2_BUCKET=aidayibin-ai-photo
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://你的公开访问域名
```

## 第 7 步：配置 App 登录校验

MVP 本地开发可以不填，默认 mock 用户进入。

正式接入大宜宾 App 时，需要 App 方提供登录校验接口，然后填：

```env
APP_AUTH_VERIFY_URL=https://大宜宾App后端/verify-token
APP_AUTH_SHARED_SECRET=双方约定的服务端密钥
```

H5 打开时，App 需要把 `app_token` 传给 H5。H5 后端再调用 `APP_AUTH_VERIFY_URL` 验证用户身份。

## 第 8 步：后台登录密码

本地默认：

```env
ADMIN_SESSION_PASSWORD=dayibin-admin-dev
```

正式环境请改成更强的密码。

后台地址：

```text
http://localhost:3000/admin
```

## 推荐开发顺序

1. 先保持 `NEXT_PUBLIC_ENABLE_MOCKS=true`，确认页面能打开。
2. 配好 Supabase，执行迁移和 `npm run db:seed`。
3. 填 APIMart key，关闭 mock，测试真实生成任务。
4. 填 Cloudflare R2，确认生成结果能转存并展示。
5. 最后再接大宜宾 App 登录。

## 当前本机可用配置

当前 `.env.local` 至少应包含：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_MOCKS=true
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=你的本地 Supabase Secret
ADMIN_SESSION_PASSWORD=dayibin-admin-dev
```

也就是说：本地页面、后台、Supabase 记录都可用；APIMart 和 R2 还没有填真实密钥时，AI 生成仍是 mock。

提醒：`.env.local` 里会放密钥，不要发到公开仓库，也不要截图给外部人员。
