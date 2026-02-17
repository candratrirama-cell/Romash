export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const GEMINI_API_KEY = "AIzaSyC9FvUDS1sGbwIMRwMG5Y2Jo_unv1XrBuo"; // Pastikan key benar
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "Key Romash Salah!" });
    }

    try {
        // Gunakan v1 (bukan v1beta jika ingin lebih stabil)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: ask }] }],
                // Menambahkan safety settings agar tidak mudah kena blokir filter
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            // Jika error karena limit, kasih pesan yang jelas
            const msg = data.error.code === 429 ? "Server Gemini lagi rame, tunggu semenit ya!" : data.error.message;
            return res.status(data.error.code || 500).json({ status: "error", message: msg });
        }

        const replyText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2",
            reply: replyText.trim()
        });

    } catch (e) {
        return res.status(500).json({ status: "error", message: "Gagal menyambung ke otak Google." });
    }
}
