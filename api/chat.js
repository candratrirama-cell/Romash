export default async function handler(req, res) {
    const { key, ask } = req.query;
    if (key !== "romash1ai") return res.status(401).json({ error: "Key Salah" });

    const lowerAsk = ask.toLowerCase();
    
    // Fitur Gambar: Hanya jalan kalau diminta (Hemat Resource)
    if (lowerAsk.includes("gambar") || lowerAsk.includes("foto")) {
        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(ask)}?width=512&height=512&nologo=true`; // Resolusi 512 biar ringan di HP
        return res.status(200).json({ type: "image", reply: "Ini gambarnya:", image_url: imgUrl });
    }

    try {
        // GANTI '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' dengan key dari console.groq.com
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer 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`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Model ini sangat cepat dan ringan
                messages: [
                    { role: "system", content: "Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab singkat dan padat." },
                    { role: "user", content: ask }
                ],
                max_tokens: 500 // Membatasi agar respon tidak terlalu panjang & berat
            })
        });

        const data = await response.json();
        res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Flash)",
            reply: data.choices[0].message.content
        });
    } catch (e) {
        res.status(200).json({ reply: "Sistem sibuk, coba lagi ya!" });
    }
}
