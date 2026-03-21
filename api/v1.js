const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';
const PAYMENT_KEY = '91b24c8aeb3d364a80742a847797553b';

export default async function handler(req, res) {
    // 1. SET HEADER CORS (PENTING AGAR BISA DIAKSES DARI LUAR)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, password, key, service, qty, link, markup, amount, target_user, depo_idx, status } = data;

    // FUNGSI HELPER: AMBIL DATABASE
    const getDb = async () => {
        try {
            const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { 
                headers: { 'X-Master-Key': JSONBIN_KEY },
                cache: 'no-store' 
            });
            const resJson = await r.json();
            return resJson.record || { partners: [] };
        } catch (e) {
            console.error("Gagal ambil DB:", e);
            return null;
        }
    };

    // FUNGSI HELPER: UPDATE DATABASE + AUTO-CLEANUP
    const updateDb = async (d) => {
        // Diet Data: Batasi riwayat & mutasi agar file JSON tetap ringan
        if (d.partners) {
            d.partners.forEach(u => {
                if (u.history) u.history = u.history.slice(-10);
                if (u.mutasi) u.mutasi = u.mutasi.slice(-10);
            });
        }
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(d)
        });
    };

    try {
        // --- AKSI TANPA DATABASE (SERVICES) ---
        if (action === 'services') {
            const rSvc = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());
            
            const list = Array.isArray(rSvc) ? rSvc : [];
            return res.json(list.map(s => ({
                ...s,
                rate: Math.ceil(parseFloat(s.rate || s.price || 0) * 1.15) // Untung Admin 15%
            })));
        }

        const db = await getDb();
        if (!db) return res.status(500).json({ success: false, message: "Database Down" });

        // --- LOGIN ---
        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            return res.json({ success: !!user, user: user || null });
        }

        // --- REGISTER ---
        if (action === 'register') {
            if (db.partners.find(u => u.username === username)) {
                return res.json({ success: false, message: "Username sudah ada" });
            }
            const newKey = `xapik1${Math.random().toString(36).substring(2, 12)}`;
            db.partners.push({ 
                username, password, apikey: newKey, balance: 0, history: [], mutasi: [] 
            });
            await updateDb(db);
            return res.json({ success: true, key: newKey });
        }

        // --- ADMIN: GET ALL PENDING DEPOSITS ---
        if (action === 'get_all_depo') {
            let pending = [];
            db.partners.forEach(u => {
                if (u.mutasi) {
                    u.mutasi.forEach((m, i) => {
                        if (m.status === 'Pending') {
                            pending.push({ username: u.username, index: i, ...m });
                        }
                    });
                }
            });
            return res.json(pending);
        }

        // --- ADMIN: CONFIRM DEPO ---
        if (action === 'confirm_depo') {
            const user = db.partners.find(u => u.username === target_user);
            if (!user || !user.mutasi[depo_idx]) return res.json({ success: false });

            const item = user.mutasi[depo_idx];
            if (status === 'Success' && item.status === 'Pending') {
                user.balance = (Number(user.balance) || 0) + Number(item.amt);
                item.status = 'Success';
            } else if (status === 'Canceled') {
                item.status = 'Canceled';
            }
            await updateDb(db);
            return res.json({ success: true });
        }

        // --- USER: CREATE QRIS ---
        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            if (!user) return res.json({ success: false });

            const randomCode = Math.floor(Math.random() * 100);
            const total = Math.ceil(parseInt(amount) * 1.10) + randomCode; // Admin 10% + Kode Unik

            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST', 
                headers: { 'X-API-KEY': PAYMENT_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, partnerReferenceNo: "GoR" + Date.now() })
            }).then(r => r.json());

            const qr = rPay.qrContent || rPay.data?.qrContent;
            if (qr) {
                if (!user.mutasi) user.mutasi = [];
                user.mutasi.push({ 
                    tgl: new Date().toLocaleString('id-ID'), 
                    amt: amount, 
                    status: 'Pending', 
                    bill: total 
                });
                await updateDb(db);
                return res.json({ success: true, qr, total });
            }
            return res.json({ success: false, message: "Server Payment Sibuk" });
        }

        // --- USER: ADD ORDER (SALDO POTONG MODAL) ---
        if (action === 'add') {
            const user = db.partners.find(u => u.apikey === (key || req.headers['x-api-key']));
            if (!user) return res.json({ status: false, error: "API Key Salah" });

            const svcs = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());

            const target = svcs.find(s => s.service == service);
            if (!target) return res.json({ status: false, error: "Layanan Tidak Ditemukan" });

            // Hitung Modal Seller (Dipotong dari saldo)
            const modal = Math.ceil(((parseFloat(target.rate || target.price) / 1000) * qty) * 1.15);
            // Hitung Harga Jual (Markup Seller)
            const persenMarkup = parseFloat(markup || 0) / 100;
            const hargaJual = Math.ceil(modal * (1 + persenMarkup));

            if (user.balance < modal) return res.json({ status: false, error: "Saldo Kurang" });

            // Tembak Hokto
            const resH = await fetch('https://hokto.my.id/produksi/smm/', {
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'add', service, link, quantity: qty })
            }).then(r => r.json());

            if (resH.order) {
                user.balance -= modal;
                user.history.push({ 
                    id: resH.order, 
                    svc: target.name, 
                    price: modal, 
                    sell: hargaJual, 
                    date: new Date().toLocaleString('id-ID') 
                });
                await updateDb(db);
                return res.json({ status: true, order: resH.order, price: hargaJual });
            }
            return res.json({ status: false, error: "Gagal di Pusat" });
        }

        res.json({ message: "GoR 1.1 API Online" });

    } catch (e) {
        res.status(500).json({ error: "System Error: " + e.message });
    }
}
