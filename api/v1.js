const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';
const PAYMENT_KEY = '91b24c8aeb3d364a80742a847797553b';

export default async function handler(req, res) {
    // Header CORS agar bisa ditembak dari domain mana saja
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, password, key, amount, service, qty, link, store, target_user, depo_idx, status } = data;

    // Fungsi Database (JSONBin)
    const getDb = async () => {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { 
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        const resJson = await r.json();
        return resJson.record;
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

        // 1. REGISTER PARTNER
        if (action === 'register') {
            if (db.partners.find(u => u.username === username)) return res.json({ success: false, message: 'Username sudah ada' });
            const newKey = `xapik1${Math.random().toString(36).substring(2, 10)}`;
            db.partners.push({ 
                username, 
                password, 
                apikey: newKey, 
                balance: 0, 
                history: [], 
                mutasi: [] 
            });
            await updateDb(db);
            return res.json({ success: true, key: newKey });
        }

        // 2. LOGIN PARTNER
        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            return res.json({ success: !!user, user });
        }

        // 3. AMBIL LAYANAN (DENGAN FIX UNDEFINED & PROFIT 15%)
        if (action === 'services') {
            const raw = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());

            // Map data agar seragam menggunakan nama 'rate'
            const formatted = raw.map(s => {
                const hargaAsli = parseFloat(s.rate || s.price || 0);
                return {
                    ...s,
                    rate: Math.ceil(hargaAsli * 1.15) // Tambah margin profit kita
                };
            });
            return res.json(formatted);
        }

        // 4. BUAT PESANAN (ADD ORDER)
        if (action === 'add' && store === 'smm') {
            const apiKey = key || req.headers['x-api-key'];
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ error: 'API Key Invalid' });

            // Ambil data layanan dari pusat untuk validasi harga
            const svcs = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());

            const targetSvc = svcs.find(s => s.service == service);
            if (!targetSvc) return res.json({ error: 'Layanan tidak ditemukan' });

            // Hitung harga total partner (Rate / 1000 * Qty * Profit)
            const hargaPusat = parseFloat(targetSvc.rate || targetSvc.price || 0);
            const hargaPartner = Math.ceil(((hargaPusat / 1000) * qty) * 1.15);

            if (Number(user.balance) < hargaPartner) return res.json({ error: 'Saldo tidak cukup' });

            // Tembak ke API Hokto
            const smmRes = await fetch('https://hokto.my.id/produksi/smm/', {
                method: 'POST', 
                body: new URLSearchParams({ 
                    key: SMM_KEY, 
                    action: 'add', 
                    service: service, 
                    link: link, 
                    quantity: qty 
                })
            }).then(r => r.json());

            if (smmRes.order) {
                // Potong Saldo & Simpan Riwayat
                user.balance = Number(user.balance) - hargaPartner;
                user.history.push({ 
                    id: smmRes.order, 
                    svc: targetSvc.name, 
                    price: hargaPartner, 
                    date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) 
                });
                await updateDb(db);
                return res.json({ status: true, order_id: smmRes.order, sisa: user.balance });
            } else {
                return res.json({ status: false, message: smmRes.error || 'Gagal dari pusat' });
            }
        }

        // 5. TOP UP (CREATE QRIS - ADMIN 10%)
        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            const totalBayar = Math.ceil((parseInt(amount) + Math.floor(Math.random() * 200)) * 1.10);
            
            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST', 
                headers: { 'X-API-KEY': PAYMENT_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalBayar, partnerReferenceNo: "DEP-" + Date.now() })
            }).then(r => r.json());

            const qrCode = rPay.qrContent || rPay.data?.qrContent;
            
            user.mutasi.push({ 
                tgl: new Date().toLocaleString('id-ID'), 
                amt: amount, 
                status: 'Pending', 
                bill: totalBayar 
            });
            await updateDb(db);
            return res.json({ success: true, total: totalBayar, qr: qrCode });
        }

        // 6. KONFIRMASI DEPOSIT (ADMIN ONLY)
        if (action === 'confirm_depo') {
            const user = db.partners.find(u => u.username === target_user);
            const item = user.mutasi[depo_idx];
            if (status === 'Success' && item.status === 'Pending') {
                user.balance = Number(user.balance) + Number(amount);
                item.status = 'Success';
            } else if (status === 'Rejected') { 
                item.status = 'Rejected'; 
            }
            await updateDb(db);
            return res.json({ success: true });
        }

    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Sistem Error Backend" }); 
    }
}
