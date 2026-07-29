/**
 * 账号系统：注册 / 登录 / 当前用户 / 改密 / 账号列表
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth, requireRole } = require('../middleware/auth');

// 注册（仅管理员可创建账号）
router.post('/register', requireAuth, requireRole('admin'), (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: '用户名需 3-20 位字母/数字/下划线' });
  if (String(password).length < 6) return res.status(400).json({ error: '密码至少 6 位' });
  const okRole = ['admin', 'editor', 'viewer'].includes(role) ? role : 'viewer';
  if (db.prepare('SELECT id FROM users WHERE username=?').get(username)) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username,password_hash,role) VALUES (?,?,?)').run(username, hash, okRole);
  res.json({ id: info.lastInsertRowid, username, role: okRole });
});

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  res.json({ token: signToken(u), user: { id: u.id, username: u.username, role: u.role } });
});

// 当前登录用户
router.get('/me', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id,username,role,created_at FROM users WHERE id=?').get(req.user.id);
  if (!u) return res.status(404).json({ error: '账号不存在' });
  res.json(u);
});

// 修改密码
router.post('/password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: '密码格式不正确（新密码至少 6 位）' });
  }
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, u.password_hash)) return res.status(400).json({ error: '原密码错误' });
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(newPassword, 10), u.id);
  res.json({ ok: true });
});

// 账号列表（管理员）
router.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json(db.prepare('SELECT id,username,role,created_at FROM users ORDER BY id').all());
});

module.exports = router;
