export default async function handler(req, res) {
    // 1. IZINKAN AKSES DARI MANA SAJA (WAJIB)
    // Supaya orang bisa pasang API Key kamu di web/app mereka tanpa error 'CORS'
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Menangani preflight request dari browser
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. AMBIL DATA DARI PEMANGGIL (USER)
    const { key, ask } = req.query;

    // 3. DAFTAR API KEY RESMI ROMASH AI
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // 4. VALIDASI: Cek apakah kolom apikey yang dipasang di kodingan user benar
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ 
            status: "error",
            message: "API Key romashAI salah atau tidak terdaftar!" 
        });
    }

    // Cek jika pertanyaan kosong
    if (!ask) {
        return res.status(400).json({ 
            status: "error",
            message: "Parameter 'ask' (pertanyaan) tidak ditemukan." 
        });
    }

    try {
        // 5. PROSES PENGAMBILAN JAWABAN (Otak AI)
        // Kita pakai Pollinations sebagai mesin di belakang layar romashAI
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=Kamu adalah romashAI, asisten AI publik yang handal.`);
        const text = await response.text();

        // 6. KIRIM BALIK DALAM FORMAT JSON STANDAR
        // Ini yang akan dibaca oleh kolom 'reply' di kodingan user
        res.status(200).json({
            status: "success",
            provider: "romashAI",
            reply: text
        });

    } catch (e) {
        res.status(500).json({ 
            status: "error", 
            message: "Gagal menghubungkan ke otak romashAI." 
        });
    }
}
