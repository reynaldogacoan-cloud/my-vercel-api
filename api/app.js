import { getConnection } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'mysecret';

export default async function handler(req, res) {
  // ===== CORS =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ===== Parsing body =====
  let body = {};
  if (req.method === 'POST') {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      console.error('Body parse error:', e);
      return res.status(400).json({ success: false, error: 'Invalid JSON' });
    }
  }

  // ===== Extract variables with safe defaults =====
  const {
    action = null,
    table = null,
    email = null,
    password = null,
    nama = null,
    jabatan = null,
    id = null,
    data = null
  } = body;

  console.log('ACTION:', action);
  console.log('BODY:', body);

  let conn;

  try {
    conn = await getConnection();

    // ===== REGISTER =====
    if (action === 'register') {
      if (!nama || !email || !password || !jabatan)
        return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });

      const [exist] = await conn.query('SELECT id FROM profile WHERE email = ?', [email]);
      if (exist.length > 0)
        return res.status(400).json({ success: false, error: 'Email sudah terdaftar.' });

      const hashed = await bcrypt.hash(password, 10);
      await conn.query(
        'INSERT INTO profile (nama, email, password, jabatan) VALUES (?, ?, ?, ?)',
        [nama, email, hashed, jabatan]
      );

      return res.status(201).json({ success: true, message: 'User berhasil terdaftar.' });
    }

    // ===== LOGIN =====
    if (action === 'login') {
      if (!email || !password)
        return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });

      const [rows] = await conn.query('SELECT * FROM profile WHERE email = ?', [email]);
      if (rows.length === 0)
        return res.status(401).json({ success: false, error: 'User tidak ditemukan.' });

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ success: false, error: 'Password salah.' });

      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1d' });
      return res.json({
        success: true,
        message: 'Login berhasil.',
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          jabatan: user.jabatan,
        },
      });
    }

    // ===== READ DATA =====
    if (action === 'read') {
      if (!table) return res.status(400).json({ success: false, error: 'Parameter table wajib diisi.' });

      const [rows, fields] = await conn.query(`SELECT * FROM ??`, [table]);
      const columns = fields.map(f => f.name);

      return res.status(200).json({ success: true, columns, data: rows });
    }

    // ===== INSERT DATA =====
    if (action === 'insert') {
      if (!table || !data || typeof data !== 'object') 
        return res.status(400).json({ success: false, error: 'Parameter table dan data wajib diisi.' });

      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(',');

      const sql = `INSERT INTO ?? (${fields.join(',')}) VALUES (${placeholders})`;
      const [result] = await conn.query(sql, [table, ...values]);

      return res.status(201).json({
        success: true,
        message: 'Data berhasil ditambahkan.',
        insertId: result.insertId,
      });
    }

    // ===== UPDATE DATA =====
    if (action === 'update') {
      if (!table || !id || !data || typeof data !== 'object')
        return res.status(400).json({ success: false, error: 'Parameter table, id, dan data wajib diisi.' });

      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map(f => `${f}=?`).join(',');

      const sql = `UPDATE ?? SET ${setClause} WHERE id=?`;
      await conn.query(sql, [table, ...values, id]);

      return res.status(200).json({ success: true, message: 'Data berhasil diupdate.' });
    }

    // ===== DEFAULT =====
    return res.status(400).json({ success: false, error: 'Action tidak dikenal.' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) await conn.end();
  }
}
