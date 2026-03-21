const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';

export default async function handler(req, res) {
    // Header CORS agar aman ditembak dari mana saja
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Gabungkan query dan body (support POST & GET)
    const data = { ...req.query, ...req.body };
    const { action, username, password, key, service, qty, link, markup, amount } = data;

    // FUNGSI DATABASE (JSONBIN)
    const getDb = async () => {
        try {
            const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { 
                headers: { 'X-Master-Key': JSONBIN_KEY }
            });
            const result = await r.json();
            let db = result.record;
            
            // PROTEKSI: Pastikan struktur partners ada
            if (!db || !db.partners) {
                db = { partners: db.partners || [] };
            }
            return db;
        } catch (e) {
            console.error("Database Fetch Error:", e);
            return { partners: [] }; // Balikan data kosong jika bin error
        }
    };

    const updateDb = async (d) => {
        try {
            await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
                body: JSON.stringify(d)
            });
        } catch (e) {
            console.error("Database Update Error:", e);
        }
    };

    try {
        let db = await getDb();

        // 1. REGISTER
        if (action === 'register') {
            if (!username || !password) return res.json({ success: false, message: 'Data tidak lengkap' });
            if (db.partners.find(u => u.username === username)) {
                return res.json({ success: false, message: 'Username sudah terpakai' });
            }
            const newKey = `xapik1${Math.random().toString(36).substring(2, 12)}`;
            const newUser = { 
                username, 
                password, 
                apikey: newKey, 
                balance: 0, 
                history: [], 
                mutasi: [] 
            };
            db.partners.push(newUser);
            await updateDb(db);
            return res.json({ success: true, key: newKey });
        }

        // 2. LOGIN
        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            if (user) {
                return res.json({ success: true, user });
            } else {
                return res.json({ success: false, message: 'Username/Password salah' });
            }
        }

        // 3. SERVICES (AMBIL DARI HOKTO)
        if (action === 'services') {
            try {
                const response = await fetch('https://hokto.my.id/produksi/smm/', { 
                    method: 'POST', 
                    body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
                });
                const raw = await response.json();
                
                // Standarisasi harga ke properti 'rate' + Margin 15%
                const formatted = Array.isArray(raw) ? raw.map(s => {
                    const price = parseFloat(s.rate || s.price || 0);
                    return { ...s, rate: Math.ceil(price * 1.15) };
                }) : [];
                
                return res.json(formatted);
            } catch (e) {
                return res.json({ error: "Gagal memuat layanan dari pusat" });
            }
        }

        // 4. ADD ORDER (LOGIKA SALDO + RIWAYAT + MARKUP)
        if (action === 'add') {
            const apiKey = key || req.headers['x-api-key'];
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ status: false, error: 'API Key Invalid' });

            // Cek harga terbaru di pusat
            const svcsRaw = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());

            const target = svcsRaw.find(s => s.service == service);
            if (!target) return res.json({ status: false, error: 'Layanan tidak ditemukan' });

            const hargaPusat = parseFloat(target.rate || target.price || 0);
            const hargaDasarGoR = Math.ceil(((hargaPusat / 1000) * qty) * 1.15);
            
            // Hitung harga jual seller (markup partner)
            const persenMarkup = parseFloat(markup || 0) / 100;
            const hargaJualPartner = Math.ceil(hargaDasarGoR * (1 + persenMarkup));

            if (Number(user.balance) < hargaDasarGoR) {
                return res.json({ status: false, error: 'Saldo Anda tidak cukup' });
            }

            // Tembak Hokto
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
                // Potong Saldo & Catat Log
                user.balance = Number(user.balance) - hargaDasarGoR;
                user.history.push({ 
                    id: smmRes.order, 
                    svc: target.name, 
                    qty, target: link, 
                    price: hargaDasarGoR, 
                    sell_price: hargaJualPartner,
                    date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
                    via: key ? 'API_KEY' : 'DASHBOARD'
                });
                await updateDb(db);
                return res.json({ status: true, order_id: smmRes.order, price: hargaJualPartner, sisa: user.balance });
            } else {
                return res.json({ status: false, error: smmRes.error || 'Gagal diproses pusat' });
            }
        }

        // 5. CREATE QRIS
        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            if(!user) return res.json({ error: 'User tidak ditemukan' });
            
            const total = Math.ceil(parseInt(amount) * 1.10); // Admin 10%
            const r = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, partnerReferenceNo: "GoR-" + Date.now() })
            }).then(r => r.json());

            return res.json({ success: true, qr: r.qrContent || r.data?.qrContent, total });
        }

        // Jika action tidak ditemukan
        res.json({ message: "GoR 1.1 API Online" });

    } catch (e) {
        console.error("Global Error:", e);
        res.status(500).json({ error: "Internal Server Error", detail: e.message });
    }
}
