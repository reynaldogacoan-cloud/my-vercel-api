import { getConnection } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Only POST allowed' });
  }

  const { table, data } = req.body;
  if (!table || !data) {
    return res.status(400).json({ success: false, message: 'Table and data required' });
  }

  try {
    const conn = await getConnection();
    const [result] = await conn.query(`INSERT INTO ${table} SET ?`, [data]);
    await conn.end();

    res.status(200).json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
