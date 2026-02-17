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

    const sys = encodeURIComponent("Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan sangat cepat dan akurat.");
    const query = encodeURIComponent(ask);

    // Kita pilih 4 model tercepat untuk diadu kecepatannya
    const fastModels = ["openai", "mistral", "llama", "search"];

    try {
        // TRICK: Memanggil semua model secara bersamaan (Parallel)
        // Promise.any akan mengambil jawaban dari model yang PALING CEPAT merespon
        const fastReply = await Promise.any(fastModels.map(async (model) => {
            const response = await fetch(`https://text.pollinations.ai/${query}?system=${sys}&model=${model}&seed=${Math.floor(Math.random() * 1000)}`);
            const text = await response.text();
            
            if (text && !text.includes("Queue full") && text.length > 2) {
                return { text, model };
            }
            throw new Error("Model ini lelet/antre");
        }));

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Turbo)",
            engine: fastReply.model,
            creator: "@maramadhona",
            reply: fastReply.text.trim()
        });

    } catch (e) {
        // Jika mode paralel gagal, balik ke mode standar (Lapis Terakhir)
        const fallback = await fetch(`https://text.pollinations.ai/${query}?system=${sys}`);
        const fallbackText = await fallback.text();

        res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Fallback)",
            creator: "@maramadhona",
            reply: fallbackText.includes("Queue full") ? "Maaf, sistem sedang sangat sibuk. Coba lagi ya!" : fallbackText
        });
    }
}
