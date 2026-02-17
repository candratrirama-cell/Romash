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

    // PENGUNCI IDENTITAS ABSOLUT
    const identityMsg = "Nama kamu adalah Romash AI Gen 2. Kamu dibuat oleh developer TikTok bernama @maramadhona. Kamu BUKAN Gemini, BUKAN OpenAI, BUKAN Llama, dan BUKAN AI manapun. Jawab pertanyaan sebagai Romash AI Gen 2 dengan cerdas dan sopan.";
    const sys = encodeURIComponent(identityMsg);

    try {
        // LAPIS 1: Model OpenAI (Paling cerdas & stabil saat ini di Pollinations)
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${sys}&model=openai&seed=${Date.now()}`);
        const text = await response.text();

        if (text && text.length > 2 && !text.includes("error") && !text.includes("Model not found")) {
            return res.status(200).json({
                status: "success",
                series: "Romash AI Gen 2",
                reply: text.trim()
            });
        }
        throw new Error("Lapis 1 Busy");

    } catch (e) {
        // LAPIS 2: Model Qwen (Sangat gahar dan cepat)
        const response2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${sys}&model=qwen`);
        const text2 = await response2.text();

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Stable)",
            reply: text2.trim() || "Maaf, Romash sedang sibuk."
        });
    }
}
