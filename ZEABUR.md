# 在 Zeabur 上部署古树博物馆

Render 在国内访问不通，所以改用同样"GitHub 一键绑定"的 Zeabur。Zeabur 国内访问快、免费额度够用。

## 部署步骤

### 1. 注册/登录
打开 https://zeabur.com → 点 **Login** → 选 **GitHub**。授权后会自动跳回 Zeabur 控制台。

### 2. 新建项目
- 控制台右上角 **Create Project** → 取个名字（如 `古树博物馆`）→ 区域选 **Hong Kong (HKG)** 最近
- 进入项目后右上角 **Add Service** → **Git** → 选 `meijiang-trees-museum` 仓库 → 分支选 `main`
- Zeabur 会自动读 `zeabur.toml` 识别为 **Node.js** 服务，build = `npm install`，start = `node server.js`
- 点 Deploy

### 3. 关键：给服务挂一块持久卷（否则重启数据库会丢！）
服务起来后：

1. 点进刚建好的服务卡片 → **Settings**（左侧）
2. 找到 **Volumes** → **Add Volume**
   - **Mount Path** 填 `/data`
   - **Size** 填 `1` GB（够用）
   - 点 **Save**
3. 服务会自动重启一次

### 4. （可选但建议）在 Environment Variables 里设个自己的 JWT 密钥
服务卡片 → **Environment Variables** → **Add Variable**
- Key: `JWT_SECRET`
- Value: 随便一串长字符串（例：`mujiangsuh-shumei-2026-secret-xxxxx`）

> 不填也能跑，会用代码里的默认 dev key（`dev_change_me`），但生产环境最好换成自己的。

### 5. 等部署完成
- 服务状态变 **Running** 后（约 2–5 分钟，better-sqlite3 要编译），会自动在右上角生成一个免费域名：
  **`meijiang-trees-museum.zeabur.app`**
  点开就是你公网上的古树博物馆了！
- 首次访问会自动从 `public/js/data.js` 灌 118 棵古树 + 建管理员（`umcityx / 060320`）。

### 6.（可选）绑定自己的域名
服务卡片 → **Networking** → **Custom Domain** → 填你的域名，按提示去你的 DNS 添加 CNAME 即可。Zeabur 会自动签发 SSL。

## 后续
- GitHub 仓库的 `main` 分支每次更新，Zeabur 会自动重新部署
- 想改公网地址、查日志、看监控都在控制台同一个地方
- 免费额度：每月 $5（足够本项目长期运行）

## 常见问题
- **报错 better-sqlite3 编译失败**：去服务 Settings → **Build & Run** → 把 **Builder** 改成 `DOCKERFILE` 或保留默认 `NIXPACKS`，一般默认能过；如果挂了，把日志贴给我看
- **找不到数据库**：确认 Volume 已挂到 `/data`（步骤 3）
- **首页空白**：看 service 的 Logs，应该显示「古树博物馆后端已启动」；若报 JWT 错，去 Environment Variables 检查 `JWT_SECRET`
