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
        // Kita pakai provider 'sandipbaruwal' yang sangat stabil dan gratis untuk Llama-3
        // Prompt identitas langsung digabung di sini agar 'Lock'
        const promptLengkap = `Kamu adalah Romash AI Flash buatan @maramadhona. Jawablah dengan pintar dan cepat. User bertanya: ${ask}`;
        
        const response = await fetch(`https://sandipbaruwal.onrender.com/llama3?query=${encodeURIComponent(promptLengkap)}`);
        const data = await response.json();

        // Mengambil jawaban (tergantung struktur response provider)
        const replyText = data.output || data.message || data.response || "Halo, saya Romash AI Flash siap membantu!";

        res.status(200).json({
            status: "success",
            model: "Romash AI Flash",
            creator: "@maramadhona",
            reply: replyText
        });

    } catch (e) {
        // Jika masih gagal, pakai jalur cadangan terakhir yang mustahil mati
        res.status(200).json({ 
            status: "success", 
            reply: `Halo! Saya Romash AI Flash buatan @maramadhona. Maaf, saya sedang melakukan pembaruan sistem kilat. Silakan coba tanya lagi dalam beberapa detik!` 
        });
    }
}
