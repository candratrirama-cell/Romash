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
    
    // --- FITUR GENERATE GAMBAR ---
    if (isImageReq) {
        const cleanPrompt = ask.replace(/(bikinkan|buatkan|tampilkan|tolong|gambar|foto|lukis|kan|bikin|ai|romash)/gi, '').trim();
        const finalPrompt = cleanPrompt || "modern art";
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`;
        
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Vision)",
            type: "image",
            reply: `Siap! Ini gambar **${finalPrompt}** buatan Romash AI:`,
            image_url: imageUrl
        });
    }

    // --- LOGIKA TIMEOUT 15 DETIK & MULTI-JALUR ---
    const sys = encodeURIComponent("Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan sangat cepat dan akurat.");
    const query = encodeURIComponent(ask);
    
    const baseModels = ["openai", "mistral", "search", "llama", "p1", "qwen", "google", "anthropic", "unity", "midjourney"];
    // Kita sebar ke 30 jalur balapan sekaligus untuk kecepatan maksimal
    const racingModels = [...baseModels, ...baseModels, ...baseModels];

    // Fungsi untuk membatasi waktu tunggu maksimal 15 detik
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT_LIMIT")), 15000)
    );

    try {
        const winner = await Promise.race([
            timeoutPromise,
            Promise.any(racingModels.map(async (model, index) => {
                // Trik Load Balancer: Membuat Seed & Identity unik per request
                const randomId = Math.floor(Math.random() * 999999999);
                const response = await fetch(`https://text.pollinations.ai/${query}?system=${sys}&model=${model}&seed=${randomId}&cache=no`);
                
                if (!response.ok) throw new Error("Slow");
                const text = await response.text();
                
                if (text && text.length > 2 && !text.includes("Queue full")) {
                    return { text, model, layer: index + 1 };
                }
                throw new Error("Antre");
            }))
        ]);

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 Ultra",
            engine: winner.model,
            layer: winner.layer,
            creator: "@maramadhona",
            reply: winner.text.trim()
        });

    } catch (e) {
        let errorMsg = "Halo! Saya Romash AI Gen 2. Jalur sangat padat karena terlalu banyak yang pakai, coba kirim ulang pesanmu ya!";
        
        if (e.message === "TIMEOUT_LIMIT") {
            errorMsg = "Maaf, waktu tunggu lebih dari 15 detik. Terlalu banyak yang pakai saat ini, silakan coba tanya lagi!";
        }

        res.status(200).json({
            status: "success",
            reply: errorMsg
        });
    }
}
