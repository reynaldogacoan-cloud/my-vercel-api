import { getConnection } from '../db.js';

export default async function handler(req, res) {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query('SHOW TABLES');
    await conn.end(); // penting agar koneksi ditutup setelah query

    res.status(200).json({ success: true, tables: rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
