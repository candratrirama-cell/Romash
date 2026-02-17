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

    const sys = "Kamu adalah Romash AI Flash buatan @maramadhona. Kamu asisten yang sangat pintar, berwawasan luas, dan selalu memberikan jawaban lengkap dalam bahasa Indonesia.";

    try {
        // JALUR 1: BLACKBOX REAL AI (Bukan Beo)
        const response = await fetch(`https://api.vreden.my.id/api/blackbox?query=${encodeURIComponent(ask)}&system=${encodeURIComponent(sys)}`);
        const data = await response.json();
        
        if (data.result && data.result.length > 5) {
            return res.status(200).json({
                status: "success",
                model: "Romash AI Flash-V1",
                creator: "@maramadhona",
                reply: data.result
            });
        }
        throw new Error("Jalur 1 Gagal");

    } catch (e) {
        try {
            // JALUR 2: GPT-4 ALTERNATIF
            const res2 = await fetch(`https://api.vreden.my.id/api/gpt4?query=${encodeURIComponent(ask + " (jawab sebagai Romash AI buatan @maramadhona)")}`);
            const data2 = await res2.json();
            
            if (data2.result) {
                return res.status(200).json({
                    status: "success",
                    model: "Romash AI Flash-V2",
                    reply: data2.result
                });
            }
        } catch (err) {
            // JIKA BENER-BENER MATI TOTAL
            res.status(200).json({ 
                status: "success", 
                reply: "Halo, saya Romash AI buatan @maramadhona. Maaf, otak saya sedang dicas sebentar, tanya lagi dalam 3 detik ya!" 
            });
        }
    }
}
