const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';
const PAYMENT_KEY = '91b24c8aeb3d364a80742a847797553b';

export default async function handler(req, res) {
    // Header Keamanan & CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, password, key, amount, service, qty, link, store, target_user, depo_idx, status } = data;

    // Fungsi Internal Akses Database JSONBin
    const getDb = async () => {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { 
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        const resJson = await r.json();
        return resJson.record;
    };

    const updateDb = async (newContent) => {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(newContent)
        });
    };

    try {
        let db = await getDb();

        // 1. REGISTER: Membuat akun partner baru & Auto Generate API Key xapik1
        if (action === 'register') {
            if (db.partners.find(u => u.username === username)) {
                return res.json({ success: false, message: 'Username sudah digunakan' });
            }
            const randomStr = Math.random().toString(36).substring(2, 8);
            const newKey = `xapik1${randomStr}${Date.now().toString().slice(-4)}`;
            
            db.partners.push({ 
                username, password, apikey: newKey, balance: 0, history: [], mutasi: [] 
            });
            await updateDb(db);
            return res.json({ success: true, key: newKey });
        }

        // 2. LOGIN: Autentikasi Partner
        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            if (!user) return res.json({ success: false });
            return res.json({ success: true, user });
        }

        // 3. CREATE QRIS: Top Up dengan pajak admin 10%
        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            const nominal = parseInt(amount);
            const totalBayar = Math.ceil((nominal + Math.floor(Math.random() * 200)) * 1.10);
            
            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST',
                headers: { 'X-API-KEY': PAYMENT_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalBayar, partnerReferenceNo: "DEP-" + Date.now() })
            }).then(r => r.json());
            
            user.mutasi.push({ 
                tgl: new Date().toLocaleString(), amt: nominal, status: 'Pending', bill: totalBayar 
            });
            await updateDb(db);
            return res.json({ success: true, total: totalBayar, qr: rPay.qrContent || rPay.data?.qrContent });
        }

        // 4. CONFIRM DEPO (KHUSUS ADMIN): Terima/Tolak Saldo
        if (action === 'confirm_depo') {
            const user = db.partners.find(u => u.username === target_user);
            const item = user.mutasi[depo_idx];
            
            if (status === 'Success' && item.status === 'Pending') {
                user.balance += parseInt(amount);
                item.status = 'Success';
            } else if (status === 'Rejected') {
                item.status = 'Rejected';
            }
            await updateDb(db);
            return res.json({ success: true });
        }

        // 5. ORDER SMM: Eksekusi pesanan dengan profit 15%
        const apiKey = key || req.headers['x-api-key'];
        if (action === 'add' && store === 'smm' && apiKey?.startsWith('xapik1')) {
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ error: 'API Key Invalid' });

            const svcs = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());
            
            const target = svcs.find(s => s.service == service);
            const hargaPartner = Math.ceil(((parseFloat(target.rate) / 1000) * qty) * 1.15);

            if (user.balance < hargaPartner) return res.json({ error: 'Saldo API Tidak Cukup' });

            const smmRes = await fetch('https://hokto.my.id/produksi/smm/', {
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'add', service, link, quantity: qty })
            }).then(r => r.json());

            if (smmRes.order) {
                user.balance -= hargaPartner;
                user.history.push({ id: smmRes.order, svc: target.name, price: hargaPartner, date: new Date().toLocaleString() });
                await updateDb(db);
                return res.json({ status: true, order_id: smmRes.order, sisa_saldo: user.balance });
            }
            return res.json({ status: false, message: 'Gagal diproses SMM' });
        }

        // 6. SERVICES: List Layanan dengan harga sudah profit 15%
        if (action === 'services') {
            const raw = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());
            return res.json(raw.map(s => ({ ...s, rate: Math.ceil(parseFloat(s.rate) * 1.15) })));
        }

    } catch (e) {
        return res.status(500).json({ error: "System Error", msg: e.message });
    }
}
