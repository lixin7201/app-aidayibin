# 高考志愿助手最后一轮优化与上线验收方案

日期：2026-06-28  
范围：`/ai/gaokao` 高考志愿助手、AI 顾问回复、冲稳保报告、微信分享卡片、部署包与上线验收  
目标：这是上线前最后一轮集中修整，优先解决“能不能看懂、能不能分享、能不能稳定上线”。

## 一、当前检查结论

### 1. AI 顾问回复排版

现状：

- 本地复现到顾问回复直接出现 `- **城市偏好**`、`---`、`**第一段**` 等 Markdown 符号。
- 聊天气泡当前按普通文本渲染，换行和段落没有被产品化处理。
- 报告生成里已有 `cleanLegacyMarkdown` 这类清理思路，但聊天回复没有统一清理。

影响：

- 用户会感觉“AI 味”和“代码味”明显。
- 长段内容在手机上阅读压力大，尤其顾问确认区空间较小。

必须优化：

- 在 `/api/gaokao/chat` 返回前统一清理 Markdown：去掉 `###`、`**`、`---`、表格线、项目符号残留。
- 前端聊天气泡使用段落化渲染：保留自然换行，连续空行拆成段落，长词/长句自动换行。
- LLM 提示词补一条硬约束：回复纯中文短段落，不使用 Markdown 标题、加粗、分隔线、表格。

建议实现：

- 最小改动：在 `continueGaokaoChat` 最后统一调用一个 `cleanGaokaoChatText()`，覆盖外部顾问引擎和本地 LLM 两条路径。
- 前端只增加一个很小的 `ChatMessageBubble` 渲染函数，不引入 Markdown 依赖。
- 增加一个单测：输入含 `###`、`**`、`---` 的回复，输出不含这些符号，并保留段落。

验收标准：

- 顾问回复中不直接出现 `**`、`###`、`---`。
- 一段超过 20 字的回复在手机宽度下不会横向溢出。
- 聊天气泡至少保留自然段落，读起来像客服顾问，而不是模型原始输出。

## 二、顾问确认是否影响后续大学和专业推荐

结论：

- 必须影响。顾问确认阶段聊出来的偏好和限制条件，要写入考生画像，并影响后面的大学和专业推荐。
- 推荐接口 `/api/gaokao/recommend` 读取结构化 `profile`，再进入 `buildGaokaoRecommendations()`；所以顾问阶段要做的事，就是把聊天结论沉淀到 `profile`。
- 例如用户说“成都重庆优先、不读民办、想读计算机”，后续推荐必须优先考虑成都/重庆和计算机方向，并过滤或降低民办候选。
- AI 顾问的自然语言回复要好看、好懂；真正参与推荐的是它同步写入的结构化字段，而不是把整段聊天文本直接丢给推荐算法。

当前实际链路：

- `/api/gaokao/chat` -> `continueGaokaoChat()`
- `mergeGaokaoProfile()` 从用户消息里提取偏好
- `callGaokaoAdvisorEngine()` 可能返回 `profilePatch`
- `/api/gaokao/recommend` -> `getGaokaoRecommendations()` -> `buildGaokaoRecommendations()`

风险点：

- 如果外部顾问引擎返回的 `profilePatch` 覆盖了分数、位次、科类，就会影响推荐结果。
- 目前 `applyAdvisorResult()` 对 `profilePatch` 的接收范围偏宽。

必须优化：

- 顾问确认必须影响推荐结果。用户在顾问区补充的城市、专业、就业方向、民办/中外、调剂、风险偏好、预算限制，不能只停留在聊天记录里，必须写入结构化 `profile`，并作为后续大学和专业推荐的计算条件。
- 顾问确认必须回写这些会影响推荐的字段：`preferredMajors`、`rejectedMajors`、`preferredCities`、`rejectedCities`、`riskPreference`、`tuitionLimit`、`acceptPrivate`、`acceptSinoForeign`、`acceptAdjustment`、`notes`。
- 用户在顾问区明确更正分数、位次、科目时，也要允许通过本地解析更新硬事实。
- 但不能让顾问大模型凭空覆盖硬事实：姓名、首选科目、再选科目、科类、分数、位次、批次。硬事实只能来自用户明确填写或明确更正。
- 页面上要让用户看见“顾问已确认的偏好”，避免用户不知道聊天内容已经影响推荐。

验收标准：

