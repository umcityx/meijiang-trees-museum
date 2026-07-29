/**
 * 古树 CRUD：公开读，写操作需 admin/editor
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

function rowToTree(r) {
  if (!r) return null;
  return {
    ...r,
    gallery: JSON.parse(r.gallery || '[]'),
    estimateAge: r.estimateAge ? Number(r.estimateAge) : undefined,
    lat: r.lat != null ? Number(r.lat) : undefined,
    lng: r.lng != null ? Number(r.lng) : undefined,
  };
}

// better-sqlite3 要求所有命名参数都必须存在；这里补齐缺省字段，避免 500
const TEXT_FIELDS = ['name','otherName','latinName','family','genus','level','age','location','height','dbh','canopy','feature','manageUnit','protectionMeasures','maintenance','description','image','pointcloud'];
const NUM_FIELDS = ['estimateAge','lat','lng'];
function normTree(b = {}) {
  const out = {};
  for (const f of TEXT_FIELDS) {
    const v = b[f];
    out[f] = (v === undefined || v === null) ? '' : String(v);
  }
  for (const f of NUM_FIELDS) {
    const v = b[f];
    out[f] = (v === undefined || v === null || v === '') ? null : Number(v);
  }
  out.gallery = JSON.stringify(b.gallery || []);
  return out;
}

// 列表（公开）+ 搜索 + 分页
router.get('/', (req, res) => {
  const { q, family, genus, page = 1, pageSize = 1000 } = req.query;
  const where = [];
  const params = [];
  if (q) {
    const like = `%${q}%`;
    where.push('(name LIKE ? OR otherName LIKE ? OR latinName LIKE ? OR family LIKE ? OR genus LIKE ? OR location LIKE ?)');
    params.push(like, like, like, like, like, like);
  }
  if (family) { where.push('family=?'); params.push(family); }
  if (genus) { where.push('genus=?'); params.push(genus); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) c FROM trees ${w}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM trees ${w} ORDER BY id LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ total, trees: rows.map(rowToTree) });
});

// 详情（公开）
router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM trees WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: '未找到该古树' });
  res.json(rowToTree(r));
});

// 新增（admin / editor）
router.post('/', requireAuth, requireRole('admin', 'editor'), (req, res) => {
  const b = req.body;
  const info = db.prepare(`INSERT INTO trees
    (name,otherName,latinName,family,genus,level,age,estimateAge,location,lat,lng,height,dbh,canopy,feature,manageUnit,protectionMeasures,maintenance,description,image,pointcloud,gallery)
    VALUES (@name,@otherName,@latinName,@family,@genus,@level,@age,@estimateAge,@location,@lat,@lng,@height,@dbh,@canopy,@feature,@manageUnit,@protectionMeasures,@maintenance,@description,@image,@pointcloud,@gallery)`)
    .run(normTree(b));
  res.json(rowToTree(db.prepare('SELECT * FROM trees WHERE id=?').get(info.lastInsertRowid)));
});

// 更新（admin / editor）
router.put('/:id', requireAuth, requireRole('admin', 'editor'), (req, res) => {
  const b = req.body;
  if (!db.prepare('SELECT id FROM trees WHERE id=?').get(req.params.id)) {
    return res.status(404).json({ error: '未找到该古树' });
  }
  db.prepare(`UPDATE trees SET
    name=@name,otherName=@otherName,latinName=@latinName,family=@family,genus=@genus,level=@level,
    age=@age,estimateAge=@estimateAge,location=@location,lat=@lat,lng=@lng,height=@height,dbh=@dbh,
    canopy=@canopy,feature=@feature,manageUnit=@manageUnit,protectionMeasures=@protectionMeasures,
    maintenance=@maintenance,description=@description,image=@image,pointcloud=@pointcloud,gallery=@gallery,updated_at=datetime('now')
    WHERE id=@id`)
    .run({ id: req.params.id, ...normTree(b) });
  res.json(rowToTree(db.prepare('SELECT * FROM trees WHERE id=?').get(req.params.id)));
});

// 删除（仅 admin）
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM trees WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: '未找到该古树' });
  res.json({ ok: true });
});

module.exports = router;
