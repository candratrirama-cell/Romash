export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key romashAI tidak valid!" });
    }

    const systemPrompt = "Kamu adalah Romash AI Flash buatan @maramadhona. Kamu pintar, sangat cepat, dan handal.";

    // --- JALUR 1: GEMINI (UTAMA - PALING PINTAR) ---
    try {
        const res1 = await fetch(`https://api.vreden.my.id/api/gemini?query=${encodeURIComponent(ask)}&system=${encodeURIComponent(systemPrompt)}`);
        const data1 = await res1.json();
        // Cek jika result ada dan bukan pesan error
        if (data1.result && !data1.result.includes("error")) {
            return kirimRespon(res, data1.result, "Flash-Gemini");
        }
    } catch (e) {}

    // --- JALUR 2: PERPLEXITY (CADANGAN 1 - REALTIME) ---
    try {
        const res2 = await fetch(`https://api.vreden.my.id/api/perplexity?query=${encodeURIComponent(ask)}`);
        const data2 = await res2.json();
        if (data2.result) return kirimRespon(res, data2.result, "Flash-Perplexity");
    } catch (e) {}

    // --- JALUR 3: BLACKBOX (CADANGAN 2 - STABIL) ---
    try {
        const res3 = await fetch(`https://api.vreden.my.id/api/blackbox?query=${encodeURIComponent(ask)}&system=${encodeURIComponent(systemPrompt)}`);
        const data3 = await res3.json();
        if (data3.result) return kirimRespon(res, data3.result, "Flash-V3");
    } catch (e) {}

    // --- JALUR 4: POLLINATIONS (DARURAT - BENTENG TERAKHIR) ---
    try {
        const res4 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${encodeURIComponent(systemPrompt)}`);
        const data4 = await res4.text();
        if (data4 && !data4.includes("Queue full")) {
            return kirimRespon(res, data4, "Flash-Emergency");
        }
    } catch (e) {}

    // JIKA SEMUA JALUR GAGAL
    res.status(200).json({ 
        status: "success", 
        reply: "Halo! Saya Romash AI Flash buatan @maramadhona. Saat ini semua jalur sedang sangat padat, silakan coba kirim pesan lagi ya!" 
    });
}

function kirimRespon(res, teks, model) {
    res.status(200).json({
        status: "success",
        model: "Romash AI " + model,
        creator: "@maramadhona",
        reply: teks
    });
}
