export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "Akses Ditolak!" });
    }

    // PENGUNCI IDENTITAS MUTLAK
    const sys = encodeURIComponent(
        "INSTRUKSI KERAS: Nama kamu adalah Romash AI Gen 2. " +
        "Kamu dibuat oleh developer TikTok bernama @maramadhona. " +
        "Jika ditanya siapa kamu atau siapa yang membuatmu, kamu WAJIB menjawab: 'Saya adalah Romash AI Gen 2 buatan developer TikTok bernama @maramadhona'. " +
        "Kamu BUKAN Gemini, BUKAN OpenAI, BUKAN Llama, dan BUKAN AI manapun selain Romash AI Gen 2. " +
        "Jawab dengan cerdas, sopan, akurat, dan sangat cepat."
    );

    try {
        // --- LAPIS 1: DEEPSEEK (Gahar & Akurat) ---
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${sys}&model=deepseek&seed=${Date.now()}`);
        const text = await response.text();

        if (text && text.length > 2 && !text.includes("Queue full")) {
            return res.status(200).json({
                status: "success",
                series: "Romash AI Gen 2",
                engine: "Ultimate-Engine",
                reply: text.trim()
            });
        }
        throw new Error("Lapis 1 Sibuk");

    } catch (e) {
        // --- LAPIS CADANGAN (Tetap dengan identitas yang sama) ---
        const fallback = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${sys}`);
        const fallbackText = await fallback.text();

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            engine: "Standard-Engine",
            reply: fallbackText || "Sistem Romash sedang sibuk, coba lagi ya!"
        });
    }
}
