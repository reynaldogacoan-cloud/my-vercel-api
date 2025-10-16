import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConnection } from "../../db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email dan password wajib diisi" });

  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM profiles WHERE email = ? LIMIT 1", [email]);
    await conn.end();

    if (!rows.length) return res.status(401).json({ error: "Email tidak ditemukan" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Password salah" });

    const token = jwt.sign(
      { sub: user.id, email: user.email, nama: user.nama },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        jabatan: user.jabatan,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
