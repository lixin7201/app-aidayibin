# AI 写真 / AI 算命 / 高考志愿填报安全稳定与可维护性审查报告

审查日期：2026-06-28

审查范围：

- AI 写真：`/ai/photo`、`/api/uploads`、`/api/generations`
- AI 算命：`/ai/fortune`、`/api/fortune/generations`
- 高考志愿填报：`/ai/gaokao`、`/api/gaokao/chat`、`/api/gaokao/recommend`、`/api/gaokao/reports`
- 共享基础能力：App / 微信登录、签名 Cookie、公开分享 token、图片存储、限流、任务 worker、测试与依赖安全

本报告只做代码审查和优化建议，不修改任何已经实现的功能。

## 1. 总体结论

当前项目不是“裸奔版”，基础安全、稳定性和可维护性已经有明显工程化痕迹：

- 主要业务接口都要求登录态。
- 用户 Cookie、图片公开访问、分享页访问都用了 HMAC 签名。
- AI 写真和 AI 算命有用户级限流、额度限制、平台级名额、运行中任务限制。
- AI 写真和 AI 算命提交任务时使用 MySQL advisory lock，能挡住同一用户并发提交窗口。
- 高考志愿填报要求登录、限流、报告生成次数上限，并且报告文案明确避免承诺录取。
- TypeScript、ESLint、Vitest 当前均通过。

但如果按正式推广、真实用户裂变和成本安全来要求，仍然有几个必须收口的问题。最重要的是：生产环境仍存在“未配置 App token 校验时信任前端 uid”的兼容逻辑。这会影响 AI 写真、AI 算命、高考报告三条链路，因为它们都依赖同一个会话身份。

我的判断：

```text
代码质量：基本合格，可以维护。
稳定性：基本合格，但任务 worker 和图片清理需要补强。
安全性：有基础防线，但正式推广前必须收口 App 身份校验、图片清理和旧上传签名入口。
```

## 2. 本次验证结果

已执行：

```bash
npm run typecheck
npm run lint
npm test
npm audit --omit=dev --audit-level=moderate
rg -n "APIMART_API_KEY|APP_SESSION_SECRET|APP_AUTH_SHARED_SECRET|WECHAT_APP_SECRET|GAOKAO_LLM_API_KEY|ALIYUN_OSS_ACCESS_KEY_SECRET|CLOUDFLARE_R2_SECRET_ACCESS_KEY|ADMIN_SESSION_PASSWORD|local-aidayibin-session-secret|createHmac|Bearer " .next/static public
```

结果：

- `npm run typecheck` 通过。
- `npm run lint` 通过。
- `npm test` 通过，18 个测试文件、82 个测试用例全部通过。
- `.next/static public` 未检出敏感变量名或服务端签名逻辑。
- `npm audit --omit=dev --audit-level=moderate` 仍有 2 个 moderate，来自 Next 依赖链里的 `postcss < 8.5.10`。`npm audit fix --force` 会安装破坏性版本，不建议直接执行。

## 3. 分模块评级

| 模块 | 安全性 | 稳定性 | 可维护性 | 结论 |
| --- | --- | --- | --- | --- |
| AI 写真 | B | B+ | B | 服务端额度、锁、限流合格；生产身份校验、图片删除和 worker 仍需补强。 |
| AI 算命 | B | B+ | B | 与写真同源能力较多，娱乐免责声明已有；掌纹/面相图片隐私清理要更严。 |
| 高考志愿填报 | B+ | B+ | B | 登录、限流、报告次数、免责声明和数据边界较好；分享隐私提示和顾问引擎可观测性要补。 |
| 共享基础设施 | B- | B | B | 签名和限流已有，但 App 身份兼容逻辑、旧上传签名接口、worker 锁与清理策略是主要短板。 |

## 4. 已经做得好的部分

### 4.1 业务接口默认要求登录

AI 写真：

- `src/app/api/generations/route.ts` 的 GET/POST 都调用 `requireStoredSessionFromRequest`。
- `src/app/api/uploads/route.ts` 上传接口也要求登录。
- `src/app/api/generations/[id]/route.ts` 读取和删除记录时按 `user.id` 查。

AI 算命：

- `src/app/api/fortune/generations/route.ts` 的 GET/POST 都要求登录。
- `src/app/api/fortune/generations/[id]/route.ts` 读取和删除记录时按 `user.id` 查。

