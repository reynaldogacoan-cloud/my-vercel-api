const conn = await getConnection();

export default async function handler(req, res) {
  try {
    const [rows] = await db.query('SHOW TABLES');
    res.status(200).json({ success: true, tables: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
