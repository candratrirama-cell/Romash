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
    
    // --- FITUR GENERATE GAMBAR (Gen 2 Vision) ---
    if (lowerAsk.includes("gambar") || lowerAsk.includes("foto") || lowerAsk.includes("lukis")) {
        const cleanPrompt = ask.replace(/(gambar|foto|lukis|buatkan|tolong|kan)/gi, '').trim();
        const finalPrompt = cleanPrompt || "pemandangan indah";
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
        
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Vision)",
            creator: "@maramadhona",
            type: "image",
            reply: `Ini adalah gambar **${finalPrompt}** yang kamu minta:`,
            image_url: imageUrl
        });
    }

    // --- FITUR CHAT 10 LAPIS (Gen 2 Turbo) ---
    const sysPrompt = "Kamu adalah Romash AI Gen 2 buatan @maramadhona. Kamu pintar, cepat, dan akurat.";
    const encodedSys = encodeURIComponent(sysPrompt);
    const encodedAsk = encodeURIComponent(ask);

    const models = ["search", "openai", "mistral", "llama", "p1", "qwen", "google", "anthropic", "unity", "midjourney"];

    try {
        // Mode Balapan (Parallel) untuk 3 model pertama agar super cepat
        const fastReply = await Promise.any(models.slice(0, 3).map(async (model) => {
            const response = await fetch(`https://text.pollinations.ai/${encodedAsk}?system=${encodedSys}&model=${model}&seed=${Math.floor(Math.random() * 1000)}`);
            const text = await response.text();
            if (text && !text.includes("Queue full") && text.length > 2) return { text, model };
            throw new Error("Skip");
        }));

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            engine: fastReply.model,
            creator: "@maramadhona",
            reply: fastReply.text.trim()
        });

    } catch (e) {
        // Fallback: Coba sisa model secara berurutan jika balapan gagal
        for (let i = 3; i < models.length; i++) {
            try {
                const resFallback = await fetch(`https://text.pollinations.ai/${encodedAsk}?system=${encodedSys}&model=${models[i]}`);
                const textFallback = await resFallback.text();
                if (textFallback && !textFallback.includes("Queue full")) {
                    return res.status(200).json({
                        status: "success",
                        series: "Romash AI Gen 2",
                        engine: models[i],
                        reply: textFallback.trim()
                    });
                }
            } catch (err) { continue; }
        }

        res.status(200).json({ 
            status: "success", 
            reply: "Halo! Saya Romash AI Gen 2 buatan @maramadhona. Jalur sedang sangat padat, coba lagi ya!" 
        });
    }
}
