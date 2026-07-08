# 宜宾打工恋爱精神状态测试需求摘要

来源文档：

- 初版：`/Users/lixin/Documents/大宜宾/测试/AI 测试/测试题/2.md`
- 幽默强化版：`/Users/lixin/Documents/大宜宾/测试/AI 测试/测试题/4.md`

## 目标

在 `app-aidayibin` 内新增独立 H5 模块 `/ai/life-test`，让用户通过 13 道宜宾本地生活题，得到 16 种「宜宾精神状态」结果之一，并生成可保存/分享的结果海报，承接招聘和红娘入口。

## 本次落地范围

- 用户端：`/life-test`、`/life-test/play`、`/life-test/result/[sessionId]`、`/life-test/types`。
- 配置：80+ 题题库、结果、CTA、城市信息在 `src/features/life-test/config` 管理。
- 题流：前 5 题核心筛查，第 6-12 题按用户早期答案进入打工班味、招聘换坑、红娘恋爱、社交电量、江边回血、反骨隐藏、本地浓度等分支，第 13 题为命运暴击题。
- 隐藏机制：连续选择 D 弹出隐藏题库提示；累计 4 次 D 优先进入「宜宾隐藏款」结果。
- 计分：4 个原创维度映射 16 种结果，平分稳定处理；动态题流按用户实际答过的 13 题计分。
- 数据：新增 `life_test_sessions`、`life_test_events`、`life_test_leads`、`life_test_result_assets` Prisma 模型。
- API：session 创建/答题/完成、事件、留资、后台统计/记录/线索、CSV 导出。
- 海报：服务端图片公开海报 `/life-test/poster/[sessionId]`，优先使用 GPT-Image-2 无文字底图，再由程序叠加昵称、结果和分享文案。
- 后台：`/admin/life-test` 基础看板、7 日趋势、结果分布、最近测试、留资列表、测试记录/留资 CSV 导出。

## 暂未做

- GPT-Image-2 预生成 16 张最终正式主视觉仍需在本地文案确认后补齐。
- 后台题库/结果/CTA 可视化编辑。
- 招聘/红娘真实系统深度打通。

这些属于 PRD 后续阶段，不影响当前本地体验和数据闭环。
