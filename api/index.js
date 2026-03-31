const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const getDb = async () => (await axios.get(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } })).data.record;
const saveDb = async (data) => await axios.put(BASE_URL, data, { headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY } });

// [POST] REQUEST OTP (BUAT TERMUX KIRIM WA)
app.post('/api/request-otp', async (req, res) => {
    const { apikey, target } = req.body;
    try {
        let db = await getDb();
        const user = Object.values(db.users).find(u => u.apikey === apikey);
        if (!user) return res.json({ status: false, msg: "API Key Tidak Valid!" });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // MASUKIN KE FOLDER SERVER UNTUK VALIDASI
        db.server.pending_otp = { target, msg: `Kode otp anda ${otp}`, code: otp, status: "pending" };
        
        await saveDb(db);
        res.json({ status: true, msg: "Perintah kirim ke Termux berhasil!", otp_debug: otp });
    } catch (e) { res.status(500).json({ status: false }); }
});

// [POST] VERIFY OTP (FOLDER VALIDASI)
app.post('/api/verify-otp', async (req, res) => {
    const { code_input } = req.body;
    try {
        let db = await getDb();
        const validCode = db.server.pending_otp.code;
        
        if (code_input === validCode) {
            res.json({ status: true, msg: "OTP VALID! ✅" });
        } else {
            res.json({ status: false, msg: "OTP SALAH! ❌" });
        }
    } catch (e) { res.json({ status: false }); }
});

// [GET] CHECK TASK (DIPANGGIL TERMUX TIAP 5 DETIK)
app.get('/api/check-task', async (req, res) => {
    try {
        let db = await getDb();
        if (db.server.pending_otp && db.server.pending_otp.status === "pending") {
            res.json({ task: db.server.pending_otp });
            // Update agar tidak kirim terus menerus
            db.server.pending_otp.status = "sent";
            await saveDb(db);
        } else { res.json({ task: null }); }
    } catch (e) { res.json({ task: null }); }
});

module.exports = app;
