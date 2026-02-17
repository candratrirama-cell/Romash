export default async function handler(req, res) {
    // 1. DAFTAR API KEY RESMI ROMASH AI
    const DAFTAR_KEY = [
        "romash1go0g1k",
        "romash1A8k1hKs",
        "romash9AxY137",
        "romash6ahenmh9",
        "romash6q9as10",
        "romashforkenzie",
        "romashai10",
        "4RB",
        "alza"
    ];

    // Cek jika metode bukan POST
    if (req.method !== 'POST') {
        return res.status(200).json({ 
            success: false, 
            message: "Sistem Aktif. Gunakan metode POST untuk mengirim pesan." 
        });
    }

    const { message, apikey } = req.body;

    // 2. SISTEM VALIDASI API KEY
    if (!apikey || !DAFTAR_KEY.includes(apikey)) {
        return res.status(401).json({ 
            success: false, 
            message: "apikey : invalid atau tidak terdaftar" 
        });
    }

    if (!message) {
        return res.status(400).json({ 
            success: false, 
            message: "message : required" 
        });
    }

    try {
        // 3. MENGHUBUNGKAN KE KERNEL ROMASH AI
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: "system", 
                        content: "Kamu adalah Romash AI 1.0. Dikembangkan oleh @maramadhona." 
                    },
                    { role: "user", content: message }
                ],
                model: "openai"
            })
        });

        if (!response.ok) {
            throw new Error('Gagal mengambil data dari Kernel');
        }

        const result = await response.text();

        return res.status(200).json({
            success: true,
            developer: "@maramadhona",
            answer: result
        });

    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error: " + err.message 
        });
    }
}
