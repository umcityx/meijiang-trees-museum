#!/usr/bin/env bash
# ============================================================
# 梅江古树博物馆 - 腾讯云轻量应用服务器 一键部署脚本
# 用法：在服务器上，先 cd 进入项目目录，再执行：
#        sudo bash install.sh
# 脚本会自动：装系统依赖 → 确保 Node 18+ → npm install
#            → 生成 .env → 注册 systemd 服务并启动
# ============================================================
set -e

echo "=============================================="
echo "  梅江古树博物馆 一键部署脚本"
echo "=============================================="

# 0. 进入脚本所在目录（确保在项目根目录运行）
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

# 1. 系统依赖（编译 better-sqlite3 兜底 + 基础工具）
echo "[1/6] 安装系统依赖 (build-essential/python3/git/curl/openssl)..."
sudo apt-get update -y
sudo apt-get install -y build-essential python3 git curl unzip openssl

# 2. 确保 Node.js 18+（轻量应用镜像 Node.js 通常已带，跳过；否则装 20 LTS）
NODE_VER=$(node -v 2>/dev/null | sed 's/^v//;s/\..*//' || echo 0)
if [ "$NODE_VER" -lt 18 ]; then
  echo "[2/6] 检测到 Node $(node -v 2>/dev/null || echo 未安装)，安装 Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[2/6] 已检测到 Node $(node -v)，版本满足要求，跳过安装"
fi

# 3. 安装 npm 依赖（better-sqlite3 在 Linux 会自动下载预编译二进制）
echo "[3/6] 安装 npm 依赖（可能需要 1-3 分钟）..."
npm install --omit=dev

# 4. 生成 .env（若已存在则跳过）
if [ ! -f .env ]; then
  echo "[4/6] 生成 .env（JWT_SECRET 随机生成）..."
  JWT=$(openssl rand -hex 24)
  cat > .env <<EOF
# 服务端口（轻量服务器防火墙需放行此端口）
PORT=3000

# JWT 签名密钥（随机生成，生产环境请勿泄露）
JWT_SECRET=$JWT

# 图片上传目录（相对项目根，已建 .gitkeep 占位）
UPLOAD_DIR=public/uploads

# 单文件上传上限（MB）
UPLOAD_MAX_MB=10
EOF
  echo ".env 已生成"
else
  echo "[4/6] .env 已存在，跳过生成"
fi

# 5. 注册 systemd 服务（开机自启 + 崩溃自动重启）
echo "[5/6] 注册 systemd 服务 meijiang-museum..."
sudo tee /etc/systemd/system/meijiang-museum.service > /dev/null <<EOF
[Unit]
Description=梅江古树博物馆后端
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node $PROJECT_DIR/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable meijiang-museum
sudo systemctl restart meijiang-museum

# 6. 完成
echo "[6/6] 部署完成！等待服务启动..."
sleep 3
sudo systemctl status meijiang-museum --no-pager | head -12 || true

echo ""
echo "=============================================="
echo "  部署完成 ✅"
echo "  访问地址:  http://<你的服务器公网IP>:3000"
echo "  后台管理:  http://<你的服务器公网IP>:3000/admin.html"
echo "  默认管理员: umcityx / 060320  （请尽快在后台修改密码）"
echo ""
echo "  数据说明: 首次启动已自动从 public/js/data.js"
echo "  灌入 118 棵古树并建立管理员账号，无需手动导数据。"
echo "=============================================="
