const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// CONFIG DATA
const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Endpoint: Cek OTP (Untuk Developer Lain & Admin)
app.get('/api/get-latest', async (req, res) => {
    const { apikey } = req.query;
    try {
        const response = await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
        const db = response.data.record;

        // Validasi API Key (Bypass jika KEY-12345 untuk tes)
        if (apikey !== "KEY-12345" && (!db.api_keys || !db.api_keys[apikey])) {
            return res.status(403).json({ status: false, msg: "Invalid API Key" });
        }

        res.json({ status: true, otp: db.server.latest_otp.code, time: db.server.latest_otp.timestamp });
    } catch (e) { res.status(500).json({ status: false, msg: "Database Error" }); }
});

// Endpoint: Terima OTP dari Termux
app.post('/api/webhook-wa', async (req, res) => {
    const { otp } = req.body;
    try {
        const response = await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
        let db = response.data.record;
        db.server.latest_otp = { code: otp, timestamp: Date.now() };

        await axios.put(BASE_URL, db, {
            headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY }
        });
        res.json({ status: "success" });
    } catch (e) { res.status(500).send("Error"); }
});

// Endpoint: Create QRIS Hokto
app.post('/api/order', async (req, res) => {
    const { amount } = req.body;
    try {
        const resp = await axios.post("https://hokto.my.id/produksi/payment/?api=create_qris", {
            amount: amount,
            partnerReferenceNo: "INV" + Date.now()
        }, { headers: { 'X-API-KEY': HOKTO_KEY } });
        res.json({ qr: resp.data.qr_link || resp.data.qr_code });
    } catch (e) { res.status(500).json({ status: false }); }
});

module.exports = app;
