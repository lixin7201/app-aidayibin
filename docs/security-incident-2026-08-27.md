# 2026-08-27 生产服务器 Nginx 劫持事件

## 状态

已止血并完成当前原机可执行的应用、入口与访问面加固，未完成可信重建。`ces.dayibin.cn` 的三个 AI 入口已恢复 HTTPS，但服务器曾被取得 root 级权限，在完成系统重装和全部外部凭据轮换前，不能把原机视为完全可信。

## 影响与根因

- 受影响入口：`/ai/photo`、`/ai/fortune`、`/ai/life-test`。
- 直接原因：生产 Nginx 的 `/ai/` 被改成外部恶意反向代理，并存在按 User-Agent、路径和 404 条件分流的隐藏代理规则。
- 不是应用仓库代码或 DNS 解析造成：PM2 中 Next.js 服务一直在线，源站 3001 端口三个入口均返回正常页面；DNS 仍解析到原阿里云服务器。
- 已确认服务器级入侵：发现两个异常账户获得 wheel 和免密 sudo，其中一个是新建交互账户，另一个是被篡改的系统账户；攻击脚本和恶意 Nginx 备份仍留在服务器。
- 最早确认的 root 木马活动在 2026-07-30：`/usr/bin/723e98a6tcp` 连接外部后通过 `fexecve` 启动伪装成内核线程的 memfd 可执行体；最早确认的 Nginx 恶意配置在 2026-08-08。
- 新发现的未清空日志把首次入侵链进一步收敛到 2026-07-30：同一外部来源先访问宝塔安全入口，随后向正常登录接口提交用户名/密码并成功访问 overview、plugin、system、xterm；约 06:34:03 建立 WebSSH，06:45:54 投放 loader，06:45:55 启动 memfd 木马。2026-08-25 同一来源再次通过公网宝塔 WebSSH -> 本机 `root@127.0.0.1:22` -> 注入 Nginx -> 清空审计。
- 已高置信确认攻击者掌握可重复使用的有效宝塔凭据，并经正常登录流程进入 WebSSH；不是“匿名访问 `/webssh` 即 RCE”。同一来源在 08-06、08-08、08-09、08-17、08-25 均重复出现正常登录后进入 WebSSH 的记录。现存证据仍不能证明凭据来自弱口令、复用/撞库、终端窃取还是旧面板的已认证漏洞，但直接 root SSH 作为首次入口已降为不符合现有时间线的次要可能。

## 已执行处置

