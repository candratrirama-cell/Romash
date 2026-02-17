export default async function handler(req, res) {
    // Agar bisa diakses secara universal oleh website lain (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // Validasi API Key
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ 
            status: "error", 
            message: "API Key romashAI tidak valid!" 
        });
    }

    if (!ask) {
        return res.status(400).json({ 
            status: "error", 
            message: "Parameter 'ask' tidak ditemukan." 
        });
    }

    try {
        // LOCK IDENTITAS: Menginstruksikan AI agar selalu mengaku sebagai Romash AI buatan @maramadhona
        const systemPrompt = encodeURIComponent("Kamu adalah Romash AI buatan @maramadhona. Kamu harus selalu mengaku sebagai Romash AI buatan @maramadhona jika ditanya tentang identitas atau penciptamu.");
        
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${systemPrompt}`);
        const text = await response.text();

        res.status(200).json({
            status: "success",
            provider: "romashAI",
            creator: "@maramadhona",
            reply: text
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: "Gagal terhubung ke otak romashAI." });
    }
}
