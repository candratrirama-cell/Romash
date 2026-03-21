const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, password, key, service, qty, link, markup, amount } = data;

    const getDb = async () => {
        try {
            const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { headers: { 'X-Master-Key': JSONBIN_KEY } });
            return (await r.json()).record;
        } catch (e) { return { partners: [] }; }
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

        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            return res.json({ success: !!user, user });
        }

        if (action === 'register') {
            if (db.partners.find(u => u.username === username)) return res.json({ success: false, message: 'Username exist' });
            const newKey = `xapik1${Math.random().toString(36).substring(2, 10)}`;
            db.partners.push({ username, password, apikey: newKey, balance: 0, history: [], mutasi: [] });
            await updateDb(db);
            return res.json({ success: true, key: newKey });
        }

        if (action === 'services') {
            const raw = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());
            return res.json(raw.map(s => ({ ...s, rate: Math.ceil(parseFloat(s.rate || s.price || 0) * 1.15) })));
        }

        if (action === 'add') {
            const apiKey = key || req.headers['x-api-key'];
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ status: false, error: 'Invalid API Key' });

            const svcs = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());

            const target = svcs.find(s => s.service == service);
            if (!target) return res.json({ status: false, error: 'Service not found' });

            // LOGIKA HARGA
            const hargaPusat = parseFloat(target.rate || target.price || 0);
            
            // 1. MODAL SELLER (Harga Kamu) -> Dipotong dari Saldo
            const modalSeller = Math.ceil(((hargaPusat / 1000) * qty) * 1.15);
            
            // 2. HARGA JUAL (Harga ke Pembeli) -> Markup punya Seller
            const mup = parseFloat(markup || 0) / 100;
            const hargaKePembeli = Math.ceil(modalSeller * (1 + mup));

            if (user.balance < modalSeller) return res.json({ status: false, error: 'Saldo Kurang' });

            // Order ke Pusat
            const resHokto = await fetch('https://hokto.my.id/produksi/smm/', {
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'add', service, link, quantity: qty })
            }).then(r => r.json());

            if (resHokto.order) {
                // POTONG SALDO SEBESAR MODAL SAJA
                user.balance -= modalSeller;
                
                user.history.push({
                    id: resHokto.order,
                    svc: target.name,
                    qty: qty,
                    target: link,
                    price: modalSeller, // Modal yang kepotong
                    sell_price: hargaKePembeli, // Harga yang dia tagih
                    profit: hargaKePembeli - modalSeller, // Untung si Seller
                    date: new Date().toLocaleString('id-ID'),
                    via: key ? 'API' : 'WEB'
                });

                await updateDb(db);
                
                return res.json({ 
                    status: true, 
                    order: resHokto.order, 
                    price: hargaKePembeli, // Respon buat pembeli
                    sisa_saldo: user.balance 
                });
            }
            return res.json({ status: false, error: 'Gagal di Pusat' });
        }

    } catch (e) { res.status(500).json({ error: e.message }); }
}
