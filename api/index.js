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

// --- QRIS GENERATOR (FIXED) ---
app.post('/api/order', async (req, res) => {
    const { amount } = req.body;
    try {
        // Menggunakan format GET yang lebih stabil untuk Hokto
        const resp = await axios.get(`https://hokto.my.id/produksi/payment/?api=create_qris&amount=${amount}&apikey=${HOKTO_KEY}`);
        const qr = resp.data.qr_link || resp.data.qr_code;
        if (qr) res.json({ status: true, qr });
        else res.json({ status: false, msg: "Saldo Hokto Habis/API Error" });
    } catch (e) { res.json({ status: false, msg: "Gagal hubungi Hokto" }); }
});

// --- REQUEST OTP (TERMUX PUSH) ---
app.post('/api/request-otp', async (req, res) => {
    const { apikey, target } = req.body;
    try {
        let db = await getDb();
        const user = Object.values(db.users).find(u => u.apikey === apikey);
        if (!user) return res.json({ status: false, msg: "Key Salah!" });

        const otp = Math.floor(1000 + Math.random() * 9000);
        // Simpan OTP di server untuk divalidasi nanti
        db.server.pending_otp = { target, msg: `Kode otp anda ${otp}`, code: otp.toString(), status: "pending" };
        
        await saveDb(db);
        res.json({ status: true, msg: "Dikirim ke WA!" });
    } catch (e) { res.json({ status: false }); }
});

// --- VALIDASI OTP (CEK APAKAH VALID) ---
app.post('/api/verify-otp', async (req, res) => {
    const { inputCode } = req.body;
    try {
        let db = await getDb();
        const serverCode = db.server.pending_otp.code;
        
        if (inputCode === serverCode) {
            res.json({ status: true, msg: "OTP Valid! Selamat Datang." });
        } else {
            res.json({ status: false, msg: "Kode Salah / Kadaluarsa!" });
        }
    } catch (e) { res.json({ status: false }); }
});

// --- CHECK TASK (TERMUX ONLY) ---
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
