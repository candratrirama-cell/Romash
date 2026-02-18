module.exports = async (req, res) => {
  // Pengaturan CORS (Biar bisa dipanggil dari UI chatbot mana pun)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Pintu Tol Tetap Ada (Sesuai permintaan kamu)
  const validKeys = ["romash0ai", "romash1ai", "apibrain"];
  const userKey = req.headers['authorization'];

  if (!validKeys.includes(userKey)) {
    return res.status(401).json({ error: "Akses Ditolak! Tiket Salah." });
  }

  if (req.method === 'POST') {
    try {
      const { pesan } = req.body;
      
      // Menggunakan Pollinations AI (Tanpa API Key!)
      const systemPrompt = encodeURIComponent("Kamu adalah Romash AI Gen 2 buatan @maramadhona.");
      const userPrompt = encodeURIComponent(pesan);
      
      const response = await fetch(`https://text.pollinations.ai/${userPrompt}?system=${systemPrompt}&model=openai`);
      const hasilText = await response.text();

      return res.status(200).json({ 
        hasil: hasilText,
        creator: "@maramadhona"
      });

    } catch (error) {
      return res.status(500).json({ error: "Pollinations Error: " + error.message });
    }
  } else {
    return res.status(200).json({ status: "Romash AI via Pollinations Online" });
  }
};
