const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";

// --- ENDPOINT UNTUK DEVELOPER LAIN ---
// Developer panggil ini: romash.vercel.app/api/get-latest?apikey=...
app.get('/api/get-latest', async (req, res) => {
    const { apikey } = req.query;
    try {
        const resDb = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { 
            headers: { "X-Master-Key": MASTER_KEY } 
        });
        const db = resDb.data.record;

        if (!db.api_keys[apikey]) return res.json({ status: false, msg: "Invalid API Key" });

        // Ambil OTP terakhir yang masuk
        const otp = db.server.latest_otp;
        res.json({ status: true, otp: otp.code, time: otp.timestamp });
    } catch (e) { res.status(500).json({ error: "Cloud Down" }); }
});

// --- ENDPOINT UNTUK TOPUP QRIS ---
app.post('/api/create-payment', async (req, res) => {
    const { amount } = req.body;
    try {
        const resp = await axios.post("https://hokto.my.id/produksi/payment/?api=create_qris", {
            amount: amount,
            partnerReferenceNo: "INV" + Date.now()
        }, { headers: { 'X-API-KEY': HOKTO_KEY } });
        
        res.json({ status: true, qr: resp.data.qr_link || resp.data.qr_code });
    } catch (e) { res.json({ status: false, msg: "Hokto Error" }); }
});

// --- ENDPOINT PENERIMA DARI TERMUX ---
app.post('/api/webhook-wa', async (req, res) => {
    const { otp } = req.body;
    try {
        const resDb = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { 
            headers: { "X-Master-Key": MASTER_KEY } 
        });
        let db = resDb.data.record;
        db.server.latest_otp = { code: otp, timestamp: Date.now() };

        await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID}`, db, {
            headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY }
        });
        res.json({ status: "saved" });
    } catch (e) { res.status(500).send("Err"); }
});

module.exports = app;
