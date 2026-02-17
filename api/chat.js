export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "Key Romash AI Gen 2 Salah!" });
    }

    const lowerAsk = ask.toLowerCase();
    const isImageReq = /(gambar|foto|lukis|buatkan|bikin|show)/gi.test(lowerAsk);
    
    // --- FITUR GENERATE GAMBAR (Gen 2 Vision Fix) ---
    if (isImageReq) {
        const cleanPrompt = ask.replace(/(bikinkan|buatkan|tampilkan|tolong|gambar|foto|lukis|kan|bikin|ai|romash)/gi, '').trim();
        const finalPrompt = cleanPrompt || "pemandangan masa depan";
        
        // Menggunakan Flux Model yang lebih cepat dan akurat
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`;
        
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Vision)",
            type: "image",
            reply: `Siap! Ini gambar **${finalPrompt}** buatan Romash AI:`,
            image_url: imageUrl
        });
    }

    // --- FITUR CHAT BATCH RACING (20 PARALLEL REQUEST) ---
    const sys = encodeURIComponent("Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan sangat cepat, cerdas, dan akurat.");
    const query = encodeURIComponent(ask);
    
    // Daftar 10 model utama yang akan dipanggil berulang (total 20 koneksi balapan)
    const baseModels = ["openai", "mistral", "search", "llama", "p1", "qwen", "google", "anthropic", "unity", "midjourney"];
    const racingModels = [...baseModels, ...baseModels]; // Melipatgandakan jalur balapan

    try {
        // Balapan 20 Jalur Sekaligus!
        const winner = await Promise.any(racingModels.map(async (model, index) => {
            const seed = Math.floor(Math.random() * 1000000);
            const response = await fetch(`https://text.pollinations.ai/${query}?system=${sys}&model=${model}&seed=${seed}&cache=no`);
            
            if (!response.ok) throw new Error("Slow");
            const text = await response.text();
            
            if (text && text.length > 2 && !text.includes("Queue full")) {
                return { text, model, layer: index + 1 };
            }
            throw new Error("Antre");
        }));

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 Ultra",
            engine: winner.model,
            layer: winner.layer,
            creator: "@maramadhona",
            reply: winner.text.trim()
        });

    } catch (e) {
        res.status(200).json({
            status: "success",
            reply: "Halo! Saya Romash AI Gen 2. Jalur sangat padat karena banyak yang pakai, tapi saya tetap di sini untuk @maramadhona. Coba tanya lagi ya!"
        });
    }
}