- 取证备份保存在服务器 `/root/incident-response-20260827-2315/`，归档为 `/root/incident-response-20260827-2315.tgz`；权限限制为 root 可读。
- 用已知正常备份恢复 `ces.dayibin.cn` 的 `/ai/ -> 127.0.0.1:3001` 路由，清除另一个站点中的同批恶意规则，并重新加载 Nginx。
- 隔离已知恶意配置、注入脚本和旧备份到取证目录；在线展开后的 Nginx 配置不再命中已知 IOC。
- 锁定异常账户 `caishenye` 和被篡改的 `systemd-resolve` 密码，改为不可登录或保留系统不可登录 shell，移出 wheel，并移除其 sudoers 免密提权文件。
- SSH 22 端口和现有 `authorized_keys` 保持不变；关闭 SSH 密码认证，root 仅允许公钥登录。
- 宝塔面板曾在应急止血阶段被停止；用户明确安全边界后已立即恢复面板、任务进程与开机自启。25996 保持监听，但 firewalld 仅允许用户当前 `dayibin-server` 来源 IP 访问，不再对全网开放。没有改动 SSH 22、公钥或 Codex 的 `dayibin-server` 入口。
- 已轮换宝塔面板密码并清除 11 个旧会话文件；新密码仅保存在 root-only 事故目录。启用 WebSSH 会话录像/登录记录，WebSSH 功能本身保持可用；请求日志双写目录改为 root-only。
- auditd 在线增加对宝塔程序与配置、系统二进制目录、cron/systemd 持久化目录、shell profile、日志删除/改名/截断和 fileless 执行的持久监控，共 42 条活动规则且 `lost=0`；全程未重启宝塔或业务进程。
- 冻结并留证 memfd 木马后终止进程；将 `/usr/bin/723e98a6tcp`、`/tmp/hy_*`、`menggu_bak_*` 可恢复地隔离到 root 取证目录。当前无 deleted/memfd 可执行进程、同名加载器或已知 C2 连接。
- firewalld 运行时和永久规则均只保留 22、80、443；3306、888、8080、9100、FTP 及被动端口段已从公网收口，本机数据库和 Nginx 反代未停止。
- 启用 auditd，并持久审计账户、sudo、SSH、公钥、cron、systemd 与 Nginx 配置变更；原有 journald/rsyslog 持久日志保持运行。
- 应用补丁升级 Next.js 至 16.2.11、Sharp 至 0.35.3，禁用受影响的 GIF/TIFF/VIPS loader；增加上传魔数/像素校验、头像 SSRF allowlist、对象删除边界、可信代理 IP、life-test 写 capability、公开 DTO 收口和安全响应头。
- 生产环境已禁止裸 `uid` / `app_user_id` 换取会话；只有服务端验签通过的 `app_token` 或微信 OAuth 身份可访问用户数据。当前尚未配置 `APP_AUTH_VERIFY_URL`，因此旧版 App 裸 uid 登录会安全失败，需 App 后端补齐短期 token 验签接口后恢复。
- 删除未使用且无法约束真实上传大小的 `/api/uploads/sign`；所有图片统一重编码，存储扩展名由服务端 MIME 决定；对象 URL 解码后必须保持规范路径，阻断编码目录穿越。
- 使用部署包 `app-aidayibin-deploy-20260828-012748.tar.gz` 在新目录完成低并发 `npm ci --omit=dev` 和 `npm run db:generate`，再原子切换到 `/www/wwwroot/ai`；旧版本保留在 `/www/wwwroot/ai-presecurity-20260828-012748` 供只读回溯。
- 已轮换 `APP_SESSION_SECRET` 与 `ADMIN_SESSION_PASSWORD`，旧 30 天会话、旧管理员会话和 life-test 写令牌全部失效；新管理员密码仅保存在 root-only 取证目录，不写入事故报告。
- 为 `ces.dayibin.cn` 重新签发并安装证书，修正 acme.sh 自动续期 reload 命令；HTTP 除 ACME 校验外强制 301 到 HTTPS，HTTPS 启用 HSTS，且活动 Nginx 不再为该站点加载 PHP handler。

## 验收证据

- 新建纯公钥 SSH 会话通过：`dayibin-server` 返回 `FRESH_KEY_SSH_OK`；22 端口公网开放，密码认证关闭。
- Nginx 配置测试通过；PM2 的 `aidayibin-h5` online，端口 3001。
- 服务器内网和本机公网通过 HTTPS 访问三个 AI 入口均返回 200；HTTP 返回 301 到 HTTPS，证书域名匹配且有效到 2026-11-25，HSTS 已返回。
- 用微信 App/WebView UA 和 BaiduSpider UA 分别访问三个入口，均无重定向。
- 宝塔面板与任务进程 active，PID 分别保持 42584、42623；25996 从用户当前网络可连接，完整 Chrome 请求访问安全入口返回 200；firewalld 仅允许当前来源 IP 访问面板。auditd enabled/active，42 条规则加载且 `lost=0`。
- firewalld 仅开放 22、80、443；3306 和 9100 的现存连接均为本机回环。
- 应用安全回归：27 个测试文件、120 个测试通过；TypeScript、ESLint、Next 16.2.11 生产构建通过。线上裸 uid 交换返回 401，已删除的上传签名路由返回 404。

## 回滚与剩余风险

