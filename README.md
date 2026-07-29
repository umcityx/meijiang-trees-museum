# 梅江古树博物馆 · 数字馆藏平台

一个面向**梅江区二级古树**的数字博物馆网站：以地图、科属分类、图文详情展示 118 棵古树，并内置**激光雷达点云 3D 实景漫游**（千年古梅已接入），让访客无需亲临现场即可“云游”古树实地。

> 本站为「前端 + Node 后端」一体应用，古树数据、图片上传、账号体系、互动功能全部走 API。

---

## ✨ 功能特性

- **古树总览**：科属种分组（19 科 26 属）可折叠展示、分页加载、双地图（Leaflet 卫星图 + 高德地图）切换。
- **详情弹窗**：位置 / 复壮措施 / 古树故事合并字幕；本地实拍图相册；收藏功能。
- **3D 实景漫游**：千年古梅（id=54 潮塘宫粉）接入激光雷达点云，浏览器内可旋转 / 缩放 / 平移查看树体真实形态（Three.js + PLY 点云）。
- **账号体系**：注册 / 登录（JWT）、角色权限 `admin > editor > viewer`。
- **后台管理**（`/admin.html`）：古树增删改查、图片上传、查看访问统计与留言。
- **互动**：访问埋点、留言、收藏。

---

## 🧱 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML / CSS / JavaScript、Leaflet、高德地图 JS API、Three.js（点云） |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 鉴权 | JWT（jsonwebtoken）+ bcryptjs 密码哈希 |
| 上传 | multer |
| 点云处理 | Python + laspy（LAS → 抽稀 PLY） |

---

## 📁 目录结构

```
server.js                入口：静态托管 public/ + 挂载 API 路由
db.js                    SQLite 建库/建表 + 首次数据迁移（118 棵）
.env / .env.example      运行配置（JWT_SECRET / PORT / 上传目录）
routes/
  auth.js                注册 / 登录（JWT）
  trees.js               古树 CRUD（写操作需 admin/editor）
  upload.js              图片上传（multer）
  stats.js               访问统计 / 留言 / 收藏
middleware/auth.js       JWT 鉴权 + 角色中间件
process_pointcloud.py    点云处理脚本（LAS → 轻量 PLY）
data/                    原始古树 Excel 数据源
public/                  前端
  index.html             访客端主页
  admin.html             后台管理页
  css/ js/ images/       样式 / 脚本 / 实拍图
  pointclouds/54.ply     千年古梅点云（38MB）
  uploads/               用户上传图片（运行时生成）
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖（better-sqlite3 为原生模块，会自动编译）
npm install

# 2. 配置环境变量
cp .env.example .env
#   然后编辑 .env，把 JWT_SECRET 改成你自己的随机字符串

# 3. 启动服务
PORT=8765 node server.js
```

启动后访问 <http://localhost:8765>

首次启动会自动：
1. 把 `data/` 中的 118 棵古树迁移进 `data/museum.db`（仅当表为空）；
2. 创建默认管理员账号（见下，**请尽快改密码**）。

### 默认管理员账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `umcityx` | `060320` | admin |

角色权限：`admin`（增删改查+管理）> `editor`（可编辑不可删）> `viewer`（只读）。

---

## 🌲 点云 3D 漫游

千年古梅（潮塘宫粉，城东镇潮塘村，树龄约 1017 年）已接入激光雷达点云漫游。
点开该树详情弹窗即可看到「3D 实景漫游」区块。

处理流程见 `process_pointcloud.py`：两帧 LAS 扫描（共约 1.7 亿点）经流式分块、
z 直方图定位地面、ROI 裁切 + 双体素抽稀（树 4cm / 地面 8cm），导出约 255 万点的 `public/pointclouds/54.ply`。

> 新增其他古树的点云：把对应 LAS 跑一遍 `process_pointcloud.py`（修改 `FILES` / `OUT`），
> 再在数据库为该树设置 `pointcloud` 字段指向 PLY 路径即可，前端无需改动。

---

## 📌 备注

- **必须经服务访问**：双击 `index.html` 无效，数据走后端 API。
- 修改 `routes/*.js` 或 `db.js` 后需**重启服务**（无热重载）。
- 更完整的后端 / API 说明见 [`README_backend.md`](./README_backend.md)。

---

## 📄 许可

本项目用于教学 / 大创展示，数据版权归相关管护单位所有。
