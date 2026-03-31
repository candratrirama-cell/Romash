const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const getDb = async () => (await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } })).data.record;
const saveDb = async (data) => await axios.put(BASE_URL, data, { headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY } });

// [POST] LOGIN & REGISTER (Fix: No Macet)
app.post('/api/auth', async (req, res) => {
    const { u, p } = req.body;
    try {
        let db = await getDb();
        if (!db.users) db.users = {};
        if (!db.users[u]) {
            db.users[u] = { password: p, balance: 0, apikey: "G-" + Math.random().toString(36).substring(2, 6).toUpperCase() };
            await saveDb(db);
        }
        const user = db.users[u];
        if (user.password === p) res.json({ status: true, data: user, user: u });
        else res.json({ status: false, msg: "Pass Salah!" });
    } catch (e) { res.status(500).json({ status: false, msg: "DB Error" }); }
});

// [POST] DEPOSIT QRIS HOKTO
app.post('/api/deposit', async (req, res) => {
    const { amount } = req.body;
    try {
        const resp = await axios.get(`https://hokto.my.id/produksi/payment/?api=create_qris&amount=${amount}&apikey=${HOKTO_KEY}`);
        if (resp.data.qr_link || resp.data.qr_code) {
            res.json({ status: true, qr: resp.data.qr_link || resp.data.qr_code });
        } else res.json({ status: false, msg: "API Hokto Gangguan" });
    } catch (e) { res.json({ status: false }); }
});

// [POST] REQUEST OTP
app.post('/api/request-otp', async (req, res) => {
    const { apikey, target } = req.body;
    try {
        let db = await getDb();
        const user = Object.values(db.users).find(u => u.apikey === apikey);
        if (!user) return res.json({ status: false, msg: "Key Invalid" });
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        db.server.pending_otp = { target, msg: `Kode otp anda ${otp}`, code: otp, status: "pending" };
        await saveDb(db);
        res.json({ status: true, msg: "OTW Termux!" });
    } catch (e) { res.json({ status: false }); }
});

module.exports = app;
