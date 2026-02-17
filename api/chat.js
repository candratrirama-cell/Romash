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
    const isImageReq = /(gambar|foto|lukis|buatkan|bikin)/gi.test(lowerAsk);
    
    // --- FITUR GAMBAR (Otomatis & Ringan) ---
    if (isImageReq) {
        const cleanPrompt = ask.replace(/(bikinkan|buatkan|tampilkan|tolong|gambar|foto|lukis|kan|bikin|ai|romash)/gi, '').trim();
        const finalPrompt = cleanPrompt || "pemandangan";
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
        
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            type: "image",
            reply: `Ini gambar **${finalPrompt}** buat kamu:`,
            image_url: imageUrl
        });
    }

    // --- FITUR CHAT 3 JALUR BALAPAN (TANPA BATAS WAKTU) ---
    const sys = encodeURIComponent("Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan cerdas dan cepat.");
    const query = encodeURIComponent(ask);
    
    // 3 Model terbaik untuk diadu kecepatannya
    const models = ["openai", "mistral", "search"];

    try {
        // Balapan: Siapa yang paling cepat merespon, itu yang diambil
        const winner = await Promise.any(models.map(async (model) => {
            const seed = Math.floor(Math.random() * 100000);
            const response = await fetch(`https://text.pollinations.ai/${query}?system=${sys}&model=${model}&seed=${seed}`);
            
            if (!response.ok) throw new Error("Gagal");
            const text = await response.text();
            
            if (text && text.length > 2 && !text.includes("Queue full")) {
                return { text, model };
            }
            throw new Error("Antre");
        }));

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            engine: winner.model,
            creator: "@maramadhona",
            reply: winner.text.trim()
        });

    } catch (e) {
        // Fallback terakhir jika semua jalur benar-benar macet total
        const finalTry = await fetch(`https://text.pollinations.ai/${query}?system=${sys}`);
        const finalText = await finalTry.text();
        
        res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Final)",
            reply: finalText.includes("Queue full") ? "Maaf, semua jalur lagi penuh banget. Coba tanya lagi sebentar ya!" : finalText
        });
    }
}
