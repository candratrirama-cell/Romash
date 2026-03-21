const JSONBIN_ID = '69be7bc1c3097a1dd54655de';
const JSONBIN_KEY = '$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6';
const SMM_KEY = '6b856fd3530faabf97cdf6399c32682e';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    const { action, username, password, target_user, depo_idx, status } = { ...req.query, ...req.body };

    // Ambil Database (Tanpa Cache biar data terbaru)
    const getDb = async () => {
        try {
            const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_KEY },
                cache: 'no-store'
            });
            const out = await r.json();
            return out.record;
        } catch (e) { return null; }
    };

    const updateDb = async (d) => {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(d)
        });
    };

    try {
        // --- SERVICES (Gak butuh Database) ---
        if (action === 'services') {
            const r = await fetch('https://hokto.my.id/produksi/smm/', { 
                method: 'POST', body: new URLSearchParams({ key: SMM_KEY, action: 'services' }) 
            }).then(r => r.json());
            return res.json(r);
        }

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database Error" });

        // --- GET ALL PENDING (Untuk Admin) ---
        if (action === 'get_all_depo') {
            let pending = [];
            if (db.partners) {
                db.partners.forEach(u => {
                    if (u.mutasi) {
                        u.mutasi.forEach((m, i) => {
                            if (m.status === 'Pending') pending.push({ username: u.username, index: i, ...m });
                        });
                    }
                });
            }
            return res.json(pending);
        }

        // --- CONFIRM DEPO ---
        if (action === 'confirm_depo') {
            const user = db.partners.find(u => u.username === target_user);
            if (!user || !user.mutasi || !user.mutasi[depo_idx]) return res.json({ success: false });

            if (status === 'Success') {
                user.balance = (Number(user.balance) || 0) + Number(user.mutasi[depo_idx].amt);
                user.mutasi[depo_idx].status = 'Success';
            } else {
                user.mutasi[depo_idx].status = 'Canceled';
            }
            await updateDb(db);
            return res.json({ success: true });
        }

        // --- LOGIN ---
        if (action === 'login') {
            const user = db.partners.find(u => u.username === username && u.password === password);
            return res.json({ success: !!user, user });
        }

        // --- REGISTER ---
        if (action === 'register') {
            if (db.partners.find(u => u.username === username)) return res.json({ success: false });
            db.partners.push({ username, password, balance: 0, apikey: 'key' + Date.now(), history: [], mutasi: [] });
            await updateDb(db);
            return res.json({ success: true });
        }

        res.json({ status: "Online" });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