高考志愿填报：

- `src/app/api/gaokao/chat/route.ts`、`src/app/api/gaokao/recommend/route.ts`、`src/app/api/gaokao/reports/route.ts` 都要求登录。
- `src/app/api/gaokao/reports/[id]/route.ts` 按用户读取和删除报告。

结论：普通接口没有明显的匿名提交入口。

### 4.2 Cookie 和分享链接不是明文信任

相关文件：

- `src/lib/auth/signed-cookie.ts`
- `src/lib/auth/image-token.ts`
- `src/lib/auth/result-share-token.ts`
- `src/lib/share/result-share.ts`

当前做法：

- 登录 Cookie 使用 HMAC 签名。
- 公开图片访问使用 `kind + taskId + variant` 签名 token。
- 分享页使用 `kind + taskId + result-share-page` 签名 token。
- 生产环境缺少 `APP_SESSION_SECRET` 会直接报错。

结论：不是单纯靠 UUID 裸访问。

### 4.3 AI 写真和 AI 算命有成本控制

AI 写真：

- `/api/generations` 每用户 1 分钟最多 3 次。
- 服务端再次检查每日额度、活动总额度、提交次数、平台每日总量。
- 同一用户同一时间只允许一个运行中写真任务。
- 提交任务时用 MySQL advisory lock 保护并发窗口。

AI 算命：

- `/api/fortune/generations` 每用户 1 分钟最多 2 次。
- 默认每个用户活动期最多成功 1 次。
- 同一用户同一时间只允许一个运行中算命任务。
- 提交任务时同样用 MySQL advisory lock。

结论：前端额度提示不是唯一防线，服务端也在兜底。

### 4.4 高考志愿填报有高风险内容边界

相关文件：

- `src/features/gaokao/gaokao-llm.ts`
- `src/features/gaokao/gaokao-report.ts`
- `src/features/gaokao/gaokao-repository.ts`

当前做法：

- 只服务四川 2026 场景。
- 明确不能说已有 2026 录取结果。
- 报告写明结果仅供参考，以考试院、阳光高考平台和高校章程为准。
- 学校名单来自数据库推荐，不让聊天阶段编造具体学校。
- 正常用户最多生成 2 次报告，且有删除后重生成的规则。

结论：高考模块没有把 AI 结果包装成录取承诺，这是合格设计。

## 5. 必须优先处理的问题

### P0-1：生产环境 App 身份校验仍可能退回到信任前端 uid

风险等级：P0

影响范围：

- AI 写真额度和任务归属
- AI 算命体验次数和任务归属
- 高考报告生成次数和报告归属

证据：

- `src/features/auth/app-auth-service.ts`
- 当前逻辑在拿到 `app_user_id` 或 `uid` 时，如果不是生产环境，或者生产环境没有配置 `APP_AUTH_VERIFY_URL`，会直接创建会话。
- 这段逻辑是为了兼容旧 App WebView，但正式推广时风险很高。

风险说明：

如果生产环境没有配置 `APP_AUTH_VERIFY_URL`，外部请求理论上可以提交任意 `uid` / `app_user_id`，从而伪造用户身份。由于后续所有额度、报告、记录都绑定这个身份，等于所有业务安全都被这个入口影响。

建议方案：

1. 生产环境强制要求 `app_token` 或可信微信 OAuth 身份。
2. 生产环境配置了 `APP_AUTH_VERIFY_URL` 时，必须调用 App 服务端验证 token，不再接受裸 `uid` 建立 App 会话。
3. 旧版 QFH5 只给 `uid` 的兼容逻辑只允许在开发、灰度白名单或明确的内网测试环境启用。
4. 增加启动前检查：`NODE_ENV=production` 且打开写真/算命/高考任一功能时，`APP_SESSION_SECRET` 和 `APP_AUTH_VERIFY_URL` 必须存在。
5. 增加测试：生产环境、缺少 `APP_AUTH_VERIFY_URL`、只传 `uid` 时必须返回 401/500，不能创建会话。

验收标准：

- 生产环境只传 `uid` 不能登录。
- 生产环境传过期或伪造 `app_token` 不能登录。
- App 正常传短期 token 时三条业务链路可用。
- 微信外部打开分享页仍可正常展示公开分享内容，不被强制 App 登录打断。

### P0-2：图片删除只是软删除数据库，真实图片对象不会同步删除