- 顾问回复再智能，也不能把 `550 分` 改成其它分数。
- 用户补充“成都重庆优先、不读民办、计算机方向”后，新生成报告里的候选排序和过滤必须体现这些偏好。
- 用户补充“想读计算机、不考虑民办、成都重庆优先”后，报告里的专业建议、院校排序和风险解释都要能看出这些偏好已经生效。
- 用户在顾问区明确说“刚才分数填错了，是 520 分”，后续推荐应按 520 分重新计算。
- 用户只问咨询问题时，不会误改科目、分数、位次。

## 三、冲一冲 / 稳一稳 / 保一保数量与排版

现状：

- 真实报告检查结果：当前每档 12 条，共 36 条。
- 手机分享页截图高度超过 10000px，信息量明显过重。
- 报告策略文案显示“本轮筛到 36 条候选：冲 12 条、稳 12 条、保 12 条”。

政策参考：

- 四川 2026 普通高校招生采用院校专业组方式设置志愿，平行志愿批次最多可填 45 个院校专业组志愿，每个院校专业组内设置 6 个专业志愿和是否服从调剂选项。参考四川省教育考试院与阳光高考公开说明。

判断：

- 36 条候选作为后台候选池不算离谱，但作为用户第一份 AI 初筛报告偏多。
- 初筛报告应先给“高信号候选”，不是直接替用户列满志愿表。
- 稳档应是主阵地，冲档和保底要控制数量，避免用户误以为每档平均重要。

必须优化：

- 推荐结果保存数量调整为 18 条左右：冲 5、稳 8、保 5。
- 如果数据不足，按实际结果展示，不硬凑。
- 报告页面冲一冲、稳一稳、保一保三个栏目默认收起，各自独立提供“展开/收起”。
- 用户展开某一栏并下滑到栏目底部时，底部提示“看完本栏，是否收起”，用户点“收起本栏”后只收起当前栏目。
- 分享卡片只展示每档 1 条代表候选，避免长文字挤爆。

排版优化：

- 每个冲稳保栏目标题右侧都有明确的“展开/收起”按钮，按钮状态跟当前栏目一致。
- 报告页的学校卡片增加“核心信息第一行”：学校、风险标签、位次差。
- 专业建议默认最多展示 2 个，更多放入展开。
- 长专业组名使用两行截断，不把 `专业组103` 断成 `10 / 3`。

验收标准：

- 新报告默认不再出现 36 条候选。
- 手机首屏能看到报告结论和至少一个候选入口。
- 任一学校/专业组名称不出现生硬断字。
- 展开/收起不会造成页面跳动明显。

## 四、微信分享卡片与行书书法风格

现状：

- 分享按钮已存在，会调用 `shareImage()`，传入 `sharePageUrl` 和 `shareImageUrl`。
- 分享页接口和卡片图接口在正确域名下可打开：
  - 分享页：`200 text/html`
  - 卡片图：`200 image/jpeg`，尺寸 `900x1200`
- 但当前本地 `.env.local` 的 `NEXT_PUBLIC_APP_URL` 是 `http://localhost:3000`，本地服务跑在 `3001`，导致本地生成分享链接指错端口。
- 分享页底部“我也想测一份”链接当前会变成 `/ai/ai/gaokao`，说明 share 页面里 `Link + appPath()` 双重 basePath。
- 分享页控制台出现：
  - `/ai/brand/dayibin-icon.png` 404
  - 公开分享页触发 `/ai/api/auth/check` 401
- 卡片生成里 logo 使用了本机绝对路径：`/Users/lixin/Documents/大宜宾/图片相关/大宜宾图标_副本.png`，上线不可依赖。

必须优化：

- 修复分享 URL 配置：本地测试用 `http://localhost:3001`，线上用 `http://ces.dayibin.cn/ai` 或实际公网入口，不能混用。
- 修复分享页 CTA 链接：公开页内部跳转不要再生成 `/ai/ai/...`。
- 公开分享页跳过 App 登录探测，避免微信打开时出现无意义 401。
- 补齐 `public/brand/dayibin-icon.png`，并让卡片接口使用项目内资源，不用本机绝对路径。
- 分享卡片视觉改为“行书书法风”：
  - 标题使用行书/毛笔字风格字体。
  - 卡片背景使用宣纸浅米色、淡墨山水/印章点缀。
  - 主标题建议：“李鑫的志愿初筛笺”。
  - 三档使用竖向短签：`冲`、`稳`、`保`，不再用拥挤长条。
  - 学校和专业组分两行显示，专业组长文本自动截断。
  - 底部保留免责声明：“初筛参考，正式填报以官方为准”。

