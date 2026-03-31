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

// AUTH LOGIN
app.post('/api/auth', async (req, res) => {
    const { u, p } = req.body;
    try {
        let db = await getDb();
        if (!db.users[u]) {
            db.users[u] = { password: p, balance: 0, apikey: "G-" + Math.random().toString(36).substring(2, 8).toUpperCase() };
            await saveDb(db);
        }
        if (db.users[u].password === p) res.json({ status: true, data: db.users[u], user: u });
        else res.json({ status: false, msg: "Password Salah!" });
    } catch (e) { res.status(500).json({ status: false }); }
});

// QRIS HOKTO
app.post('/api/order', async (req, res) => {
    try {
        const resp = await axios.get(`https://hokto.my.id/produksi/payment/?api=create_qris&amount=${req.body.amount}&apikey=${HOKTO_KEY}`);
        res.json({ status: true, qr: resp.data.qr_link || resp.data.qr_code });
    } catch (e) { res.json({ status: false }); }
});

// PUSH KE TERMUX (VIA JSONBIN QUEUE)
app.post('/api/request-otp', async (req, res) => {
    const { apikey, target } = req.body;
    try {
        let db = await getDb();
        const user = Object.values(db.users).find(u => u.apikey === apikey);
        if (!user) return res.json({ status: false, msg: "Key Invalid" });
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        db.server.pending_otp = { target, msg: `Kode otp anda ${otp}`, code: otp, status: "pending" };
        await saveDb(db);
        res.json({ status: true, msg: "OTP Dikirim!", otp });
    } catch (e) { res.json({ status: false }); }
});

// CHECK TASK (UNTUK TERMUX)
app.get('/api/check-task', async (req, res) => {
    try {
        let db = await getDb();
        if (db.server.pending_otp?.status === "pending") {
            res.json({ task: db.server.pending_otp });
            db.server.pending_otp.status = "sent";
            await saveDb(db);
        } else res.json({ task: null });
    } catch (e) { res.json({ task: null }); }
});

module.exports = app;
