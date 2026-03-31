const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Helper: Ambil & Simpan DB
const getDb = async () => (await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } })).data.record;
const saveDb = async (data) => await axios.put(BASE_URL, data, { headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY } });

// [POST] Login / Register Otomatis
app.post('/api/auth', async (req, res) => {
    const { u, p } = req.body;
    try {
        let db = await getDb();
        if (!db.users[u]) {
            // Register user baru jika belum ada
            db.users[u] = { password: p, balance: 0, apikey: "G-" + Math.random().toString(36).substring(2, 10).toUpperCase() };
            await saveDb(db);
        }
        const user = db.users[u];
        if (user.password === p) return res.json({ status: true, user: u, data: user });
        res.json({ status: false, msg: "Password salah!" });
    } catch (e) { res.status(500).json({ status: false }); }
});

// [GET] Cek OTP (Endpoint API untuk Client & Test Button)
app.get('/api/get-otp', async (req, res) => {
    const { apikey } = req.query;
    try {
        let db = await getDb();
        // Cari user berdasarkan API Key
        const username = Object.keys(db.users).find(k => db.users[k].apikey === apikey);
        if (!username) return res.json({ status: false, msg: "API Key Salah!" });
        
        const user = db.users[username];
        if (user.balance < 10) return res.json({ status: false, msg: "Saldo Kurang (Min 10)" });

        // Potong saldo & ambil OTP
        user.balance -= 10;
        await saveDb(db);
        res.json({ status: true, otp: db.server.latest_otp.code, sisa: user.balance });
    } catch (e) { res.json({ status: false }); }
});

// [POST] Order QRIS
app.post('/api/order', async (req, res) => {
    try {
        const resp = await axios.post("https://hokto.my.id/produksi/payment/?api=create_qris", {
            amount: req.body.amount,
            partnerReferenceNo: "INV" + Date.now()
        }, { headers: { 'X-API-KEY': HOKTO_KEY } });
        res.json({ qr: resp.data.qr_link || resp.data.qr_code });
    } catch (e) { res.json({ status: false }); }
});

module.exports = app;
