import { getConnection } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Only POST allowed' });
  }

  const { table, data, where } = req.body;
  if (!table || !data || !where) {
    return res.status(400).json({ success: false, message: 'Table, data, and where required' });
  }

  try {
    const conn = await getConnection();
    const [result] = await conn.query(`UPDATE ${table} SET ? WHERE ?`, [data, where]);
    await conn.end();

    res.status(200).json({ success: true, affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
