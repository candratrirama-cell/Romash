const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// --- KONFIGURASI KUNCI (DATA KAMU) ---
const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const HOKTO_API_KEY = "91b24c8aeb3d364a80742a847797553b"; // API Key Hokto Kamu
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Helper: Ambil Data dari JSONBin
const getDb = async () => {
    const res = await axios.get(BASE_URL, { headers: { "X-Master-Key": MASTER_KEY } });
    return res.data.record;
};

// Helper: Simpan Data ke JSONBin
const saveDb = async (newData) => {
    await axios.put(BASE_URL, newData, {
        headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY }
    });
};

// [POST] Endpoint Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await getDb();
        const user = db.users[username];
        if (user && user.password === password) {
            res.json({ status: true, balance: user.balance });
        } else {
            res.json({ status: false, msg: "Login Gagal! Cek User/Pass." });
        }
    } catch (e) {
        res.status(500).json({ status: false, msg: "Database Error" });
    }
});

// [POST] Endpoint Buat QRIS (Top Up)
app.post('/api/order', async (req, res) => {
    const { userId, amount } = req.body;
    const inv = "INV" + Date.now();
    
    try {
        // Tembak API Hokto untuk Create QRIS
        const response = await axios.post("https://hokto.my.id/produksi/payment/?api=create_qris", {
            amount: amount,
            partnerReferenceNo: inv
        }, { 
            headers: { 'X-API-KEY': HOKTO_API_KEY } 
        });

        // Ambil link QR dari respon Hokto
        const qrData = response.data.qr_link || response.data.qr_code;
        
        if (qrData) {
            res.json({ status: true, qr: qrData, inv: inv });
        } else {
            res.json({ status: false, msg: "Gagal generate QR dari Hokto" });
        }
    } catch (e) {
        res.status(500).json({ status: false, msg: "Hokto API Error" });
    }
});

// [GET] Endpoint Ambil OTP & Potong Saldo
app.get('/api/get-otp', async (req, res) => {
    const { userId } = req.query;
    try {
        const db = await getDb();
        const user = db.users[userId];

        if (!user) return res.json({ status: false, msg: "User tidak ditemukan" });
        if (user.balance < 10) return res.json({ status: false, msg: "Saldo Kurang (Min Rp 10)" });

        const otpData = db.server.latest_otp;
        
        // Cek jika OTP ada dan masih baru (kurang dari 5 menit)
        if (otpData && otpData.code && (Date.now() - otpData.timestamp < 300000)) {
            user.balance -= 10; // Potong Saldo
            await saveDb(db); // Simpan Perubahan
            res.json({ status: true, otp: otpData.code, sisa: user.balance });
        } else {
            res.json({ status: false, msg: "OTP Belum Masuk atau Expired" });
        }
    } catch (e) {
        res.status(500).json({ status: false, msg: "System Error" });
    }
});

// [POST] Endpoint Terima OTP dari Termux
app.post('/api/receive-otp', async (req, res) => {
    const { otp } = req.body;
    try {
        const db = await getDb();
        db.server.latest_otp = { code: otp, timestamp: Date.now() };
        await saveDb(db);
        res.json({ status: true });
    } catch (e) {
        res.status(500).json({ status: false });
    }
});

module.exports = app;
