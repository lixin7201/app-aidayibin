# 高考助手当前版本重新对齐优化方案

更新时间：2026-06-28

本方案基于当前本地版本、原需求文档、截图反馈和最新补充重新整理。目标不是推翻重做，而是在现有 UI 基础上把产品方向拉回原需求：用户先快速填写关键考生信息，再由顾问确认偏好，最后生成一份能打开、能看完整分析、能分享冲稳保卡片的志愿初筛报告。

本方案同时合并以下口径：后续本地测试使用带 `app_user_id`、`nickname`、`avatar_url` 的测试链接；科目选择要更短更简单；顾问确认要真实接入外部志愿顾问项目能力且不在项目里出现外部实名；考生信息填完后可收起，顾问聊天区变大；报告必须能打开完整分析，分享只分享冲稳保卡片；当前整体 UI 已基本满意，不能再整体大改。

## 1. 当前判断

当前整体 UI 风格已经基本可接受：顶部视觉、右上角头像、功能卡片和页面专业感不再大改。

但当前体验仍偏离需求：

- 科目选择太长，12 个组合下拉不适合手机端。
- 顾问确认回复太短，像简单追问，不像真正的志愿顾问分析。
- 顾问聊天结果没有足够明确地进入最终报告参考。
- 考生信息填完后还占着主要空间，顾问聊天区域不够大。
- 生成报告后用户没有明确入口打开完整报告。
- 分享应该分享冲稳保推荐卡片，而不是让用户摸不清报告在哪里。

## 2. 产品流程

最终流程保持三步：

1. 用户填写考生信息。
2. 顾问确认偏好和风险点。
3. 生成并查看完整报告，分享时分享冲稳保摘要卡片。

页面顺序建议：

```text
顶部平台栏和头像
高考填报 AI 助手 hero
考生信息卡片
AI 初筛 / 院校推荐 / 生成报告功能卡
顾问确认聊天
数据状态
报告记录
完整报告视图
```

说明：布局结构可以保持当前版本，不再重做大视觉；只修内部交互和状态。

## 3. 科目选择

### 3.1 当前问题

当前“科目”是一个包含 12 个组合的下拉框，例如“物理 + 化学 + 生物”。这个方案看似一次选择，但手机端列表太长，用户找选项很费劲。

### 3.2 新方案

保持在“考生信息”卡片里，不拆成复杂模块。用户端仍只看到一个简单的“科目”选择入口；点开或展开后，用图 1 那种紧凑选项完成选择，不把页面重新拆成两个很重的“首选科目 / 再选科目”大栏。

展开内容为：

- `首选`：单选 `物理` / `历史`。
- `选考`：复选 `化学` / `生物` / `思想政治` / `地理`。
- 选考最多 2 门。
- 选择完成后在顾问确认摘要里显示为 `物理 + 化学 + 生物`。

这符合截图里的简单选择方式，也比 12 项组合下拉更短。实现时可以用原生按钮/复选框做弹出选择面板，不新增复杂选择器依赖。

### 3.3 实施文件

- `src/features/gaokao/gaokao-app.tsx`

### 3.4 实施要点

- 删除当前页面里的 `subjectOptions` 组合数组。
- 保留已有数据结构：`firstChoiceSubject`、`optionalSubjects`、`subjectType`。
- 表单显示上只保留一个“科目”控件入口，内部选择首选和选考。
- 新增页面内小函数：
  - `setFirstChoiceSubject(subject)`
  - `toggleOptionalSubject(subject)`
  - `formatSubjectSelection(profile)`
- 不改数据库，不改接口 schema。

## 4. 考生信息卡片收起

### 4.1 当前问题

用户填完姓名、科目、分数、位次后，考生信息卡片仍占较大空间。后面真正需要沟通的是顾问确认，但聊天区域太小。

### 4.2 新交互

当必填项齐全后：

- 考生信息卡片自动变成紧凑摘要态。
- 摘要展示：姓名、科目组合、分数、位次。
- 右侧或底部提供 `修改`。
- 点 `修改` 后展开完整表单。

顾问确认区域随之变大：

- 聊天记录至少显示最近 5-8 条。
- 不再只显示最后 2 条。
- 文本区和发送按钮保持当前风格，不重做 UI。

### 4.3 实施文件

- `src/features/gaokao/gaokao-app.tsx`

### 4.4 最小实现

在 `GaokaoAssistantApp` 内增加：

```ts
const [isProfileExpanded, setIsProfileExpanded] = useState(false);
```

规则：

- 必填未齐：强制展开。
- 必填已齐：默认收起。
- 用户点修改：展开。
- 用户改完仍齐：可再次收起。

## 5. 顾问确认接入真实外部项目能力

### 5.1 当前事实

当前代码没有真正调用外部志愿顾问项目，只是本项目自己的 LLM 追问和解释。

已确认远端仓库存在，HEAD 为：

```text
9fbf7e79895b92b23d8e1c04c57d02a5938bdb8d
```

但本机当前找到的本地目录是空的，还没有可直接运行的项目代码或服务入口。后续需要等授权代码、API 文档或可运行服务补齐后再接。

