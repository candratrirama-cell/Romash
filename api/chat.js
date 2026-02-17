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

    const systemPrompt = "Kamu adalah Romash AI Flash buatan @maramadhona. Kamu pintar, cepat, dan handal.";

    // --- JALUR 1: BLACKBOX (Paling Pintar & Cepat) ---
    try {
        const res1 = await fetch(`https://api.vreden.my.id/api/blackbox?query=${encodeURIComponent(ask)}&system=${encodeURIComponent(systemPrompt)}`);
        const data1 = await res1.json();
        if (data1.result) return kirimRespon(res, data1.result, "Flash-V1");
    } catch (e) {}

    // --- JALUR 2: LLAMA-3 (Alternatif High Speed) ---
    try {
        const res2 = await fetch(`https://api.sandipbaruwal.onrender.com/llama3?query=${encodeURIComponent(systemPrompt + " User: " + ask)}`);
        const data2 = await res2.json();
        if (data2.output) return kirimRespon(res, data2.output, "Flash-V2");
    } catch (e) {}

    // --- JALUR 3: SKIZO (Jalur Bot Teruji) ---
    try {
        const res3 = await fetch(`https://skizo.tech/api/openai?apikey=free&text=${encodeURIComponent(systemPrompt + " Jawab: " + ask)}`);
        const data3 = await res3.json();
        if (data3.result) return kirimRespon(res, data3.result, "Flash-V3");
    } catch (e) {}

    // --- JALUR 4: POLLINATIONS (BENTENG TERAKHIR - PASTI NYALA) ---
    try {
        const res4 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${encodeURIComponent(systemPrompt)}`);
        const data4 = await res4.text();
        if (data4) return kirimRespon(res, data4, "Flash-Emergency");
    } catch (e) {}

    // JIKA SEMUA GAGAL TOTAL
    res.status(500).json({ status: "error", message: "Semua jalur Romash AI sedang sibuk. Coba lagi nanti." });
}

// Fungsi pembantu agar kode lebih rapi
function kirimRespon(res, teks, model) {
    res.status(200).json({
        status: "success",
        model: "Romash AI " + model,
        creator: "@maramadhona",
        reply: teks
    });
}
