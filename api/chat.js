// api/chat.js - VERSI ANTI-GAGAL TOTAL
export default async function handler(req, res) {
    // 1. HEADERS (Wajib untuk koneksi antar domain)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. DETEKSI INPUT (Kita cek di URL atau di Body biar gak salah baca)
    const key = req.query.key || (req.body && req.body.key);
    const ask = req.query.ask || (req.body && req.body.ask);
    
    // GANTI DENGAN KEY ASLIMU DARI DASHBOARD TADI
    const GEMINI_API_KEY = "AIzaSyC9FvUDS1sGbwIMRwMG5Y2Jo_unv1XrBuo"; 
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // 3. VALIDASI
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key Romash tidak valid!" });
    }

    if (!ask) {
        return res.status(400).json({ status: "error", message: "Pesan kosong (Input tidak terbaca)" });
    }

    try {
        // 4. TEMBAK LANGSUNG KE GOOGLE
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Kamu Romash AI. Jawab: ${ask}` }]
                }]
            })
        });

        const data = await response.json();

        // JIKA GOOGLE MEMBERIKAN ERROR (Ini yang bikin grafikmu biru)
        if (data.error) {
            return res.status(500).json({ 
                status: "error", 
                message: "Google Error: " + data.error.message 
            });
        }

        // AMBIL TEKSNYA
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Romash bingung.";

        return res.status(200).json({
            status: "success",
            reply: replyText.trim()
        });

    } catch (e) {
        // JIKA SERVER KAMU YANG ERROR
        return res.status(500).json({ 
            status: "error", 
            message: "Server internal bermasalah: " + e.message 
        });
    }
}
