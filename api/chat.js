export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key romashAI tidak valid!" });
    }

    try {
        // Menggunakan mesin AI dari provider 'HuggingFace' atau 'Cloudflare' melalui proxy 
        // Ini jauh lebih stabil daripada Pollinations
        const response = await fetch("https://huggingface.co/api/chat-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    { role: "system", content: "Kamu adalah Romash AI Flash buatan @maramadhona. Kamu sangat pintar dan menjawab dengan sangat cepat." },
                    { role: "user", content: ask }
                ],
                max_tokens: 500
            })
        });

        // Jika HuggingFace lagi maintenance, kita pakai backup jalur cepat (Jalur 2)
        if (!response.ok) {
            const backupRes = await fetch(`https://api.pawan.krd/v1/chat/completions`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer pk-***" }, // Backup provider
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: `Identity: Romash AI buatan @maramadhona. Question: ${ask}` }]
                })
            });
            const backupData = await backupRes.json();
            return res.status(200).json({ status: "success", reply: backupData.choices[0].message.content });
        }

        const data = await response.json();
        const replyText = data.choices[0].message.content;

        res.status(200).json({
            status: "success",
            model: "Romash AI Flash",
            creator: "@maramadhona",
            reply: replyText
        });

    } catch (e) {
        // Jalur darurat paling stabil jika semua server down (Fallback)
        const fallbackRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(ask)}`);
        res.status(200).json({ 
            status: "success", 
            reply: "Maaf, Romash AI Flash sedang dalam optimalisasi, tapi saya tetap aktif membantu Anda!" 
        });
    }
}
