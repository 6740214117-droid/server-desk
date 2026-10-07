import express from 'express';
import mysql from 'mysql2/promise';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const serviceTables = { apache: 'apache_users', nginx: 'nginx_users' };

function getMysqlConfig() {
  if (process.env.MYSQL_URL) {
    const url = new URL(process.env.MYSQL_URL);
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, ''))
    };
  }

  if (process.env.MYSQLHOST && process.env.MYSQLUSER && process.env.MYSQLDATABASE) {
    return {
      host: process.env.MYSQLHOST,
      port: Number(process.env.MYSQLPORT) || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    };
  }

  return null;
}

const mysqlConfig = getMysqlConfig();
const pool = mysqlConfig ? mysql.createPool({
  ...mysqlConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ...(process.env.MYSQL_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {})
}) : null;

const sampleUsers = {
  apache: [
    { name: 'ผู้ใช้ตัวอย่าง A', email: 'user.a@example.com', phone: '000-000-0001' },
    { name: 'ผู้ใช้ตัวอย่าง B', email: 'user.b@example.com', phone: '000-000-0002' },
    { name: 'ผู้ใช้ตัวอย่าง C', email: 'user.c@example.com', phone: '000-000-0003' },
    { name: 'นักศึกษาตัวอย่าง', email: 'student@example.com', phone: 'ไม่ระบุ', isStudent: true }
  ],
  nginx: [
    { name: 'ผู้ใช้ตัวอย่าง D', email: 'user.d@example.com', phone: '000-000-0004' },
    { name: 'ผู้ใช้ตัวอย่าง E', email: 'user.e@example.com', phone: '000-000-0005' },
    { name: 'ผู้ใช้ตัวอย่าง F', email: 'user.f@example.com', phone: '000-000-0006' },
    { name: 'นักศึกษาตัวอย่าง', email: 'student@example.com', phone: 'ไม่ระบุ', isStudent: true }
  ]
};

async function initializeDatabase() {
  for (const table of Object.values(serviceTables)) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(320) NOT NULL,
        phone VARCHAR(100) NOT NULL DEFAULT 'ไม่ระบุ',
        is_student BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  for (const [service, table] of Object.entries(serviceTables)) {
    const [rows] = await pool.query(`SELECT COUNT(*) AS user_count FROM ${table}`);
    if (Number(rows[0].user_count) === 0) {
      for (const user of sampleUsers[service]) {
        await pool.query(
          `INSERT INTO ${table} (name, email, phone, is_student) VALUES (?, ?, ?, ?)`,
          [user.name, user.email, user.phone, user.isStudent ?? false]
        );
      }
    }
  }
}

app.use(express.json({ limit: '20kb' }));

app.get('/api/health', async (_request, response) => {
  if (!pool) {
    response.status(503).json({ error: 'MySQL connection is not configured.' });
    return;
  }
  try {
    await pool.query('SELECT 1');
    response.json({ database: 'connected' });
  } catch {
    response.status(503).json({ database: 'unavailable' });
  }
});

app.get('/api/:service/users', async (request, response) => {
  const table = serviceTables[request.params.service];
  if (!table) {
    response.status(404).json({ error: 'Unknown service.' });
    return;
  }
  if (!pool) {
    response.status(503).json({ error: 'MySQL connection is not configured.' });
    return;
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, is_student AS isStudent FROM ${table} ORDER BY id DESC`
    );
    response.json(rows);
  } catch (error) {
    console.error('Could not load users:', error);
    response.status(500).json({ error: 'Could not load users from the database.' });
  }
});

app.post('/api/:service/users', async (request, response) => {
  const table = serviceTables[request.params.service];
  if (!table) {
    response.status(404).json({ error: 'Unknown service.' });
    return;
  }
  if (!pool) {
    response.status(503).json({ error: 'MySQL connection is not configured.' });
    return;
  }
  const { name, email, phone } = request.body ?? {};
  if (typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      (phone !== undefined && typeof phone !== 'string')) {
    response.status(400).json({ error: 'A valid name and email are required.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO ${table} (name, email, phone)
       VALUES (?, ?, ?)`,
      [name.trim(), email.trim(), phone?.trim() || 'ไม่ระบุ']
    );
    response.status(201).json({
      id: result.insertId,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || 'ไม่ระบุ',
      isStudent: false
    });
  } catch (error) {
    console.error('Could not save user:', error);
    response.status(500).json({ error: 'Could not save user to the database.' });
  }
});

app.get(['/', '/apache', '/nginx'], (_request, response) => response.sendFile(path.join(projectDirectory, 'index.html')));
app.get('/app.js', (_request, response) => response.sendFile(path.join(projectDirectory, 'app.js')));
app.get('/styles.css', (_request, response) => response.sendFile(path.join(projectDirectory, 'styles.css')));

async function startServer() {
  if (pool) {
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('Could not initialize MySQL:', error);
    }
  }
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

startServer();