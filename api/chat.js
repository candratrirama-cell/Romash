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

    const lowerAsk = ask.toLowerCase();
    
    // --- FITUR GENERATE GAMBAR (Gen 2 Image Engine) ---
    // Mendeteksi kata kunci: gambar, lukis, foto, buatkan, image, draw
    if (lowerAsk.includes("gambar") || lowerAsk.includes("foto") || lowerAsk.includes("lukis") || lowerAsk.includes("buatkan")) {
        const promptGambar = encodeURIComponent(ask);
        const imageUrl = `https://image.pollinations.ai/prompt/${promptGambar}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
        
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Vision)",
            creator: "@maramadhona",
            type: "image",
            reply: "Ini adalah gambar yang kamu minta:",
            image_url: imageUrl
        });
    }

    // --- FITUR CHAT (Gen 2 Turbo Parallel) ---
    const sys = encodeURIComponent("Kamu adalah Romash AI Gen 2 buatan @maramadhona. Kamu pintar, akurat, dan bisa segalanya.");
    const query = encodeURIComponent(ask);
    const fastModels = ["openai", "mistral", "search"];

    try {
        const fastReply = await Promise.any(fastModels.map(async (model) => {
            const response = await fetch(`https://text.pollinations.ai/${query}?system=${sys}&model=${model}&seed=${Math.floor(Math.random() * 1000)}`);
            const text = await response.text();
            if (text && !text.includes("Queue full") && text.length > 2) return { text, model };
            throw new Error("Skip");
        }));

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Turbo)",
            engine: fastReply.model,
            creator: "@maramadhona",
            reply: fastReply.text.trim()
        });

    } catch (e) {
        res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            reply: "Halo! Saya Romash AI Gen 2. Sedang ada kendala sedikit, coba tanya lagi ya!"
        });
    }
}
