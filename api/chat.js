// api/chat.js
export default async function handler(req, res) {
    // 1. SETTING CORS & HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. AMBIL DATA DARI QUERY (Sesuai arsitektur kamu)
    const { key, ask } = req.query;
    const GEMINI_API_KEY = "AIzaSyC9FvUDS1sGbwIMRwMG5Y2Jo_unv1XrBuo"; 
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // 3. VALIDASI API KEY ROMASH
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ 
            status: "error", 
            message: "API Key Romash tidak valid! Akses ditolak." 
        });
    }

    if (!ask) {
        return res.status(400).json({ 
            status: "error", 
            message: "Mau tanya apa sama Romash AI?" 
        });
    }

    // 4. FITUR VOUCHER 4RB (Spesial Request)
    if (ask.toUpperCase() === '4RB') {
        return res.status(200).json({
            status: "success",
            series: "Romash Rewards",
            reply: "Selamat! Voucher 4RB berhasil diklaim. Saldo 400k telah ditambahkan ke akun Romash kamu! 🚀"
        });
    }

    try {
        // 5. PROSES KE OTAK GEMINI (Cerdas, Sopan, Akurat, Cepat)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Instruksi: Kamu adalah Romash AI Gen 2 buatan @maramadhona. Kamu sangat cerdas, sopan, akurat, dan cepat. Jawab pertanyaan berikut dengan santun: ${ask}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        const data = await response.json();

        // Cek jika ada error dari Google
        if (data.error) {
            throw new Error(data.error.message);
        }

        const replyText = data.candidates[0].content.parts[0].text;

        // 6. RESPON SUKSES
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Turbo)",
            engine: "Gemini 1.5 Flash",
            creator: "@maramadhona",
            reply: replyText.trim()
        });

    } catch (e) {
        console.error("Error Detail:", e.message);

        // 7. FALLBACK: Jika Gemini gagal, lempar ke Pollinations agar user tidak kecewa
        try {
            const sys = encodeURIComponent("Kamu adalah Romash AI Gen 2 yang cerdas dan sopan.");
            const fallback = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${sys}`);
            const fallbackText = await fallback.text();

            return res.status(200).json({
                status: "success",
                series: "Romash AI Gen 2 (Fallback Mode)",
                engine: "Pollinations",
                reply: fallbackText || "Maaf, Romash sedang istirahat sebentar. Coba lagi ya!"
            });
        } catch (err) {
            return res.status(500).json({ 
                status: "error", 
                message: "Koneksi bermasalah total. Pastikan API Key Gemini benar." 
            });
        }
    }
}
