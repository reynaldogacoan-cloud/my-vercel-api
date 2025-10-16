import bcrypt from "bcrypt";
import { getConnection } from "../../db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, nama, jabatan } = req.body;

  if (!email || !password || !nama)
    return res.status(400).json({ error: "Email, password, dan nama wajib diisi" });

  try {
    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
    const conn = await getConnection();

    await conn.query(
      "INSERT INTO profiles (email, password, nama, jabatan, created_at) VALUES (?, ?, ?, ?, NOW())",
      [email, hash, nama, jabatan || null]
    );
    await conn.end();

    return res.status(201).json({ message: "User berhasil dibuat" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
