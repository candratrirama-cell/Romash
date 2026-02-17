import { GoogleGenerativeAI } from "@google/generative-ai";

// Pastikan API Key Gemini ditaruh di Environment Variable untuk keamanan extra
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyC9FvUDS1sGbwIMRwMG5Y2Jo_unv1XrBuo");

export default async function handler(req, res) {
    // CORS Header agar bisa dipanggil dari UI buatanmu
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // 1. Validasi Akses
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "API Key Romash tidak valid!" });
    }

    if (!ask) return res.status(400).json({ status: "error", message: "Tanya apa hari ini?" });

    try {
        // 2. Setting Karakter: Cerdas, Sopan, Akurat, Cepat
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Kamu adalah Romash AI Gen 2 buatan @maramadhona. " +
                               "Kepribadianmu: Sangat Cerdas, Sopan, Akurat, dan Cepat dalam merespon. " +
                               "Selalu berikan jawaban yang bermanfaat dan gunakan bahasa yang santun."
        });

        // 3. Eksekusi (Dengan Safety Settings agar tetap Sopan)
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: ask }] }],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7, // Seimbang antara kreatif dan akurat
            }
        });

        const text = result.response.text();

        return res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Turbo)",
            engine: "Gemini-Engine",
            creator: "@maramadhona",
            reply: text.trim()
        });

    } catch (e) {
        // 4. Fallback ke Pollinations jika Gemini limit/error
        const fallback = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=Kamu adalah Romash AI Gen 2 yang Sopan dan Akurat.`);
        const fallbackText = await fallback.text();

        res.status(200).json({
            status: "success",
            series: "Romash AI Gen 2 (Fallback)",
            reply: fallbackText
        });
    }
}