风险等级：P0 / P1

影响范围：

- AI 写真成品图、预览图、分享图、卡片图
- AI 算命掌纹/面相输入图和报告图

证据：

- `softDeleteUserGeneration` 只设置 `deleted_at`。
- `softDeleteUserFortuneGeneration` 只设置 `deleted_at`。
- `deleteImageObject` 已存在，但没有被删除接口调用。
- `cleanupTempImages` 只清理临时输入图，不清理用户删除后的成品图。

风险说明：

用户在页面里删除记录后，业务列表和分享页会隐藏，但对象存储里的图片仍可能存在。若某个直接 OSS/R2 URL 已经被分享或缓存，数据库软删除不能让图片真正失效。对写真、掌纹、面相这类个人图片来说，隐私风险较高。

建议方案：

1. 保持当前用户体验不变，删除按钮仍是删除记录。
2. 后端删除记录时，同步或异步删除相关对象：原图、预览图、分享图、卡片图。
3. 如果担心直接删除导致误删，可先做“删除队列 + worker”，24 小时内可恢复，超过后物理删除。
4. 对历史已删除记录补一次清理脚本，但执行前必须先备份并 dry-run。
5. 删除日志只记录 taskId、objectKey，不记录完整公网 URL。

验收标准：

- 删除写真记录后，`/api/generations/:id/image` 返回 404。
- 删除算命记录后，`/api/fortune/generations/:id/image` 返回 404。
- 对应 OSS/R2 object 不再存在，或进入明确的待删除队列。
- 已删除记录不再被分享页读取。

### P0-3：临时图片清理只调用 R2 删除，和当前多存储 Provider 不一致

风险等级：P0 / P1

影响范围：

- AI 写真上传的用户输入图
- AI 算命上传的掌纹/面相图
- 阿里云 OSS 或本地存储生产环境

证据：

- `src/workers/cleanup-temp-images.ts` 直接 `import { deleteObject } from "@/lib/storage/r2"`。
- `src/lib/storage/image-storage.ts` 已支持 `r2`、`aliyun_oss`、`local` 三种 Provider。
- `cleanupTempImages` 没有根据任务记录或当前 Provider 选择删除方式。

风险说明：

如果线上使用 `IMAGE_STORAGE_PROVIDER=aliyun_oss` 或 `local`，临时输入图可能不会被正确清理。AI 算命上传的是手掌/面部相关图片，隐私敏感度更高。

建议方案：

1. 清理逻辑改为调用统一的 `deleteImageObject`。
2. 临时上传时记录 provider 和 object key，避免靠 URL 路径猜。
3. 兼容历史 URL 解析，但只作为 fallback。
4. 增加 `worker:cleanup` 的生产定时任务检查和运行日志。
5. 增加测试覆盖：R2、Aliyun OSS、local 三种 provider 的临时对象都能被正确删除。

验收标准：

- 线上实际 Provider 下，24 小时前完成/失败/取消任务的 `temp_input_urls` 被清空。
- 对应临时对象被物理删除。
- worker 失败时能看到结构化日志，而不是静默堆积。

## 6. 建议近期处理的问题

### P1-1：任务同步 worker 缺少领取锁和重试分级

风险等级：P1

影响范围：

- AI 写真任务轮询
- AI 算命任务轮询

证据：

- `generation_tasks` 和 `fortune_generation_tasks` 都有 `lock_until` 字段。
- `syncPendingGenerationTasks` / `syncPendingFortuneTasks` 当前只是查询 pending/processing 任务顺序处理，没有使用 `lock_until` 领取任务。
- worker 遇到任意异常会把任务标记为 `failed`。

风险说明：

如果多个进程同时跑 worker，可能重复查询同一外部任务、重复下载/处理成品图。若外部 API 或对象存储短暂失败，当前逻辑容易把可恢复错误直接变成最终失败，用户体验和成本都受影响。

建议方案：

1. 使用 `lock_until` 做任务领取：先 update 抢占，再处理。
2. 加 `retry_count` / `last_checked_at` / `next_retry_at`，至少区分临时错误和最终错误。
3. 外部 API 失败、下载失败、存储失败先重试，超过阈值才最终失败。
4. 对卡在 pending 且没有 `provider_task_id` 的任务做超时失败或告警。
5. 增加 worker 自检输出：本次领取数、成功数、失败数、跳过数、耗时。

