/**
 * 图片上传：登录后可上传，校验类型/大小，存 public/uploads，可关联到古树 gallery
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.UPLOAD_MAX_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('仅支持 jpg / png / webp 格式'));
    }
    cb(null, true);
  },
});

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' });
  const rel = '/' + path.relative(PUBLIC_DIR, req.file.path).replace(/\\/g, '/');
  let treeId = null;
  if (req.body.treeId) {
    const t = db.prepare('SELECT * FROM trees WHERE id=?').get(req.body.treeId);
    if (t) {
      treeId = t.id;
      const g = JSON.parse(t.gallery || '[]');
      g.push(rel);
      const cover = g[0] || rel;
      db.prepare("UPDATE trees SET gallery=?, image=COALESCE(NULLIF(image,''),?) WHERE id=?")
        .run(JSON.stringify(g), cover, t.id);
    }
  }
  res.json({ url: rel, filename: req.file.filename, treeId });
});

// 错误处理（文件过大 / 类型不符）
router.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;
