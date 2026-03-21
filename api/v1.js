const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    const data = { ...req.query, ...req.body };
    const { action, key, service, qty, link, markup } = data; // Tambah markup

    const getDb = async () => {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, { 
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
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

        // LOGIK ORDER (Dashboard & API Docs Masuk Sini)
        if (action === 'add') {
            const apiKey = key || req.headers['x-api-key'];
            const user = db.partners.find(u => u.apikey === apiKey);
            
            if (!user) return res.json({ status: false, error: 'API Key Invalid' });

            // 1. Ambil Data Layanan Pusat
            const svcs = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', 
                body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());

            const target = svcs.find(s => s.service == service);
            if (!target) return res.json({ status: false, error: 'Layanan Tidak Ditemukan' });

            // 2. HITUNG HARGA (Harga Kamu + Admin 15%)
            const hargaPusat = parseFloat(target.rate || target.price || 0);
            const hargaDasarKamu = Math.ceil(((hargaPusat / 1000) * qty) * 1.15);
            
            // HITUNG HARGA JUAL SELLER (Jika ada parameter markup)
            // Misal markup=10, maka harga di api docs jadi lebih mahal 10% buat pembeli mereka
            const persenMarkup = parseFloat(markup || 0) / 100;
            const hargaJualSeller = Math.ceil(hargaDasarKamu * (1 + persenMarkup));

            // 3. VALIDASI SALDO (Penting!)
            if (Number(user.balance) < hargaDasarKamu) {
                return res.json({ status: false, error: 'Saldo Partner Tidak Cukup' });
            }

            // 4. KIRIM KE HOKTO
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
                // 5. POTONG SALDO & CATAT RIWAYAT (Wajib di sini)
                user.balance = Number(user.balance) - hargaDasarKamu;
                
                const logPesanan = {
                    id: smmRes.order,
                    svc: target.name,
                    qty: qty,
                    target: link,
                    price: hargaDasarKamu, // Harga yang dipotong dari saldo dia
                    sell_price: hargaJualSeller, // Harga yang dia jual ke orang lain
                    date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
                    via: key ? 'API_EXTERNAL' : 'DASHBOARD'
                };

                user.history.push(logPesanan);
                await updateDb(db);

                return res.json({ 
                    status: true, 
                    order_id: smmRes.order, 
                    price: hargaJualSeller, // Beritahu seller berapa harga yang harus dia tagih ke pembelinya
                    sisa_saldo: user.balance 
                });
            } else {
                return res.json({ status: false, error: smmRes.error || 'Gagal di Pusat' });
            }
        }
        
        // Action lainnya (login, register, services) tetap sama seperti sebelumnya...
        // (Pastikan bagian services tetap mengirim harga + 15%)

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
