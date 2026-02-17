export default async function handler(req, res) {
    // 1. Ambil data dari link (URL)
    const { key, ask } = req.query;

    // 2. Daftar Kunci Restoran (API Key) kamu
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // 3. Cek Kunci
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ error: "API Key romashAI salah!" });
    }

    if (!ask) {
        return res.status(400).json({ error: "Tanya apa? Isi parameter 'ask' ya." });
    }

    try {
        // 4. Identitas romashAI
        const identitas = "Namamu adalah romashAI, asisten AI pintar.";
        
        // 5. Panggil AI pake 'fetch' (Bawaan JavaScript, Gak perlu instal apa-apa)
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=${encodeURIComponent(identitas)}`);
        const data = await response.text();

        // 6. Kasih jawaban otomatis
        return res.status(200).json({
            status: "success",
            nama: "romashAI",
            reply: data
        });

    } catch (error) {
        return res.status(500).json({ error: "Gagal nyambung ke server romashAI." });
    }
}
