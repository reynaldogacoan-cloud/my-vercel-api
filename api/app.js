import { getConnection } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'mysecret';

export default async function handler(req, res) {
  const { action } = req.query;
  let conn;

  try {
    conn = await getConnection();

    // ========== REGISTER ==========
    if (action === 'register') {
      const { nama, email, password, jabatan } = req.body;
      if (!nama || !email || !password || !jabatan)
        return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });

      const hashed = await bcrypt.hash(password, 10);
      await conn.query(
        'INSERT INTO profile (nama, email, password, jabatan) VALUES (?, ?, ?, ?)',
        [nama, email, hashed, jabatan]
      );

      return res.status(200).json({ success: true, message: 'User berhasil terdaftar.' });
    }

    // ========== LOGIN ==========
    if (action === 'login') {
      const { email, password } = req.body;
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

    // ========== READ DATA (TABEL BEBAS, INCLUDE HEADER) ==========
    if (action === 'read') {
      const { table } = req.query;
      if (!table)
        return res.status(400).json({ success: false, error: 'Parameter table wajib diisi.' });

      const [rows, fields] = await conn.query(`SELECT * FROM ??`, [table]);
      const columns = fields.map(f => f.name);
      return res.status(200).json({ success: true, columns, data: rows });
    }

    // ========== INSERT DATA ==========
    if (action === 'insert') {
      const { table, data } = req.body;
      if (!table || !data)
        return res.status(400).json({ success: false, error: 'Parameter table dan data wajib diisi.' });

      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');

      const query = `INSERT INTO ?? (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await conn.query(query, [table, ...values]);

      return res.status(200).json({
        success: true,
        message: 'Data berhasil ditambahkan.',
        insertId: result.insertId,
      });
    }

    // ========== UPDATE DATA ==========
    if (action === 'update') {
      const { table, id, data } = req.body;
      if (!table || !id || !data)
        return res.status(400).json({ success: false, error: 'Parameter table, id, dan data wajib diisi.' });

      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map(f => `${f}=?`).join(', ');
      const query = `UPDATE ?? SET ${setClause} WHERE id = ?`;

      await conn.query(query, [table, ...values, id]);
      return res.status(200).json({ success: true, message: 'Data berhasil diupdate.' });
    }

    // ========== DEFAULT ==========
    return res.status(400).json({ success: false, error: 'Action tidak dikenal.' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) await conn.end();
  }
}
