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

    // 2. MENGAMBIL DATA DARI REQUEST
    const { message, apikey } = req.body;

    // 3. SISTEM VALIDASI API KEY
    if (!apikey || !DAFTAR_KEY.includes(apikey)) {
        return res.status(401).json({ 
            success: false, 
            status: "error",
            message: "apikey : invalid atau tidak terdaftar" 
        });
    }

    // 4. VALIDASI PESAN
    if (!message) {
        return res.status(400).json({ 
            success: false, 
            message: "message : required (pesan tidak boleh kosong)" 
        });
    }

    try {
        // 5. MENGHUBUNGKAN KE KERNEL ROMASH AI
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: "system", 
                        content: "Kamu adalah Romash AI 1.0. Kamu dikembangkan sepenuhnya oleh @maramadhona. Kamu adalah AI yang sangat cerdas dan membantu. Jika ditanya siapa pembuatmu, selalu jawab @maramadhona." 
                    },
                    { role: "user", content: message }
                ],
                model: "openai"
            })
        });

        const result = await response.text();

        // 6. MENGIRIM JAWABAN BALIK KE PENGGUNA
        return res.status(200).json({
            success: true,
            status: "Authorized",
            developer: "@maramadhona",
            apikey_used: apikey,
            answer: result
        });

    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error: Gagal terhubung ke Kernel Romash" 
        });
    }
}
