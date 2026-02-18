const { Groq } = require("groq-sdk");

module.exports = async (req, res) => {
  // Pengaturan agar bisa dipanggil dari UI/Chatbot lain (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pintu Tol: Cek API Key Romash
  const validKeys = ["romash0ai", "romash1ai", "apibrain"];
  const userKey = req.headers['authorization'];

  if (!validKeys.includes(userKey)) {
    return res.status(401).json({ error: "Akses Ditolak! API Key Salah." });
  }

  if (req.method === 'POST') {
    try {
      const { pesan } = req.body;

      if (!pesan) {
        return res.status(400).json({ error: "Pesan tidak boleh kosong." });
      }

      // Pastikan Nama Env di Vercel adalah: GROQ_API_KEY
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan cerdas dan gaul." },
          { role: "user", content: pesan }
        ],
        model: "llama3-8b-8192",
      });

      return res.status(200).json({ 
        hasil: completion.choices[0].message.content,
        creator: "@maramadhona"
      });

    } catch (error) {
      // Ini yang bakal muncul di log Vercel kalau ada masalah
      return res.status(500).json({ error: "Server Crash: " + error.message });
    }
  } else {
    return res.status(200).json({ status: "Romash AI Online", dev: "@maramadhona" });
  }
};
