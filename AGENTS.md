<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI 接手第一动作

任何新窗口、子代理或后续 AI 接手本项目时，第一步必须读取 Obsidian 项目卡：

```text
/Users/lixin/.openclaw/workspace/knowledge/09-项目开发/项目卡-app-aidayibin.md
```

未读取项目卡前，不要修改代码。读取后先确认 `PRD 与验收标准`、`Evaluator 挑刺标准`、`聊天记录逐条执行清单`、`开发前检索路线` 和最新 `开发记录`。

任何新增功能、修复、部署、数据迁移或配置调整后，必须把本次目标、改动、验证、风险、下一步追加到项目卡的 `开发记录`。如果发现已有未记录改动，先看 `git status` 并向用户确认，不要覆盖。

# Project handoff rules

Before changing or deploying this project, read `docs/development-red-lines-and-deployment.md`.

After every code or package change, explain the Aliyun deployment commands in one complete block for the project owner. Include the exact package path/name, `/www/wwwroot/ai`, `.next` handling, dependency install decision, `npm run db:generate`, PM2 restart command with `PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production`, and `curl` checks for `/ai/photo` and `/ai/fortune`.
