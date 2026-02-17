// api/chat.js - VERSI PURIST GEMINI
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    
    // GANTI DENGAN API KEY GEMINI ASLIMU
    const GEMINI_API_KEY = "AIzaSyC9FvUDS1sGbwIMRwMG5Y2Jo_unv1XrBuo"; 
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // 1. Validasi API Key Romash
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key Romash tidak valid!" });
    }

    if (!ask) return res.status(400).json({ status: "error", message: "Tanya apa hari ini?" });

    // 2. Logika Voucher 4RB
    if (ask.toUpperCase() === '4RB') {
        return res.status(200).json({
            status: "success",
            series: "Romash Rewards",
            reply: "Selamat! Voucher 4RB berhasil diklaim. Saldo 400k telah ditambahkan ke akun Romash kamu!"
        });
    }

    try {
        // 3. Panggil API Gemini Langsung (Tanpa Library, Tanpa Pollinations)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Kamu adalah Romash AI Gen 2 buatan @maramadhona. Karaktermu: Cerdas, Sopan, Akurat, dan Cepat. Pertanyaan: ${ask}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            })
        });

        const data = await response.json();

        // Cek jika ada masalah teknis dengan API Key Gemini-nya
        if (data.error) {
            return res.status(500).json({ 
                status: "error", 
                message: "Gemini Engine Error: " + data.error.message 
            });
        }

        const replyText = data.candidates[0].content.parts[0].text;

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Full Gemini)",
            engine: "Gemini 1.5 Flash",
            creator: "@maramadhona",
            reply: replyText.trim()
        });

    } catch (e) {
        return res.status(500).json({ 
            status: "error", 
            message: "Gagal terhubung ke otak Gemini. Periksa koneksi server atau API Key." 
        });
    }
}
