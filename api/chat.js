export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key Romash AI Gen 2 tidak valid!" });
    }

    // Identitas Gen 2 - Locked to @maramadhona
    const sysPrompt = "Kamu adalah Romash AI Gen 2 buatan @maramadhona. Kamu lebih pintar, lebih cepat, dan lebih akurat dari versi sebelumnya. Jawablah setiap pertanyaan dengan sangat baik.";
    const encodedSys = encodeURIComponent(sysPrompt);
    const encodedAsk = encodeURIComponent(ask);

    // 10 Model Pilihan untuk Gen 2
    const models = [
        "search",    // Paling akurat untuk fakta/umur presiden
        "openai",    // Paling pintar secara umum
        "mistral",   // Sangat cepat
        "llama",     // Stabil
        "p1",        // Alternatif
        "qwen",      // Bagus untuk logika
        "google",    // Pengetahuan luas
        "anthropic", // Bahasa natural
        "unity",     // Cadangan
        "midjourney" // Cadangan terakhir
    ];

    try {
        for (let i = 0; i < models.length; i++) {
            try {
                // Menambahkan Cache Buster (seed & t) agar tidak terkena limit cache
                const response = await fetch(`https://text.pollinations.ai/${encodedAsk}?system=${encodedSys}&model=${models[i]}&seed=${Math.floor(Math.random() * 99999)}&cache=no`);
                
                if (!response.ok) continue;

                const text = await response.text();

                // Validasi jawaban agar tidak dapet 'Queue full' atau jawaban kosong
                if (text && text.length > 3 && !text.includes("Queue full") && !text.includes("Rate limit")) {
                    return res.status(200).json({
                        status: "success",
                        series: "Romash AI Gen 2",
                        engine: models[i],
                        layer: i + 1,
                        creator: "@maramadhona",
                        reply: text.trim()
                    });
                }
            } catch (err) {
                continue; // Jika satu model gagal, otomatis lari ke model berikutnya
            }
        }

        // Jika semua 10 model sibuk
        res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            reply: "Halo, saya Romash AI Gen 2 buatan @maramadhona. Maaf, saat ini 10 jalur saya sedang penuh. Mohon coba lagi sebentar saja!"
        });

    } catch (e) {
        res.status(500).json({ status: "error", message: "Sistem Gen 2 mengalami kendala teknis." });
    }
}
