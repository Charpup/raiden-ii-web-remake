# Handoff: galatealearningfor.fun 网页端游戏部署环境说明

- **Prepared for**: 外部 vibe coding 工具开发团队
- **Prepared by**: Galatea
- **Snapshot time (CST)**: 2026-04-09 16:42~16:50
- **Target**: 在当前站点架构下，新增一个可稳定上线的网页端游戏

---

## 1) 站点当前架构（Production）

### 1.1 域名与入口
- 主域名: `https://galatealearningfor.fun/`
- WWW 别名: `https://www.galatealearningfor.fun/`
- 当前均返回 `200`，由同一 Nginx 站点承载

### 1.2 反向代理 / 静态托管拓扑
- Web 服务: **Nginx 1.26.3**
- 80/443 监听: `0.0.0.0` + `::`（IPv4/IPv6）
- TLS: Let’s Encrypt（证书 CN=`galatealearningfor.fun`，到期 2026-06-21）

Nginx 关键路由（来自 `/etc/nginx/conf.d/galatealearningfor.fun.conf`）：

1. `location /`  
   - 静态根目录：`/var/www/galatealearningfor.fun`
   - `try_files $uri $uri/ =404`

2. `location /learning-graph/`  
   - `alias /srv/galatea-learning-graph/current/`
   - 当前 `current` 为 symlink 指向 release 目录

3. `location /clawlibrary/`  
   - 反向代理到 `http://127.0.0.1:4173`
   - 已配置 Upgrade/Connection 头，支持 websocket/长连接场景