字体建议：

- 优先自托管开源中文书法字体，避免服务器缺字体导致 Sharp 生成图回退成普通黑体。
- 可选字体：
  - `Liu Jian Mao Cao`：草书/手写风，Google Fonts 页面说明其基于书法家刘正江作品；GitHub 显示 SIL Open Font License 1.1。
  - `Ma Shan Zheng`：厚重手写标题风，Google Fonts / Adobe Fonts 均标记为开源可用。
- 最终建议：卡片标题使用 `Liu Jian Mao Cao`，正文仍用系统黑体/宋体，保证可读性。

验收标准：

- 微信分享出去是卡片图，不是空白链接。
- 卡片图公网 URL 无需登录 cookie 即可访问。
- 卡片标题有明显行书/书法风，但学校名、位次、分数仍清楚。
- 卡片里不出现“专业组10 / 3”这种断行。
- 本地、服务器各生成一张真实报告分享卡，人工确认微信可打开。

## 五、为什么这次包从一百多 MB 变成三百多 MB

本地实测：

- 当前压缩包：约 319MB。
- `data/gaokao`：约 273MB。
  - `admission_clean.db`：约 143MB。
  - `sichuan-2026-major-plans.ndjson`：约 96MB。
  - `admission_clean.db.gz`：约 28MB。
- `public/templates`：约 142MB。
- `.next`：约 196MB，其中 `.next/dev` 约 174MB。

原因判断：

- 不是这几行 UI 代码导致包变大。
- 主要是把高考原始/中间数据、写真模板大图、Next dev 构建目录一起打进包了。
- `.next/dev` 不该进生产包，这是本轮打包规则的明确问题。

必须优化：

- 上线包分为两类：
  - 代码包：包含生产运行必须文件和 `.next` 生产构建，不含 `.next/dev`、历史压缩包、测试输出。
  - 数据包或 `with-data` 包：包含本轮高考推荐必需的数据文件、导入脚本和 Prisma schema。
- 高考推荐需要的数据文件不能为了压缩体积删除或漏传；如果不放进代码包，也必须作为数据包同步上传，并在部署命令里执行对应导入。
- 如果服务器数据库已完成导入，可以不重复导入，但仍要确认服务器已有对应版本的数据；不能只因为包体大就跳过必要数据。
- `public/templates` 若服务器已有且本轮没变，不跟随高考功能包重复上传。

打包验收：

- 包内不得出现 `.env.local`、`.env`。
- 包内不得出现 `.next/dev/`。
- 包内不得出现 `dist/`、`output/`、`outputs/`。
- 高考代码包目标大小回到合理区间；如必须携带数据，必须在包名中标明 `with-data`，包体变大属于可接受成本。

## 六、安全性与性能检查

已检查：

- 本地关键接口响应：
  - `/ai/gaokao`：`200`，约 `0.125s`
  - 分享页：`200`，约 `0.020s`
  - 分享卡片图：`200`，约 `0.170s`
- 分享 token 使用 HMAC，并校验 kind + id。
- 高考聊天接口有限流：每用户每分钟 12 次。
- 推荐生成接口有限流：每用户每分钟 6 次。
- `npm audit --omit=dev --audit-level=high` 未发现 high/critical，但提示 Next 内部 PostCSS moderate 漏洞；`npm audit fix --force` 会降级/破坏 Next，不应直接执行。

上线前必须补查：

- 服务器 `.env.local`：
  - `NEXT_PUBLIC_APP_URL` 必须是公网入口。
  - `APP_SESSION_SECRET` 必须稳定，不能发版后变，否则旧分享 token 会失效。
  - `GAOKAO_LLM_API_KEY` 不进压缩包。
- 公开分享页不应依赖登录态。
- 分享卡片接口必须有 token，无 token 返回 404。
- DeepSeek 失败时必须回退本地报告，不影响用户生成。

性能优化：

- 推荐保存条数从 36 降到 18，可明显降低报告页 DOM、分享页 HTML 和卡片排版压力。
- 卡片图只取每档代表 1 条，Sharp 生成更稳定。
- 公开分享页避免加载 App 登录轮询，减少 401 请求和微信内打开噪音。

## 七、最后一轮实施顺序

