import bcrypt from "bcrypt";
import { getConnection } from "../../db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nama, email, password, jabatan } = req.body;

  if (!nama || !email || !password || !jabatan) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }

  try {
    const conn = await getConnection();

    // cek apakah email sudah terdaftar
    const [existing] = await conn.query("SELECT id FROM profiles WHERE email = ?", [email]);
    if (existing.length > 0) {
      await conn.end();
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // simpan ke database
    await conn.query(
      "INSERT INTO profiles (nama, email, password, jabatan) VALUES (?, ?, ?, ?)",
      [nama, email, hashedPassword, jabatan]
    );

    await conn.end();

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      user: { nama, email, jabatan },
    });
  } catch (err) {
    console.error("Error saat register:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}

