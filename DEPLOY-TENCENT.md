# 梅江古树博物馆 · 腾讯云轻量服务器部署指南

> 目标：把**完整后端**（登录 / 上传 / 统计 / 留言 / 收藏）部署到国内可稳定访问的服务器。
> 适用：腾讯云轻量应用服务器（Ubuntu 22.04 或 应用镜像 Node.js）。
> 难度：跟着步骤复制命令即可，不需要懂 Linux。

---

## 一、买一台轻量服务器（一次性，约 ¥60–100/年）

1. 打开 https://cloud.tencent.com → 右上角**登录**（用微信/QQ，没账号先注册+实名，免费）。
2. 进入 **轻量应用服务器** 控制台（产品 → 计算 → 轻量应用服务器）。
3. 点 **新建**：
   - **镜像**：选 `系统镜像` → `Ubuntu 22.04 LTS`（推荐，干净）；或 `应用镜像` → `Node.js`（自带 Node，更省事）。
   - **地域**：选 **广州 / 上海 / 北京**（离梅州近选广州）。
   - **套餐**：选最便宜的 **2核 2G**（够用，约 ¥60–100/年）。
   - **登录方式**：`设置密码`，记好你设的 `root` 密码。
   - **时长**：1 年。
4. 点 **立即购买** → 支付。

> 买好后，在实例列表里能看到**公网 IP**（形如 `129.xxx.xxx.xxx`），后面全程要用它。

---

## 二、放行防火墙端口

轻量服务器默认只开 22（SSH）。要让人访问网站，需放行 3000 端口：

1. 实例列表点进你的服务器 → 左侧 **防火墙**。
2. 点 **添加规则**：
   - 应用类型：`自定义`
   - 协议端口：`TCP:3000`
   - 策略：`允许`
   - 来源：`0.0.0.0/0`（所有人）
3. 保存。

> 想直接用 `http://IP` 访问（不加 `:3000`）？把上面端口改成 `80` 并在 `install.sh` 里把 `.env` 的 `PORT` 设成 `80` 即可。

---

## 三、登录服务器

两种方式任选其一：

### 方式 A：腾讯云网页终端（最简单，不用装软件）
实例详情页 → **登录** → 选 `OrccaTerm`（或标准登录）→ 用 `root` + 你设的密码登录。

### 方式 B：本机终端 SSH（进阶）
```bash
ssh root@你的公网IP
```

---

## 四、上传项目代码

### 方式 A：服务器上直接 git clone（推荐，一行命令）
```bash
cd ~
git clone https://github.com/umcityx/meijiang-trees-museum.git
cd meijiang-trees-museum
```

### 方式 B：本机上传（若 GitHub 拉取太慢）
在你**本机** PowerShell（项目目录 `古树博物馆-重构版`）打包（不含 node_modules/.env/数据库）：
```powershell
Compress-Archive -Path .\* -DestinationPath ..\museum.zip -Force
```
然后用 FileZilla / scp 把 `museum.zip` 传到服务器 `~`，再：
```bash
cd ~
unzip museum.zip -d meijiang-trees-museum
cd meijiang-trees-museum
```

---

## 五、一键部署

在项目目录里执行：
```bash
sudo bash install.sh
```

脚本会自动：
1. 装系统编译工具（build-essential / python3 / git / curl / openssl）
2. 检测 Node，低于 18 则装 Node 20 LTS
3. `npm install` 安装依赖（better-sqlite3 自动下 Linux 预编译）
4. 生成 `.env`（JWT_SECRET 随机）
5. 注册 systemd 服务（开机自启 + 崩溃重启）
6. 启动服务

看到末尾 `部署完成 ✅` 和 `active (running)` 即成功。

---

## 六、访问测试

浏览器打开：
```
http://你的公网IP:3000
```
- 能看到完整博物馆（118 棵古树、地图、点云、实拍图）✅
- 点右上角登录，用 **`umcityx` / `060320`** 登录后台（`/admin.html`），可管理古树、上传图片、看统计。

---

## 七、日常管理

| 操作 | 命令 |
|---|---|
| 看服务状态 | `sudo systemctl status meijiang-museum` |
| 看日志 | `sudo journalctl -u meijiang-museum -f` |
| 重启服务 | `sudo systemctl restart meijiang-museum` |
| 停止服务 | `sudo systemctl stop meijiang-museum` |
| 开机自启 | `sudo systemctl enable meijiang-museum`（脚本已设） |

---

## 八、以后更新代码

本地改完代码后，推到 GitHub，然后在服务器上：
```bash
cd ~/meijiang-trees-museum
git pull
npm install --omit=dev   # 若依赖有变动才需要
sudo systemctl restart meijiang-museum
```

---

## 九、常见问题

**Q1：访问 IP:3000 打不开？**
- 检查防火墙是否放了 3000 端口（第二步）。
- 服务器上 `sudo systemctl status meijiang-museum` 看是否 running。
- 看日志 `sudo journalctl -u meijiang-museum -n 50`。

**Q2：npm install 卡在 better-sqlite3 编译？**
- 脚本已装 build-essential。若仍失败，手动 `sudo apt-get install -y build-essential python3` 后重跑 `npm install`。
- 腾讯云 Ubuntu 通常 better-sqlite3 有预编译，不会真编译。

**Q3：想用域名（如 museum.example.com）？**
- 国内服务器绑定域名需 **ICP 备案**。备案后，在轻量服务器控制台「域名解析」绑定，再用 Nginx 反代 3000 端口（可加 HTTPS）。新手建议先用 IP:3000。

**Q4：数据会不会丢？**
- 数据库存在服务器 `data/museum.db`（首次启动自动建）。**重装系统会丢**，定期备份 `data/` 目录即可。上传的图片在 `public/uploads/`，同理。

---

## 十、安全提醒

- 默认管理员 `umcityx / 060320` 请**尽快在后台修改密码**。
- `.env` 里的 `JWT_SECRET` 是随机生成的，请勿提交到公开仓库。
- 本机曾用于推送 GitHub 的 Personal Access Token 建议去 GitHub 撤销（部署已完成，不再需要）。
