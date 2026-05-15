# 2026-05-12 变更记录

## 已完成修改

### 1. 恢复统一总入口

- `src/app/page.tsx` 保留 `/ai-test` 总入口
- 总入口展示 `AI 写真` 和 `AI 算命`
- 后续新增玩法也从这里统一管理

### 2. 写真和算命页面互相独立

- `src/features/h5/photo-workspace.tsx` 移除了跳转 `AI 算命` 的入口
- `src/features/fortune/fortune-app.tsx` 移除了跳转 `功能入口` 和 `AI 写真` 的入口
- App 可以分别配置 `/ai-test/photo` 和 `/ai-test/fortune` 两个独立 WebView 入口

### 3. 支持 App WebView 直登

- `src/app/api/auth/exchange/route.ts`
- `src/features/auth/app-auth-service.ts`
- `src/features/auth/app-token-login.tsx`

已支持：

- `uid / username / face / deviceid`
- `app_user_id / nickname / avatar_url / device_id`

### 4. 保留模板图并优化首屏

- `src/app/photo/page.tsx` 不再首屏预取用户生成历史
- `src/features/h5/photo-workspace.tsx` 恢复模板图片墙
- 模板图片优先使用 `/public/templates/thumbs/*.webp` 缩略图
- 首屏先展示当前性别前 12 个模板，点击后展开完整模板
- 生成记录点击展开后再请求，避免阻塞页面打开

## 本地联调步骤

1. 确认 `.env.local` 至少包含：

```env
NEXT_PUBLIC_BASE_PATH=/ai-test
NEXT_PUBLIC_APP_URL=http://localhost:3001/ai-test
```

2. 安装依赖并构建：

```bash
npm install
npm run build
```

3. 启动本地生产模式：

```bash
npm run start -- -p 3001
```

4. 访问以下地址检查：

- `http://localhost:3001/ai-test`
- `http://localhost:3001/ai-test/photo`
- `http://localhost:3001/ai-test/fortune`

5. 模拟 App 登录：

```text
http://localhost:3001/ai-test/photo?uid=123&username=测试用户&face=https%3A%2F%2Fexample.com%2Fa.png&deviceid=test123
```

## 部署后检查

- `/ai-test` 只作为总入口
- `/ai-test/photo` 不出现 `AI 算命` 跳转入口
- `/ai-test/fortune` 不出现 `AI 写真` 或 `功能入口` 跳转入口
- 写真模板图正常显示，男女模板一个不少
- 点击 `查看全部` 后展示完整模板列表
- 点击 `生成记录` 展开后再加载历史记录
- `POST /ai-test/api/auth/exchange` 返回 200
