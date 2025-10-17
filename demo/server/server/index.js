const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_FILE = path.join(__dirname, '../data.db');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    plate TEXT,
    total INTEGER,
    totalWeight TEXT,
    defaultId TEXT,
    defaultWeight REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplierId INTEGER,
    recordId TEXT,
    weight REAL,
    classification TEXT,
    attributes TEXT,
    defects TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // seed demo suppliers if empty
  db.get('SELECT COUNT(*) as c FROM suppliers', (err, row) => {
    if (!err && row.c === 0) {
      const stmt = db.prepare('INSERT INTO suppliers (name,plate,total,totalWeight,defaultId,defaultWeight) VALUES (?,?,?,?,?,?)');
      stmt.run('Thiên Thành', '79-VA-18175', 1, '100', '48', 15);
      stmt.run('Kiên Thịnh', '73-AB-12345', 2, '200', '49', 22.0);
      stmt.run('Satomura', '51-CD-98765', 3, '300', '50', 33.3);
      stmt.finalize();
      console.log('Seeded suppliers');
    }
  });
});

// endpoints
app.get('/api/suppliers', (req, res) => {
  db.all('SELECT * FROM suppliers ORDER BY id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/suppliers/:id', (req, res) => {
  const id = Number(req.params.id);
  db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

app.post('/api/records', (req, res) => {
  const { supplierId, recordId, weight, classification, attributes, defects } = req.body;
  const stmt = db.prepare(`INSERT INTO records (supplierId, recordId, weight, classification, attributes, defects)
    VALUES (?,?,?,?,?,?)`);
  stmt.run(supplierId || null, recordId, weight, classification, JSON.stringify(attributes || {}), JSON.stringify(defects || {}), function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));