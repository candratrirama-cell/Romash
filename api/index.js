const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Helper: Ambil Data
const getDb = async () => {
    const res = await axios.get(BASE_URL, { headers: { "X-Master-Key": MASTER_KEY } });
    return res.data.record;
};

// Helper: Simpan Data
const saveDb = async (newData) => {
    await axios.put(BASE_URL, newData, {
        headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY }
    });
};

// Endpoint Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await getDb();
    const user = db.users[username];
    if (user && user.password === password) {
        res.json({ status: true, balance: user.balance });
    } else {
        res.json({ status: false, msg: "Login Gagal" });
    }
});

// Endpoint Terima OTP dari Termux
app.post('/api/receive-otp', async (req, res) => {
    const { otp } = req.body;
    const db = await getDb();
    db.server.latest_otp = { code: otp, timestamp: Date.now() };
    await saveDb(db);
    res.json({ status: true });
});

// Endpoint Ambil OTP (Potong Saldo 10)
app.get('/api/get-otp', async (req, res) => {
    const { userId } = req.query;
    const db = await getDb();
    const user = db.users[userId];

    if (!user || user.balance < 10) return res.json({ status: false, msg: "Saldo Kurang" });

    const otpData = db.server.latest_otp;
    if (otpData.code && (Date.now() - otpData.timestamp < 300000)) {
        user.balance -= 10;
        await saveDb(db);
        res.json({ status: true, otp: otpData.code, sisa: user.balance });
    } else {
        res.json({ status: false, msg: "OTP Belum Tersedia" });
    }
});

module.exports = app;
