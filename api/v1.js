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
    const { action, username, password, key, amount, service, qty, link, store } = data;

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

        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            if (!user) return res.json({ success: false });
            return res.json({ success: true, user });
        }

        if (action === 'create_qris') {
            const user = db.partners.find(u => u.username === username);
            if (!user) return res.json({ error: 'User Not Found' });
            const nominal = parseInt(amount);
            const totalBayar = Math.ceil((nominal + Math.floor(Math.random() * 200)) * 1.10);
            const rPay = await fetch('https://hokto.my.id/produksi/payment/?api=create_qris', {
                method: 'POST',
                headers: { 'X-API-KEY': PAYMENT_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalBayar, partnerReferenceNo: "API-" + Date.now() })
            });
            const pRes = await rPay.json();
            user.mutasi.push({ tgl: new Date().toLocaleString(), amt: nominal, status: 'Pending', bill: totalBayar });
            await updateDb(db);
            return res.json({ success: true, total: totalBayar, qr: pRes.qrContent || pRes.data?.qrContent });
        }

        const apiKey = key || req.headers['x-api-key'];
        if (action === 'add' && store === 'smm' && apiKey && apiKey.startsWith('xapik1')) {
            const user = db.partners.find(u => u.apikey === apiKey);
            if (!user) return res.json({ error: 'Key Invalid' });
            const rSvc = await fetch('https://hokto.my.id/produksi/smm/', { method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) });
            const svcs = await rSvc.json();
            const targetSvc = svcs.find(s => s.service == service);
            const hargaJual = Math.ceil(((parseFloat(targetSvc.rate) / 1000) * qty) * 1.15);
            if (user.balance < hargaJual) return res.json({ error: 'Saldo Kurang' });
            const smmRes = await fetch('https://hokto.my.id/produksi/smm/', {
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'add', service, link, quantity: qty })
            }).then(r => r.json());
            if (smmRes.order) {
                user.balance -= hargaJual;
                user.history.push({ id: smmRes.order, svc: targetSvc.name, price: hargaJual, date: new Date().toLocaleString() });
                await updateDb(db);
                return res.json({ status: true, order_id: smmRes.order, sisa: user.balance });
            }
        }

        if (action === 'services') {
            const r = await fetch('https://hokto.my.id/produksi/smm/', { method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) });
            const raw = await r.json();
            return res.json(raw.map(s => ({ ...s, rate: Math.ceil(parseFloat(s.rate) * 1.15) })));
        }

    } catch (e) { res.status(500).json({ error: "System Error" }); }
}
