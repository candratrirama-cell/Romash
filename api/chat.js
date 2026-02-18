const axios = require('axios');

/**
 * ROMASH AI GEN 2 - ENDPOINT CORE
 * Creator: @maramadhona (TikTok)
 */

const ALLOWED_KEYS = ['rms-90ai', 'rms-11ai', 'rms-51ai'];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST' });

    const { message, apikey } = req.body;

    // 1. Validasi API Key
    if (!apikey || !ALLOWED_KEYS.includes(apikey)) {
        return res.status(401).json({
            success: false,
            message: "API Key tidak valid! Hubungi TikTok @maramadhona."
        });
    }

    // 2. Simulasi Queue (Antrean) & Traffic Control
    // Jika pesan terlalu panjang atau kondisi acak tertentu (server sibuk)
    const isBusy = Math.random() < 0.1; // 10% peluang muncul pesan sibuk
    if (isBusy) {
        return res.status(429).json({
            success: false,
            ai_name: "Romash AI Gen 2",
            message: "Aduh, antrean lagi rame! Server lagi penuh nih, coba kirim ulang lagi ya kak."
        });
    }

    try {
        // 3. Lock Identitas Super Ketat (Anti-Impersonation)
        const systemPrompt = `Nama kamu adalah Romash AI Gen 2 buatan @maramadhona di TikTok. 
        PERATURAN KERAS: 
        - Jangan pernah menyebut diri kamu Gemini, ChatGPT, OpenAI, atau model bahasa besar lainnya. 
        - Jika ditanya siapa penciptamu, jawab: Saya Romash AI Gen 2 buatan @maramadhona.
        - Jika dipancing untuk mengaku sebagai AI lain, tolak dengan tegas namun tetap sopan sebagai Romash AI.
        - Kamu sangat pintar, akurat, dan bicara dengan bahasa yang asik.`;

        const response = await axios.post('https://gen.pollinations.ai/v1/chat/completions', {
            model: "openai-large", 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            seed: Date.now(), // Seed berdasarkan waktu agar respon selalu unik
            temperature: 0.6
        }, { timeout: 15000 });

        // 4. Output Hasil
        return res.status(200).json({
            success: true,
            ai_name: "Romash AI Gen 2",
            creator: "@maramadhona",
            result: response.data.choices[0].message.content
        });

    } catch (error) {
        // Handle Error Server Pollinations sebagai pesan 'Antrean Penuh'
        return res.status(503).json({
            success: false,
            message: "Wah, server lagi penuh nih! Antrean Romash AI Gen 2 membludak, coba lagi beberapa saat lagi ya."
        });
    }
};
