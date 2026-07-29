/**
 * 古树博物馆后端入口
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态托管 public（只暴露此目录，根目录的 server.js/db.js 等不对外）
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trees', require('./routes/trees'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stats', require('./routes/stats'));

// API 404
app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }));

// 兜底返回首页（SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`古树博物馆后端已启动: http://localhost:${PORT}`);
  console.log(`后台管理页: http://localhost:${PORT}/admin.html`);
});