- 如本次配置误伤，可从取证目录恢复处置前文件；恢复前必须人工确认文件是否含恶意规则。
- root 级入侵后，原机清理无法证明没有未知后门。下一阶段必须从可信镜像重建服务器，只迁移已审计的应用、数据和配置。
- 已轮换宝塔密码、应用会话密钥与应用管理员密码；仍应在各供应商控制台轮换服务器 root、数据库、第三方 API、R2/对象存储、微信及回调凭据，并作废未知 SSH 公钥。外部凭据轮换需要逐项确认业务依赖，不能在仅持有服务器权限时伪造完成。
- 888、3306、8080、9100、8232、28080、3001、3002 的进程仍绑定全部网卡，目前依赖 firewalld 阻断；可信重建时应改绑 `127.0.0.1` 或明确内网地址。
- 2026-08-28 10:26 已把千帆 `wap_token -> qfLogin -> canonical userId` 的 loopback 适配以蓝绿方式部署：候选目录 `/www/wwwroot/ai-release-20260828-094405-auth`、PM2 进程 `aidayibin-h5-auth-candidate`、端口 3013；`APP_AUTH_VERIFY_URL` 仅在候选环境中设置为 `http://127.0.0.1:8080/api/login/qfLogin`，未恢复裸 UID。
- 活动 Nginx `/ai/` 已平滑切到 3013；原 `aidayibin-h5` 及 3001 保持在线作为秒级回滚，宝塔、SSH 和高考服务均未停止。切换前后 photo/fortune/life-test 均为 200，HTTP 为 301，裸 UID 和无效 Token 均为 401，切换后观察窗口无 5xx。
- 真实 App 在 3013 上已连续完成 4 次 token exchange 200，证明 WebView 能读取 Token 且 qfLogin 登录成功；但数据库最新用户头像仍为空。根因是新适配只读取 qfLogin 的 `userId/username`，遗漏了旧 H5 登录后用 qfLogin 返回 Token 调 `/api/ucuser/{canonicalUserId}` 补取权威资料的步骤，并且空头像会覆盖数据库旧值。
- 2026-08-28 10:59 以 `app-aidayibin-deploy-20260828-105442.tar.gz` 启动独立 3014 候选：服务端只用 qfLogin 的 canonical userId 和临时 Token 经 loopback 获取 `avatarValue/headimgurl`，Token 不进入会话、数据库、客户端响应或错误日志；资料失败时不信任客户端头像，且 Prisma 不再用空值覆盖旧头像。全量 28 个测试文件、132 项测试、TypeScript、ESLint、生产构建和对抗复审均通过。
- Nginx 已 graceful reload 到 3014，photo/fortune/life-test 均为 200，裸 UID 与无效 Token 均为 401，3014 未向公网开放；3013 与 3001 均继续在线作为回滚，宝塔、SSH 和高考服务未停止。真实头像恢复仍需用户在 App 重新打开页面触发一次新 exchange 后确认，在该证据出现前不宣称端到端完成。
- 3014 上用户真机再次触发 5 次 exchange 200，头像仍为空。脱敏只读查询确认 qfLogin canonical ID 能命中 Java `dyw_uc_user.id`，但该行的 `avatar` 与 `headimgurl` 源字段本身均为空；原生 App 显示的头像只存在于 QFH5 `face`，因此仅调用 Java `/api/ucuser/{id}` 无法恢复头像。
- 2026-08-28 11:42 使用 `app-aidayibin-deploy-20260828-114030.tar.gz` 启动 3015 候选并平滑切流：browser `wap_token` 与 QFH5 展示资料合并，token 仍唯一决定 canonical 身份；`face` 只有在 qfLogin 验证成功且 origin 命中既有大宜宾图片白名单时才可写入，外域头像、裸 UID 和无效 Token继续拒绝。28 个测试文件、134 项测试、TypeScript、ESLint、生产构建与安全 Agent 复审均通过。
- 3015 的 photo/fortune/life-test 均为 200，公网端口未放行；3001、3013、3014、宝塔、SSH 与高考服务均保持在线。真实头像最终恢复仍需用户重新打开 H5 触发 3015 exchange 后检查数据库 `avatar_url` 非空，在此之前状态保持 `PARTIAL`。
- `npm audit --omit=dev` 的网络可达 Next/Sharp/PostCSS/nanoid 高危项已修；剩余告警位于 Prisma CLI 的 `deepmerge-ts` 配置链，未接受不兼容的强制降级或主版本 override，需随 Prisma 官方兼容更新处理。

## 本次边界

原机已完成止血、应用补丁、会话密钥轮换和 HTTPS 收口，但没有也不能被声明为“彻底可信”。最终完成条件仍是：干净镜像重建、全部可接触凭据轮换、应用改为专用非 root 用户运行、云安全组复核、数据与三条 AI 入口迁移验收。
