/**
 * 访问统计 + 互动（留言 / 收藏）
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 记录访问（公开，前端埋点）
router.post('/visits', (req, res) => {
  const ip = String(req.headers['x-forwarded-for'] || req.ip || '');
  const ua = String(req.headers['user-agent'] || '');
  const day = todayStr();
  db.prepare('INSERT INTO visits (ip,path,ua,day) VALUES (?,?,?,?)')
    .run(ip, (req.body && req.body.path) || '/', ua, day);
  res.json({ ok: true });
});

// 统计概览（登录可见）
router.get('/', requireAuth, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) c FROM visits').get().c;
  const today = db.prepare('SELECT COUNT(*) c FROM visits WHERE day=?').get(todayStr()).c;
  const uv = db.prepare('SELECT COUNT(DISTINCT ip) c FROM visits').get().c;
  const treeCount = db.prepare('SELECT COUNT(*) c FROM trees').get().c;
  const messageCount = db.prepare('SELECT COUNT(*) c FROM messages').get().c;
  res.json({ totalVisits: total, todayVisits: today, uv, treeCount, messageCount });
});

// 留言
router.get('/messages', (req, res) => {
  res.json(db.prepare('SELECT id,author,content,created_at FROM messages ORDER BY id DESC LIMIT 50').all());
});
router.post('/messages', requireAuth, (req, res) => {
  const content = String((req.body && req.body.content) || '').trim();
  if (!content) return res.status(400).json({ error: '留言内容不能为空' });
  const u = db.prepare('SELECT id,username FROM users WHERE id=?').get(req.user.id);
  db.prepare('INSERT INTO messages (user_id,author,content) VALUES (?,?,?)').run(u.id, u.username, content);
  res.json({ ok: true });
});

// 收藏
router.get('/favorites', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT tree_id FROM favorites WHERE user_id=?').all(req.user.id).map(r => r.tree_id));
});
router.post('/favorites', requireAuth, (req, res) => {
  const treeId = req.body && req.body.treeId;
  if (!treeId) return res.status(400).json({ error: 'treeId 必填' });
  db.prepare('INSERT OR IGNORE INTO favorites (user_id,tree_id) VALUES (?,?)').run(req.user.id, treeId);
  res.json({ ok: true });
});
router.delete('/favorites/:treeId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id=? AND tree_id=?').run(req.user.id, req.params.treeId);
  res.json({ ok: true });
});

module.exports = router;
