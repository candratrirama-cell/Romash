const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// CONFIG
const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// HELPER JSONBIN
const getDb = async () => {
    const res = await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
    return res.data.record;
};
const saveDb = async (data) => {
    await axios.put(BASE_URL, data, { headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY } });
};

// --- ENDPOINT HOKTO PAYMENT (QRIS) ---
app.post('/api/order', async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount < 500) return res.json({ status: false, msg: "Min Rp 500" });

    try {
        // Request ke Hokto untuk buat QRIS
        const resp = await axios.get(`https://hokto.my.id/produksi/payment/?api=create_qris&amount=${amount}&apikey=${HOKTO_KEY}`);
        
        if (resp.data && (resp.data.qr_link || resp.data.qr_code)) {
            res.json({ 
                status: true, 
                qr: resp.data.qr_link || resp.data.qr_code 
            });
        } else {
            res.json({ status: false, msg: "Gagal ambil QR dari Hokto" });
        }
    } catch (e) {
        res.json({ status: false, msg: "Hokto API Error" });
    }
});

// --- ENDPOINT AUTH (LOGIN/REGISTER) ---
app.post('/api/auth', async (req, res) => {
    const { u, p } = req.body;
    try {
        let db = await getDb();
        if (!db.users) db.users = {};
        if (!db.users[u]) {
            db.users[u] = { password: p, balance: 0, apikey: "G-" + Math.random().toString(36).substring(2, 10).toUpperCase() };
            await saveDb(db);
        }
        const user = db.users[u];
        if (user.password === p) res.json({ status: true, user: u, data: user });
        else res.json({ status: false, msg: "Pass Salah!" });
    } catch (e) { res.status(500).json({ status: false }); }
});

// --- ENDPOINT REQUEST OTP (UNTUK TERMUX) ---
app.post('/api/request-otp', async (req, res) => {
    const { apikey, target } = req.body;
    try {
        let db = await getDb();
        const username = Object.keys(db.users).find(k => db.users[k].apikey === apikey);
        if (!username || db.users[username].balance < 10) return res.json({ status: false, msg: "Saldo Kurang / Key Salah" });

        const otp = Math.floor(1000 + Math.random() * 9000);
        db.server.pending_otp = { target: target, msg: `Kode otp anda ${otp}`, code: otp, status: "pending" };
        db.users[username].balance -= 10;
        
        await saveDb(db);
        res.json({ status: true, otp: otp, sisa: db.users[username].balance });
    } catch (e) { res.json({ status: false }); }
});

// --- ENDPOINT CHECK TASK (UNTUK GATEWAY.JS) ---
app.get('/api/check-task', async (req, res) => {
    try {
        let db = await getDb();
        if (db.server.pending_otp && db.server.pending_otp.status === "pending") {
            res.json({ task: db.server.pending_otp });
            db.server.pending_otp.status = "sent";
            await saveDb(db);
        } else { res.json({ task: null }); }
    } catch (e) { res.json({ task: null }); }
});

module.exports = app;