验收标准：

- 两个 worker 并发跑时，同一任务只被一个 worker 处理。
- 模拟一次存储 502，任务不会立刻最终失败，会进入下次重试。
- 超过最大重试次数后，用户能看到明确失败原因。

### P1-2：`/api/uploads/sign` 旧直传签名入口缺少限流，且只走 R2

风险等级：P1

证据：

- `src/app/api/uploads/sign/route.ts` 要求登录并校验文件大小，但没有调用 `assertRateLimit`。
- 它直接调用 `createUploadUrl`，该实现来自 `src/lib/storage/r2.ts`。
- 当前主上传入口 `/api/uploads` 已有每分钟、每天、每天 MB 数限制，并会服务端压缩。

风险说明：

如果前端已经不使用直传签名入口，它会变成不必要的攻击面。如果还在用，它缺少和 `/api/uploads` 一致的限流、字节配额和多 Provider 支持。

建议方案：

1. 先确认前端是否仍调用 `/api/uploads/sign`。
2. 如果不用，直接关闭或仅开发环境开放。
3. 如果要保留，补齐和 `/api/uploads` 一样的用户频率、日次数、日流量限制。
4. 让它走统一 storage provider，不要只绑定 R2。

验收标准：

- 普通用户无法在 1 分钟内无限拿签名 URL。
- 当前线上 Provider 不是 R2 时，该接口不会误报或生成不可用 URL。

### P1-3：分享 token 和图片 token 没有过期或撤销机制

风险等级：P1 / P2

证据：

- `src/lib/auth/image-token.ts` 签名内容是 `kind:taskId:variant`。
- `src/lib/auth/result-share-token.ts` 签名内容是 `kind:taskId:result-share-page`。
- token 没有时间戳、版本号或单独撤销字段。

风险说明：

当前设计适合“分享长期可访问”的产品需求，但不适合“用户随时可撤销公开分享”的隐私需求。另一个问题是 token 使用 `APP_SESSION_SECRET`，如果发版或运维误换该密钥，旧分享链接会全部失效。

建议方案：

1. 先做产品决策：分享链接是否必须长期有效。
2. 如果要支持撤销，给任务/报告增加 `share_revoked_at` 或 `share_token_version`。
3. 如果要长期稳定分享，考虑拆出独立 `RESULT_SHARE_TOKEN_SECRET`，避免和登录 Cookie 密钥生命周期绑死。
4. 保留当前 URL 结构，避免影响已实现分享体验。

验收标准：

- 删除记录后分享页失效。
- 若启用撤销，用户撤销分享后旧链接返回 404。
- 更换登录 Cookie secret 不影响历史分享，或明确写入运维红线不能更换。

### P1-4：高考外部顾问引擎配置未进入 `.env.example`，且失败静默

风险等级：P1 / P2

证据：

- `src/lib/config.ts` 支持 `GAOKAO_ADVISOR_BASE_URL`、`GAOKAO_ADVISOR_API_KEY`、`GAOKAO_ADVISOR_TIMEOUT_MS`。
- `.env.example` 当前没有列出这组变量。
- `src/features/gaokao/gaokao-advisor-engine.ts` 失败时返回 `null`，走本地 fallback。

风险说明：

本地 fallback 能保证功能不断，但上线运维会不知道外部顾问引擎到底有没有接上。如果业务预期是“真实顾问能力已接入”，静默 fallback 会造成产品验收误判。

建议方案：

1. `.env.example` 和部署文档补齐 `GAOKAO_ADVISOR_*`。
2. 增加健康检查或后台状态：顾问引擎未配置、超时、返回异常分别可见。
3. 日志中只写 `advisor engine`，不暴露外部实名和用户完整隐私。
4. 对 fallback 明确打点，便于判断真实接入率。

验收标准：

- 未配置时页面仍可用，但后台能看到“使用本地 fallback”。
- 配置错误时不影响用户，但运维能定位错误。

### P1-5：依赖漏洞需要受控升级，不要 `npm audit fix --force`

风险等级：P1 / P2

当前审计结果：

```text
postcss <8.5.10
Severity: moderate
Next 依赖链引入
npm audit fix --force 会安装破坏性版本
```

建议方案：