### 5.2 接入原则

可以真实调用外部项目能力，但本项目里不出现外部作者或项目实名：

- 页面仍叫 `顾问确认`。
- 代码命名使用中性名字，例如 `gaokaoAdvisorEngine`、`externalAdvisor`、`advisorEngine`。
- 环境变量使用 `GAOKAO_ADVISOR_*`。
- 服务端日志只写 `advisor engine`。
- 产品文案、源码文件名、函数名、接口路径、错误提示都不出现外部实名。

### 5.3 最小技术方案

新增薄适配层：

- `src/features/gaokao/gaokao-advisor-engine.ts`

职责：

- 把内部 `GaokaoProfile` 转成外部项目入参。
- 调用外部项目 HTTP API 或本地服务。
- 把外部结果转回内部结构。
- 调用失败时返回 `null`，走现有 LLM fallback。

建议返回：

```ts
type GaokaoAdvisorResult = {
  reply: string;
  profilePatch: Partial<GaokaoProfile>;
  advisorNotes: string[];
};
```

环境变量建议：

```text
GAOKAO_ADVISOR_BASE_URL=
GAOKAO_ADVISOR_API_KEY=
GAOKAO_ADVISOR_TIMEOUT_MS=15000
```

### 5.4 调用链

当前：

```text
/api/gaokao/chat
  -> continueGaokaoChat
  -> mergeGaokaoProfile
  -> generateGaokaoAssistantReply
```

调整：

```text
/api/gaokao/chat
  -> continueGaokaoChat
  -> mergeGaokaoProfile
  -> callGaokaoAdvisorEngine
  -> 成功：合并 profilePatch，展示 advisor reply
  -> 失败：fallback 到 generateGaokaoAssistantReply
```

### 5.5 回复质量

顾问回复不能再“一句蹦一句”。

每次回复建议：

- 先确认用户刚补充的信息。
- 给 2-4 段具体分析。
- 明确说出专业、城市、民办/中外、调剂、滑档风险中的关键点。
- 最后只问一个关键问题，或提示可以生成报告。

语气可以直白、有一点幽默，但不能粗暴判断，不承诺录取概率，不编造 2026 录取结果。

## 6. 顾问结果进入最终报告

### 6.1 当前问题

如果顾问聊天只是聊天，不进入报告，最终报告就会像没参考用户偏好。

### 6.2 新规则

以下信息必须进入最终报告参考：

- 专业偏好。
- 明确不想读的专业。
- 城市偏好。
- 明确不想去的城市。
- 是否接受民办。
- 是否接受中外合作。
- 是否接受调剂。
- 学费预算。
- 风险偏好。
- 顾问确认过程中形成的关键提醒。

### 6.3 最小实现

第一版不新增数据库字段。

做法：

- `mergeGaokaoProfile` 继续负责基础抽取。
- 外部顾问返回的 `profilePatch` 合并进 `profile`。
- 外部顾问返回的 `advisorNotes` 合并进 `profile.notes` 或报告结构化 `summary`。
- `buildGaokaoReportContent` 读取这些信息，生成“顾问确认参考”段落。

后续如果要审计每轮顾问对话，再新增单独表，不在第一版做。

## 7. 完整报告可查看

### 7.1 当前问题

当前生成报告后只提示“报告已生成，可以查看和分享”，但主页面没有明确打开完整报告的按钮。报告记录里也只有分享和删除。

### 7.2 新交互

- 生成成功后立即展示完整报告。
- 报告记录增加 `查看`。
- 点击 `查看` 后在当前页面展示完整报告。
- 完整报告顶部提供 `返回顾问确认` 或 `收起报告`。
- 测试账号无限生成时，也能打开任意报告，不被 `canGenerate` 影响。

### 7.3 实施文件

- `src/features/gaokao/gaokao-app.tsx`
- `src/features/gaokao/gaokao-report-view.tsx`

### 7.4 最小实现

在 `GaokaoAssistantApp` 内增加：

```ts
const [selectedReport, setSelectedReport] = useState<GaokaoReportListItem | null>(null);
```

生成成功后：

```ts
setSelectedReport(payload.report);
```

报告记录增加：

```tsx
onView(report)
```

这是最小可用方案，不新增详情页路由。

## 8. 报告内容增强

### 8.1 当前问题

当前报告结构有“报告结论、冲稳保、策略说明、风险提醒、下一步”，但分析偏短，不够像完整志愿初筛报告。

### 8.2 新报告结构

完整报告建议包含：

- 报告结论。
- 考生画像。
- 顾问确认参考。
- 冲一冲候选。
- 稳一稳候选。
- 保一保候选。
- 专业和城市取舍。
- 民办/中外/调剂风险。
- 下一步核对清单。
- 官方免责声明。

### 8.3 实施文件

- `src/features/gaokao/gaokao-report.ts`
- `src/features/gaokao/gaokao-report-view.tsx`

### 8.4 边界

- LLM 或外部顾问只负责解释和建议，不负责凭空造学校名单。
- 冲稳保名单仍来自本项目已导入的四川历史投档数据和推荐算法。
- 不说“2026 已有录取结果”。
- 不承诺录取概率。

