const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Helper Ambil Data
const getDb = async () => {
    const res = await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
    return res.data.record;
};

// Endpoint Auth
app.post('/api/auth', async (req, res) => {
    const { u, p } = req.body;
    try {
        let db = await getDb();
        if (!db.users) db.users = {};
        if (!db.users[u]) {
            db.users[u] = { password: p, balance: 0, apikey: "G-" + Math.random().toString(36).substring(2, 10).toUpperCase() };
            // Simpan perubahan ke JSONBin
            await axios.put(BASE_URL, db, { headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY } });
        }
        const user = db.users[u];
        if (user.password === p) res.json({ status: true, data: user, user: u });
        else res.json({ status: false, msg: "Password Salah!" });
    } catch (e) {
        res.status(500).json({ status: false, msg: "Koneksi Database Gagal!" });
    }
});

// Endpoint Order QRIS Hokto
app.post('/api/order', async (req, res) => {
    const { amount } = req.body;
    try {
        const resp = await axios.get(`https://hokto.my.id/produksi/payment/?api=create_qris&amount=${amount}&apikey=${HOKTO_KEY}`);
        res.json({ status: true, qr: resp.data.qr_link || resp.data.qr_code });
    } catch (e) { res.json({ status: false }); }
});

module.exports = app;