### 第 1 步：修顾问回复排版

修改范围：

- `src/features/gaokao/gaokao-service.ts`
- `src/features/gaokao/gaokao-llm.ts`
- `src/features/gaokao/gaokao-app.tsx`
- `tests/gaokao-chat-service.test.ts` 或新增轻量文本清理测试

验收：

- 顾问回复不显示 Markdown 符号。
- 长回复自动换行。
- 测试覆盖 Markdown 清理。

### 第 2 步：限制顾问回写字段

修改范围：

- `src/features/gaokao/gaokao-service.ts`
- `tests/gaokao-chat-service.test.ts`

验收：

- 顾问引擎不能覆盖分数、位次、科类。
- 偏好字段仍可影响后续推荐。

### 第 3 步：调整推荐数量和报告折叠

修改范围：

- `src/features/gaokao/gaokao-repository.ts`
- `src/features/gaokao/gaokao-report.ts`
- `src/features/gaokao/gaokao-report-view.tsx`
- `tests/gaokao-recommendations.test.ts`

验收：

- 新报告默认约 18 条候选。
- 每档默认展示前 3 条，可展开。
- 策略说明显示新数量。

### 第 4 步：重做行书书法分享卡片

修改范围：

- `src/app/api/gaokao/reports/[id]/card/route.ts`
- `public/brand/dayibin-icon.png`
- `public/fonts/` 或 `src/assets/fonts/`
- 可新增一个卡片生成测试或快照尺寸测试

验收：

- 卡片图 900x1200 或 1080x1440，微信预览清楚。
- 标题为行书书法风。
- 正文可读，不乱断行。
- 无本机绝对路径依赖。

### 第 5 步：修分享页公开访问

修改范围：

- `src/app/share/gaokao/[id]/page.tsx`
- `src/app/share/photo/[id]/page.tsx`
- `src/app/share/fortune/[id]/page.tsx`
- `src/features/auth/app-token-login.tsx`

验收：

- 分享页 CTA 不再出现 `/ai/ai/...`。
- 分享页无 `/api/auth/check` 401 噪音。
- 无 token 的分享页和卡片图仍返回 404。

### 第 6 步：重新打干净部署包

修改范围：

- 不一定改代码，可用打包命令完成。

验收：

- 包内无 `.next/dev`。
- 包内无 `.env.local`。
- 包体回到合理范围。
- 重新跑 `typecheck`、`lint`、`test`、`build`。

## 八、上线前验收清单

本地必须通过：

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `rm -rf .next && npm run build`
- `PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production npm run start`
- `/ai/gaokao` 页面登录测试号可用
- 顾问回复无 Markdown 残留
- 新报告候选数量合理
- 分享页 200
- 分享卡片图 200 且视觉通过
- 无 token 分享页 404
- 包内无 `.env.local` 和 `.next/dev`

服务器必须通过：

- `/ai/photo` 200
- `/ai/fortune` 200
- `/ai/gaokao` 200
- 真实 App 内打开高考页可登录
- 离心之巅测试号可无限重新填写和生成
- 微信分享能打开公开分享页
- 微信分享卡片图是行书书法风卡片
- PM2 日志无启动错误、无缺模块错误、无 Prisma 错误

## 九、参考资料

- 四川省教育考试院：《关于做好我省2026年普通高校招生工作的通知》：https://www.sceea.cn/Html/202604/Newsdetail_4767.html
- 阳光高考：《四川省2026年普通高校招生实施规定》：https://gaokao.chsi.com.cn/gkxx/zc/ss/202604/20260424/2293468665-9.html
- 四川省2026年高考志愿填报辅助系统：https://zyfz.sceeic.cn/
- Google Fonts：Liu Jian Mao Cao：https://fonts.google.com/specimen/Liu+Jian+Mao+Cao
- Google Fonts：Ma Shan Zheng：https://fonts.google.com/specimen/Ma+Shan+Zheng
- googlefonts/liujianmaocao 许可证说明：https://github.com/googlefonts/liujianmaocao

## 十、建议的最终交付口径

这一轮不再扩大功能，不做完整志愿表编辑器，不做复杂概率模型，只做上线必须的收口：

- 顾问回复像人话。
- 推荐数量别吓人。
- 报告手机上读得动。
- 微信分享卡片好看且能打开。
- 包体和部署过程干净。
- 上线前把本地、服务器、微信三条路径都验完。
