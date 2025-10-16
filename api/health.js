import db from '../../db.js';

export default async function handler(req, res) {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.status(200).json({ status: 'ok', server_time: rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