## 9. 分享卡片

### 9.1 分享目标

点击分享时，只分享冲稳保推荐摘要卡片，不分享长报告截图。

卡片内容：

- 姓名。
- 科类、分数、位次。
- 冲一冲 1-2 个。
- 稳一稳 1-2 个。
- 保一保 1-2 个。
- 大宜宾 AI 标识。
- “结果仅供参考，正式填报以官方为准”。

### 9.2 当前基础

当前已经有服务端卡片接口：

- `src/app/api/gaokao/reports/[id]/card/route.ts`

后续只优化排版和信息密度，不重做整条分享链路。

### 9.3 分享页

分享页仍展示完整报告：

- `src/app/share/gaokao/[id]/page.tsx`

逻辑是：分享出去看到短卡片，点开后看完整报告。

## 10. 本地测试方式

后续本地测试统一使用这个带 App 用户信息的链接：

```text
http://192.168.2.38:3101/ai/gaokao?app_user_id=734275&nickname=%E7%A6%BB%E5%BF%83%E4%B9%8B%E5%B7%85&avatar_url=https%3A%2F%2Fpic.app.dayibin.cn%2Fuser%2F20260228071740front1_0_734275_Frdv1DUkY6fqU7TkcIEfhcg5q8uu.jpg%3Fimageslim%7CimageView2%2F1%2Fw%2F100%2Fh%2F100
```

这个用于本地预览、截图、手机测试。正式 App 登录态另行处理，不和本次产品体验优化混在一起。

## 11. 需要修改的文件

必改：

- `src/features/gaokao/gaokao-app.tsx`
- `src/features/gaokao/gaokao-profile.ts`
- `src/features/gaokao/gaokao-service.ts`
- `src/features/gaokao/gaokao-llm.ts`
- `src/features/gaokao/gaokao-report.ts`
- `src/features/gaokao/gaokao-report-view.tsx`
- `src/app/api/gaokao/chat/route.ts`
- `src/app/api/gaokao/reports/[id]/card/route.ts`

可新增：

- `src/features/gaokao/gaokao-advisor-engine.ts`

测试：

- `tests/gaokao-profile.test.ts`
- 可新增 `tests/gaokao-advisor-engine.test.ts`
- 可新增 `tests/gaokao-report.test.ts`

禁止改：

- AI 写真生成逻辑。
- AI 算命生成逻辑。
- 写真/算命额度统计。
- 现有图片保存分享逻辑。
- 生产环境 `.env` / `.env.local` 文件。
- 生产部署目录结构。

## 12. 验收标准

### 12.1 科目

- 手机上不再出现 12 项长组合下拉。
- 首选物理/历史只能二选一。
- 选考最多 2 门。
- 顾问摘要能正确显示科目组合。
- 生成报告时 `firstChoiceSubject`、`optionalSubjects`、`subjectType` 正确。

### 12.2 表单和聊天

- 必填项未齐时，考生信息展开。
- 必填项齐全后，考生信息可收起为摘要。
- 顾问聊天至少显示最近 5 条。
- 顾问回复不再只有一句短追问。

### 12.3 外部顾问能力

- 配置外部顾问服务时，优先调用外部顾问。
- 未配置或调用失败时，降级到现有 LLM，不阻塞用户。
- 新增代码、页面、日志、环境变量不出现外部实名。
- 顾问返回的偏好能进入最终报告。

### 12.4 报告

- 生成成功后立即看到完整报告。
- 报告记录有 `查看 / 分享 / 删除`。
- 点 `查看` 能打开完整报告。
- 完整报告有顾问确认参考、冲稳保、风险、下一步清单。

### 12.5 分享

- 分享按钮使用报告卡片图。
- 卡片只展示冲稳保摘要。
- 分享页可打开完整报告。

### 12.6 回归

上线前必须通过：

```bash
npm run typecheck
npm run lint
npm test
rm -rf .next && npm run build
```

并验证：

- `/ai/photo` 正常。
- `/ai/fortune` 正常。
- `/ai/gaokao` 正常。

## 13. 推荐执行顺序

1. 改科目控件。
2. 加考生信息收起和顾问聊天显示更多内容。
3. 加报告选中状态和“查看完整报告”入口。
4. 增强报告结构，把顾问确认参考写进报告。
5. 新增外部顾问中性适配层。
6. 优化分享卡片为冲稳保 1-2 条摘要。
7. 本地跑测试和构建。
8. 用本地测试链接截图给用户确认。
9. 用户确认后再打包上传服务器，部署时保留服务器已有环境文件。

## 14. 部署提醒

本方案不是立即部署指令。代码完成并截图确认后，按 `docs/development-red-lines-and-deployment.md` 生成正式部署命令。

部署时必须确认：

- 不删除服务器已有 `.env.local`。
- 包内包含完整 `.next/BUILD_ID`、`.next/server`、`.next/static`。
- 执行 `npm run db:generate`。
- 使用 `PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 restart aidayibin-h5 --update-env` 重启。
- `curl` 验证 `/ai/photo`、`/ai/fortune`，并额外验证 `/ai/gaokao`。
