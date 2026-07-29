# 古树博物馆 · 后端服务说明

纯前端站点升级为「Express + SQLite」前后端一体应用。古树数据、图片上传、账号、互动全部走 API。

## 启动

```bash
# 依赖已安装（managed node 的 node_modules）
PORT=8765 node server.js
# 开发时若换机器：用 managed node 的 npm.cmd 执行 npm install
```

首次启动会自动：
1. 把 `public/js/data.js` 的 118 棵古树迁移进 `data/museum.db`（仅当 trees 表为空）
2. 创建默认管理员账号 `umcityx` / `060320`（仅当无账号）

## 默认账号

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| umcityx | 060320 | admin | 增删改查古树、上传、管理 |

角色：`admin` > `editor`（可编辑不可删）> `viewer`（只读）。**请尽快改密码。**

## 目录结构

```
server.js              入口（静态托管 public/ + 挂载 API）
db.js                  better-sqlite3 建库/建表/首次迁移
.env                   JWT_SECRET / PORT / DB_PATH
routes/
  auth.js              注册 / 登录(JWT)
  trees.js             古树 CRUD（写需 admin/editor）
  upload.js            图片上传（multer，存 public/uploads/）
  stats.js             访问统计 / 留言 / 收藏
middleware/auth.js     JWT 鉴权 + 角色中间件
public/                前端（index.html / css / js / images / admin.html / uploads）
data/museum.db         SQLite 数据库
```

## API 速查

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET  | `/api/trees` | 公开 | 列表（支持 `?q=&family=&genus=&page=&pageSize=`） |
| GET  | `/api/trees/:id` | 公开 | 详情 |
| POST | `/api/trees` | admin/editor | 新增（走 `normTree` 补齐字段） |
| PUT  | `/api/trees/:id` | admin/editor | 更新 |
| DELETE | `/api/trees/:id` | admin | 删除 |
| POST | `/api/auth/register` | 公开 | 注册（body: username,password,role?） |
| POST | `/api/auth/login` | 公开 | 登录（返回 `token`） |
| POST | `/api/upload` | 登录 | 上传图（multipart `file`，返回 `/uploads/xxx`） |
| GET  | `/api/stats` | 登录 | 统计概览（总访问/今日/UV/树数/留言数） |
| POST | `/api/stats/visits` | 公开 | 访问埋点 |
| GET/POST | `/api/stats/messages` | GET 公开 / POST 登录 | 留言列表 / 发留言 |
| GET/POST/DELETE | `/api/stats/favorites` | 登录 | 收藏列表 / 收藏 / 取消 |

前端请求需带 `Authorization: Bearer <token>`（登录后存 localStorage）。

## 注意事项

- 双击 `index.html` 无效，必须经服务访问（数据走 API）。
- 改 `routes/*.js` 或 `db.js` 后需**重启服务**（无热重载）。
- 上传图存 `public/uploads/`，URL 形如 `/uploads/xxx.png`；前端 `image`/`gallery` 引用可改为该路径。
- `better-sqlite3` 是原生模块，换机器用 managed node 的 `npm.cmd install` 即可（预编译可用）。
