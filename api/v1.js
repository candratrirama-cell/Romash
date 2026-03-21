const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';
const PAYMENT_KEY = '91b24c8aeb3d364a80742a847797553b';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = { ...req.query, ...req.body };
    const { action, username, password, key, amount, service, qty, link, store, target_user, depo_idx, status } = data;

    const getDb = async () => {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { headers: { 'X-Master-Key': JSONBIN_KEY }});
        return (await r.json()).record;
    };
    const updateDb = async (d) => {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(d)
        });
    };

    try {
        let db = await getDb();

        if (action === 'register') {
            if (db.partners.find(u => u.username === username)) return res.json({ success: false, message: 'Username Exist' });
            const newKey = `xapik1${Math.random().toString(36).substring(2, 10)}`;
            db.partners.push({ username, password, apikey: newKey, balance: 0, history: [], mutasi: [] });
            await updateDb(db);
            return res.json({ success: true, key: newKey });
        }

        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            return res.json({ success: !!user, user });
        }

        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            const nominal = parseInt(amount);
            const total = Math.ceil((nominal + Math.floor(Math.random() * 200)) * 1.10);
            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST', headers: { 'X-API-KEY': PAYMENT_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, partnerReferenceNo: "DEP-" + Date.now() })
            }).then(r => r.json());
            user.mutasi.push({ tgl: new Date().toLocaleString(), amt: nominal, status: 'Pending', bill: total });
            await updateDb(db);
            return res.json({ success: true, total, qr: rPay.qrContent || rPay.data?.qrContent });
        }

        if (action === 'confirm_depo') {
            const user = db.partners.find(u => u.username === target_user);
            const item = user.mutasi[depo_idx];
            if (status === 'Success' && item.status === 'Pending') {
                user.balance = Number(user.balance) + Number(amount);
                item.status = 'Success';
            } else if (status === 'Rejected') { item.status = 'Rejected'; }
            await updateDb(db);
            return res.json({ success: true });
        }

        if (action === 'add' && store === 'smm') {
            const apiKey = key || req.headers['x-api-key'];
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ error: 'Key Invalid' });
            const svcs = await fetch('https://hokto.my.id/produksi/smm/', { method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) }).then(r => r.json());
            const target = svcs.find(s => s.service == service);
            const harga = Math.ceil(((parseFloat(target.rate) / 1000) * qty) * 1.15);
            if (Number(user.balance) < harga) return res.json({ error: 'Low Balance' });
            const smmRes = await fetch('https://hokto.my.id/produksi/smm/', {
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'add', service, link, quantity: qty })
            }).then(r => r.json());
            if (smmRes.order) {
                user.balance = Number(user.balance) - harga;
                user.history.push({ id: smmRes.order, svc: target.name, price: harga, date: new Date().toLocaleString() });
                await updateDb(db);
                return res.json({ status: true, order_id: smmRes.order, sisa: user.balance });
            }
        }

        if (action === 'services') {
            const raw = await fetch('https://hokto.my.id/produksi/smm/', { method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) }).then(r => r.json());
            return res.json(raw.map(s => ({ ...s, rate: Math.ceil(parseFloat(s.rate) * 1.15) })));
        }
    } catch (e) { res.status(500).json({ error: "Err" }); }
}