### 1.3 站点安全头（全站）
当前已开启：
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy`（允许 `script-src 'self' 'unsafe-inline' https:`）

> 对游戏开发的影响：
> - 第三方脚本/CDN可用（`https:`），但建议尽量自托管核心资源以控延迟与稳定性。
> - 若需新增外域 API / 域名白名单，需同步评估 CSP 与 CORS。

---

## 2) 当前内容与技术栈现状

### 2.1 Root Shell（主页）
- 路径：`/var/www/galatealearningfor.fun`
- 现状：偏**静态站点**（`index.html` + `app.js` + `styles.css`）
- 前端实现：原生 JS + i18n 文本组织（非重型框架）

### 2.2 子路径并存模型（Subpath-first）
当前站点通过多个独立子路径承载不同项目（如 `/github-hot/`, `/ios-game-charts/`, `/wechat-mini-game/`, `/publishing-ops-demo/`）。

> 这意味着：新游戏最稳妥方式也是**新增独立子路径**，不要直接侵入 root shell。

### 2.3 动态应用参考：`/clawlibrary/`
- 应用由 Podman 容器提供，映射端口 `4173`
- 对外仅通过 Nginx 子路径代理暴露
- 容器状态：`Up 16 hours`（采样时）

> 可作为“网页游戏后端/热更新控制台”型项目的部署模板。

---

## 3) 主机硬件与资源快照（部署预估核心）

采样主机：`VM-0-15-opencloudos`（Tencent Cloud CVM）

### 3.1 CPU
- 架构: x86_64
- vCPU: **4**
- 型号: Intel Xeon E5-26xx v4（虚拟化 KVM）

### 3.2 内存
- 物理内存: **7.5 GiB**
- 采样时使用: 3.5 GiB used / 1.0 GiB free / 4.0 GiB available
- Swap: 8.0 GiB（已用约 4.8 GiB）

### 3.3 磁盘
- 系统盘: 120G
- 使用率: 60%（72G used / 49G avail）

### 3.4 负载快照（瞬时）
- `uptime` load average: **5.87 / 5.58 / 4.93**
- 该值对 4 vCPU 而言偏高
- 但从进程看，负载主要由本机其他 Python/OpenClaw 任务拉高，并非仅网站流量导致

---

## 4) 线上请求与性能样本（用于游戏预算）

### 4.1 可达性（采样）
- `/` -> 200
- `/learning-graph/` -> 200
- `/clawlibrary/` -> 200
- `/github-hot/` -> 200
- `/wechat-mini-game/` -> 200

### 4.2 首字节/总耗时样本（curl）
- `/` -> TTFB ~0.31s
- `/learning-graph/` -> TTFB ~0.43s
- `/clawlibrary/` -> TTFB ~0.05s
- `/github-hot/` -> TTFB ~0.29s
- `/wechat-mini-game/` -> TTFB ~0.04s

### 4.3 访问结构（最近 2000 行采样）
- 请求热点主要是 `/clawlibrary/api/openclaw/*` 的轮询类请求
- 根路径 `/` 请求量明显低于 ClawLibrary API 路径
- 存在常见扫描流量（如 `/.env`, `/.git/config`, `/wp-admin` 等）

> 结论：当前站点有一定自动化/控制台型请求噪音，游戏应避免高频无意义轮询，尽量前端本地计算 + 稀疏上报。

---

## 5) 对“网页端游戏”的部署建议（可直接给外部开发方）

## 方案 A（推荐，低运维成本）
**纯前端静态游戏 + 子路径发布**

- 目标路径建议：`/game/` 或 `/games/<slug>/`
- 产物：静态构建文件（HTML/CSS/JS/资源）
- 部署：复制到 `/var/www/galatealearningfor.fun/game/`
- Nginx：仅需补一段子路径 location（或复用现有 root + 目录映射）

适用：单机逻辑、排行榜可延后、先快速上线验证玩法

## 方案 B（有在线状态/存档需求）
**游戏前端静态 + 本地容器服务（Node）+ Nginx 反代**

- 前端：`/game/`
- 后端：本机容器监听如 `127.0.0.1:4180`
- Nginx：`location /game-api/ { proxy_pass http://127.0.0.1:4180; ... }`
- 数据：可先文件/SQLite，再平滑升级

适用：需要账号、存档、排行榜、多人房间预埋接口

---

## 6) 性能与资源预算（建议基线）

为保证“同机多业务并存 + 游戏体验稳定”，建议把单游戏页面预算控制在：

- 首屏 JS（gzip 后）: **<= 600KB**（理想 <= 400KB）
- 首屏图片/图集: **<= 2MB**
- 首屏可交互时间（4G 网络）: **<= 3s**
- 持续 CPU 占用（单活跃玩家）: 尽量低于 **1 个 vCPU 的 20%**
- 内存占用（单 tab）: 控制在 **150~300MB** 范围内

实践建议：
- 贴图使用 WebP/AVIF；大图集切片
- 开启资源长缓存（hash 文件名）
- 动画帧率动态降级（后台 tab / 低性能设备）
- 减少高频日志与轮询

---

## 7) 上线前验收清单（交付方必须自检）

1. **路由与资源**
   - `https://galatealearningfor.fun/game/` 200
   - 所有静态资源 200，无 404/403

2. **兼容性**
   - Chrome/Edge 最新版 + 移动端浏览器基本可玩
   - 页面缩放、横竖屏策略明确

3. **性能**
   - 首屏与首次可玩时间达标
   - 长玩 10 分钟无明显内存泄漏

4. **安全**
   - 无明文密钥写入前端
   - API token 不暴露到客户端源码

5. **回滚**
   - 保留上一个版本目录
   - 一条命令可回滚静态目录（或切换 symlink）

---

## 8) 本次 handoff 的可验证证据点

- 主配置：`/etc/nginx/conf.d/galatealearningfor.fun.conf`
- 主站根目录：`/var/www/galatealearningfor.fun`
- 学习图谱目录：`/srv/galatea-learning-graph/current`
- ClawLibrary 容器端口：`0.0.0.0:4173`（Podman）
- 证书签发者：Let’s Encrypt E8

---

## 9) 给外部 vibe coding 工具的一句话接口约束

**请按“独立子路径 + 静态优先 + 可回滚部署”生成游戏工程；若需要服务端，再走本机容器 + Nginx 子路径反代，不要改动现有根站结构。**

---

（End of handoff）
