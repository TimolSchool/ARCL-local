require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── DB ───────────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'notesdb',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── Init table ───────────────────────────────────────────────────────────────
async function // Static Frontend bundle for Docker / Local standalone
const pathModule = require("path");
const fsModule = require("fs");
const frontendDist = pathModule.join(__dirname, "..", "..", "frontend_dist");
if (fsModule.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(pathModule.join(frontendDist, "index.html"));
  });
}
initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      title      TEXT        NOT NULL,
      content    TEXT        NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅  Table notes prête');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health — indicateur de connectivité cloud
app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS time');
    res.json({ status: 'ok', db_time: rows[0].time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET toutes les notes
app.get('/api/notes', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY updated_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET une note
app.get('/api/notes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST créer
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim())
    return res.status(400).json({ error: 'title et content requis' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT modifier
app.put('/api/notes/:id', async (req, res) => {
  const { title, content } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE notes SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [title, content, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE supprimer
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM notes WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Start ────────────────────────────────────────────────────────────────────
// Static Frontend bundle for Docker / Local standalone
const pathModule = require("path");
const fsModule = require("fs");
const frontendDist = pathModule.join(__dirname, "..", "..", "frontend_dist");
if (fsModule.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(pathModule.join(frontendDist, "index.html"));
  });
}
initDB()
  .then(() => app.listen(PORT, () => console.log(`🚀  API sur http://localhost:${PORT}`)))
  .catch(err => { console.error('Erreur DB:', err); process.exit(1); });

