import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  // 1. Cek API Key Romash (Header)
  const validKeys = ["romash1ai", "romash0ai", "romash5ai", "romash3ai", "romash4ai"];
  const userKey = req.headers['authorization'];

  if (!validKeys.includes(userKey)) {
    return res.status(401).json({ error: "API Key Romash Salah!" });
  }

  if (req.method === 'POST') {
    const { pesan } = req.body;

    if (!pesan) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    try {
      // 2. Panggil AI Groq
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan cerdas, santai, dan membantu." 
          },
          { role: "user", content: pesan }
        ],
        model: "llama3-8b-8192",
      });

      res.status(200).json({ 
        hasil: completion.choices[0].message.content,
        creator: "@maramadhona"
      });
    } catch (error) {
      res.status(500).json({ error: "Gagal memproses pesan: " + error.message });
    }
  } else {
    // Jika diakses via GET (browser langsung)
    res.status(200).json({ 
      status: "Online",
      bot: "Romash AI Gen 2",
      creator: "@maramadhona"
    });
  }
}
