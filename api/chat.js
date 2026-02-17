export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key tidak valid!" });
    }

    const sys = "Kamu adalah Romash AI Flash buatan @maramadhona. Jawab dengan sangat pintar dan cepat.";

    // --- URUTAN 8 LAPIS PERTAHANAN ---
    
    // 1. GEMINI (Terpintar)
    try {
        const r1 = await fetch(`https://api.vreden.my.id/api/gemini?query=${encodeURIComponent(ask)}&system=${encodeURIComponent(sys)}`);
        const d1 = await r1.json();
        if (d1.result) return send(res, d1.result, "Flash-Gemini");
    } catch (e) {}

    // 2. PERPLEXITY (Real-time Search)
    try {
        const r2 = await fetch(`https://api.vreden.my.id/api/perplexity?query=${encodeURIComponent(ask)}`);
        const d2 = await r2.json();
        if (d2.result) return send(res, d2.result, "Flash-Perplexity");
    } catch (e) {}

    // 3. BLACKBOX (Coding & Logic)
    try {
        const r3 = await fetch(`https://api.vreden.my.id/api/blackbox?query=${encodeURIComponent(ask)}&system=${encodeURIComponent(sys)}`);
        const d3 = await r3.json();
        if (d3.result) return send(res, d3.result, "Flash-Blackbox");
    } catch (e) {}

    // 4. LLAMA-3 (Speed Monster)
    try {
        const r4 = await fetch(`https://api.vreden.my.id/api/llama3?query=${encodeURIComponent(sys + " User: " + ask)}`);
        const d4 = await r4.json();
        if (d4.result) return send(res, d4.result, "Flash-Llama3");
    } catch (e) {}

    // 5. GPT-4 (Creative)
    try {
        const r5 = await fetch(`https://api.vreden.my.id/api/gpt4?query=${encodeURIComponent(ask)}`);
        const d5 = await r5.json();
        if (d5.result) return send(res, d5.result, "Flash-GPT4");
    } catch (e) {}

    // 6. MISTRAL (Efficient)
    try {
        const r6 = await fetch(`https://api.vreden.my.id/api/mistral?query=${encodeURIComponent(ask)}`);
        const d6 = await r6.json();
        if (d6.result) return send(res, d6.result, "Flash-Mistral");
    } catch (e) {}

    // 7. DEEPSEEK (Analytical)
    try {
        const r7 = await fetch(`https://api.vreden.my.id/api/deepseek?query=${encodeURIComponent(ask)}`);
        const d7 = await r7.json();
        if (d7.result) return send(res, d7.result, "Flash-DeepSeek");
    } catch (e) {}

    // 8. CLAUDE-SONNET (The Final Guard)
    try {
        const r8 = await fetch(`https://api.vreden.my.id/api/claude?query=${encodeURIComponent(ask)}`);
        const d8 = await r8.json();
        if (d8.result) return send(res, d8.result, "Flash-Claude");
    } catch (e) {}

    // --- FALLBACK JIKA SEMUA MATI ---
    res.status(200).json({ 
        status: "success", 
        reply: "Halo! Saya Romash AI Flash buatan @maramadhona. Saat ini semua jalur (8 Lapis) sedang mengalami lonjakan trafik yang ekstrem. Mohon coba lagi sesaat lagi!" 
    });
}

function send(res, teks, model) {
    res.status(200).json({
        status: "success",
        model: "romashAI " + model,
        creator: "@maramadhona",
        reply: teks
    });
}
