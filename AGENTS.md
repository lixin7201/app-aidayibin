<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project handoff rules

Before changing or deploying this project, read `docs/development-red-lines-and-deployment.md`.

After every code or package change, explain the Aliyun deployment commands in one complete block for the project owner. Include the exact package path/name, `/www/wwwroot/ai`, `.next` handling, dependency install decision, `npm run db:generate`, PM2 restart command with `PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production`, and `curl` checks for `/ai/photo` and `/ai/fortune`.
