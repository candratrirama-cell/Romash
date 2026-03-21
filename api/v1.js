const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';
const PAYMENT_KEY = '91b24c8aeb3d364a80742a847797553b';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, password, key, amount } = data;

    // Helper: Ambil Database dengan limit waktu (Timeout 5 detik)
    const getDb = async () => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);
        try {
            const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { 
                headers: { 'X-Master-Key': JSONBIN_KEY },
                signal: controller.signal
            });
            clearTimeout(id);
            const resJson = await r.json();
            return resJson.record || { partners: [] };
        } catch (e) {
            return { partners: [] };
        }
    };

    const updateDb = async (d) => {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(d)
        });
    };

    try {
        // 1. ACTION SERVICES (DIPISAH: Tidak perlu baca JSONBin, biar Cepat!)
        if (action === 'services') {
            const rSvc = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());
            
            const list = Array.isArray(rSvc) ? rSvc : [];
            return res.json(list.map(s => ({
                ...s,
                rate: Math.ceil(parseFloat(s.rate || s.price || 0) * 1.15)
            })));
        }

        // Ambil DB untuk aksi yang butuh data user
        let db = await getDb();

        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            if (!user) return res.json({ success: false, message: 'Gagal' });
            return res.json({ success: true, user });
        }

        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            if (!user) return res.json({ success: false, message: 'User tidak ditemukan' });

            const total = Math.ceil(parseInt(amount) * 1.10) + Math.floor(Math.random() * 100);
            
            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST', 
                headers: { 'X-API-KEY': PAYMENT_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, partnerReferenceNo: "DEP" + Date.now() })
            }).then(r => r.json());

            const qr = rPay.qrContent || rPay.data?.qrContent;
            if (qr) {
                if(!user.mutasi) user.mutasi = [];
                user.mutasi.push({ tgl: new Date().toLocaleString(), amt: amount, status: 'Pending', bill: total });
                await updateDb(db);
                return res.json({ success: true, qr, total });
            }
            return res.json({ success: false, message: 'Pusat Offline' });
        }

        // Action Add Order (Sama seperti logika sebelumnya yang sudah diperbaiki)
        if (action === 'add') {
            const apiKey = key || req.headers['x-api-key'];
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ status: false, error: 'Key Salah' });

            // Logic order... (Pastikan user.balance terpotong modal)
            // ... (Gunakan kode add order dari pesan sebelumnya)
        }

    } catch (e) {
        res.status(500).json({ error: "Server Busy" });
    }
}
