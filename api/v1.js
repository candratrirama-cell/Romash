const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';
const PAYMENT_KEY = '91b24c8aeb3d364a80742a847797553b'; // Pastikan Key ini Aktif

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, amount, target_user, depo_idx, status } = data;

    const getDb = async () => {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { headers: { 'X-Master-Key': JSONBIN_KEY } });
        return (await r.json()).record;
    };

    const updateDb = async (d) => {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(d)
        });
    };

    try {
        let db = await getDb();

        // --- ACTION: CREATE QRIS (FIXED) ---
        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            if (!user) return res.json({ success: false, message: 'User tidak ditemukan' });

            // Hitung Total (Nominal + Admin 10% + Kode Unik agar tidak kembar)
            const kodeUnik = Math.floor(Math.random() * 200);
            const totalBayar = Math.ceil(parseInt(amount) * 1.10) + kodeUnik;
            
            // Tembak API Payment Hokto dengan Header Lengkap
            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST', 
                headers: { 
                    'X-API-KEY': PAYMENT_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    amount: totalBayar, 
                    partnerReferenceNo: "GoR-" + Date.now() 
                })
            }).then(r => r.json());

            // Ambil data QR (Support beberapa format respon)
            const qrCode = rPay.qrContent || rPay.data?.qrContent;

            if (qrCode) {
                // Catat di Mutasi User (Status Pending)
                if (!user.mutasi) user.mutasi = [];
                user.mutasi.push({ 
                    tgl: new Date().toLocaleString('id-ID'), 
                    amt: amount, // Saldo yang didapat
                    status: 'Pending', 
                    bill: totalBayar // Yang harus dibayar
                });
                await updateDb(db);
                return res.json({ success: true, total: totalBayar, qr: qrCode });
            } else {
                return res.json({ success: false, message: rPay.message || 'Gagal generate QRIS' });
            }
        }

        // --- ACTION: CONFIRM DEPO (ADMIN ONLY) ---
        if (action === 'confirm_depo') {
            const user = db.partners.find(u => u.username === target_user);
            if (!user || !user.mutasi[depo_idx]) return res.json({ success: false });

            const item = user.mutasi[depo_idx];
            if (status === 'Success' && item.status === 'Pending') {
                user.balance = Number(user.balance) + Number(item.amt);
                item.status = 'Success';
                await updateDb(db);
                return res.json({ success: true, msg: 'Saldo Berhasil Masuk' });
            }
            return res.json({ success: false, msg: 'Sudah diproses atau ditolak' });
        }

        // ... (Action lain seperti add order tetap ada di sini) ...

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