1. 不要直接执行 `npm audit fix --force`。
2. 等 Next 当前主版本的安全修复版本，做单独依赖升级 PR。
3. 升级前后必须跑：`typecheck`、`lint`、`test`、`build`，并手动验 `/ai/photo`、`/ai/fortune`、`/ai/gaokao`。
4. 如果短期无法升级，记录风险接受：项目没有用户自定义 CSS 输入，实际暴露面相对有限，但仍需跟进。

验收标准：

- `npm audit --omit=dev --audit-level=moderate` 不再报该问题，或有明确风险接受记录。

## 7. 可维护性优化建议

### 7.1 不建议现在大重构写真和算命

AI 写真和 AI 算命有明显重复：

- 任务表结构相似。
- 提交服务相似。
- repository 映射公开图片 URL 的逻辑相似。
- sync worker 相似。
- 图片 token 和分享 token 使用方式相似。

但当前功能已经能跑，且业务红线要求“不影响已实现功能”。所以不建议现在为了“看起来优雅”做大抽象。

更稳的做法：

1. 先修身份校验、图片清理、worker 锁这类根风险。
2. 后续如果第三个图片生成类业务出现，再提取小的公共 helper。
3. 每次只抽一类重复，例如“公开图片 URL 构造”或“worker 领取任务”，不要一次性做通用任务框架。

验收标准：

- 抽象后的代码行数变少。
- 写真和算命现有测试都通过。
- 页面保存、分享、删除、轮询体验不变。

### 7.2 增加上线前环境体检脚本

建议新增一个只读脚本，例如：

```text
npm run doctor:production
```

检查项：

- `NODE_ENV=production`
- `NEXT_PUBLIC_ENABLE_MOCKS=false`
- `APP_SESSION_SECRET` 存在且不是默认值
- `APP_AUTH_VERIFY_URL` 已配置
- `ADMIN_SESSION_PASSWORD` 不是默认值
- 图片存储 Provider 对应变量齐全
- `APIMART_API_KEY` 已配置
- `GAOKAO_LLM_*`、`GAOKAO_ADVISOR_*` 是否符合预期
- worker 定时任务是否已配置

这比靠人工逐条看文档更稳。

### 7.3 增加运营观测指标

建议先做最小指标，不上复杂监控系统也可以：

- 每日写真提交数、成功数、失败数、平均完成时间。
- 每日算命提交数、成功数、失败数、平均完成时间。
- 高考报告生成数、删除数、重生成数。
- App 登录交换成功率、失败率、失败原因。
- worker 本次处理数和失败原因 Top。
- 临时图片清理数量和失败数量。
- 触发限流次数。

验收标准：

- 出问题时能回答“是登录问题、AI 服务问题、存储问题、还是 worker 没跑”。

### 7.4 补测试的最小清单

当前测试已经不错，但以下风险点建议补：

1. 生产环境缺少 `APP_AUTH_VERIFY_URL` 时，只传 `uid` 不能创建会话。
2. `/api/uploads/sign` 限流或关闭策略。
3. 写真/算命删除记录后，对象删除或进入删除队列。
4. `cleanupTempImages` 在 `aliyun_oss`、`local` provider 下能正确清理。
5. worker 并发领取同一任务时只处理一次。
6. provider 临时失败时任务进入 retry，不直接最终失败。
7. 高考分享卡片 token 缺失、错误、删除报告后都返回 404。
8. 高考顾问引擎超时时 fallback 可用，并能记录状态。

## 8. 分业务优化建议

### 8.1 AI 写真

当前合格项：

- 上传接口有登录、限流、文件类型和大小限制。
- 服务端会压缩用户上传图。
- 生成接口有额度、限流、平台上限和并发锁。
- 成品图访问有签名 token。
- 分享页 token 验证后才展示。

优先优化：

1. 收口 App 身份校验，避免伪造用户刷额度。
2. 用户删除记录后，物理删除对象存储中的成品和衍生图。
3. worker 增加领取锁和重试。
4. `/api/uploads/sign` 如未使用就关停，如使用就补限流。
5. 对保存/分享使用的轻量图继续保留，避免 2K/原图拖慢 App。

### 8.2 AI 算命

当前合格项：

- 体验次数默认限制为 1 次。
- 算命结果页有“仅供娱乐参考”的定位。
- 算命生成固定 3:4、2K，服务端会校验。
- 和写真一样有任务锁、限流和公开图 token。

优先优化：

