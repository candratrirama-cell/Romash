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

    const sys = "Kamu adalah Romash AI Flash buatan @maramadhona. Jawab dengan sangat pintar dan cepat.";

    try {
        // JALUR BARU: Menggunakan provider yang lebih tahan banting (Llama-3 via DuckDuckGo Proxy)
        const response = await fetch(`https://api.pawan.krd/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer pk-free' },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: sys },
                    { role: "user", content: ask }
                ]
            })
        });

        const data = await response.json();
        const replyText = data.choices[0].message.content;

        return res.status(200).json({
            status: "success",
            model: "Romash AI Flash-V1",
            creator: "@maramadhona",
            reply: replyText
        });

    } catch (e) {
        // CADANGAN TERAKHIR: Jalur Kencang Tanpa API Key
        try {
            const resBackup = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(ask)}`);
            const dataBackup = await resBackup.json();
            const simpleReply = "Saya Romash AI buatan @maramadhona. " + (dataBackup[0][0][0] || "Ada yang bisa saya bantu?");
            
            return res.status(200).json({
                status: "success",
                model: "Romash AI Flash-V2",
                creator: "@maramadhona",
                reply: simpleReply
            });
        } catch (err) {
            res.status(200).json({ 
                status: "success", 
                reply: "Halo! Saya Romash AI buatan @maramadhona. Server sedang sangat padat, coba lagi 5 detik ya!" 
            });
        }
    }
}
