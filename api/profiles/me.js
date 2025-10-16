import jwt from "jsonwebtoken";
import { getConnection } from "../../db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const conn = await getConnection();
    const [rows] = await conn.query(
      "SELECT id, email, nama, jabatan, created_at FROM profiles WHERE id = ? LIMIT 1",
      [decoded.sub]
    );
    await conn.end();

    if (!rows.length) return res.status(404).json({ error: "User tidak ditemukan" });
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Token invalid", detail: err.message });
  }
}