1. 掌纹/面相输入图属于更敏感的个人图片，临时图清理必须确认在真实线上 Provider 下生效。
2. 分享页也建议补一句“娱乐体验，非专业建议”，避免传播场景里弱化免责声明。
3. 删除记录后同步删除成品图和输入图。
4. worker 失败原因不要把外部服务原始错误完整展示给用户，可后台保留、前台简化。

### 8.3 高考志愿填报

当前合格项：

- 所有核心接口要求登录。
- 聊天、推荐、报告接口有限流。
- 正常用户报告生成最多 2 次。
- 报告内容明确不承诺录取。
- 推荐结果来自数据库，聊天阶段不直接编造学校名单。
- 分享页和分享卡片都有 token。

优先优化：

1. 分享卡片包含姓名、分数、位次，建议在分享按钮前提示用户“卡片会展示这些信息”。
2. 外部顾问引擎配置和健康状态要可见，避免静默 fallback 造成验收误判。
3. 数据状态建议展示更具体：导入年份、分段表数量、招生计划数量、最后导入时间。
4. 报告生成建议记录 `data_version` 或 `source_snapshot`，方便后续解释“当时基于哪版数据生成”。
5. 对高考报告的分享访问保留 token，但删除报告后必须确保卡片接口也返回 404。

## 9. 推荐执行顺序

### 第 1 阶段：安全收口，不改用户体验

目标：不动页面流程，只把风险口子堵住。

任务：

1. 生产 App 身份强校验。
2. 删除记录后的对象清理。
3. 临时图片清理适配 Aliyun OSS / local。
4. `/api/uploads/sign` 关闭或补限流。
5. 补对应测试。

验证：

```bash
npm run typecheck
npm run lint
npm test
```

手工验收：

- `/ai/photo` 正常上传、生成、查看、分享、删除。
- `/ai/fortune` 正常上传、生成、查看、分享、删除。
- `/ai/gaokao` 正常聊天、推荐、生成报告、分享、删除。

### 第 2 阶段：稳定性增强

目标：减少任务误失败和重复处理。

任务：

1. worker 使用 `lock_until` 领取任务。
2. 增加 retry 分级。
3. 增加 worker 运行日志和告警。
4. 增加 rate limit 过期数据清理定时任务。

验证：

- 模拟并发 worker。
- 模拟外部 API 短暂失败。
- 模拟存储上传失败后重试成功。

### 第 3 阶段：运维和可维护性

目标：让后续交接少靠记忆。

任务：

1. 增加生产环境体检脚本。
2. `.env.example` 补齐 `GAOKAO_ADVISOR_*`。
3. 增加关键指标输出。
4. 写真和算命只在必要时抽公共 helper，不做大框架。

验证：

- 新人按文档能判断环境是否可上线。
- 出问题时能快速定位到登录、AI 服务、存储、worker 或数据问题。

## 10. 不建议做的事

1. 不建议直接 `npm audit fix --force`，会破坏 Next 版本。
2. 不建议大重构写真/算命任务系统，当前重复代码还没有严重到必须抽框架。
3. 不建议为了“安全”把分享页全部改成强登录，这会破坏现有裂变分享。
4. 不建议把高考推荐改成完全由 LLM 生成学校名单，当前数据库约束更安全。
5. 不建议删除已有额度、任务、分享逻辑后重写；风险太高，收益不够。

## 11. 最小验收清单

上线前建议至少确认：

- 生产环境 `NEXT_PUBLIC_ENABLE_MOCKS=false`。
- 生产环境 `APP_SESSION_SECRET` 是强随机值。
- 生产环境 `APP_AUTH_VERIFY_URL` 已配置，且只传 `uid` 不能登录。
- 生产环境 `ADMIN_SESSION_PASSWORD` 不是默认值。
- 图片存储 Provider 和清理 worker 对齐。
- `worker:poll` 和 `worker:cleanup` 已配置定时运行。
- `.next/static public` 不含服务端密钥。
- `npm run typecheck` 通过。
- `npm run lint` 通过。
- `npm test` 通过。
- `/ai/photo`、`/ai/fortune`、`/ai/gaokao` 三条主链路手工验证通过。

## 12. 本次审查结论一句话

这个项目当前不是推倒重来的状态，主体代码可维护、测试也过了；真正需要优先做的是把生产身份校验、图片真实删除/清理、worker 领取重试、旧上传签名入口这几个风险点收口。按这个顺序优化，能最大限度不影响已经实现的功能。
