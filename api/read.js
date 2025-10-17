import { getConnection } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Only POST allowed' });
  }

  const { table } = req.body;
  if (!table) {
    return res.status(400).json({ success: false, message: 'Table name is required' });
  }

  try {
    const conn = await getConnection();
    const [rows, fields] = await conn.query(`SELECT * FROM ${table}`);
    await conn.end();

    const columns = fields.map((f) => f.name);
    res.status(200).json({ success: true, columns, rows });
  } catch (error) {
    console.error('Read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
