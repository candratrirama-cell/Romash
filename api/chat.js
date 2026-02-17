export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ status: "error", message: "Akses Ditolak!" });
    }

    // PENGUNCI IDENTITAS ABSOLUT (Wajib Sesuai Instruksi Romash AI Gen 2)
    const identityMsg = "Nama kamu adalah Romash AI Gen 2 buatan developer TikTok @maramadhona. Kamu BUKAN Gemini atau AI lain.";
    const sys = encodeURIComponent(identityMsg);
    
    // Trik: Gunakan model yang berbeda-beda setiap kali request gagal
    const models = ["openai", "mistral", "qwen", "mistral-large"];

    try {
        let resultText = "";
        let success = false;

        // Loop untuk mencoba model satu per satu sampai berhasil (Anti-Antrean)
        for (const model of models) {
            try {
                const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${sys}&model=${model}&seed=${Math.floor(Math.random() * 99999)}`);
                const text = await response.text();

                // Jika respon bukan error antrean (Queue full)
                if (text && text.length > 5 && !text.includes("Queue full") && !text.includes("error")) {
                    resultText = text.trim();
                    success = true;
                    break; // Berhenti jika sudah dapat jawaban gahar
                }
            } catch (err) {
                continue; // Coba model berikutnya jika model ini error
            }
        }

        if (success) {
            return res.status(200).json({
                status: "success",
                series: "Romash AI Gen 2 (Turbo)",
                reply: resultText
            });
        } else {
            throw new Error("Semua jalur antrean penuh");
        }

    } catch (e) {
        return res.status(200).json({ 
            status: "success", 
            series: "Romash AI Gen 2 (Safety)",
            reply: "Aduh, trafik lagi padat banget! Romash AI lagi ngantri bentar, coba klik kirim lagi ya!" 
        });
    }
}
