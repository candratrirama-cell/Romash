export default async function handler(req, res) {
    // WAJIB: Supaya website orang lain bisa akses server kamu tanpa diblokir
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { return res.status(200).end(); }

    const { key, ask } = req.query;
    const DAFTAR_KUNCI = ["romash1ai", "romash9ai", "romash0ai", "Romash5ai", "romash8ai"];

    // Cek apakah API Key yang dimasukkan orang di website mereka itu valid
    if (!key || !DAFTAR_KUNCI.includes(key)) {
        return res.status(401).json({ 
            status: "error", 
            message: "API Key romashAI tidak valid!" 
        });
    }

    try {
        // Proses memanggil otak AI (Pollinations sebagai mesin belakangnya)
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ask)}?system=Kamu adalah romashAI, asisten pintar.`);
        const text = await response.text();

        // Kirim jawaban balik ke website orang tersebut
        res.status(200).json({
            status: "success",
            reply: text
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: "Server romashAI sibuk." });
    }
}
