import jwt from "jsonwebtoken";
import { getConnection } from "../../db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  let userId;
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.sub;
  } catch {
    return res.status(401).json({ error: "Token invalid" });
  }

  const conn = await getConnection();

  try {
    if (req.method === "GET") {
      const [rows] = await conn.query(
        "SELECT * FROM overtime_requests WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      await conn.end();
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { tanggal, jam_mulai, jam_selesai, keterangan } = req.body;
      if (!tanggal || !jam_mulai || !jam_selesai)
        return res.status(400).json({ error: "Data tidak lengkap" });

      await conn.query(
        "INSERT INTO overtime_requests (user_id, tanggal, jam_mulai, jam_selesai, keterangan, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [userId, tanggal, jam_mulai, jam_selesai, keterangan || null]
      );
      await conn.end();
      return res.status(201).json({ message: "Overtime berhasil ditambahkan" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    await conn.end();
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
